import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "dist/public");

const key = process.env.INDEXNOW_KEY;
if (!key) {
  console.log(
    "[indexnow] INDEXNOW_KEY not set — skipping verification key file. Set INDEXNOW_KEY to ship dist/public/<key>.txt with the deploy.",
  );
  process.exit(0);
}

if (!/^[A-Za-z0-9-]{8,128}$/.test(key)) {
  console.warn(
    "[indexnow] INDEXNOW_KEY must be 8–128 chars of letters, digits, or hyphens. Skipping verification key file.",
  );
  process.exit(0);
}

await fs.mkdir(outDir, { recursive: true });
const target = path.join(outDir, `${key}.txt`);
await fs.writeFile(target, key, "utf-8");
console.log(`[indexnow] Wrote IndexNow verification key file: ${path.relative(root, target)}`);
