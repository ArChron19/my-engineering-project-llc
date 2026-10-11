/**
 * Weekly indexing report.
 *
 * Pulls coverage and performance data from Google Search Console (and
 * optionally Bing Webmaster Tools) and assembles a structured report.
 *
 * Reports are kept in-memory; the most recent 12 reports (~3 months) are
 * retained so the dashboard can show a short trend. The `startScheduler`
 * helper triggers a fresh report on a weekly cadence.
 *
 * Configuration:
 *   - GSC_*                       — see `searchConsole.ts` (required)
 *   - BING_WEBMASTER_API_KEY      — see `bingWebmaster.ts` (optional)
 *   - SEO_REPORT_DISABLED=1       — skip the scheduler entirely
 *   - SEO_REPORT_INTERVAL_MS      — override the weekly cadence (for testing)
 *   - SEO_REPORT_INITIAL_DELAY_MS — delay before the first run (default 60s)
 */

import {
  getSearchConsoleConfig,
  listSitemaps,
  querySearchAnalytics,
  SearchConsoleApiError,
  SearchConsoleConfigError,
  type SearchAnalyticsRow,
  type SitemapEntry,
} from "./searchConsole.js";
import {
  getBingWebmasterConfig,
  getRankAndTrafficStats,
  BingWebmasterApiError,
  BingWebmasterConfigError,
  type BingRankAndTrafficStat,
} from "./bingWebmaster.js";

const DEFAULT_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week
const DEFAULT_INITIAL_DELAY_MS = 60 * 1000; // 60 seconds after boot
const MAX_HISTORY = 12;

export interface SitemapSummary {
  path: string;
  lastSubmitted?: string;
  lastDownloaded?: string;
  isPending?: boolean;
  warnings: number;
  errors: number;
  submitted: number;
  indexed: number;
}

export interface SearchTotals {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface TopRow {
  key: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GoogleSection {
  status: "ok" | "skipped" | "error";
  message?: string;
  siteUrl?: string;
  sitemaps: SitemapSummary[];
  totals?: SearchTotals;
  topQueries: TopRow[];
  topPages: TopRow[];
  /**
   * Count of distinct pages with impressions during the period, sampled from
   * the top `pageRowLimit` results of `searchAnalytics.query` (currently
   * 1000). Used as a proxy for "indexed and discovered pages". Sites with
   * more than `pageRowLimit` pages will under-count.
   */
  pagesWithImpressionsSample?: { count: number; sampleSize: number };
}

export interface BingSection {
  status: "ok" | "skipped" | "error";
  message?: string;
  siteUrl?: string;
  totals?: { clicks: number; impressions: number };
  daily: BingRankAndTrafficStat[];
}

export interface WeeklyReport {
  generatedAt: string;
  period: { startDate: string; endDate: string };
  google: GoogleSection;
  bing: BingSection;
}

// ---------- Helpers ----------

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function defaultPeriod(): { startDate: string; endDate: string } {
  // Search Console has a ~3-day lag, so report on days T-10..T-3.
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 3);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 6);
  return { startDate: isoDate(start), endDate: isoDate(end) };
}

function summarizeSitemap(s: SitemapEntry): SitemapSummary {
  const submitted = (s.contents ?? []).reduce(
    (acc, c) => acc + (c.submitted ? Number(c.submitted) : 0),
    0,
  );
  const indexed = (s.contents ?? []).reduce(
    (acc, c) => acc + (c.indexed ? Number(c.indexed) : 0),
    0,
  );
  return {
    path: s.path,
    lastSubmitted: s.lastSubmitted,
    lastDownloaded: s.lastDownloaded,
    isPending: s.isPending,
    warnings: s.warnings ? Number(s.warnings) : 0,
    errors: s.errors ? Number(s.errors) : 0,
    submitted,
    indexed,
  };
}

function rowsToTop(rows: SearchAnalyticsRow[], limit: number): TopRow[] {
  return rows.slice(0, limit).map((r) => ({
    key: r.keys.join(" / "),
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  }));
}

function aggregateTotals(rows: SearchAnalyticsRow[]): SearchTotals {
  let clicks = 0;
  let impressions = 0;
  let ctrWeighted = 0;
  let positionWeighted = 0;
  for (const r of rows) {
    clicks += r.clicks;
    impressions += r.impressions;
    ctrWeighted += r.ctr * r.impressions;
    positionWeighted += r.position * r.impressions;
  }
  return {
    clicks,
    impressions,
    ctr: impressions > 0 ? ctrWeighted / impressions : 0,
    position: impressions > 0 ? positionWeighted / impressions : 0,
  };
}

// ---------- Section builders ----------

