/**
 * /aura/* on myengineeringproject.com: Aura's files, served from the `aura` branch of ArChron19/myengineeringproject
 * with a 5-minute cache, so a push there reaches the site within minutes (jsDelivr can lag up to 12 hours).
 *   /aura/aura-widget.js   /aura/aura-knowledge.json   /aura/source.md   /aura/manual.md   /aura/tours/<name>.json
 *
 * Private repo support: set the encrypted Pages secret GITHUB_TOKEN (a fine-grained token with read-only
 * "Contents" access to ArChron19/myengineeringproject). With it, files come through the GitHub API with that key,
 * so the repo can be private. Without it, files come from the public raw URL exactly as before.
 */
const OWNER_REPO = "ArChron19/myengineeringproject", BRANCH = "aura", DIR = "aura/";
const RAW = `https://raw.githubusercontent.com/${OWNER_REPO}/${BRANCH}/${DIR}`;
const API = `https://api.github.com/repos/${OWNER_REPO}/contents/${DIR}`;
const TYPES: Record<string, string> = { js: "application/javascript; charset=utf-8", json: "application/json; charset=utf-8", md: "text/markdown; charset=utf-8" };
const TTL = 300;

type Ctx = { request: Request; env?: { GITHUB_TOKEN?: string }; waitUntil?: (p: Promise<unknown>) => void };

export async function onRequest(ctx: Ctx): Promise<Response> {
  const url = new URL(ctx.request.url);
  const file = url.pathname.replace(/^\/aura\//, "");
  if (!/^(aura-widget\.js|aura-knowledge\.json|source\.md|manual\.md|tours\/[a-z0-9-]{1,64}\.json)$/.test(file))
    return new Response("Not found", { status: 404 });
  const headers = { "Content-Type": TYPES[file.split(".").pop()!], "Cache-Control": `public, max-age=${TTL}`, "Access-Control-Allow-Origin": "*" };
  const token = ctx.env?.GITHUB_TOKEN;

  if (!token) {   // public repo: unchanged behaviour
    const r = await fetch(RAW + file, { cf: { cacheTtl: TTL, cacheEverything: true } } as RequestInit);
    if (!r.ok) return new Response("Not found", { status: 404 });
    return new Response(r.body, { headers });
  }

  // private repo: authenticated fetch, cached at the edge under the public URL so GitHub is hit at most every 5 minutes
  const cache = (caches as unknown as { default: Cache }).default;
  const key = new Request(`${url.origin}/aura/${file}`, { method: "GET" });
  const hit = await cache.match(key);
  if (hit) return hit;
  const r = await fetch(`${API}${file}?ref=${BRANCH}`, { headers: {
    Authorization: `Bearer ${token}`, Accept: "application/vnd.github.raw", "User-Agent": "myengineeringproject-aura-proxy", "X-GitHub-Api-Version": "2022-11-28" } });
  if (!r.ok) return new Response("Not found", { status: 404 });
  const res = new Response(await r.arrayBuffer(), { headers });
  const put = cache.put(key, res.clone());
  if (ctx.waitUntil) ctx.waitUntil(put); else await put;
  return res;
}
