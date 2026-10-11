/**
 * POST /api/mcp
 *
 * MCP (Model Context Protocol) endpoint — Streamable HTTP transport, 2024-11-05.
 * Exposes Google Sheets tools for building selectNsolve worksheets.
 *
 * selectNsolve is a Google Workspace Marketplace add-on that runs inside Google Sheets.
 * This API creates and pre-fills spreadsheets with selectNsolve math text.
 * The user then opens the sheet and runs the add-on to solve the equations.
 *
 * selectNsolve environment characters written into cells:
 *   =   marks any cell as "math text"  →  "ε = 0.0001 m"
 *   |   precision (0 < n ≤ 1)          →  "1/sqrt(f) = -2*:LOG10(...) | 0.0001"
 *   >   lower bound (≥)                →  "f = 0.02 > 1e-10"
 *   <   upper bound (≤)                →  "f = 0.02 > 1e-10 < 1"
 *   :   GSheets fn prefix              →  ":LOG10(x)", ":SIN(x)", ":COS(x)"
 *
 * Typical AI workflow:
 *   sheets_create → sheets_apply_template → return URL → user runs add-on
 */

import {
  createSheet,
  readRange,
  writeRange,
  formatSelectNsolve,
  applyTemplate,
  type SelectNsolveEntry,
} from "./sheetsTools.js";


const SERVER_INFO      = { name: "selectNsolve", version: "1.0.0" };
const PROTOCOL_VERSION = "2024-11-05";

// ── Tool definitions ──────────────────────────────────────────────────────────

