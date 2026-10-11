# Hosting on Cloudflare Pages (free)

Cloudflare Pages project settings:
- Production branch: `main` (or `cloudflare` while testing)
- Build command: `node scripts/cf-build.mjs`
- Build output directory: `artifacts/my-engineering-project/dist/public`
- Environment variable: `NODE_VERSION=22`

What runs where:
- The website: prerendered pages from `artifacts/my-engineering-project` (includes Aura, /manual, hidden /aura-source).
- `/api/*`: `functions/api/[[path]].js`, built from `cloudflare/api.ts` + the shared MCP code in
  `artifacts/api-server/src/lib/mcpCore.ts`. `/api/mcp` and `/api/healthz` work; `/api/stripe/*` returns 503 until paid plans launch.

Google Sheets for the MCP tools (Pages -> Settings -> Variables and Secrets, as encrypted secrets), either
`GOOGLE_SERVICE_ACCOUNT_JSON`, or `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` + `GOOGLE_REFRESH_TOKEN`.
Without them the tools list works and tool calls return a clear "not connected yet" message.

The Replit api-server (`artifacts/api-server`) still builds and runs unchanged.
