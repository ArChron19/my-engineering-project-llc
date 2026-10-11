/**
 * SEO observability routes.
 *
 * GET  /api/seo/weekly-report           — latest weekly indexing report (JSON)
 * GET  /api/seo/weekly-report.txt       — same report as plain text
 * GET  /api/seo/weekly-report/history   — last N weekly reports (JSON)
 * POST /api/seo/weekly-report/refresh   — force a fresh fetch (admin trigger).
 * GET  /api/seo/last-ping               — outcome of the last post-deploy ping (JSON)
 * GET  /api/seo/last-ping.txt           — same outcome as plain text
 *
 * The refresh endpoint hits the Google Search Console and Bing APIs, which
 * have per-day quotas. To avoid letting it be used as a quota-burner or DoS
 * vector, two protections are layered:
 *   1. If `SEO_REPORT_REFRESH_TOKEN` is set, callers must present it in
 *      `Authorization: Bearer <token>` or `X-Refresh-Token: <token>`.
 *   2. A simple in-memory rate limit (`SEO_REPORT_REFRESH_MIN_INTERVAL_MS`,
 *      default 60s) blocks back-to-back refreshes regardless of auth.
 */

import { Router, type Request, type Response, type NextFunction } from "express";
import {
  getLatestReport,
  getReportHistory,
  refreshReport,
  renderReportText,
} from "../lib/seoReport.js";
import { getLastPingResult, type LastPingSnapshot } from "../lib/sitemapPing.js";

const router = Router();

const DEFAULT_REFRESH_MIN_INTERVAL_MS = 60_000;

function refreshMinIntervalMs(): number {
  const raw = process.env.SEO_REPORT_REFRESH_MIN_INTERVAL_MS;
  if (!raw) return DEFAULT_REFRESH_MIN_INTERVAL_MS;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_REFRESH_MIN_INTERVAL_MS;
}

function extractToken(req: Request): string | null {
  const auth = req.header("authorization");
  if (auth && /^Bearer\s+/i.test(auth)) {
    return auth.replace(/^Bearer\s+/i, "").trim() || null;
  }
  const headerToken = req.header("x-refresh-token");
  if (headerToken) return headerToken.trim() || null;
  return null;
}

function refreshAuth(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env.SEO_REPORT_REFRESH_TOKEN;
  if (!expected) {
    next();
    return;
  }
  const provided = extractToken(req);
  if (!provided || provided !== expected) {
    res.status(401).json({
      error: {
        code: "REFRESH_UNAUTHORIZED",
        message:
          "Missing or invalid refresh token. Send the value of SEO_REPORT_REFRESH_TOKEN in `Authorization: Bearer <token>` or `X-Refresh-Token`.",
      },
    });
    return;
  }
  next();
}

let lastRefreshAt = 0;

function refreshRateLimit(_req: Request, res: Response, next: NextFunction): void {
  const minInterval = refreshMinIntervalMs();
  if (minInterval === 0) {
    next();
    return;
  }
  const now = Date.now();
  const elapsed = now - lastRefreshAt;
  if (elapsed < minInterval) {
    const retryAfter = Math.ceil((minInterval - elapsed) / 1000);
    res.setHeader("Retry-After", String(retryAfter));
    res.status(429).json({
      error: {
        code: "REFRESH_RATE_LIMITED",
        message: `Too many refresh requests. Try again in ${retryAfter}s, or lower SEO_REPORT_REFRESH_MIN_INTERVAL_MS.`,
      },
    });
    return;
  }
  lastRefreshAt = now;
  next();
}

router.get("/seo/weekly-report", (_req, res) => {
  const latest = getLatestReport();
  if (!latest) {
    res.status(503).json({
      error: {
        code: "REPORT_NOT_READY",
        message:
          "No weekly indexing report has been generated yet. The first run happens shortly after server start; trigger an immediate refresh by POSTing to /api/seo/weekly-report/refresh.",
      },
    });
    return;
  }
  res.json(latest);
});

router.get("/seo/weekly-report.txt", (_req, res) => {
  const latest = getLatestReport();
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  if (!latest) {
    res
      .status(503)
      .send(
        "No weekly indexing report has been generated yet.\n" +
          "Trigger an immediate refresh by POSTing to /api/seo/weekly-report/refresh.\n",
      );
    return;
  }
  res.send(renderReportText(latest));
});

router.get("/seo/weekly-report/history", (_req, res) => {
  res.json({ reports: getReportHistory() });
});

router.post("/seo/weekly-report/refresh", refreshAuth, refreshRateLimit, async (_req, res) => {
  try {
    const report = await refreshReport();
    res.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[seo-report] manual refresh failed:", err);
    res.status(500).json({
      error: { code: "REPORT_REFRESH_FAILED", message },
    });
  }
});

function renderLastPingText(snapshot: LastPingSnapshot): string {
  const lines: string[] = [];
  lines.push("Last post-deploy search engine ping");
  lines.push(`Started:  ${snapshot.startedAt}`);
  lines.push(`Finished: ${snapshot.finishedAt}`);
  lines.push(`Sitemap:  ${snapshot.sitemapUrl}`);
  lines.push("");

  if (snapshot.results.length === 0) {
    lines.push(
      "No search engine credentials were configured — nothing was submitted.",
    );
    return lines.join("\n") + "\n";
  }

  for (const r of snapshot.results) {
    const status = r.status ? ` (HTTP ${r.status})` : "";
    const detail = r.error
      ? ` — ${r.error}`
      : r.detail
        ? ` — ${r.detail}`
        : "";
    lines.push(`${r.ok ? "OK" : "FAILED"}: ${r.engine}${status}${detail}`);
  }
  return lines.join("\n") + "\n";
}

const NO_PING_JSON = {
  error: {
    code: "PING_NOT_READY",
    message:
      "No post-deploy search engine ping has run yet. It fires once shortly after the api-server boots (default ~30s after deploy), unless SITEMAP_PING_DISABLED is set.",
  },
} as const;

const NO_PING_TEXT =
  "No post-deploy search engine ping has run yet.\n" +
  "It fires once shortly after the api-server boots (default ~30s after deploy),\n" +
  "unless SITEMAP_PING_DISABLED is set.\n";

router.get("/seo/last-ping", (_req, res) => {
  const snapshot = getLastPingResult();
  if (!snapshot) {
    res.status(503).json(NO_PING_JSON);
    return;
  }
  res.json(snapshot);
});

router.get("/seo/last-ping.txt", (_req, res) => {
  const snapshot = getLastPingResult();
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  if (!snapshot) {
    res.status(503).send(NO_PING_TEXT);
    return;
  }
  res.send(renderLastPingText(snapshot));
});

export default router;
