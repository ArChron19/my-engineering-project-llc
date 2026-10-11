import { build } from "vite";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { hashByLoc, lastmodByLoc, loadPreviousManifest } from "./lib/sitemap-manifest.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "dist/public");
const ssrDir = path.join(root, "dist/ssr");

process.env.PORT = process.env.PORT || "3000";
process.env.BASE_PATH = process.env.BASE_PATH || "/";

await build({
  configFile: path.join(root, "vite.config.ts"),
  build: {
    ssr: path.join(root, "src/prerender.tsx"),
    outDir: ssrDir,
    emptyOutDir: true,
    rollupOptions: {
      input: path.join(root, "src/prerender.tsx"),
      output: { format: "esm", entryFileNames: "prerender.mjs" },
    },
    minify: false,
  },
  ssr: {
    noExternal: ["wouter", "framer-motion"],
  },
  logLevel: "warn",
});

const ssrEntry = path.join(ssrDir, "prerender.mjs");
const { renderRoute, routes } = await import(pathToFileURL(ssrEntry).href);

const indexHtmlPath = path.join(outDir, "index.html");
const indexHtml = await fs.readFile(indexHtmlPath, "utf-8");

function escapeAttr(s) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

const SITE_ORIGIN = process.env.SITE_ORIGIN || "https://myengineeringproject.com";
const today = new Date().toISOString().slice(0, 10);

// Carry forward each URL's previous `<lastmod>` whenever its content hash is
// unchanged, so the sitemap only claims "modified today" for URLs that actually
// changed this build. Google uses `lastmod` to prioritise crawl budget and
// distrusts sitemaps where every URL claims today's date.
//
// The previous manifest is read from the live site first (the source of truth
// for what crawlers currently see) and falls back to the locally-cached copy
// written after the last successful ping. Set SITEMAP_LASTMOD_OFFLINE=1 to skip
// the network fetch entirely (e.g. local/offline builds) and rely on the cache.
const offline =
  process.env.SITEMAP_LASTMOD_OFFLINE === "1" ||
  process.env.SITEMAP_LASTMOD_OFFLINE === "true";
const { manifest: previousManifest, source: previousSource } =
  await loadPreviousManifest(SITE_ORIGIN, { allowNetwork: !offline });
const previousHashByLoc = hashByLoc(previousManifest);
const previousLastmodByLoc = lastmodByLoc(previousManifest);
if (previousManifest) {
  console.log(
    `Loaded previous sitemap manifest from ${previousSource} (${previousManifest.urls.length} URL(s)) to carry forward lastmod dates`,
  );
} else {
  console.log(
    "No previous sitemap manifest available — stamping today's date on every URL",
  );
}

const SITE_NAME = "My Engineering Project";
const DEFAULT_OG_IMAGE_PATH = "/og-image.jpg";
const TWITTER_SITE = "@myengproject";

// Per-URL content hashes are written to dist/public/sitemap-manifest.json so
// the post-deploy ping can diff against the previous deploy and only resubmit
// URLs whose content actually changed. The hash covers everything that affects
// what the page will look like to a crawler — rendered body HTML plus the SEO
// fields that go into <head> (title, description, og image, og type).
const manifestEntries = [];

