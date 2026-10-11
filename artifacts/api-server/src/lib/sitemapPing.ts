/**
 * Post-deploy sitemap ping.
 *
 * Notifies search engines that the site's sitemap has been (re)published.
 * The api-server reboots whenever the project is redeployed, so running this
 * once on boot is effectively a "post-deploy" hook — the static deploy is
 * already live by the time we ping (which is exactly what IndexNow needs in
 * order to verify ownership via the `<key>.txt` file shipped with the build).
 *
 * Configuration (all optional unless noted):
 *   INDEXNOW_KEY                       — required for IndexNow (Bing/Yandex/Naver/Seznam)
 *   GSC_CLIENT_ID / GSC_CLIENT_SECRET / GSC_REFRESH_TOKEN
 *                                      — required for Google Search Console
 *   GSC_SITE_URL                       — defaults to `${SITE_ORIGIN}/`
 *   SITE_ORIGIN                        — defaults to https://myengineeringproject.com
 *   SITEMAP_PING_DISABLED=1            — skip the post-deploy ping entirely
 *   SITEMAP_PING_DELAY_MS              — delay before the post-deploy ping runs (default 30s)
 *
 * If no credentials are configured the module is a no-op — it never crashes
 * the server. Failures are logged at warn-level and otherwise ignored.
 */

const SITE_ORIGIN = process.env.SITE_ORIGIN || "https://myengineeringproject.com";
const SITEMAP_URL = `${SITE_ORIGIN}/sitemap.xml`;

const DEFAULT_INITIAL_DELAY_MS = 30_000;

export interface PingResult {
  engine: string;
  ok: boolean;
  status?: number;
  detail?: string;
  error?: string;
}

export interface LastPingSnapshot {
  /** ISO timestamp of when the ping run started. */
  startedAt: string;
  /** ISO timestamp of when the ping run finished. */
  finishedAt: string;
  /** The sitemap URL that was submitted. */
  sitemapUrl: string;
  /** Per-engine outcomes. Empty when no credentials were configured. */
  results: PingResult[];
}

let lastPingSnapshot: LastPingSnapshot | null = null;

/**
 * The result of the most recent post-deploy ping, or `null` if none has run
 * yet (e.g. before the initial delay elapses, or when the ping is disabled).
 */
export function getLastPingResult(): LastPingSnapshot | null {
  return lastPingSnapshot;
}

function isTruthy(v: string | undefined): boolean {
  return v === "1" || v === "true" || v === "yes";
}

function readNumberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

async function fetchSitemapUrls(): Promise<string[]> {
  const res = await fetch(SITEMAP_URL, {
    headers: { "User-Agent": "sitemap-ping/1.0" },
  });
  if (!res.ok) {
    throw new Error(
      `Could not fetch ${SITEMAP_URL} (HTTP ${res.status}). The deploy may not be live yet, or SITE_ORIGIN may be wrong.`,
    );
  }
  const xml = await res.text();
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);
}

