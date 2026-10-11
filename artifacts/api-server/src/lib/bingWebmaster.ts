/**
 * Optional Bing Webmaster Tools client.
 *
 * Used by the weekly indexing report when `BING_WEBMASTER_API_KEY` is set.
 * Without the key the report skips this section entirely (Bing's API key is
 * separate from the IndexNow key used for sitemap pings).
 *
 * Required environment variables:
 *   BING_WEBMASTER_API_KEY — generated under "API Access" in Bing Webmaster Tools.
 *
 * Optional:
 *   BING_SITE_URL — defaults to `${SITE_ORIGIN}/` or
 *                   `https://myengineeringproject.com/`.
 */

const BASE_URL = "https://ssl.bing.com/webmaster/api.svc/json";

export class BingWebmasterConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BingWebmasterConfigError";
  }
}

export class BingWebmasterApiError extends Error {
  status?: number;
  detail?: string;
  constructor(message: string, status?: number, detail?: string) {
    super(message);
    this.name = "BingWebmasterApiError";
    this.status = status;
    this.detail = detail;
  }
}

export interface BingWebmasterConfig {
  apiKey: string;
  siteUrl: string;
}

export function getBingWebmasterConfig(): BingWebmasterConfig {
  const apiKey = process.env.BING_WEBMASTER_API_KEY;
  const siteUrl =
    process.env.BING_SITE_URL ||
    `${process.env.SITE_ORIGIN || "https://myengineeringproject.com"}/`;

  if (!apiKey) {
    throw new BingWebmasterConfigError(
      "Bing Webmaster API key is not configured. Set BING_WEBMASTER_API_KEY to include Bing in the report.",
    );
  }

  return { apiKey, siteUrl };
}

export interface BingRankAndTrafficStat {
  date: string;
  impressions: number;
  clicks: number;
}

interface BingRankAndTrafficResponse {
  d?: Array<{
    Date?: string;
    Impressions?: number;
    Clicks?: number;
  }>;
}

export async function getRankAndTrafficStats(
  cfg: BingWebmasterConfig,
): Promise<BingRankAndTrafficStat[]> {
  const url = `${BASE_URL}/GetRankAndTrafficStats?siteUrl=${encodeURIComponent(cfg.siteUrl)}&apikey=${encodeURIComponent(cfg.apiKey)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new BingWebmasterApiError(
      "Bing Webmaster GetRankAndTrafficStats failed.",
      res.status,
      detail,
    );
  }
  const data = (await res.json()) as BingRankAndTrafficResponse;
  return (data.d ?? []).map((row) => ({
    date: row.Date ?? "",
    impressions: row.Impressions ?? 0,
    clicks: row.Clicks ?? 0,
  }));
}
