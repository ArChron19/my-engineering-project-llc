/**
 * Manual post-deploy search engine notification.
 *
 * This script is intended to be run AFTER a successful deploy — it fetches the
 * live sitemap and notifies search engines about it. Most of the time you do
 * NOT need to invoke this manually: the api-server runs the same logic on boot
 * (see `artifacts/api-server/src/lib/sitemapPing.ts`), and a redeploy reboots
 * the api-server. Run this script directly only when the api-server is offline
 * or when you want to force an out-of-band re-submission.
 *
 * Usage:
 *   node artifacts/my-engineering-project/scripts/ping-search-engines.mjs
 *
 * Required environment variables — same as the api-server hook:
 *   INDEXNOW_KEY                                    (Bing/Yandex/Naver/Seznam)
 *   GSC_CLIENT_ID, GSC_CLIENT_SECRET, GSC_REFRESH_TOKEN  (Google)
 *   GSC_SITE_URL                                    (optional, Google)
 *   SITE_ORIGIN                                     (optional, both)
 *   SITEMAP_PING_DISABLED=1                         (skip everything)
 *   SITEMAP_PING_STRICT=1                           (exit 1 on any failure)
 *   SITEMAP_PING_FORCE_FULL=1                       (ignore the diff cache and
 *                                                    resubmit every URL)
 *
 * The script reads the sitemap from the LIVE site (not from disk) so that the
 * deploy is implicitly verified before we ask search engines to crawl it.
 *
 * Incremental submission: alongside `sitemap.xml`, the build also publishes
 * `sitemap-manifest.json`, which contains a content hash for every route. The
 * script remembers the last successfully-submitted manifest in
 * `artifacts/my-engineering-project/.cache/last-pinged-sitemap-manifest.json`
 * and only resubmits URLs whose hash is new or has changed. If nothing
 * changed, the IndexNow API call is skipped entirely (Google still re-pings
 * its sitemap endpoint, which is a single sitemap-level call rather than a
 * per-URL submission).
 */

import {
  fetchLiveManifest,
  loadCachedManifest,
  manifestUrlFor,
  saveCachedManifest,
} from "./lib/sitemap-manifest.mjs";

const SITE_ORIGIN = process.env.SITE_ORIGIN || "https://myengineeringproject.com";
const SITEMAP_URL = `${SITE_ORIGIN}/sitemap.xml`;
const MANIFEST_URL = manifestUrlFor(SITE_ORIGIN);

function isTruthy(v) {
  return v === "1" || v === "true" || v === "yes";
}

if (isTruthy(process.env.SITEMAP_PING_DISABLED)) {
  console.log("[ping] SITEMAP_PING_DISABLED is set — skipping search engine notification.");
  process.exit(0);
}

const FORCE_FULL = isTruthy(process.env.SITEMAP_PING_FORCE_FULL);

async function fetchSitemapUrls() {
  const res = await fetch(SITEMAP_URL, {
    headers: { "User-Agent": "ping-search-engines/1.0" },
  });
  if (!res.ok) {
    throw new Error(
      `Could not fetch ${SITEMAP_URL} (HTTP ${res.status}). The deploy may not be live yet, or SITE_ORIGIN may be wrong.`,
    );
  }
  const xml = await res.text();
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);
}

function diffManifests(previous, current) {
  const prevByLoc = new Map(
    (previous?.urls ?? []).map((entry) => [entry.loc, entry.hash]),
  );
  const changed = [];
  for (const entry of current.urls) {
    const prevHash = prevByLoc.get(entry.loc);
    if (prevHash !== entry.hash) {
      changed.push(entry.loc);
    }
  }
  return changed;
}

