/**
 * POST /api/v1/solve
 *
 * Solves a single-variable equation numerically.
 */

import { Router } from "express";
import { z } from "zod";
import { parseEquation } from "../lib/evaluator.js";
import { solve, SolverError } from "../lib/solver.js";

const router = Router();

const SolveRequest = z.object({
  equation: z.string().min(3),
  variable: z.string().min(1),
  constants: z.record(z.number()).optional().default({}),
  range: z.tuple([z.number(), z.number()]).optional().default([-1e15, 1e15]),
  precision: z.number().gt(0).lte(1).optional().default(0.0001),
});

const TIMEOUT_MS = 28_000; // 28 s wall-clock limit

router.post("/v1/solve", async (req, res) => {
  // Parse & validate request body
  const parsed = SolveRequest.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: "INVALID_REQUEST",
        message: "Request body validation failed.",
        details: parsed.error.flatten(),
      },
    });
    return;
  }

  const { equation, variable, constants, range, precision } = parsed.data;
  const [rangeMin, rangeMax] = range;

  if (rangeMin >= rangeMax) {
    res.status(400).json({
      error: {
        code: "INVALID_RANGE",
        message: "range[0] must be strictly less than range[1].",
      },
    });
    return;
  }

  try {
    // Build objective function
    const { objective } = parseEquation(equation, variable, constants);

    // Run solver
    const result = solve(objective, rangeMin, rangeMax, precision, TIMEOUT_MS);

    res.json({
      variable,
      value: result.value,
      precision: result.precision,
      elapsed_ms: result.elapsed_ms,
      iterations: result.iterations,
    });
  } catch (err) {
    if (err instanceof SolverError) {
      const statusMap: Record<string, number> = {
        INVALID_EQUATION: 400,
        UNKNOWN_NOT_FOUND: 400,
        MULTIPLE_UNKNOWNS: 400,
        INVALID_RANGE: 400,
        NO_ROOT_IN_RANGE: 422,
        SOLVE_TIMEOUT: 408,
        EVAL_ERROR: 422,
      };
      const status = statusMap[err.code] ?? 500;
      res.status(status).json({
        error: { code: err.code, message: err.message },
      });
    } else {
      console.error("Unexpected solver error:", err);
      res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." },
      });
    }
  }
});

export default router;
