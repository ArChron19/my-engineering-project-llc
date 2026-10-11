# Sitemap Submission Guide

The site serves a sitemap at `https://myengineeringproject.com/sitemap.xml`, and
`public/robots.txt` already references it. Each successful **deploy**
automatically pings the major search engines so we don't have to log into the
consoles for routine updates. Initial account setup and ownership verification
are still one-time manual steps — see below.

## Sitemap URL
```
https://myengineeringproject.com/sitemap.xml
```

## Automated submission (runs after every deploy)

The notification fires from the **api-server**, not from `pnpm build`. Because
the api-server is restarted whenever the project is redeployed, "shortly after
boot" is effectively "shortly after deploy". This makes the automation reliable
even on the very first deploy, and avoids submitting URLs from local builds or
failed CI runs that never go live.

The end-to-end flow on every deploy:

1. **Build** — `pnpm --filter @workspace/my-engineering-project build` runs:
   1. `vite build` — produces the static assets in `dist/public/`.
   2. `node scripts/prerender.mjs` — pre-renders each route, resolves accurate
      per-URL `<lastmod>` dates (see "Accurate lastmod dates" below), and writes
      `dist/public/sitemap.xml` and `dist/public/sitemap-manifest.json`.
   3. `node scripts/write-indexnow-key.mjs` — writes the IndexNow verification
      file to `dist/public/<INDEXNOW_KEY>.txt` so it ships with the static
      deploy. **No search-engine submission API calls are made during the build.**
2. **Deploy** — Replit publishes the static site and (re)starts the api-server.
3. **Post-deploy ping** — about 30 seconds after the api-server boots,
   `artifacts/api-server/src/lib/sitemapPing.ts` runs once. It fetches the live
   sitemap from `${SITE_ORIGIN}/sitemap.xml` (which double-checks that the
   deploy is actually live), then notifies:
   - **IndexNow** — a single POST notifies Bing, Yandex, Naver, Seznam, and
     other participating engines. We submit every `<loc>` from the new sitemap.
   - **Google Search Console Sitemaps API** — re-submits the sitemap to Google.

Both integrations are gated on environment variables. If the variables are not
set, the hook logs that it is skipping that engine. Failures are logged but
never crash the api-server.

### Checking whether the last deploy's ping succeeded

The ping logs success/failure to stdout, but you don't have to scrape logs to
confirm the automation worked. The api-server keeps the outcome of the most
recent post-deploy ping in memory and exposes it read-only:

| Endpoint | Description |
| --- | --- |
| `GET /api/seo/last-ping` | Outcome of the last ping as JSON: `startedAt`, `finishedAt`, `sitemapUrl`, and a `results` array with one entry per engine (`engine`, `ok`, `status`, `detail`/`error`). Returns 503 with code `PING_NOT_READY` until the first ping completes. |
| `GET /api/seo/last-ping.txt` | Same outcome rendered as plain text — convenient for `curl`, log archiving, or pasting into Slack/email. |

Notes:

- The status is held **in memory**, so it resets to "no ping yet" whenever the
  api-server restarts (i.e. on every deploy) and repopulates once the
  post-deploy ping fires (~30s after boot by default).
- When no credentials are configured, the ping still runs and records an empty
  `results` array — the endpoints make clear that nothing was submitted rather
  than reporting a failure.
- This surfaces the **api-server's** post-deploy ping only. The manual
  `scripts/ping-search-engines.mjs` runs in a separate process and is not
  reflected here.

### Accurate lastmod dates

Every `<lastmod>` entry in `sitemap.xml` reflects when that page's content
actually changed, rather than the build date. This matters because Google uses
`lastmod` to prioritise crawl budget, and a sitemap where every URL claims
today's date is treated as untrustworthy and effectively ignored.

**How it works:**

1. At the start of the build, `prerender.mjs` fetches the previously-deployed
   `${SITE_ORIGIN}/sitemap-manifest.json` from the live site. This is the same
   manifest that was produced by the previous build and deployed alongside the
   previous `sitemap.xml`. Because the build runs before the new deploy goes
   live, the live site is still serving the previous version.
2. If the live fetch fails (network unavailable, first-ever deploy, or
   `SITEMAP_LASTMOD_OFFLINE=1` is set), the script falls back to the locally-
   cached copy at `.cache/last-pinged-sitemap-manifest.json`, which is written
   by `ping-search-engines.mjs` after each successful ping. If neither source
   is available, today's date is stamped on every URL.
