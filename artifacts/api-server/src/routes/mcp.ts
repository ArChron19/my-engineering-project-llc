/**
 * POST /api/mcp - Express wrapper. The protocol logic lives in lib/mcpCore.ts so the same code also runs
 * as a Cloudflare Pages Function (functions/api/[[path]].js, built by scripts/cf-build.mjs).
 */
import { Router, Request, Response } from "express";
import { handleBody } from "../lib/mcpCore.js";

const router = Router();

router.post("/mcp", async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  const out = await handleBody(req.body);
  if (out === null) res.status(204).end();
  else res.json(out);
});

export default router;
