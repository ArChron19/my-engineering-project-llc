// Cloudflare Pages build: the website (prerendered) + the /api Pages Function.
//   Build command:   node scripts/cf-build.mjs        Output directory: artifacts/my-engineering-project/dist/public
import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const run = (c, o = {}) => execSync(c, { stdio: "inherit", cwd: root, ...o });
if (!process.env.CF_SKIP_INSTALL) run("pnpm install --frozen-lockfile --filter @workspace/my-engineering-project... --filter @workspace/api-server...");
run("pnpm --filter @workspace/my-engineering-project run build", { env: { ...process.env, NODE_ENV: "production", PORT: "5000", BASE_PATH: "/" } });
const { build } = createRequire(path.join(root, "artifacts/api-server/package.json"))("esbuild");   // installed above, with the api-server workspace
await build({
  entryPoints: [path.join(root, "cloudflare/api.ts")], outfile: path.join(root, "functions/api/[[path]].js"),
  bundle: true, format: "esm", platform: "browser", target: "es2022", conditions: ["worker", "browser"], logLevel: "info",
  plugins: [{ name: "google-on-cloudflare", setup(b) {
    b.onResolve({ filter: /^\.\/sheets\.js$/ }, () => ({ path: path.join(root, "cloudflare/googleSheetsFetch.ts") }));
  } }],
});
console.log("cf-build: site in artifacts/my-engineering-project/dist/public, API in functions/api/[[path]].js");
