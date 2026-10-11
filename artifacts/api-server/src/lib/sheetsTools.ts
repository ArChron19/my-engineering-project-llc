/**
 * Google Sheets operations for the selectNsolve MCP workflow.
 *
 * selectNsolve reads any cell containing "=" as "math text". The format:
 *
 *   Constant    →  "name = value unit"                   e.g. "ε = 0.0001 m"
 *   Variable    →  "name = number unit > min < max"      e.g. "f = 0.02 > 1e-10 < 1"
 *   Derivation  →  "name = formula"                      e.g. "A = π * r^2"
 *   Equation    →  "LHS = RHS | precision"               e.g. "1/sqrt(f) = -2*:LOG10(...) | 0.0001"
 *   Formulas    →  "Formulas:FN; FN; FN"                 e.g. "Formulas:LOG10; SIN; COS"
 *   Formula fn  →  ":LOG10(x)", ":SIN(x)"               ":" prefix routes to GSheets engine
 *
 * Environment characters:
 *   =   marks any cell as "math text" — constant, variable, derivation, or equation
 *   |   precision (0 < n ≤ 1) appended after an equation
 *   >   lower bound (≥) of variable search range
 *   <   upper bound (≤) of variable search range
 *   :   Google Sheets formula prefix (:LOG10, :SIN, :COS …)
 *
 * Unicode cell values (α, ε, π, ρ, Δ, ², ³, √, ×, °, μ, ∞) work natively.
 */

import { getUncachableGoogleSheetClient } from "./sheets.js";

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * A known value. Recognised by selectNsolve as "math text" because it contains "=".
 * Format: "name = value unit"  (unit optional)
 * Example: "ε = 0.0001 m"   or   "g = 9.81 m/s²"
 */
export interface ConstantEntry {
  type: "constant";
  /** Symbol used in equations — Unicode OK (e.g. "ε", "ρ", "ν") */
  name: string;
  value: number | string;
  /** Optional unit appended after the value (e.g. "m", "m/s²", "—") */
  unit?: string;
  /** Notes written to column B — not parsed by the add-on */
  description?: string;
}

/**
 * An unknown the solver will find.
 * Format: "name = number unit > min < max"
 *   "=" makes it math text; number is initial guess / last solved result
 *   ">" sets lower bound (≥), "<" sets upper bound (≤)
 * Example: "f = 0.02 > 1e-10 < 1"
 */
export interface VariableEntry {
  type: "variable";
  name: string;
  /** Numeric value (initial guess or last solved result) */
  value: number;
  /** Optional unit appended after the value */
  unit?: string;
  /** Lower bound (≥) → written with ">" */
  min?: number | string;
  /** Upper bound (≤) → written with "<" */
  max?: number | string;
  description?: string;
}

/**
 * An intermediate derived quantity. Recognised as "math text" because it contains "=".
 * Format: "name = formula"
 * Example: "A = π * r^2"   or   "Q = A * v"
 */
export interface DerivationEntry {
  type: "derivation";
  name: string;
  formula: string;
  description?: string;
}

/**
 * The main equation to solve. Two environment characters:
 *   |   precision (0 < n ≤ 1) appended after the equation — flags this as an equation
 *   :   prefix for Google Sheets built-in functions (:LOG10, :SIN, :COS …)
 * Format: "LHS = RHS | precision"
 * Example: "1/sqrt(f) = -2*:LOG10(ε/(3.7*D) + 2.51/(Re*sqrt(f))) | 0.0001"
 */
export interface EquationEntry {
  type: "equation";
  /** Full equation string with one "=". May contain :LOG10, :SIN, :COS. */
  equation: string;
  /** Precision, 0 < n ≤ 1 → appended as " | n". Closer to 1 = higher precision. e.g. 0.0001 */
  precision?: number;
  notes?: string;
}

/**
 * Declares the Google Sheets worksheet functions used in this problem.
 * Format: "Formulas:FN; FN; FN"  (no space between "Formulas" and ":")
 * Example: "Formulas:LOG10; SIN; COS"
 */
export interface FormulasEntry {
  type: "formulas";
  /** List of worksheet function names, e.g. ["LOG10", "SIN", "COS"] */
  functions: string[];
}

/** A plain-text label or section header (not parsed by the add-on). */
export interface LabelEntry {
  type: "label";
  text: string;
}

/** One blank row. */
export interface BlankEntry {
  type: "blank";
}

export type SelectNsolveEntry =
  | ConstantEntry
  | VariableEntry
  | DerivationEntry
  | EquationEntry
  | FormulasEntry
  | LabelEntry
  | BlankEntry;

// ── Formatters ────────────────────────────────────────────────────────────────

/**
 * Format a selectNsolve entry into cell values for one row.
 * Column A = the selectNsolve-formatted string.
 * Column B = description / notes (not parsed by the add-on).
 */