async function buildGoogleSection(
  period: { startDate: string; endDate: string },
): Promise<GoogleSection> {
  let cfg;
  try {
    cfg = getSearchConsoleConfig();
  } catch (err) {
    if (err instanceof SearchConsoleConfigError) {
      return { status: "skipped", message: err.message, sitemaps: [], topQueries: [], topPages: [] };
    }
    throw err;
  }

  const pageRowLimit = 1000;
  try {
    const [sitemaps, queryRows, pageRows, dailyRows] = await Promise.all([
      listSitemaps(cfg),
      querySearchAnalytics(cfg, { ...period, dimensions: ["query"], rowLimit: 25 }),
      querySearchAnalytics(cfg, { ...period, dimensions: ["page"], rowLimit: pageRowLimit }),
      querySearchAnalytics(cfg, { ...period, dimensions: ["date"], rowLimit: 31 }),
    ]);

    return {
      status: "ok",
      siteUrl: cfg.siteUrl,
      sitemaps: sitemaps.map(summarizeSitemap),
      totals: aggregateTotals(dailyRows),
      topQueries: rowsToTop(queryRows, 10),
      topPages: rowsToTop(pageRows, 10),
      pagesWithImpressionsSample: {
        count: pageRows.filter((r) => r.impressions > 0).length,
        sampleSize: pageRowLimit,
      },
    };
  } catch (err) {
    const message =
      err instanceof SearchConsoleApiError
        ? `${err.message}${err.status ? ` (HTTP ${err.status})` : ""}${err.detail ? ` — ${err.detail.slice(0, 200)}` : ""}`
        : err instanceof Error
          ? err.message
          : String(err);
    return {
      status: "error",
      message,
      siteUrl: cfg.siteUrl,
      sitemaps: [],
      topQueries: [],
      topPages: [],
    };
  }
}

async function buildBingSection(
  period: { startDate: string; endDate: string },
): Promise<BingSection> {
  let cfg;
  try {
    cfg = getBingWebmasterConfig();
  } catch (err) {
    if (err instanceof BingWebmasterConfigError) {
      return { status: "skipped", message: err.message, daily: [] };
    }
    throw err;
  }

  try {
    const stats = await getRankAndTrafficStats(cfg);
    const inWindow = stats.filter(
      (s) => s.date >= period.startDate && s.date <= period.endDate,
    );
    const totals = inWindow.reduce(
      (acc, s) => ({ clicks: acc.clicks + s.clicks, impressions: acc.impressions + s.impressions }),
      { clicks: 0, impressions: 0 },
    );
    return {
      status: "ok",
      siteUrl: cfg.siteUrl,
      totals,
      daily: inWindow,
    };
  } catch (err) {
    const message =
      err instanceof BingWebmasterApiError
        ? `${err.message}${err.status ? ` (HTTP ${err.status})` : ""}${err.detail ? ` — ${err.detail.slice(0, 200)}` : ""}`
        : err instanceof Error
          ? err.message
          : String(err);
    return { status: "error", message, siteUrl: cfg.siteUrl, daily: [] };
  }
}

// ---------- Public API ----------

export async function buildWeeklyReport(): Promise<WeeklyReport> {
  const period = defaultPeriod();
  const [google, bing] = await Promise.all([
    buildGoogleSection(period),
    buildBingSection(period),
  ]);
  return { generatedAt: new Date().toISOString(), period, google, bing };
}

const reportHistory: WeeklyReport[] = [];

export function getLatestReport(): WeeklyReport | null {
  return reportHistory[0] ?? null;
}

export function getReportHistory(): WeeklyReport[] {
  return reportHistory.slice();
}

export async function refreshReport(): Promise<WeeklyReport> {
  const report = await buildWeeklyReport();
  reportHistory.unshift(report);
  if (reportHistory.length > MAX_HISTORY) reportHistory.length = MAX_HISTORY;
  return report;
}

// ---------- Scheduler ----------

let schedulerTimer: ReturnType<typeof setTimeout> | null = null;
let initialTimer: ReturnType<typeof setTimeout> | null = null;

function isTruthy(v: string | undefined): boolean {
  return v === "1" || v === "true" || v === "yes";
}

function readNumberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

async function runOnce(): Promise<void> {
  try {
    const report = await refreshReport();
    const issues: string[] = [];
    if (report.google.status === "error") issues.push(`google: ${report.google.message}`);
    if (report.bing.status === "error") issues.push(`bing: ${report.bing.message}`);
    if (issues.length) {
      console.warn(`[seo-report] Generated weekly report with issues: ${issues.join("; ")}`);
    } else {
      const totals = report.google.totals;
      console.log(
        `[seo-report] Weekly report generated for ${report.period.startDate}..${report.period.endDate}` +
          (totals
            ? ` — ${totals.clicks} clicks, ${totals.impressions} impressions`
            : ""),
      );
    }
  } catch (err) {
    console.error("[seo-report] Failed to generate weekly report:", err);
  }
}

export interface SchedulerOptions {
  /** Interval between weekly runs in ms. Defaults to 7 days. */
  intervalMs?: number;
  /** Delay before the first run in ms. Defaults to 60s after boot. */
  initialDelayMs?: number;
  /** Skip the initial run (useful for tests). Defaults to false. */
  skipInitialRun?: boolean;
}

