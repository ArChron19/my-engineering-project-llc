import React, { useState } from "react";
import { PageWrapper } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BlockMath, InlineMath } from "@/components/MathRenderer";
import MermaidDiagram from "@/components/MermaidDiagram";
import { Bot, Code2, ArrowRight, Copy, Check, Wrench, Plug, TableProperties, ExternalLink, Sheet } from "lucide-react";
import { cn } from "@/lib/utils";

const MCP_URL  = "https://myengineeringproject.com/api/mcp";
const MARKETPLACE_URL = "https://workspace.google.com/marketplace";

const workflowDiagram = `
sequenceDiagram
    participant A as AI Agent / App
    participant S as selectNsolve™ MCP API
    participant G as Google Sheets™
    participant U as User
    A->>S: sheets_create("Pipe Flow Analysis")
    S->>G: Create spreadsheet
    G-->>S: spreadsheetId, url
    A->>S: sheets_apply_template(spreadsheetId, ...)
    S->>G: Write selectNsolve math text
    G-->>S: rowsWritten, formatted[]
    S-->>A: spreadsheet URL
    A-->>U: "Here is your sheet: <url>"
    U->>G: Open sheet, run selectNsolve add-on
    G-->>U: Equations solved ✓
`;

const mcpFlow = `
flowchart LR
    LLM[Language Model\\nClaude / GPT-4] -->|tools/call| MCP[selectNsolve™\\nMCP Server]
    MCP -->|Sheets API| G[Google Sheets™\\nSpreadsheet]
    G -->|url| MCP
    MCP -->|tool result| LLM
    LLM -->|sheet link| User
    User -->|open + run add-on| G
    style LLM fill:#1e3a5f,color:#fff
    style MCP fill:#7c3aed,color:#fff
    style G fill:#14532d,color:#fff
`;

const examples: Record<string, { lang: string; code: string }> = {
  python: {
    lang: "python",
    code: `import json, requests

MCP = "${MCP_URL}"

def mcp(method, params, id=1):
    r = requests.post(MCP, json={"jsonrpc":"2.0","id":id,"method":method,"params":params})
    return r.json()["result"]

def call(tool, args):
    return json.loads(mcp("tools/call",{"name":tool,"arguments":args})["content"][0]["text"])

# 1. Handshake
mcp("initialize", {
    "protocolVersion": "2024-11-05",
    "clientInfo": {"name": "my-agent", "version": "1.0"},
    "capabilities": {},
})

# 2. Create a Google Sheet
sheet = call("sheets_create", {"title": "Pipe Flow Analysis"})
print("Sheet URL:", sheet["url"])

# 3. Write selectNsolve math text using the canonical template
call("sheets_apply_template", {
    "spreadsheetId": sheet["spreadsheetId"],
    "sheetName":     "selectNsolve",
    "title":         "Pipe Flow Analysis",
})

# 4. Share the URL — user opens it and runs the selectNsolve add-on
print("Open this sheet and run the selectNsolve Basic™ add-on:")
print(sheet["url"])`,
  },
  javascript: {
    lang: "javascript",
    code: `const MCP_URL = "${MCP_URL}";

async function mcpCall(method, params) {
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  return (await res.json()).result;
}

async function tool(name, args) {
  const result = await mcpCall("tools/call", { name, arguments: args });
  return JSON.parse(result.content[0].text);
}

// 1. Handshake
await mcpCall("initialize", {
  protocolVersion: "2024-11-05",
  clientInfo: { name: "my-agent", version: "1.0" },
  capabilities: {},
});

// 2. Create the sheet
const sheet = await tool("sheets_create", { title: "Pipe Flow Analysis" });
console.log("Sheet URL:", sheet.url);

// 3. Write selectNsolve math text
await tool("sheets_apply_template", {
  spreadsheetId: sheet.spreadsheetId,
  sheetName: "selectNsolve",
  title: "Pipe Flow Analysis",
});

// 4. Share with user — they open it and run the add-on
console.log("Open and run the selectNsolve Basic™ add-on:", sheet.url);`,
  },
  curl: {
    lang: "bash",
    code: `# 1. Handshake
curl -s -X POST ${MCP_URL} \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{
    "protocolVersion":"2024-11-05",
    "clientInfo":{"name":"shell","version":"1"},
    "capabilities":{}
  }}'

# 2. Create a Google Sheet
curl -s -X POST ${MCP_URL} \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{
    "name":"sheets_create",
    "arguments":{"title":"Pipe Flow Analysis"}
  }}'
# → returns { "spreadsheetId": "...", "url": "https://docs.google.com/..." }

# 3. Write selectNsolve math text
curl -s -X POST ${MCP_URL} \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{
    "name":"sheets_apply_template",
    "arguments":{
      "spreadsheetId":"<ID from step 2>",
      "sheetName":"selectNsolve",
      "title":"Pipe Flow Analysis"
    }
  }}'

# 4. Open the sheet URL and run the selectNsolve Basic™ add-on to solve`,
  },
  mcp: {
    lang: "json",
    code: `// MCP JSON-RPC — create a sheet and write selectNsolve math text
// Step 1: initialize
{ "jsonrpc":"2.0","id":1,"method":"initialize",
  "params":{ "protocolVersion":"2024-11-05",
              "clientInfo":{"name":"claude","version":"1"},
              "capabilities":{} } }

// Step 2: create the spreadsheet
{ "jsonrpc":"2.0","id":2,"method":"tools/call",
  "params":{ "name":"sheets_create",
              "arguments":{ "title":"Pipe Flow Analysis" } } }
// → { "spreadsheetId":"1abc...","url":"https://docs.google.com/..." }

// Step 3: write selectNsolve math text
{ "jsonrpc":"2.0","id":3,"method":"tools/call",
  "params":{ "name":"sheets_apply_template",
              "arguments":{
                "spreadsheetId":"1abc...",
                "sheetName":"selectNsolve",
                "title":"Pipe Flow Analysis"
              } } }

// Step 4: return the URL to the user
// "Your sheet is ready: https://docs.google.com/...
//  Open it and run the selectNsolve Basic™ add-on to solve."`,
  },
};

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group">
      <pre className="bg-slate-900 text-slate-100 rounded-xl p-6 overflow-x-auto text-sm leading-relaxed font-mono whitespace-pre">
        <code>{code}</code>
      </pre>
      <button
        onClick={copy}
        className="absolute top-3 right-3 p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Copy code"
      >
        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
      </button>
    </div>
  );
}

