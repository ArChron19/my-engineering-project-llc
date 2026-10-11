/**
 * Cloudflare Pages Function for /api/* on myengineeringproject.com (replaces the Replit api-server).
 *   POST /api/mcp       selectNsolve MCP server (same code as Replit: artifacts/api-server/src/lib/mcpCore.ts)
 *   GET  /api/healthz   {"status":"ok"}
 *   /api/stripe/*       503 until paid plans launch (Stripe is not connected here yet)
 * Built into functions/api/[[path]].js by scripts/cf-build.mjs.
 */
import { handleBody } from "../artifacts/api-server/src/lib/mcpCore";
import { configureGoogle } from "./googleSheetsFetch";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Mcp-Session-Id, Mcp-Protocol-Version" };
const json = (obj: unknown, status = 200) => new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", ...CORS } });

export async function onRequest(ctx: { request: Request; env: Record<string, string> }): Promise<Response> {
  const { request, env } = ctx;
  const path = new URL(request.url).pathname.replace(/\/+$/, "");
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (path === "/api/healthz") return json({ status: "ok" });
  if (path === "/api/mcp") {
    if (request.method !== "POST") return json({ error: "Use POST with a JSON-RPC body (MCP Streamable HTTP)." }, 405);
    let body: unknown;
    try { body = await request.json(); } catch { return json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, 400); }
    configureGoogle(env);
    const out = await handleBody(body);
    return out === null ? new Response(null, { status: 204, headers: CORS }) : json(out);
  }
  if (path.startsWith("/api/stripe")) return json({ error: "Subscriptions aren't available yet. Pro and Classroom are coming soon." }, 503);
  return json({ error: "Not found" }, 404);
}