const TOOLS = [
  // ── 1. Create spreadsheet ────────────────────────────────────────────────
  {
    name: "sheets_create",
    description:
      "Create a new Google Sheets spreadsheet with a 'selectNsolve' tab. " +
      "Returns spreadsheetId and URL. Share the URL with the user so they can open it, " +
      "install the selectNsolve Basic™ add-on from the Google Workspace Marketplace, " +
      "and run it to solve the equations. " +
      "Pass spreadsheetId to all other sheets_ tools.",
    inputSchema: {
      type: "object",
      required: ["title"],
      properties: {
        title: { type: "string", description: "Spreadsheet title." },
      },
    },
  },

  // ── 2. Read range ────────────────────────────────────────────────────────
  {
    name: "sheets_read_range",
    description:
      "Read cell values from a Google Sheets range. Returns a 2-D array of cell strings. " +
      "Useful for reading the math text already written into a sheet, " +
      "or verifying the layout before sending the link to the user.",
    inputSchema: {
      type: "object",
      required: ["spreadsheetId", "range"],
      properties: {
        spreadsheetId: { type: "string", description: "Spreadsheet ID or URL." },
        range: {
          type: "string",
          description: "A1 notation, e.g. \"'selectNsolve'!A1:B20\" or \"A4:A15\".",
        },
      },
    },
  },

  // ── 3. Write range ───────────────────────────────────────────────────────
  {
    name: "sheets_write_range",
    description:
      "Write raw values to a Google Sheets range. " +
      "Use for filling in any cells not covered by sheets_format_selectnsolve. " +
      "Unicode strings (ε, α, ², √) work natively. " +
      "For writing selectNsolve-formatted equation/variable/constant text, " +
      "prefer sheets_format_selectnsolve instead.",
    inputSchema: {
      type: "object",
      required: ["spreadsheetId", "range", "values"],
      properties: {
        spreadsheetId: { type: "string", description: "Spreadsheet ID or URL." },
        range: { type: "string", description: "Top-left cell, e.g. \"'selectNsolve'!A18\"." },
        values: {
          type: "array",
          items: { type: "array", items: { type: ["string", "number", "null"] } },
          description: "2-D array (rows × cols). Example: [[\"f\", 0.02217, \"dimensionless\"]]",
        },
      },
    },
  },

  // ── 4. Format selectNsolve ───────────────────────────────────────────────
  {
    name: "sheets_format_selectnsolve",
    description:
      "Write selectNsolve-formatted math text into a sheet range. " +
      "selectNsolve treats any cell containing '=' as math text. Entry types:\n" +
      "  constant    →  'name = value unit'              e.g. 'ε = 0.0001 m'\n" +
      "  variable    →  'name = number unit > min < max' e.g. 'f = 0.02 > 1e-10 < 1'\n" +
      "  derivation  →  'name = formula'                 e.g. 'A = π * r^2'\n" +
      "  equation    →  'LHS = RHS | precision'          e.g. '1/sqrt(f) = -2*:LOG10(...) | 0.0001'\n" +
      "                 '|' sets precision (0 < n ≤ 1); ':LOG10'/':SIN'/':COS' routes fn to GSheets engine\n" +
      "  formulas    →  'Formulas:FN; FN'                e.g. 'Formulas:LOG10; SIN'\n" +
      "  label       →  plain text section header (no '=' — not parsed as math)\n" +
      "  blank       →  empty row\n" +
      "The user opens the sheet and runs the selectNsolve Basic™ add-on to solve equations. " +
      "Returns the list of col-A strings written for verification.",
    inputSchema: {
      type: "object",
      required: ["spreadsheetId", "startCell", "entries"],
      properties: {
        spreadsheetId: { type: "string", description: "Spreadsheet ID or URL." },
        startCell: {
          type: "string",
          description: "Top-left cell where writing starts, e.g. \"'selectNsolve'!A1\" or \"A4\".",
        },
        entries: {
          type: "array",
          description: "Array of selectNsolve entries, one per row.",
          items: {
            type: "object",
            required: ["type"],
            properties: {
              type: {
                type: "string",
                enum: ["constant", "variable", "derivation", "equation", "formulas", "label", "blank"],
                description:
                  "Entry type:\n" +
                  "  constant   : known value    →  'name = value unit'              e.g. 'ε = 0.0001 m'\n" +
                  "  variable   : unknown+bounds →  'name = number unit > min < max' e.g. 'f = 0.02 > 1e-10 < 1'\n" +
                  "  derivation : intermediate   →  'name = formula'                 e.g. 'A = π * r^2'\n" +
                  "  equation   : main solve     →  'LHS = RHS | precision'          e.g. '1/sqrt(f) = ... | 0.0001'\n" +
                  "  formulas   : fn declaration →  'Formulas:FN; FN'                e.g. 'Formulas:LOG10; SIN'\n" +
                  "  label      : plain-text section header (no '=' — not parsed)\n" +
                  "  blank      : empty row",
              },
              name:        { type: "string",  description: "Symbol name for constant, variable, or derivation." },
              value:       { type: "number",  description: "Numeric value. Required for constant and variable." },
              unit:        { type: "string",  description: "Optional unit appended after value, e.g. 'm', 'm/s²'." },
              description: { type: "string",  description: "Human-readable note written to column B." },
              min:         { type: ["string", "number"], description: "Lower bound (≥) → written with '>'. e.g. 1e-10" },
              max:         { type: ["string", "number"], description: "Upper bound (≤) → written with '<'. e.g. 1" },
              formula:     { type: "string",  description: "RHS formula for a derivation entry, e.g. 'π * r^2'." },
              equation:    { type: "string",  description: "Full equation 'LHS = RHS'. May contain :LOG10, :SIN, :COS." },
              precision:   { type: "number", exclusiveMinimum: 0, maximum: 1, description: "Precision (0 < n ≤ 1) → appended as '| n'. e.g. 0.0001." },
              notes:       { type: "string",  description: "Optional notes for column B." },
              functions:   { type: "array", items: { type: "string" }, description: "Worksheet function names, e.g. ['LOG10', 'SIN']. Written as 'Formulas:LOG10; SIN'." },
              text:        { type: "string",  description: "Label text (label type only)." },
            },
          },
        },
      },
    },
  },

  // ── 5. Apply template ────────────────────────────────────────────────────
  {
    name: "sheets_apply_template",
    description:
      "Write a complete selectNsolve-formatted worksheet using the canonical syntax. " +
      "Writes a Colebrook-White pipe flow example with all four sections: " +
      "Constants ('name = value unit'), Variables ('name = number > min < max'), " +
      "Equations ('LHS = RHS | precision' with ':LOG10'/':SIN'/':COS' for GSheets fns), " +
      "and a Results placeholder. " +
      "After writing, return the spreadsheet URL to the user so they can open it, " +
      "install the selectNsolve Basic™ add-on from the Google Workspace Marketplace, " +
      "and run it to solve the equations.",
    inputSchema: {
      type: "object",
      required: ["spreadsheetId", "sheetName", "title"],
      properties: {
        spreadsheetId: { type: "string", description: "Spreadsheet ID or URL." },
        sheetName:     { type: "string", description: "Name of the sheet tab, e.g. 'selectNsolve'." },
        title:         { type: "string", description: "Title line, e.g. 'Pipe Flow Analysis'." },
      },
    },
  },
];

// ── JSON-RPC helpers ──────────────────────────────────────────────────────────

function ok(id: unknown, result: unknown) {
  return { jsonrpc: "2.0", id, result };
}
function err(id: unknown, code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}
function toolOk(id: unknown, text: string) {
  return ok(id, { content: [{ type: "text", text }] });
}
function toolErr(id: unknown, code: string, message: string) {
  return ok(id, {
    content: [{ type: "text", text: JSON.stringify({ error: { code, message } }) }],
    isError: true,
  });
}