3. For each route rendered in the current build, `prerender.mjs` computes a
   SHA-256 hash of the rendered HTML and SEO fields. If the hash matches the
   previous manifest, the previous `lastmod` is carried forward unchanged. Only
   routes whose hash differs from the previous build (genuinely new or updated
   content) get today's date.
4. Each entry in `sitemap-manifest.json` stores both the hash and the resolved
   `lastmod`. `sitemap.xml` uses these per-URL dates.

**Shared manifest loader:**

`scripts/lib/sitemap-manifest.mjs` is a shared module used by both
`prerender.mjs` (to load the previous manifest for lastmod carry-forward) and
`ping-search-engines.mjs` (to diff against the last successfully-submitted
manifest for incremental IndexNow submission). It exports `fetchLiveManifest`,
`loadCachedManifest`, `saveCachedManifest`, `loadPreviousManifest`,
`hashByLoc`, and `lastmodByLoc`.

### Incremental IndexNow submission (manual script only)

Alongside `sitemap.xml`, `prerender.mjs` also writes
`dist/public/sitemap-manifest.json`. This manifest contains a SHA-256 content
hash for every route (computed over the rendered HTML and the SEO fields that
go into `<head>`), and ships with the static deploy at
`${SITE_ORIGIN}/sitemap-manifest.json`.

When `scripts/ping-search-engines.mjs` runs, it:

1. Fetches the live manifest from `${SITE_ORIGIN}/sitemap-manifest.json` (the
   "new" state — what was just deployed).
2. Compares each URL's hash against the previous manifest cached locally at
   `artifacts/my-engineering-project/.cache/last-pinged-sitemap-manifest.json`
   (the cache is gitignored).
3. Submits to IndexNow only the URLs whose hash is new or has changed.
4. If nothing changed, logs that and **skips the IndexNow API call entirely**
   — IndexNow throttles aggressive submitters, so quiet periods stay quiet.
5. On a successful IndexNow response, overwrites the local cache with the new
   manifest. Failed submissions leave the cache untouched so the URLs are
   retried on the next run.

Edge cases:

- If the cache file is missing (first run after `git clone`, fresh CI runner,
  or the cache was deleted), the script submits every URL — same behaviour as
  before.
- If `${SITE_ORIGIN}/sitemap-manifest.json` returns 404 (older deploy), the
  script falls back to submitting every `<loc>` from `sitemap.xml`.
- Set `SITEMAP_PING_FORCE_FULL=1` to ignore the cache and resubmit every URL
  in the manifest. Useful if a previous IndexNow submission was accepted but
  the engines never picked up the URLs and you want to retry from a clean
  slate.

The Google Search Console call is unaffected by the diff: it's a single
sitemap-level PUT (not a per-URL submission), so re-pinging when nothing
changed is harmless and lets Google re-confirm the sitemap on every deploy.

The api-server's automatic post-deploy ping
(`artifacts/api-server/src/lib/sitemapPing.ts`) does **not** currently use the
manifest cache and submits the full sitemap on each boot. Tracked separately —
see the "Avoid re-pinging search engines on every api-server cold start" task.

### Environment variables

These are read by the api-server (post-deploy ping), `write-indexnow-key.mjs`
(during build), and `ping-search-engines.mjs` (manual fallback):

| Variable | Required for | Notes |
| --- | --- | --- |
| `INDEXNOW_KEY` | IndexNow (Bing, Yandex, Naver, Seznam) | 8–128 chars, letters/digits/hyphens. Generate one at https://www.bing.com/indexnow/getstarted. The build writes it to `dist/public/<key>.txt` so the verification file ships with the deploy. The api-server reads the same variable to authenticate with IndexNow. |
| `GSC_CLIENT_ID` | Google Search Console | OAuth 2.0 client ID. |
| `GSC_CLIENT_SECRET` | Google Search Console | OAuth 2.0 client secret. |
| `GSC_REFRESH_TOKEN` | Google Search Console | Long-lived refresh token with the `https://www.googleapis.com/auth/webmasters` scope. |
| `GSC_SITE_URL` | Google Search Console (optional) | Defaults to `https://myengineeringproject.com/`. Use `sc-domain:myengineeringproject.com` if the property is verified as a domain property. |
| `SITE_ORIGIN` | All (optional) | Overrides the default origin (`https://myengineeringproject.com`). Used by `prerender.mjs` when generating sitemap `<loc>` URLs and by the post-deploy ping when fetching the live sitemap, so staging builds submit staging URLs. |
| `SITEMAP_PING_DISABLED` | Post-deploy ping + manual script | Set to `1` to skip the notification step entirely (see "Disabling" below). |
| `SITEMAP_PING_DELAY_MS` | Post-deploy ping (optional) | Delay before the post-deploy ping runs after api-server boot. Defaults to 30 000ms (30s). |
| `SITEMAP_PING_STRICT` | Manual script only (optional) | Set to `1` to make `ping-search-engines.mjs` exit `1` on any failure (useful for CI). The api-server post-deploy ping always logs failures and continues. |
| `SITEMAP_PING_FORCE_FULL` | Manual script only (optional) | Set to `1` to ignore the manifest diff cache and resubmit every URL in `sitemap-manifest.json`. Without this flag, only URLs whose content hash changed since the last successful ping are submitted. |
| `SITEMAP_LASTMOD_OFFLINE` | Build (`prerender.mjs`) (optional) | Set to `1` to skip the live `sitemap-manifest.json` fetch during the build and use only the locally-cached copy for `lastmod` carry-forward. Useful when building in a network-restricted environment. If neither the live site nor the cache is available, today's date is used for all URLs. |