export function startScheduler(opts: SchedulerOptions = {}): void {
  if (isTruthy(process.env.SEO_REPORT_DISABLED)) {
    console.log("[seo-report] SEO_REPORT_DISABLED is set — scheduler not started.");
    return;
  }
  if (schedulerTimer || initialTimer) {
    console.warn("[seo-report] Scheduler already running; ignoring duplicate start.");
    return;
  }

  const intervalMs =
    opts.intervalMs ?? readNumberEnv("SEO_REPORT_INTERVAL_MS", DEFAULT_INTERVAL_MS);
  const initialDelayMs =
    opts.initialDelayMs ?? readNumberEnv("SEO_REPORT_INITIAL_DELAY_MS", DEFAULT_INITIAL_DELAY_MS);

  const tick = () => {
    runOnce().finally(() => {
      schedulerTimer = setTimeout(tick, intervalMs);
      schedulerTimer.unref?.();
    });
  };

  if (opts.skipInitialRun) {
    schedulerTimer = setTimeout(tick, intervalMs);
    schedulerTimer.unref?.();
  } else {
    initialTimer = setTimeout(() => {
      initialTimer = null;
      tick();
    }, initialDelayMs);
    initialTimer.unref?.();
  }

  console.log(
    `[seo-report] Weekly indexing report scheduler started (every ${Math.round(intervalMs / 1000)}s, first run in ${Math.round(initialDelayMs / 1000)}s).`,
  );
}

export function stopScheduler(): void {
  if (schedulerTimer) {
    clearTimeout(schedulerTimer);
    schedulerTimer = null;
  }
  if (initialTimer) {
    clearTimeout(initialTimer);
    initialTimer = null;
  }
}

// ---------- Plain-text rendering ----------

function pad(value: number | string, width: number): string {
  const s = String(value);
  return s.length >= width ? s : s + " ".repeat(width - s.length);
}

function fmtPct(n: number): string {
  return `${(n * 100).toFixed(2)}%`;
}

function fmtPos(n: number): string {
  return n.toFixed(2);
}

export function renderReportText(report: WeeklyReport): string {
  const lines: string[] = [];
  lines.push(`Weekly Indexing Report`);
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Period:    ${report.period.startDate} → ${report.period.endDate}`);
  lines.push("");

  // Google
  lines.push(`== Google Search Console (${report.google.status}) ==`);
  if (report.google.message) lines.push(report.google.message);
  if (report.google.siteUrl) lines.push(`Site: ${report.google.siteUrl}`);

  if (report.google.sitemaps.length > 0) {
    lines.push("");
    lines.push("Sitemaps:");
    for (const s of report.google.sitemaps) {
      lines.push(
        `  - ${s.path}: submitted=${s.submitted} indexed=${s.indexed} errors=${s.errors} warnings=${s.warnings}` +
          (s.lastDownloaded ? ` lastDownloaded=${s.lastDownloaded}` : "") +
          (s.isPending ? " [pending]" : ""),
      );
    }
  }

  if (report.google.totals) {
    const t = report.google.totals;
    lines.push("");
    lines.push(
      `Totals (period): ${t.clicks} clicks, ${t.impressions} impressions, CTR ${fmtPct(t.ctr)}, avg position ${fmtPos(t.position)}`,
    );
    if (report.google.pagesWithImpressionsSample) {
      const s = report.google.pagesWithImpressionsSample;
      lines.push(
        `Pages with impressions (sampled from top ${s.sampleSize}): ${s.count}`,
      );
    }
  }

  if (report.google.topQueries.length > 0) {
    lines.push("");
    lines.push("Top queries (by clicks):");
    lines.push(`  ${pad("clicks", 8)}${pad("impr", 10)}${pad("ctr", 10)}${pad("pos", 8)}query`);
    for (const r of report.google.topQueries) {
      lines.push(
        `  ${pad(r.clicks, 8)}${pad(r.impressions, 10)}${pad(fmtPct(r.ctr), 10)}${pad(fmtPos(r.position), 8)}${r.key}`,
      );
    }
  }

  if (report.google.topPages.length > 0) {
    lines.push("");
    lines.push("Top pages (by clicks):");
    lines.push(`  ${pad("clicks", 8)}${pad("impr", 10)}${pad("ctr", 10)}${pad("pos", 8)}page`);
    for (const r of report.google.topPages) {
      lines.push(
        `  ${pad(r.clicks, 8)}${pad(r.impressions, 10)}${pad(fmtPct(r.ctr), 10)}${pad(fmtPos(r.position), 8)}${r.key}`,
      );
    }
  }

  // Bing
  lines.push("");
  lines.push(`== Bing Webmaster (${report.bing.status}) ==`);
  if (report.bing.message) lines.push(report.bing.message);
  if (report.bing.siteUrl) lines.push(`Site: ${report.bing.siteUrl}`);
  if (report.bing.totals) {
    lines.push(
      `Totals (period): ${report.bing.totals.clicks} clicks, ${report.bing.totals.impressions} impressions`,
    );
  }
  if (report.bing.daily.length > 0) {
    lines.push("");
    lines.push("Daily breakdown:");
    for (const d of report.bing.daily) {
      lines.push(`  ${d.date}: ${d.clicks} clicks, ${d.impressions} impressions`);
    }
  }

  return lines.join("\n") + "\n";
}
