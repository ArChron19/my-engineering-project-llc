/**
 * Numerical root-finding engine for selectNsolve API.
 * Uses Brent's method (bisection + secant + inverse quadratic interpolation)
 * with adaptive logarithmic bracketing across the search range.
 */

export interface SolveResult {
  value: number;
  iterations: number;
  elapsed_ms: number;
  precision: number;
  bracket: [number, number];
}

export class SolverError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "SolverError";
  }
}

/**
 * Brent's method — finds a root of f in [a, b] where f(a)*f(b) < 0.
 * Combines bisection (robustness) with secant/IQI (speed).
 */
function brent(
  f: (x: number) => number,
  a: number,
  b: number,
  tol: number,
  maxIter: number,
): { root: number; iterations: number } {
  let fa = f(a);
  let fb = f(b);

  if (!isFinite(fa) || !isFinite(fb)) {
    throw new SolverError(
      "EVAL_ERROR",
      "Equation evaluates to non-finite value at bracket endpoints.",
    );
  }
  if (fa * fb > 0) {
    throw new SolverError(
      "NO_ROOT_IN_RANGE",
      "No sign change found in bracket — solver cannot guarantee a root.",
    );
  }
  if (fa === 0) return { root: a, iterations: 0 };
  if (fb === 0) return { root: b, iterations: 0 };

  let c = a,
    fc = fa;
  let d = b - a,
    e = d;
  const eps = Number.EPSILON;

  for (let i = 0; i < maxIter; i++) {
    if (fb * fc > 0) {
      c = a;
      fc = fa;
      d = b - a;
      e = d;
    }
    if (Math.abs(fc) < Math.abs(fb)) {
      a = b;
      b = c;
      c = a;
      fa = fb;
      fb = fc;
      fc = fa;
    }

    const tol1 = 2 * eps * Math.abs(b) + 0.5 * tol;
    const xm = 0.5 * (c - b);

    if (Math.abs(xm) <= tol1 || fb === 0) return { root: b, iterations: i + 1 };

    let dd: number;
    let ee: number;

    if (Math.abs(e) >= tol1 && Math.abs(fa) > Math.abs(fb)) {
      const s = fb / fa;
      let p: number;
      let q: number;

      if (a === c) {
        p = 2 * xm * s;
        q = 1 - s;
      } else {
        const q2 = fa / fc;
        const r = fb / fc;
        p = s * (2 * xm * q2 * (q2 - r) - (b - a) * (r - 1));
        q = (q2 - 1) * (r - 1) * (s - 1);
      }

      if (p > 0) q = -q;
      else p = -p;

      if (2 * p < Math.min(3 * xm * q - Math.abs(tol1 * q), Math.abs(e * q))) {
        ee = d;
        dd = p / q;
      } else {
        dd = xm;
        ee = dd;
      }
    } else {
      dd = xm;
      ee = dd;
    }

    a = b;
    fa = fb;
    b += Math.abs(dd) > tol1 ? dd : xm > 0 ? tol1 : -tol1;
    fb = f(b);
    d = dd;
    e = ee;
  }

  return { root: b, iterations: maxIter };
}

/**
 * Generates a sorted list of scan points spanning [rangeMin, rangeMax]
 * using logarithmic spacing on both positive and negative halves,
 * plus a dense band near zero.
 */
function generateScanPoints(rangeMin: number, rangeMax: number): number[] {
  const pts = new Set<number>();

  const add = (v: number) => {
    if (v >= rangeMin && v <= rangeMax && isFinite(v)) pts.add(v);
  };

  add(rangeMin);
  add(rangeMax);
  if (rangeMin < 0 && rangeMax > 0) add(0);

  // Log-spaced points: 1e-15 … 1e15 on both signs
  for (let exp = -15; exp <= 15; exp++) {
    add(Math.pow(10, exp));
    add(-Math.pow(10, exp));
    // sub-decade points
    add(2 * Math.pow(10, exp));
    add(5 * Math.pow(10, exp));
    add(-2 * Math.pow(10, exp));
    add(-5 * Math.pow(10, exp));
  }

  // Dense band very close to zero (catches near-zero roots)
  for (let i = 1; i <= 10; i++) {
    add(i * 1e-16);
    add(-i * 1e-16);
  }

  return [...pts].sort((a, b) => a - b);
}

/**
 * Top-level solver. Scans the range for sign changes, then applies Brent's
 * method in the first bracket found.
 *
 * @param f          Objective function f(x) — root when f(x)=0
 * @param rangeMin   Lower bound of search range
 * @param rangeMax   Upper bound of search range
 * @param precision  Precision (0 < n ≤ 1), e.g. 0.0001. Closer to 1 = higher precision.
 * @param timeoutMs  Wall-clock time limit in milliseconds
 */
export function solve(
  f: (x: number) => number,
  rangeMin: number,
  rangeMax: number,
  precision: number,
  timeoutMs: number,
): SolveResult {
  const t0 = Date.now();
  const tol = precision;                                              // precision IS the convergence tolerance (0 < n ≤ 1)
  const sigFigs = Math.max(1, Math.ceil(-Math.log10(precision)));    // e.g. 0.0001 → 4; 1 → 1 (clamp to ≥ 1)
  const maxIter = 200;

  const pts = generateScanPoints(rangeMin, rangeMax);

  // Evaluate f at each scan point, skip non-finite values
  const evals: { x: number; y: number }[] = [];
  for (const x of pts) {
    if (Date.now() - t0 > timeoutMs) {
      throw new SolverError("SOLVE_TIMEOUT", "Solver exceeded time limit during scan phase.");
    }
    try {
      const y = f(x);
      if (isFinite(y)) evals.push({ x, y });
    } catch {
      // Skip points where evaluation throws (e.g. log of negative)
    }
  }

  if (evals.length < 2) {
    throw new SolverError(
      "NO_ROOT_IN_RANGE",
      "Could not evaluate the equation at enough points in the given range.",
    );
  }

  // Find first sign change
  let bracket: [number, number] | null = null;
  for (let i = 0; i < evals.length - 1; i++) {
    if (evals[i].y * evals[i + 1].y <= 0) {
      bracket = [evals[i].x, evals[i + 1].x];
      break;
    }
  }

  if (!bracket) {
    throw new SolverError(
      "NO_ROOT_IN_RANGE",
      "No root found within the specified range. The equation may have no real solution, or both ends of the range may be on the same side of zero. Try widening the range or adjusting bounds.",
    );
  }

  if (Date.now() - t0 > timeoutMs) {
    throw new SolverError("SOLVE_TIMEOUT", "Solver exceeded time limit before Brent phase.");
  }

  const { root, iterations } = brent(f, bracket[0], bracket[1], tol, maxIter);

  return {
    value: parseFloat(root.toPrecision(sigFigs)),
    iterations,
    elapsed_ms: Date.now() - t0,
    precision,
    bracket,
  };
}