for (const route of routes) {
  const { html, title, description, ogType, ogImage, robots } = renderRoute(route);
  const ogImagePath = ogImage || DEFAULT_OG_IMAGE_PATH;
  const ogImageUrl = `${SITE_ORIGIN}${ogImagePath}`;

  const loc = `${SITE_ORIGIN}${route === "/" ? "/" : route}`;
  const contentHash = createHash("sha256")
    .update(
      JSON.stringify({
        route,
        title,
        description,
        ogType,
        ogImagePath,
        html,
      }),
    )
    .digest("hex");
  const previousLastmod = previousLastmodByLoc.get(loc);
  const lastmod =
    previousHashByLoc.get(loc) === contentHash && previousLastmod
      ? previousLastmod
      : today;
  if (!robots.includes("noindex")) {
    manifestEntries.push({ loc, hash: contentHash, lastmod });
  }

  let pageHtml = indexHtml;
  pageHtml = pageHtml.replace(
    /<title>[^<]*<\/title>/,
    `<title>${escapeAttr(title)}</title>`,
  );

  const canonicalUrl = `${SITE_ORIGIN}${route === "/" ? "/" : route}`;
  const metaDesc = `<meta name="description" content="${escapeAttr(description)}" />`;
  const metaRobots = `<meta name="robots" content="${escapeAttr(robots)}" />`;
  const linkCanonical = `<link rel="canonical" href="${escapeAttr(canonicalUrl)}" />`;
  const ogTags = [
    `<meta property="og:title" content="${escapeAttr(title)}" />`,
    `<meta property="og:description" content="${escapeAttr(description)}" />`,
    `<meta property="og:type" content="${escapeAttr(ogType)}" />`,
    `<meta property="og:url" content="${escapeAttr(canonicalUrl)}" />`,
    `<meta property="og:image" content="${escapeAttr(ogImageUrl)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${escapeAttr(title)}" />`,
    `<meta property="og:site_name" content="${escapeAttr(SITE_NAME)}" />`,
    `<meta property="og:locale" content="en_US" />`,
  ].join("\n    ");
  const twitterTags = [
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:site" content="${escapeAttr(TWITTER_SITE)}" />`,
    `<meta name="twitter:title" content="${escapeAttr(title)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(description)}" />`,
    `<meta name="twitter:image" content="${escapeAttr(ogImageUrl)}" />`,
    `<meta name="twitter:image:alt" content="${escapeAttr(title)}" />`,
  ].join("\n    ");
  pageHtml = pageHtml.replace(
    /<\/head>/,
    `    ${metaDesc}\n    ${metaRobots}\n    ${linkCanonical}\n    ${ogTags}\n    ${twitterTags}\n  </head>`,
  );

  pageHtml = pageHtml.replace(
    /<div id="root"><\/div>/,
    `<div id="root">${html}</div>`,
  );

  // Root route stays as index.html; non-root routes are written as flat
  // <route>.html files (rather than <route>/index.html). Flat files
  // prevent the static host from issuing a 301 redirect to add a trailing
  // slash when the URL is requested without one — so /study-guides etc.
  // resolve directly with HTTP 200 instead of via a redirect hop.
  const outPath =
    route === "/"
      ? path.join(outDir, "index.html")
      : path.join(outDir, `${route.replace(/^\//, "")}.html`);
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, pageHtml, "utf-8");
  console.log(`Pre-rendered ${route} -> ${path.relative(root, outPath)}`);
}

const sitemapEntries = manifestEntries
  .map(({ loc, lastmod }) => {
    const route = loc === `${SITE_ORIGIN}/` ? "/" : loc.slice(SITE_ORIGIN.length);
    const priority = route === "/" ? "1.0" : "0.7";
    const changefreq = route === "/" ? "weekly" : "monthly";
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  })
  .join("\n");
const carriedForward = manifestEntries.filter((e) => e.lastmod !== today).length;
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries}\n</urlset>\n`;
await fs.writeFile(path.join(outDir, "sitemap.xml"), sitemapXml, "utf-8");
console.log(
  `Generated sitemap.xml with ${manifestEntries.length} routes (${carriedForward} with a carried-forward lastmod, ${manifestEntries.length - carriedForward} stamped ${today})`,
);

const manifest = {
  generatedAt: new Date().toISOString(),
  siteOrigin: SITE_ORIGIN,
  urls: manifestEntries,
};
await fs.writeFile(
  path.join(outDir, "sitemap-manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf-8",
);
console.log(
  `Generated sitemap-manifest.json with ${manifestEntries.length} content hashes`,
);

await fs.rm(ssrDir, { recursive: true, force: true });