### One-time IndexNow setup

1. Generate a key at https://www.bing.com/indexnow/getstarted (or just pick any
   random 32-char hex string).
2. Save it as the `INDEXNOW_KEY` secret in Replit (or your CI environment).
   The same secret is consumed by the build (which writes the verification key
   file) and by the api-server (which makes the post-deploy API call).
3. Run a build and deploy. The build writes `dist/public/<key>.txt`
   automatically, so once the deploy is live the verification file is reachable
   at `https://myengineeringproject.com/<key>.txt`. The api-server then pings
   IndexNow ~30 seconds after it boots, and IndexNow can verify ownership.

### One-time Google Search Console setup

1. In Google Cloud Console, create an OAuth 2.0 Client ID of type "Web
   application" or "Desktop". Note the client ID and secret.
2. Use the OAuth 2.0 Playground (or a similar tool) to grant the
   `https://www.googleapis.com/auth/webmasters` scope to the account that owns
   the Search Console property and exchange the resulting code for a refresh
   token.
3. Save the three values as `GSC_CLIENT_ID`, `GSC_CLIENT_SECRET`, and
   `GSC_REFRESH_TOKEN` in your deploy environment.
4. The next deploy will resubmit the sitemap automatically.

### Manual / out-of-band re-submission

`scripts/ping-search-engines.mjs` is still available as a manual tool. Run it
when the api-server is offline, or when you want to force an out-of-band
re-submission without waiting for a redeploy:

```bash
node artifacts/my-engineering-project/scripts/ping-search-engines.mjs
```

It uses the same environment variables as the post-deploy ping and fetches the
sitemap from `${SITE_ORIGIN}/sitemap.xml` (the live site), so it must be run
after a deploy is live. It does **not** run during `pnpm build` — local builds
and previews never make external API calls.

### Disabling the automation

Set `SITEMAP_PING_DISABLED=1` in the deploy environment to skip the post-deploy
ping entirely (useful when a search engine API is having an outage). The
api-server will log that it skipped the ping and continue normally.

You can also unset `INDEXNOW_KEY` and the `GSC_*` variables individually — the
hook silently skips whichever engine is missing credentials.

## Google Search Console (one-time account setup)

1. Go to https://search.google.com/search-console and sign in.
2. Click **Add property** and choose **Domain** (recommended — covers all
   subdomains and protocols). Enter `myengineeringproject.com`.
3. Verify ownership using the DNS TXT record Google provides. Add it through
   your domain registrar's DNS panel, then click **Verify**.
   - Alternative: choose **URL prefix** instead and verify with the
     HTML file method (upload the file to `public/`).
4. In the left sidebar, open **Sitemaps**.
5. Under **Add a new sitemap**, enter `sitemap.xml` and click **Submit**.
6. Wait a few minutes, then refresh. Status should read **Success**.
7. Open **Pages** (Indexing → Pages) to review the initial coverage report
   for crawl errors. Note any URLs flagged as "Excluded" or "Error" and
   address them.

## Bing Webmaster Tools (one-time account setup)

1. Go to https://www.bing.com/webmasters and sign in.
2. Click **Add a site**. The fastest path is **Import from Google Search
   Console** — this carries over verification and the sitemap automatically.