async function pingIndexNow(results: PingResult[]): Promise<void> {
  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    console.log("[sitemap-ping] INDEXNOW_KEY not set — skipping IndexNow (Bing, Yandex, Naver, Seznam).");
    return;
  }
  if (!/^[A-Za-z0-9-]{8,128}$/.test(key)) {
    console.warn("[sitemap-ping] INDEXNOW_KEY must be 8-128 chars of letters, digits, or hyphens. Skipping.");
    return;
  }

  let urls: string[];
  try {
    urls = await fetchSitemapUrls();
  } catch (err) {
    results.push({
      engine: "IndexNow",
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
    return;
  }
  if (urls.length === 0) {
    console.warn("[sitemap-ping] Sitemap had no <loc> entries — nothing to submit to IndexNow.");
    return;
  }

  const host = new URL(SITE_ORIGIN).host;
  const body = {
    host,
    key,
    keyLocation: `${SITE_ORIGIN}/${key}.txt`,
    urlList: urls,
  };

  try {
    const res = await fetch("https://api.indexnow.org/IndexNow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });
    results.push({
      engine: "IndexNow (Bing/Yandex/Naver/Seznam)",
      ok: res.ok,
      status: res.status,
      detail: res.ok ? `${urls.length} URL(s) submitted` : await res.text().catch(() => ""),
    });
  } catch (err) {
    results.push({
      engine: "IndexNow",
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

async function pingGoogleSearchConsole(results: PingResult[]): Promise<void> {
  const refreshToken = process.env.GSC_REFRESH_TOKEN;
  const clientId = process.env.GSC_CLIENT_ID;
  const clientSecret = process.env.GSC_CLIENT_SECRET;
  const siteUrl = process.env.GSC_SITE_URL || `${SITE_ORIGIN}/`;

  if (!refreshToken || !clientId || !clientSecret) {
    console.log(
      "[sitemap-ping] GSC_REFRESH_TOKEN / GSC_CLIENT_ID / GSC_CLIENT_SECRET not all set — skipping Google Search Console.",
    );
    return;
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    if (!tokenRes.ok) {
      results.push({
        engine: "Google Search Console",
        ok: false,
        status: tokenRes.status,
        error: "OAuth token exchange failed",
      });
      return;
    }
    const { access_token: accessToken } = (await tokenRes.json()) as {
      access_token: string;
    };
    const submitRes = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(SITEMAP_URL)}`,
      { method: "PUT", headers: { Authorization: `Bearer ${accessToken}` } },
    );
    results.push({
      engine: "Google Search Console",
      ok: submitRes.ok,
      status: submitRes.status,
      detail: submitRes.ok ? `Submitted ${SITEMAP_URL}` : await submitRes.text().catch(() => ""),
    });
  } catch (err) {
    results.push({
      engine: "Google Search Console",
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export async function pingSearchEngines(): Promise<PingResult[]> {
  console.log(`[sitemap-ping] Notifying search engines about ${SITEMAP_URL} ...`);
  const startedAt = new Date().toISOString();
  const results: PingResult[] = [];
  await Promise.all([pingIndexNow(results), pingGoogleSearchConsole(results)]);

  lastPingSnapshot = {
    startedAt,
    finishedAt: new Date().toISOString(),
    sitemapUrl: SITEMAP_URL,
    results,
  };

  if (results.length === 0) {
    console.log(
      "[sitemap-ping] No search engine credentials configured — nothing submitted.",
    );
    return results;
  }

  for (const r of results) {
    const status = r.status ? ` (HTTP ${r.status})` : "";
    if (r.ok) {
      console.log(`[sitemap-ping] ${r.engine}: OK${status}${r.detail ? ` — ${r.detail}` : ""}`);
    } else {
      const detail = r.error ? ` — ${r.error}` : r.detail ? ` — ${r.detail}` : "";
      console.warn(`[sitemap-ping] ${r.engine}: FAILED${status}${detail}`);
    }
  }
  return results;
}

let scheduled = false;

export interface PingSchedulerOptions {
  /** Delay before the post-deploy ping runs, in ms. Defaults to 30s. */
  initialDelayMs?: number;
}

/**
 * Schedule a one-shot post-deploy ping shortly after server boot.
 *
 * The api-server is restarted on every redeploy, so "shortly after boot" is
 * effectively "shortly after deploy". The small delay gives the static deploy
 * (a sibling artifact) time to come fully live before we hit it.
 */
export function startPostDeployPing(opts: PingSchedulerOptions = {}): void {
  if (isTruthy(process.env.SITEMAP_PING_DISABLED)) {
    console.log("[sitemap-ping] SITEMAP_PING_DISABLED is set — post-deploy ping disabled.");
    return;
  }
  if (scheduled) {
    console.warn("[sitemap-ping] Post-deploy ping already scheduled; ignoring duplicate start.");
    return;
  }
  scheduled = true;

  const delay =
    opts.initialDelayMs ?? readNumberEnv("SITEMAP_PING_DELAY_MS", DEFAULT_INITIAL_DELAY_MS);

  const timer = setTimeout(() => {
    pingSearchEngines().catch((err) => {
      console.error("[sitemap-ping] Post-deploy ping crashed:", err);
    });
  }, delay);
  timer.unref?.();

  console.log(
    `[sitemap-ping] Post-deploy notification scheduled (in ${Math.round(delay / 1000)}s).`,
  );
}