async function pingIndexNow(results) {
  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    console.log("[ping] INDEXNOW_KEY not set — skipping IndexNow (Bing, Yandex, Naver, Seznam).");
    return;
  }
  if (!/^[A-Za-z0-9-]{8,128}$/.test(key)) {
    console.warn("[ping] INDEXNOW_KEY must be 8-128 chars of letters, digits, or hyphens. Skipping.");
    return;
  }

  let liveManifest = null;
  let urlsToSubmit;
  let submissionLabel;
  try {
    liveManifest = await fetchLiveManifest(SITE_ORIGIN);
    if (!liveManifest) {
      // Older deploys (or the api-server's static asset host) may not yet be
      // serving sitemap-manifest.json. Fall back to the previous behaviour.
      console.log(
        `[ping] ${MANIFEST_URL} not found — falling back to submitting every URL in ${SITEMAP_URL}.`,
      );
      const allUrls = await fetchSitemapUrls();
      urlsToSubmit = allUrls;
      submissionLabel = `${allUrls.length} URL(s) submitted (no manifest available — full submission)`;
    } else if (FORCE_FULL) {
      urlsToSubmit = liveManifest.urls.map((u) => u.loc);
      submissionLabel = `${urlsToSubmit.length} URL(s) submitted (SITEMAP_PING_FORCE_FULL=1)`;
    } else {
      const cached = await loadCachedManifest();
      const changed = diffManifests(cached, liveManifest);
      if (cached && changed.length === 0) {
        console.log(
          `[ping] No URL content changed since the last successful submission (${liveManifest.urls.length} URL(s) checked). Skipping IndexNow API call.`,
        );
        // Persist the freshly-fetched manifest so its `generatedAt` matches
        // the live deploy even though we didn't ping anything.
        await saveCachedManifest(liveManifest);
        return;
      }
      urlsToSubmit = changed.length > 0 ? changed : liveManifest.urls.map((u) => u.loc);
      if (!cached) {
        submissionLabel = `${urlsToSubmit.length} URL(s) submitted (no previous manifest cached — full submission)`;
      } else {
        submissionLabel = `${urlsToSubmit.length} of ${liveManifest.urls.length} URL(s) submitted (changed since last ping)`;
      }
    }
  } catch (err) {
    results.push({ engine: "IndexNow", ok: false, error: err.message });
    return;
  }

  if (urlsToSubmit.length === 0) {
    console.warn("[ping] Nothing to submit to IndexNow — sitemap appears empty.");
    return;
  }

  const host = new URL(SITE_ORIGIN).host;
  const body = {
    host,
    key,
    keyLocation: `${SITE_ORIGIN}/${key}.txt`,
    urlList: urlsToSubmit,
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
      detail: res.ok ? submissionLabel : await res.text().catch(() => ""),
    });
    if (res.ok && liveManifest) {
      // Only persist the manifest after a confirmed-successful submission so
      // a failure leaves the cache untouched and the URLs retry next run.
      await saveCachedManifest(liveManifest);
    }
  } catch (err) {
    results.push({ engine: "IndexNow", ok: false, error: err.message });
  }
}

async function pingGoogleSearchConsole(results) {
  const refreshToken = process.env.GSC_REFRESH_TOKEN;
  const clientId = process.env.GSC_CLIENT_ID;
  const clientSecret = process.env.GSC_CLIENT_SECRET;
  const siteUrl = process.env.GSC_SITE_URL || `${SITE_ORIGIN}/`;

  if (!refreshToken || !clientId || !clientSecret) {
    console.log("[ping] GSC_REFRESH_TOKEN / GSC_CLIENT_ID / GSC_CLIENT_SECRET not all set — skipping Google Search Console.");
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
    const { access_token: accessToken } = await tokenRes.json();
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
    results.push({ engine: "Google Search Console", ok: false, error: err.message });
  }
}

console.log(`[ping] Notifying search engines about ${SITEMAP_URL} ...`);

const results = [];
await Promise.all([pingIndexNow(results), pingGoogleSearchConsole(results)]);

if (results.length === 0) {
  console.log(
    "[ping] No search engine credentials configured (or nothing to submit). Set INDEXNOW_KEY and/or the GSC_* env vars to enable submission. See docs/sitemap-submission.md.",
  );
  process.exit(0);
}

let hadFailure = false;
for (const r of results) {
  const status = r.status ? ` (HTTP ${r.status})` : "";
  if (r.ok) {
    console.log(`[ping] ${r.engine}: OK${status}${r.detail ? ` — ${r.detail}` : ""}`);
  } else {
    hadFailure = true;
    const detail = r.error ? ` — ${r.error}` : r.detail ? ` — ${r.detail}` : "";
    console.warn(`[ping] ${r.engine}: FAILED${status}${detail}`);
  }
}

if (hadFailure && isTruthy(process.env.SITEMAP_PING_STRICT)) {
  process.exit(1);
}