export function formatEntry(entry: SelectNsolveEntry): (string | number | null)[] {
  switch (entry.type) {
    case "blank":
      return [null, null];

    case "label":
      return [entry.text, null];

    case "constant": {
      // "name = value unit"  — the "=" makes it "math text"
      let cell = `${entry.name} = ${entry.value}`;
      if (entry.unit) cell += ` ${entry.unit}`;
      return [cell, entry.description ?? null];
    }

    case "variable": {
      // "f = 0.02 > 1e-10 < 1"  — "=" makes it math text; value is initial guess / last result
      let cell = `${entry.name} = ${entry.value}`;
      if (entry.unit) cell += ` ${entry.unit}`;
      if (entry.min !== undefined) cell += ` > ${entry.min}`;
      if (entry.max !== undefined) cell += ` < ${entry.max}`;
      return [cell, entry.description ?? null];
    }

    case "formulas": {
      // "Formulas:LOG10; SIN; COS"  — no space between "Formulas" and ":"
      const cell = `Formulas:${entry.functions.join("; ")}`;
      return [cell, null];
    }

    case "derivation": {
      // "name = formula"  — resolved before the main equation is solved
      return [`${entry.name} = ${entry.formula}`, entry.description ?? null];
    }

    case "equation": {
      // "LHS = RHS | N"   (:LOG10 etc. left as-is for the GSheets engine)
      let cell = entry.equation;
      if (entry.precision !== undefined) cell += ` | ${entry.precision}`;
      return [cell, entry.notes ?? null];
    }
  }
}

/**
 * Build a 2-D grid for sheets.values.update.
 * Each entry maps to one row with columns [A, B].
 */
export function buildValuesGrid(
  entries: SelectNsolveEntry[],
): (string | number | null)[][] {
  return entries.map((e) => {
    const row = formatEntry(e);
    while (row.length < 2) row.push(null);
    return row as (string | number | null)[];
  });
}

// ── Utility helpers ───────────────────────────────────────────────────────────

/** Accept either a full Google Sheets URL or a bare spreadsheet ID. */
export function parseSpreadsheetId(input: string): string {
  const match = input.match(/\/spreadsheets\/d\/([\w-]+)/);
  return match ? match[1] : input.trim();
}

// ── CREATE ────────────────────────────────────────────────────────────────────

export async function createSheet(title: string): Promise<{
  spreadsheetId: string;
  url: string;
  sheetTitle: string;
}> {
  const sheets = await getUncachableGoogleSheetClient();
  const res = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title },
      sheets: [{ properties: { title: "selectNsolve", index: 0 } }],
    },
  });
  const id = res.data.spreadsheetId!;
  return {
    spreadsheetId: id,
    url: `https://docs.google.com/spreadsheets/d/${id}/edit`,
    sheetTitle: "selectNsolve",
  };
}

// ── READ ──────────────────────────────────────────────────────────────────────

export async function readRange(
  spreadsheetId: string,
  range: string,
): Promise<{ values: (string | number | boolean | null)[][] }> {
  const sheets = await getUncachableGoogleSheetClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: parseSpreadsheetId(spreadsheetId),
    range,
    valueRenderOption: "UNFORMATTED_VALUE",
  });
  return { values: (res.data.values ?? []) as any };
}

// ── WRITE ─────────────────────────────────────────────────────────────────────

export async function writeRange(
  spreadsheetId: string,
  range: string,
  values: (string | number | null)[][],
): Promise<{ updatedCells: number }> {
  const sheets = await getUncachableGoogleSheetClient();
  const res = await sheets.spreadsheets.values.update({
    spreadsheetId: parseSpreadsheetId(spreadsheetId),
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
  return { updatedCells: res.data.updatedCells ?? 0 };
}

// ── FORMAT SELECTNSOLVE RANGE ─────────────────────────────────────────────────

/**
 * Write selectNsolve-formatted entries into a sheet range.
 *
 * Each entry type and its cell string:
 *   constant    →  "ε = 0.0001 m"                              ("=" → math text)
 *   variable    →  "f = 0.02 > 1e-10 < 1"                      (">" "<" → bounds)
 *   derivation  →  "A = π * r^2"                               ("=" → math text)
 *   equation    →  "1/sqrt(f) = -2*:LOG10(...) | 0.0001"       ("|" precision,
 *                                                                ":" GSheets fn)
 *   label       →  plain text (section header)
 *   blank       →  empty row
 *
 * Column A = formatted string.  Column B = optional description/notes.
 * Returns the list of col-A strings so the AI can verify before solving.
 */
export async function formatSelectNsolve(
  spreadsheetId: string,
  startCell: string,
  entries: SelectNsolveEntry[],
): Promise<{ updatedCells: number; formatted: string[] }> {
  const grid = buildValuesGrid(entries);
  const result = await writeRange(spreadsheetId, startCell, grid);
  const formatted = entries.map((e) => String(formatEntry(e)[0] ?? ""));
  return { updatedCells: result.updatedCells, formatted };
}

// ── GET SHEET ID ──────────────────────────────────────────────────────────────

export async function getSheetId(
  spreadsheetId: string,
  sheetName: string,
): Promise<number> {
  const sheets = await getUncachableGoogleSheetClient();
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: parseSpreadsheetId(spreadsheetId),
  });
  const sheet = meta.data.sheets?.find((s) => s.properties?.title === sheetName);
  if (!sheet?.properties?.sheetId && sheet?.properties?.sheetId !== 0) {
    throw new Error(`Sheet tab "${sheetName}" not found in spreadsheet.`);
  }
  return sheet.properties.sheetId!;
}

