/**
 * Shared helpers for loading and persisting the sitemap content-hash manifest.
 *
 * Both `prerender.mjs` (which writes a fresh manifest at build time and needs
 * the *previous* manifest to carry forward each URL's `lastmod`) and
 * `ping-search-engines.mjs` (which diffs the live manifest against the last one
 * it submitted) need to read a previously-published manifest. To avoid two
 * copies of the same fetch/read/parse logic drifting apart, that logic lives
 * here.
 *
 * A manifest has the shape:
 *   {
 *     generatedAt: string,      // ISO timestamp
 *     siteOrigin: string,
 *     urls: Array<{ loc: string, hash: string, lastmod: string }>
 *   }
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// scripts/lib/ -> scripts/ -> artifact root
export const ARTIFACT_ROOT = path.resolve(__dirname, "..", "..");

// The manifest most recently submitted to IndexNow is cached here so the next
// ping can diff against it. The same file doubles as an offline fallback source
// of previous `lastmod` values when the live site can't be reached at build
// time. The `.cache/` directory is gitignored.
export const MANIFEST_CACHE_PATH = path.join(
  ARTIFACT_ROOT,
  ".cache",
  "last-pinged-sitemap-manifest.json",
);

const USER_AGENT = "sitemap-manifest-loader/1.0";

export function manifestUrlFor(siteOrigin) {
  return `${siteOrigin}/sitemap-manifest.json`;
}

function isManifest(data) {
  return Boolean(data) && Array.isArray(data.urls);
}

/**
 * Fetch the manifest currently served by the live site.
 * Returns `null` on 404 (older deploy that predates the manifest) and throws on
 * any other non-OK response or malformed body.
 */
export async function fetchLiveManifest(siteOrigin, { userAgent = USER_AGENT } = {}) {
  const manifestUrl = manifestUrlFor(siteOrigin);
  const res = await fetch(manifestUrl, { headers: { "User-Agent": userAgent } });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(
      `Could not fetch ${manifestUrl} (HTTP ${res.status}). The deploy may not be live yet, or SITE_ORIGIN may be wrong.`,
    );
  }
  const data = await res.json();
  if (!isManifest(data)) {
    throw new Error(`${manifestUrl} has unexpected shape (missing urls array)`);
  }
  return data;
}

/**
 * Read the locally-cached copy of the last manifest. Returns `null` when the
 * cache is missing (first run) or unreadable — callers treat that as "no
 * previous manifest available".
 */
export async function loadCachedManifest(cachePath = MANIFEST_CACHE_PATH) {
  try {
    const raw = await fs.readFile(cachePath, "utf-8");
    const data = JSON.parse(raw);
    if (!isManifest(data)) return null;
    return data;
  } catch (err) {
    if (err && err.code === "ENOENT") return null;
    console.warn(
      `[sitemap-manifest] Could not read cached manifest at ${path.relative(process.cwd(), cachePath)}: ${err.message}. Treating it as unavailable.`,
    );
    return null;
  }
}

/**
 * Persist a manifest to the local cache. Best-effort: failures are logged, not
 * thrown, so a write error can't crash the caller.
 */
export async function saveCachedManifest(manifest, cachePath = MANIFEST_CACHE_PATH) {
  try {
    await fs.mkdir(path.dirname(cachePath), { recursive: true });
    await fs.writeFile(
      cachePath,
      `${JSON.stringify(manifest, null, 2)}\n`,
      "utf-8",
    );
  } catch (err) {
    console.warn(
      `[sitemap-manifest] Could not update cached manifest at ${path.relative(process.cwd(), cachePath)}: ${err.message}.`,
    );
  }
}

/**
 * Load the previously-published manifest from whichever source is available.
 *
 * Order of preference:
 *   1. The live site (`${siteOrigin}/sitemap-manifest.json`) — the source of
 *      truth for what crawlers currently see. Skipped when `allowNetwork` is
 *      false (offline / local builds).
 *   2. The locally-cached copy written after the last successful ping.
 *
 * Returns `{ manifest, source }` where `source` is "live", "cache", or "none".
 * Network and read failures degrade gracefully to the next source.
 */
export async function loadPreviousManifest(siteOrigin, { allowNetwork = true } = {}) {
  if (allowNetwork) {
    try {
      const live = await fetchLiveManifest(siteOrigin);
      if (live) return { manifest: live, source: "live" };
    } catch (err) {
      console.warn(
        `[sitemap-manifest] Could not fetch the live manifest (${err.message}). Falling back to the local cache.`,
      );
    }
  }
  const cached = await loadCachedManifest();
  if (cached) return { manifest: cached, source: "cache" };
  return { manifest: null, source: "none" };
}

/** Build a `loc -> lastmod` lookup from a manifest (or null). */
export function lastmodByLoc(manifest) {
  return new Map(
    (manifest?.urls ?? []).map((entry) => [entry.loc, entry.lastmod]),
  );
}

/** Build a `loc -> hash` lookup from a manifest (or null). */
export function hashByLoc(manifest) {
  return new Map(
    (manifest?.urls ?? []).map((entry) => [entry.loc, entry.hash]),
  );
}
