/**
 * Safe mathematical expression evaluator using mathjs.
 * Parses "LHS = RHS" equations and returns an objective function f(x) = LHS(x) - RHS(x).
 */

import { evaluate, parse } from "mathjs";
import { SolverError } from "./solver.js";

export interface ParsedEquation {
  /** Ready-to-evaluate objective function: returns 0 at the root */
  objective: (x: number) => number;
  /** The implicit expression string used internally: LHS - (RHS) */
  expression: string;
}

/**
 * Validates that all names in the expression are either:
 *   - the target variable
 *   - a provided constant
 *   - a known mathjs built-in (sin, cos, log10, pi, e, etc.)
 */
function extractNames(expr: string): string[] {
  const node = parse(expr);
  const names: string[] = [];
  node.traverse((n: any) => {
    if (n.type === "SymbolNode" || n.type === "FunctionNode") {
      names.push(n.name);
    }
  });
  return [...new Set(names)];
}

const MATHJS_BUILTINS = new Set([
  "sin", "cos", "tan", "asin", "acos", "atan", "atan2",
  "sinh", "cosh", "tanh",
  "sqrt", "cbrt", "exp", "log", "log2", "log10",
  "abs", "ceil", "floor", "round", "sign",
  "pow", "mod", "min", "max",
  "pi", "e", "Infinity", "NaN", "true", "false",
  "i",  // imaginary unit — flag if used
]);

/**
 * Parses an equation string of the form "LHS = RHS" and produces an
 * objective function f(variable) = LHS(variable) - RHS(variable).
 *
 * @param equation   Equation string, e.g. "0.5 * m * v^2 = m * g * h"
 * @param variable   Name of the unknown, e.g. "v"
 * @param constants  Known values, e.g. { m: 1, g: 9.81, h: 10 }
 */
export function parseEquation(
  equation: string,
  variable: string,
  constants: Record<string, number>,
): ParsedEquation {
  // Strip the selectNsolve Google Sheets function prefix (:LOG10 → log10, :SIN → sin, etc.)
  // The ":" prefix in selectNsolve routes a function to the native GSheets formula engine.
  // For the REST solver we simply drop the prefix — mathjs handles these natively.
  const equationClean = equation.replace(/:([A-Za-z_][A-Za-z0-9_]*)/g, (_, fn) => fn.toLowerCase());

  const parts = equationClean.split("=");
  if (parts.length !== 2) {
    throw new SolverError(
      "INVALID_EQUATION",
      `Equation must contain exactly one '=' sign. Got: "${equation}"`,
    );
  }

  const lhs = parts[0].trim();
  const rhs = parts[1].trim();

  if (!lhs || !rhs) {
    throw new SolverError(
      "INVALID_EQUATION",
      "Both sides of the equation must be non-empty.",
    );
  }

  // Strip precision specifier if present (| n) — leftover from selectNsolve syntax
  const rhsClean = rhs.replace(/\|.*$/, "").trim();
  const expression = `(${lhs}) - (${rhsClean})`;

  // Check the expression is syntactically valid
  try {
    parse(expression);
  } catch (err: any) {
    throw new SolverError(
      "INVALID_EQUATION",
      `Could not parse equation: ${err.message}`,
    );
  }

  // Check for unknown names
  const names = extractNames(expression);
  const unknownNames = names.filter(
    (n) => n !== variable && !(n in constants) && !MATHJS_BUILTINS.has(n),
  );
  if (unknownNames.length > 0) {
    throw new SolverError(
      "UNKNOWN_NOT_FOUND",
      `Unresolved names in equation: ${unknownNames.join(", ")}. Provide them as constants or check spelling.`,
    );
  }

  // Check the variable actually appears
  if (!names.includes(variable)) {
    throw new SolverError(
      "UNKNOWN_NOT_FOUND",
      `Variable "${variable}" does not appear in the equation.`,
    );
  }

  // Check for multiple unknowns (names that aren't constants or builtins)
  const freeNames = names.filter(
    (n) => !(n in constants) && !MATHJS_BUILTINS.has(n),
  );
  if (freeNames.length > 1) {
    throw new SolverError(
      "MULTIPLE_UNKNOWNS",
      `Multiple unknowns detected: ${freeNames.join(", ")}. Only single-variable equations are supported.`,
    );
  }

  const objective = (x: number): number => {
    const scope: Record<string, number> = { ...constants, [variable]: x };
    const result = evaluate(expression, scope);
    return typeof result === "number" ? result : Number(result);
  };

  return { objective, expression };
}