// ── SET COLUMN WIDTHS ─────────────────────────────────────────────────────────

async function setColumnWidths(
  spreadsheetId: string,
  sheetId: number,
  widths: number[],
): Promise<void> {
  const sheets = await getUncachableGoogleSheetClient();
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: widths.map((pixels, i) => ({
        updateDimensionProperties: {
          range: { sheetId, dimension: "COLUMNS", startIndex: i, endIndex: i + 1 },
          properties: { pixelSize: pixels },
          fields: "pixelSize",
        },
      })),
    },
  });
}

// ── APPLY TEMPLATE ────────────────────────────────────────────────────────────

/**
 * Write a complete selectNsolve worksheet using the canonical format.
 *
 * Column A = selectNsolve math text (read by the add-on)
 * Column B = notes / description (ignored by the add-on)
 *
 *  Row  Col A                                                              Col B
 *  ---  ───────────────────────────────────────────────────────────────    ──────────────
 *   1   # Pipe Flow Analysis — Colebrook-White
 *   2   (blank)
 *   3   # CONSTANTS  (name = value unit)
 *   4   ε = 0.0001 m                                                       pipe absolute roughness
 *   5   D = 0.1 m                                                          pipe inner diameter
 *   6   Re = 100000                                                        Reynolds number
 *   7   ν = 0.000001 m²/s                                                  kinematic viscosity
 *   8   (blank)
 *   9   # VARIABLES  (name = value unit > min < max)
 *  10   f = 0.02 > 1e-10 < 1                                               friction factor (dimensionless)
 *  11   (blank)
 *  12   # EQUATIONS  (LHS = RHS | precision, :FN for GSheets)
 *  13   Formulas:LOG10                                                     worksheet functions used
 *  14   1/sqrt(f) = -2*:LOG10(ε/(3.7*D)+2.51/(Re*sqrt(f))) | 0.0001      Colebrook-White
 *  15   (blank)
 *  16   # RESULTS
 *  17   f = ?                                                              write solved value here
 */
export async function applyTemplate(
  spreadsheetId: string,
  sheetName: string,
  title: string,
): Promise<{ rowsWritten: number; formatted: string[] }> {
  const sid = parseSpreadsheetId(spreadsheetId);

  const entries: SelectNsolveEntry[] = [
    // ── Title ────────────────────────────────────────────────────────────────
    { type: "label", text: `# ${title}` },
    { type: "blank" },

    // ── Constants  "name = value unit" ───────────────────────────────────────
    { type: "label",    text: "# CONSTANTS" },
    { type: "constant", name: "ε",  value: 0.0001,   unit: "m",    description: "pipe absolute roughness" },
    { type: "constant", name: "D",  value: 0.1,       unit: "m",    description: "pipe inner diameter" },
    { type: "constant", name: "Re", value: 100000,                  description: "Reynolds number" },
    { type: "constant", name: "ν",  value: 0.000001,  unit: "m²/s", description: "kinematic viscosity" },
    { type: "blank" },

    // ── Variables  "name = value unit > min < max" ────────────────────────────
    { type: "label",    text: "# VARIABLES" },
    { type: "variable", name: "f", value: 0.02, min: "1e-10", max: 1, description: "friction factor (Darcy-Weisbach, dimensionless)" },
    { type: "blank" },

    // ── Equations  "Formulas:FN"  +  "LHS = RHS | tolerance"  ────────────────
    { type: "label",    text: "# EQUATIONS" },
    { type: "formulas", functions: ["LOG10"] },
    {
      type: "equation",
      equation: "1/sqrt(f) = -2*:LOG10(ε/(3.7*D) + 2.51/(Re*sqrt(f)))",
      precision: 0.0001,
      notes: "Colebrook-White — implicit, solve for f",
    },
    { type: "blank" },

    // ── Results ───────────────────────────────────────────────────────────────
    { type: "label",    text: "# RESULTS" },
    { type: "constant", name: "f", value: "?", description: "friction factor — write solved value here" },
  ];

  const grid = buildValuesGrid(entries);
  const sheets = await getUncachableGoogleSheetClient();

  await sheets.spreadsheets.values.update({
    spreadsheetId: sid,
    range: `'${sheetName}'!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: grid },
  });

  const sheetId = await getSheetId(sid, sheetName);
  await setColumnWidths(sid, sheetId, [420, 320]); // col A wide for equations, col B for notes

  const formatted = entries.map((e) => String(formatEntry(e)[0] ?? ""));
  return { rowsWritten: entries.length, formatted };
}
