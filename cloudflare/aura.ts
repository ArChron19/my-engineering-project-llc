/**
 * /aura/* on myengineeringproject.com: Aura's files, served from the `aura` branch of ArChron19/myengineeringproject
 * with a 5-minute cache, so a push there reaches the site within minutes (jsDelivr can lag up to 12 hours).
 *   /aura/aura-widget.js   /aura/aura-knowledge.json   /aura/source.md   /aura/manual.md   /aura/tours/<name>.json
 */
const RAW = "https://raw.githubusercontent.com/ArChron19/myengineeringproject/aura/aura/";
const TYPES: Record<string, string> = { js: "application/javascript; charset=utf-8", json: "application/json; charset=utf-8", md: "text/markdown; charset=utf-8" };

export async function onRequest(ctx: { request: Request }): Promise<Response> {
  const file = new URL(ctx.request.url).pathname.replace(/^\/aura\//, "");
  if (!/^(aura-widget\.js|aura-knowledge\.json|source\.md|manual\.md|tours\/[a-z0-9-]{1,64}\.json)$/.test(file))
    return new Response("Not found", { status: 404 });
  const r = await fetch(RAW + file, { cf: { cacheTtl: 300, cacheEverything: true } } as RequestInit);
  if (!r.ok) return new Response("Not found", { status: 404 });
  return new Response(r.body, { headers: { "Content-Type": TYPES[file.split(".").pop()!], "Cache-Control": "public, max-age=300",
    "Access-Control-Allow-Origin": "*" } });
}