3. If importing isn't an option, click **Add site manually**, enter
   `https://myengineeringproject.com`, and verify via DNS TXT record,
   XML file upload, or meta tag.
4. In the left sidebar, open **Sitemaps**.
5. Click **Submit sitemap** and enter
   `https://myengineeringproject.com/sitemap.xml`.
6. Open **Site Explorer** and **URL Inspection** to review the initial
   crawl report and address any flagged errors.

## Weekly indexing report

Once the sitemap is being submitted automatically, ongoing visibility into
crawl errors, indexed page counts, and top queries is what actually drives
SEO improvements. The api-server runs a lightweight job in the background
that pulls those numbers from the search engines once a week and exposes a
small dashboard for them.

### What it covers

- **Google Search Console** — sitemap status (submitted vs. indexed,
  warnings, errors, last download), 7-day totals (clicks, impressions, CTR,
  average position), top 10 queries, top 10 pages, and a "unique pages with
  impressions" count as a proxy for indexed-and-discovered pages.
- **Bing Webmaster Tools** — optional. When `BING_WEBMASTER_API_KEY` is set
  the report includes Bing's daily clicks/impressions for the same window.
- **Period** — the report covers the 7-day window ending three days before
  the run, which matches Search Console's data lag.

### Where the report lives

The api-server keeps the latest 12 weekly reports in memory and serves them
from these endpoints:

| Endpoint | Description |
| --- | --- |
| `GET /api/seo/weekly-report` | Latest report as JSON. Returns 503 until the first run completes. |
| `GET /api/seo/weekly-report.txt` | Same report rendered as plain text — convenient for `curl`, log archiving, or pasting into Slack/email. |
| `GET /api/seo/weekly-report/history` | Last 12 reports as `{ "reports": [...] }`. |
| `POST /api/seo/weekly-report/refresh` | Force a fresh fetch right now. |

### Configuration

The report reuses the same Google credentials that the post-deploy sitemap
ping (`artifacts/api-server/src/lib/sitemapPing.ts`) already uses, so no extra
Google secrets are required:

| Variable | Required for | Notes |
| --- | --- | --- |
| `GSC_CLIENT_ID` / `GSC_CLIENT_SECRET` / `GSC_REFRESH_TOKEN` | Google section | Same values as the ping step. |
| `GSC_SITE_URL` | Google section (optional) | Same default as the ping step. |
| `BING_WEBMASTER_API_KEY` | Bing section (optional) | Generated under "API Access" in Bing Webmaster Tools. Without it the Bing section is marked "skipped" and the rest of the report still works. |
| `BING_SITE_URL` | Bing section (optional) | Defaults to `${SITE_ORIGIN}/` or `https://myengineeringproject.com/`. |
| `SEO_REPORT_DISABLED` | Both | Set to `1` to disable the scheduler entirely (useful in local dev). |
| `SEO_REPORT_INTERVAL_MS` | Both (optional) | Override the weekly cadence. |
| `SEO_REPORT_INITIAL_DELAY_MS` | Both (optional) | Delay before the first run after a deploy. Defaults to 60s. |
| `SEO_REPORT_REFRESH_TOKEN` | Refresh endpoint (optional) | Shared secret for `POST /api/seo/weekly-report/refresh`. When set, callers must send `Authorization: Bearer <token>` (or `X-Refresh-Token`). When unset, the endpoint is open — fine in local dev, recommended in production. |
| `SEO_REPORT_REFRESH_MIN_INTERVAL_MS` | Refresh endpoint (optional) | Minimum interval between manual refreshes. Defaults to 60 000ms (1 minute) so the endpoint can't be used to burn GSC/Bing API quota. Set to `0` to disable. |

If any required credential is missing, that section of the report is
labelled `skipped` (with a clear message) and the scheduler keeps running —
the report never crashes the server.

## Verification checklist

- [ ] Domain verified in Google Search Console
- [ ] Sitemap submitted in Google Search Console (status: Success)
- [ ] Initial Pages report reviewed in Google Search Console
- [ ] Domain verified in Bing Webmaster Tools
- [ ] Sitemap submitted in Bing Webmaster Tools (status: Success)
- [ ] Initial crawl report reviewed in Bing Webmaster Tools
- [ ] `INDEXNOW_KEY` set in the deploy environment (auto-pings Bing/Yandex/etc.)
- [ ] `GSC_CLIENT_ID`, `GSC_CLIENT_SECRET`, `GSC_REFRESH_TOKEN` set in the deploy environment (auto-pings Google)
