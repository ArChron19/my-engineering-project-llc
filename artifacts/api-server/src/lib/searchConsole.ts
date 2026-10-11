/**
 * Google Search Console client.
 *
 * Reuses the same OAuth credentials that `lib/sitemapPing.ts` uses for the
 * post-deploy sitemap re-submission, so a single set of secrets covers both
 * the ping step and the weekly indexing report.
 *
 * Required environment variables:
 *   GSC_CLIENT_ID, GSC_CLIENT_SECRET, GSC_REFRESH_TOKEN
 *
 * Optional:
 *   GSC_SITE_URL  — defaults to "https://myengineeringproject.com/".
 *                   Use "sc-domain:myengineeringproject.com" if the property
 *                   is verified as a domain property.
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SC_API = "https://searchconsole.googleapis.com/webmasters/v3";

export class SearchConsoleConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SearchConsoleConfigError";
  }
}

export class SearchConsoleApiError extends Error {
  status?: number;
  detail?: string;
  constructor(message: string, status?: number, detail?: string) {
    super(message);
    this.name = "SearchConsoleApiError";
    this.status = status;
    this.detail = detail;
  }
}

export interface SearchConsoleConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  siteUrl: string;
}

export function getSearchConsoleConfig(): SearchConsoleConfig {
  const clientId = process.env.GSC_CLIENT_ID;
  const clientSecret = process.env.GSC_CLIENT_SECRET;
  const refreshToken = process.env.GSC_REFRESH_TOKEN;
  const siteUrl =
    process.env.GSC_SITE_URL ||
    `${process.env.SITE_ORIGIN || "https://myengineeringproject.com"}/`;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new SearchConsoleConfigError(
      "Google Search Console credentials are not configured. Set GSC_CLIENT_ID, GSC_CLIENT_SECRET, and GSC_REFRESH_TOKEN.",
    );
  }

  return { clientId, clientSecret, refreshToken, siteUrl };
}

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

async function getAccessToken(cfg: SearchConsoleConfig): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.accessToken;
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      refresh_token: cfg.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new SearchConsoleApiError(
      "Failed to exchange GSC refresh token for an access token.",
      res.status,
      detail,
    );
  }

  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    accessToken: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
  };
  return cachedToken.accessToken;
}

async function gscFetch<T>(cfg: SearchConsoleConfig, pathSuffix: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken(cfg);
  const url = `${SC_API}${pathSuffix}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new SearchConsoleApiError(
      `Search Console API request failed: ${pathSuffix}`,
      res.status,
      detail,
    );
  }
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

// ---------- Sitemaps ----------

export interface SitemapContent {
  type?: string;
  submitted?: string;
  indexed?: string;
}

export interface SitemapEntry {
  path: string;
  lastSubmitted?: string;
  lastDownloaded?: string;
  isPending?: boolean;
  isSitemapsIndex?: boolean;
  type?: string;
  warnings?: string;
  errors?: string;
  contents?: SitemapContent[];
}

interface SitemapsListResponse {
  sitemap?: Array<{
    path: string;
    lastSubmitted?: string;
    lastDownloaded?: string;
    isPending?: boolean;
    isSitemapsIndex?: boolean;
    type?: string;
    warnings?: string;
    errors?: string;
    contents?: SitemapContent[];
  }>;
}

export async function listSitemaps(cfg: SearchConsoleConfig): Promise<SitemapEntry[]> {
  const data = await gscFetch<SitemapsListResponse>(
    cfg,
    `/sites/${encodeURIComponent(cfg.siteUrl)}/sitemaps`,
  );
  return (data.sitemap ?? []).map((s) => ({
    path: s.path,
    lastSubmitted: s.lastSubmitted,
    lastDownloaded: s.lastDownloaded,
    isPending: s.isPending,
    isSitemapsIndex: s.isSitemapsIndex,
    type: s.type,
    warnings: s.warnings,
    errors: s.errors,
    contents: s.contents,
  }));
}

// ---------- Search Analytics ----------

export interface SearchAnalyticsRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface SearchAnalyticsResponse {
  rows?: Array<{
    keys?: string[];
    clicks?: number;
    impressions?: number;
    ctr?: number;
    position?: number;
  }>;
}

export interface SearchAnalyticsQuery {
  startDate: string; // YYYY-MM-DD
  endDate: string;
  dimensions?: Array<"query" | "page" | "country" | "device" | "date">;
  rowLimit?: number;
  startRow?: number;
}

export async function querySearchAnalytics(
  cfg: SearchConsoleConfig,
  q: SearchAnalyticsQuery,
): Promise<SearchAnalyticsRow[]> {
  const body = {
    startDate: q.startDate,
    endDate: q.endDate,
    dimensions: q.dimensions ?? [],
    rowLimit: q.rowLimit ?? 100,
    startRow: q.startRow ?? 0,
  };

  const data = await gscFetch<SearchAnalyticsResponse>(
    cfg,
    `/sites/${encodeURIComponent(cfg.siteUrl)}/searchAnalytics/query`,
    { method: "POST", body: JSON.stringify(body) },
  );

  return (data.rows ?? []).map((r) => ({
    keys: r.keys ?? [],
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    ctr: r.ctr ?? 0,
    position: r.position ?? 0,
  }));
}