const tabs = ["python", "javascript", "curl", "mcp"] as const;
type Tab = typeof tabs[number];
const tabLabels: Record<Tab, string> = {
  python:     "Python",
  javascript: "JavaScript",
  curl:       "cURL",
  mcp:        "MCP / JSON-RPC",
};

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl font-bold font-display border-b border-border pb-2">{children}</h2>
  );
}

export default function DeveloperAPI() {
  const [activeTab, setActiveTab] = useState<Tab>("python");

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto space-y-16">

        {/* Hero */}
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-100 text-green-700 font-semibold text-sm border border-green-200">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Live
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100 text-violet-700 font-semibold text-sm border border-violet-200">
              <Bot size={14} /> MCP-compatible
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-display text-primary">
            selectNsolve API
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            An MCP server that lets AI agents create Google Sheets™ spreadsheets pre-filled with
            selectNsolve™ math text. The user opens the sheet, runs the
            selectNsolve Basic™ add-on, and the equations are solved — inside Google Sheets™, exactly as designed.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" className="bg-primary text-white font-bold" asChild>
              <a href="#quickstart">Quick Start <ArrowRight size={16} className="ml-2" /></a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href={MARKETPLACE_URL} target="_blank" rel="noopener noreferrer">
                Get the Add-on <ExternalLink size={16} className="ml-2" />
              </a>
            </Button>
          </div>
        </div>

        {/* How it works callout */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-blue-800 font-semibold">
            <Sheet size={18} />
            How this works
          </div>
          <p className="text-blue-900 text-sm leading-relaxed">
            selectNsolve Basic™ is a Google Workspace™ add-on — it runs entirely inside Google Sheets™.
            This API creates a spreadsheet and writes your problem as selectNsolve™ math text (constants,
            variables, equations). You then open the sheet and run the add-on to solve. The API does
            not solve equations itself; the add-on does.
          </p>
        </div>

        {/* Key capabilities */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: Sheet,  title: "Creates Google Sheets™", sub: "Pre-filled with selectNsolve™ math text", color: "text-green-600 bg-green-50 border-green-200" },
            { icon: Code2,  title: "MCP & REST",             sub: "Works with Claude, GPT-4, any agent",   color: "text-blue-600 bg-blue-50 border-blue-200"  },
            { icon: Wrench, title: "Full syntax support",    sub: "Constants, variables, equations, derivations", color: "text-violet-600 bg-violet-50 border-violet-200" },
          ].map(({ icon: Icon, title, sub, color }) => (
            <div key={title} className={cn("rounded-2xl border p-5 space-y-1", color)}>
              <Icon size={20} />
              <p className="font-bold text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </div>
          ))}
        </div>

        {/* Quick start */}
        <section id="quickstart" className="space-y-6">
          <SectionHeading>Quick Start</SectionHeading>
          <p className="text-muted-foreground">
            No API key needed. Call the MCP server to create a Google Sheet™ and write your
            selectNsolve™ problem into it, then open the sheet and run the add-on.
          </p>

          <div className="flex gap-2 flex-wrap border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px",
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tabLabels[tab]}
              </button>
            ))}
          </div>
          <CodeBlock code={examples[activeTab].code} />
        </section>

        {/* Workflow diagram */}
        <section className="space-y-4">
          <SectionHeading>End-to-End Workflow</SectionHeading>
          <p className="text-muted-foreground">
            The API handles creating the sheet and writing the math text.
            The selectNsolve™ add-on handles the solving — inside Google Sheets™.
          </p>
          <div className="bg-card border border-border rounded-2xl p-6">
            <MermaidDiagram chart={workflowDiagram} />
          </div>
        </section>

        {/* MCP connection */}
        <section id="mcp-connect" className="space-y-6">
          <SectionHeading>MCP Integration</SectionHeading>
          <p className="text-muted-foreground">
            selectNsolve™ exposes an MCP server at{" "}
            <code className="font-mono text-sm bg-muted px-1.5 py-0.5 rounded">{MCP_URL}</code>.
            Any MCP-compatible model can connect and use the Sheets tools to build
            a selectNsolve worksheet for a user.
          </p>

          <div className="bg-card border border-border rounded-2xl p-6">
            <MermaidDiagram chart={mcpFlow} />
          </div>

          {/* Claude Desktop */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-100">
                <Plug size={18} className="text-violet-700" />
              </div>
              <h3 className="text-xl font-bold font-display">Connect Claude Desktop</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Add the following to your{" "}
              <code className="font-mono bg-muted px-1.5 py-0.5 rounded">claude_desktop_config.json</code> (
              <a href="https://modelcontextprotocol.io/quickstart/user" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                where to find it ↗
              </a>
              ) to give Claude access.
            </p>
            <CodeBlock code={`// claude_desktop_config.json
{
  "mcpServers": {
    "selectNsolve": {
      "url": "${MCP_URL}"
    }
  }
}`} />
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 space-y-1">
              <p className="font-semibold">Remote MCP server support</p>
              <p>Claude Desktop 0.10.0+ supports remote MCP servers over HTTP. Older versions may require a local proxy.</p>
            </div>
          </div>
        </section>

        {/* Environment characters */}
        <section id="sheets" className="space-y-8">
          <SectionHeading>selectNsolve Math Text Syntax</SectionHeading>
          <p className="text-muted-foreground">
            The API writes these five environment characters into cell text. The add-on reads them
            when it runs inside Google Sheets™.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
            {[
              { char: "=", label: "Math text",    example: "ε = 0.0001 m",            text: "Any cell containing '=' is read as math text — constant, variable, derivation, or equation" },
              { char: "|", label: "Precision",     example: "1/sqrt(f) = … | 0.0001",  text: "Flags the cell as an equation. Number following is precision (0 < n ≤ 1). Closer to 1 = higher precision; 60-second limit in the add-on." },
              { char: ">", label: "Lower bound",  example: "f = 0.02 > 1e-10",        text: "Lower search bound (≥) on a variable — the add-on searches from this value upward" },
              { char: "<", label: "Upper bound",  example: "f = 0.02 > 1e-10 < 1",   text: "Upper search bound (≤) on a variable — the add-on searches up to this value" },
              { char: ":", label: "GSheets fn",   example: "-2*:LOG10(ε/(3.7*D)+…)", text: "Prefix routes that function to the Google Sheets™ formula engine (LOG10, SIN, COS…)" },
            ].map(({ char, example, label, text }) => (
              <div key={char} className="rounded-xl border-2 border-border bg-card p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xl font-bold text-primary">{char}</span>
                  <span className="font-semibold text-xs tracking-wider text-foreground">{label}</span>
                </div>
                <code className="block text-[11px] text-muted-foreground font-mono break-all">{example}</code>
                <p className="text-xs text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>

          {/* Colebrook-White worked example */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold font-display">Example — Colebrook-White Equation</h3>
            <p className="text-muted-foreground text-sm">
              The friction factor <InlineMath formula="f" /> is implicit — it appears on both sides.
              The API writes this into the sheet; the add-on solves it.
            </p>
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-8 text-center">
                <BlockMath formula="\frac{1}{\sqrt{f}} = -2 \log_{10}\!\left(\frac{\varepsilon}{3.7 D} + \frac{2.51}{Re\sqrt{f}}\right)" />
              </CardContent>
            </Card>
            <p className="text-sm text-muted-foreground font-mono bg-muted rounded-xl p-4 leading-loose">
              # CONSTANTS<br/>
              ε = 0.0001 m<br/>
              D = 0.1 m<br/>
              Re = 100000<br/>
              <br/>
              # VARIABLES<br/>
              f = 0.02 &gt; 1e-10 &lt; 1<br/>
              <br/>
              # EQUATIONS<br/>
              Formulas:LOG10<br/>
              1/sqrt(f) = -2*:LOG10(ε/(3.7*D) + 2.51/(Re*sqrt(f))) | 0.0001
            </p>
          </div>

          {/* Three-step workflow */}
          <div className="space-y-3">
            <h3 className="font-bold font-display text-lg">Three-step AI workflow</h3>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              {[
                { step: "1", tool: "sheets_create",         desc: "Create a Google Sheet. Returns spreadsheetId and URL." },
                { step: "2", tool: "sheets_apply_template", desc: "Write the selectNsolve math text: constants, variables, equations, Formulas declaration." },
                { step: "3", tool: "— Return URL to user",  desc: "User opens the sheet, installs selectNsolve Basic™ from the Google Workspace™ Marketplace, and runs it to solve." },
              ].map(({ step, tool, desc }) => (
                <div key={step} className="flex gap-3 bg-card border border-border rounded-xl p-4">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">{step}</div>
                  <div className="space-y-1">
                    <code className="font-mono text-xs text-primary">{tool}</code>
                    <p className="text-muted-foreground text-xs leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sheets tool table */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <TableProperties size={18} className="text-green-700" />
              </div>
              <h3 className="text-xl font-bold font-display">MCP Tool Reference</h3>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 border-b border-border">
                  <tr>
                    <th className="text-left p-4 font-semibold">Tool</th>
                    <th className="text-left p-4 font-semibold">Required args</th>
                    <th className="text-left p-4 font-semibold">Returns</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { tool: "sheets_create",              args: "title",                             returns: "spreadsheetId, url" },
                    { tool: "sheets_read_range",          args: "spreadsheetId, range",              returns: "values (2-D array)" },
                    { tool: "sheets_write_range",         args: "spreadsheetId, range, values",      returns: "updatedCells" },
                    { tool: "sheets_format_selectnsolve", args: "spreadsheetId, startCell, entries", returns: "updatedCells, formatted[ ]" },
                    { tool: "sheets_apply_template",      args: "spreadsheetId, sheetName, title",   returns: "rowsWritten, formatted[ ]" },
                  ].map(({ tool, args, returns }) => (
                    <tr key={tool} className="hover:bg-muted/20">
                      <td className="p-4"><code className="font-mono text-xs text-primary">{tool}</code></td>
                      <td className="p-4 text-xs text-muted-foreground font-mono">{args}</td>
                      <td className="p-4 text-xs text-muted-foreground">{returns}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Get the add-on CTA */}
        <section className="bg-primary text-white rounded-3xl p-10 text-center space-y-5">
          <h2 className="text-3xl font-bold font-display">Get selectNsolve Basic™</h2>
          <p className="text-white/80 text-lg max-w-xl mx-auto">
            Install the add-on from the Google Workspace™ Marketplace to solve equations
            inside your Google Sheets™.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-white text-primary font-bold hover:bg-white/90" asChild>
              <a href={MARKETPLACE_URL} target="_blank" rel="noopener noreferrer">
                Install from Marketplace <ExternalLink size={16} className="ml-2" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
              <a href="mailto:support@myengineeringproject.com">
                Contact Support
              </a>
            </Button>
          </div>
        </section>

      </div>
    </PageWrapper>
  );
}