// ── Tool dispatcher ───────────────────────────────────────────────────────────

async function callTool(
  id: unknown,
  name: string,
  args: Record<string, any>,
): Promise<unknown> {
  try {
    switch (name) {

      // ── sheets_create ───────────────────────────────────────────────────
      case "sheets_create": {
        const { title } = args;
        if (!title) return toolErr(id, "INVALID_REQUEST", "'title' is required.");
        return toolOk(id, JSON.stringify(await createSheet(title)));
      }

      // ── sheets_read_range ───────────────────────────────────────────────
      case "sheets_read_range": {
        const { spreadsheetId, range } = args;
        if (!spreadsheetId || !range)
          return toolErr(id, "INVALID_REQUEST", "'spreadsheetId' and 'range' are required.");
        return toolOk(id, JSON.stringify(await readRange(spreadsheetId, range)));
      }

      // ── sheets_write_range ──────────────────────────────────────────────
      case "sheets_write_range": {
        const { spreadsheetId, range, values } = args;
        if (!spreadsheetId || !range || !Array.isArray(values))
          return toolErr(id, "INVALID_REQUEST", "'spreadsheetId', 'range', and 'values' are required.");
        return toolOk(id, JSON.stringify(await writeRange(spreadsheetId, range, values)));
      }

      // ── sheets_format_selectnsolve ──────────────────────────────────────
      case "sheets_format_selectnsolve": {
        const { spreadsheetId, startCell, entries } = args;
        if (!spreadsheetId || !startCell || !Array.isArray(entries))
          return toolErr(id, "INVALID_REQUEST", "'spreadsheetId', 'startCell', and 'entries' are required.");
        const result = await formatSelectNsolve(
          spreadsheetId,
          startCell,
          entries as SelectNsolveEntry[],
        );
        return toolOk(id, JSON.stringify(result));
      }

      // ── sheets_apply_template ───────────────────────────────────────────
      case "sheets_apply_template": {
        const { spreadsheetId, sheetName, title } = args;
        if (!spreadsheetId || !sheetName || !title)
          return toolErr(id, "INVALID_REQUEST", "'spreadsheetId', 'sheetName', and 'title' are required.");
        return toolOk(id, JSON.stringify(await applyTemplate(spreadsheetId, sheetName, title)));
      }

      default:
        return err(id, -32601, `Unknown tool: "${name}"`);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`Tool "${name}" error:`, msg);
    return toolErr(id, "TOOL_ERROR", msg);
  }
}

// ── Message handler ───────────────────────────────────────────────────────────

export async function handleMessage(msg: unknown): Promise<unknown | null> {
  if (!msg || typeof msg !== "object") return err(null, -32600, "Invalid Request");

  const { jsonrpc, id, method, params } = msg as any;
  if (jsonrpc !== "2.0") return err(id ?? null, -32600, "Invalid JSON-RPC version");
  if (id === undefined) return null; // notification — no response

  switch (method) {
    case "initialize":
      return ok(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions:
          "selectNsolve MCP server — Google Sheets tools for building selectNsolve worksheets. " +
          "selectNsolve Basic™ is a Google Workspace Marketplace add-on that runs inside Google Sheets. " +
          "This server creates and pre-fills spreadsheets with selectNsolve math text; " +
          "the user opens the sheet and runs the add-on to solve the equations. " +
          "selectNsolve math text syntax: " +
          "'=' marks any cell as math text (constant, variable, derivation, or equation). " +
          "'|' sets equation precision (0 < n ≤ 1, e.g. 0.0001); closer to 1 = higher precision. " +
          "'>' and '<' set variable search bounds (lower ≥ and upper ≤). " +
          "':' prefixes a Google Sheets built-in function inside an equation (:LOG10, :SIN, :COS). " +
          "Typical workflow: sheets_create → sheets_apply_template → return URL to user.",
      });

    case "tools/list":
      return ok(id, { tools: TOOLS });

    case "tools/call":
      return callTool(id, params?.name, params?.arguments ?? {});

    default:
      return err(id, -32601, `Method not found: "${method}"`);
  }
}

/** Handles one HTTP body (a JSON-RPC message or a batch). Returns null when there is nothing to send (204). */
export async function handleBody(body: unknown): Promise<unknown | null> {
  const messages: unknown[] = Array.isArray(body) ? body : [body];
  const responses: unknown[] = [];
  for (const msg of messages) {
    const r = await handleMessage(msg);
    if (r !== null) responses.push(r);
  }
  return responses.length === 0 ? null : responses.length === 1 ? responses[0] : responses;
}
