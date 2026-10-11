import React from "react";
import { PageWrapper } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, ShieldCheck, BookOpenCheck } from "lucide-react";
import MermaidDiagram from "@/components/MermaidDiagram";

const unicodeWorkflow = `
flowchart LR
    U[Unicode Input\\nAny Script] --> GS[Google Sheets™\\nCell]
    GS --> SN[selectNsolve™\\nBasic™]
    SN --> R[Solved Result\\nwith Original Units]
    R --> D[Share &\\nCollaborate]
    style SN fill:#1e3a5f,color:#fff
    style R fill:#4a7ab5,color:#fff
`;

const unicodeScripts = [
  { script: "Latin", examples: ["velocity", "pressure", "force"], color: "#1e3a5f" },
  { script: "Greek", examples: ["ρ (rho)", "μ (mu)", "Δ (delta)"], color: "#4a7ab5" },
  { script: "Arabic", examples: ["سرعة", "ضغط", "قوة"], color: "#2e6b3e" },
  { script: "Chinese", examples: ["速度", "压力", "力"], color: "#7b3f00" },
  { script: "Cyrillic", examples: ["скорость", "давление"], color: "#5b2d8e" },
  { script: "Hebrew", examples: ["מהירות", "לחץ"], color: "#8b0000" },
];

export default function Skills() {
  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="space-y-6 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-secondary/15 text-secondary font-semibold text-sm mb-2">
            Skills & Creative Learning
          </div>
          <h1 className="text-4xl md:text-6xl font-bold font-display leading-tight">
            Learn Creatively: Unleashing the Power of Unicode
          </h1>
          <p className="text-xl text-muted-foreground">
            Google Sheets™ is not limited to English letters and numbers. It works seamlessly with Unicode characters from virtually every global script and symbol set.
          </p>
        </div>

        <section className="py-8">
          <h2 className="text-3xl font-bold font-display mb-8 text-center">Why Unicode Integration Matters</h2>
          <p className="text-center text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            Moving beyond Latin characters unlocks a new level of functionality for global projects and data management.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-t-4 border-t-primary">
              <CardContent className="p-8 space-y-4">
                <Globe className="w-10 h-10 text-primary" />
                <h3 className="text-xl font-bold font-display">1. Global Collaboration</h3>
                <p className="text-muted-foreground">
                  Enable diverse teams to work together in their native languages. Input data using Arabic, Chinese, Spanish, Hebrew, Cyrillic, or any other language, ensuring accurate communication.
                </p>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-secondary">
              <CardContent className="p-8 space-y-4">
                <ShieldCheck className="w-10 h-10 text-secondary" />
                <h3 className="text-xl font-bold font-display">2. Data Integrity</h3>
                <p className="text-muted-foreground">
                  Analyze datasets from around the world. Keeping the information in its original language maintains its accuracy and authenticity, crucial for compliance and clarity.
                </p>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-accent-foreground">
              <CardContent className="p-8 space-y-4">
                <BookOpenCheck className="w-10 h-10 text-accent-foreground" />
                <h3 className="text-xl font-bold font-display">3. Advanced Learning</h3>
                <p className="text-muted-foreground">
                  Create educational materials that teach vocabulary across different writing systems or build comprehensive documentation that integrates specialized engineering characters.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Unicode Scripts SVG Showcase */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold font-display text-center">selectNsolve™ Speaks Every Language</h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto">
            Name your variables in any script. selectNsolve Basic™ recognises Unicode identifiers natively — your equations read like your native language.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {unicodeScripts.map(({ script, examples, color }) => (
              <div
                key={script}
                className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-bold text-sm uppercase tracking-wide">{script}</span>
                </div>
                <ul className="space-y-1">
                  {examples.map((ex) => (
                    <li key={ex} className="font-mono text-sm text-muted-foreground">{ex}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* SVG Globe Illustration */}
          <div className="flex justify-center py-4">
            <svg
              viewBox="0 0 480 200"
              className="w-full max-w-2xl"
              aria-label="Global Unicode integration illustration"
              role="img"
            >
              {/* Central Google Sheets node */}
              <rect x="185" y="70" width="110" height="60" rx="12" fill="#1e3a5f" />
              <text x="240" y="98" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">selectNsolve™</text>
              <text x="240" y="114" textAnchor="middle" fill="white" fontSize="10">Basic™</text>

              {/* Orbiting script nodes */}
              {[
                { cx: 60,  cy: 50,  label: "Arabic", sub: "سرعة" },
                { cx: 60,  cy: 150, label: "Chinese", sub: "速度" },
                { cx: 420, cy: 50,  label: "Cyrillic", sub: "скорость" },
                { cx: 420, cy: 150, label: "Greek", sub: "ρ, μ, Δ" },
                { cx: 240, cy: 20,  label: "Hebrew", sub: "מהירות" },
                { cx: 240, cy: 180, label: "Latin", sub: "velocity" },
              ].map(({ cx, cy, label, sub }) => (
                <g key={label}>
                  <line
                    x1={cx} y1={cy}
                    x2={240} y2={100}
                    stroke="#4a7ab5" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6"
                  />
                  <circle cx={cx} cy={cy} r="28" fill="#f0f4f8" stroke="#4a7ab5" strokeWidth="1.5" />
                  <text x={cx} y={cy - 6} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#1e3a5f">{label}</text>
                  <text x={cx} y={cy + 9} textAnchor="middle" fontSize="10" fill="#4a7ab5">{sub}</text>
                </g>
              ))}

              {/* Result arrow */}
              <text x="240" y="165" textAnchor="middle" fontSize="11" fill="#2e6b3e" fontWeight="bold">→ One Solver for All</text>
            </svg>
          </div>
        </section>

        {/* Workflow Diagram */}
        <section className="space-y-4">
          <h2 className="text-3xl font-bold font-display text-center">Multilingual Workflow</h2>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <MermaidDiagram chart={unicodeWorkflow} />
          </div>
        </section>

        <section className="bg-primary/5 rounded-3xl p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold font-display mb-6">What You Can Creatively Achieve</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            The integration of Unicode is not just cosmetic—it's fully functional within the Sheets environment. Build equations using native symbols (like Greek letters for physics) and watch your spreadsheets transform into professional engineering documents.
          </p>
        </section>
      </div>
    </PageWrapper>
  );
}
