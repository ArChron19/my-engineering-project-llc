import React from "react";
import { PageWrapper } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookMarked, Calculator, Lightbulb } from "lucide-react";
import { BlockMath, InlineMath } from "@/components/MathRenderer";
import MermaidDiagram from "@/components/MermaidDiagram";

const studyWorkflow = `
flowchart LR
    A([Read Problem]) --> B[Draw Schematic]
    B --> C[Identify Knowns\\n& Unknowns]
    C --> D[Write Equations\\nin Cells]
    D --> E[Define Elements\\nConstants, Vars]
    E --> F([selectNsolve™\\nClick to Solve])
    style A fill:#1e3a5f,color:#fff
    style F fill:#1e3a5f,color:#fff
    style D fill:#4a7ab5,color:#fff
`;

const frictionFactor = `
flowchart TD
    R[Reynolds Number\\nRe = ρvD/μ] --> L{Laminar\\nRe < 2300?}
    L -- Yes --> LA["f = 64 / Re"]
    L -- No --> T{Turbulent\\nRe > 4000?}
    T -- Yes --> CW["Colebrook-White\\n1/√f = -2·log₁₀(ε/3.7D + 2.51/Re√f)"]
    T -- No --> TR["Transition Zone\\nInterpolate"]
    style R fill:#1e3a5f,color:#fff
    style CW fill:#4a7ab5,color:#fff
    style LA fill:#4a7ab5,color:#fff
`;

export default function StudyGuides() {
  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold font-display text-primary">Study Guides</h1>
          <p className="text-xl text-muted-foreground">Resources and references to accelerate your learning and problem-solving.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="hover:shadow-lg transition-all group cursor-pointer">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BookMarked size={24} />
              </div>
              <CardTitle>Quick Reference Introduction</CardTitle>
              <CardDescription className="text-base mt-2">
                A condensed guide to the selectNsolve Basic™ syntax. Perfect for printing or keeping open on a second monitor while working.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-all group cursor-pointer">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Calculator size={24} />
              </div>
              <CardTitle>Friction Factor: Colebrook-White</CardTitle>
              <CardDescription className="text-base mt-2">
                Step-by-step tutorial on setting up and solving the implicit Colebrook-White equation using iterative techniques in your sheet.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-all group cursor-pointer md:col-span-2">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-accent-foreground/10 text-accent-foreground flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Lightbulb size={24} />
              </div>
              <CardTitle>Extend Google Sheets™ Native Functionality</CardTitle>
              <CardDescription className="text-base mt-2">
                Learn advanced techniques for combining native Google Sheets™ formulas (like IF, VLOOKUP, and standard math functions) with the raw equation-solving power of selectNsolve™. Discover how to build dynamic engineering dashboards.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Engineering Problem-Solving Workflow */}
        <section className="space-y-6 pt-4">
          <h2 className="text-3xl font-bold font-display border-b border-border pb-2">Engineering Problem-Solving Workflow</h2>
          <p className="text-muted-foreground text-lg">
            Professional engineers follow a systematic approach. selectNsolve Basic™ accelerates the calculation step — but the strategy must come from you.
          </p>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <MermaidDiagram chart={studyWorkflow} />
          </div>
        </section>

        {/* Friction Factor Reference */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold font-display border-b border-border pb-2">Friction Factor Reference</h2>
          <p className="text-muted-foreground">
            Selecting the correct friction factor formula depends on the flow regime. Use the Reynolds number <InlineMath formula="Re" /> to determine which equation applies:
          </p>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <MermaidDiagram chart={frictionFactor} />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6 space-y-3">
                <p className="text-sm font-bold text-green-700 uppercase tracking-wide">Laminar Flow  (Re &lt; 2300)</p>
                <BlockMath formula="f = \frac{64}{Re}" />
                <p className="text-sm text-green-700">Explicitly solvable — no iteration needed.</p>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-6 space-y-3">
                <p className="text-sm font-bold text-blue-700 uppercase tracking-wide">Turbulent Flow  (Re &gt; 4000)</p>
                <BlockMath formula="\frac{1}{\sqrt{f}} = -2\log_{10}\!\!\left(\frac{\varepsilon}{3.7D} + \frac{2.51}{Re\sqrt{f}}\right)" />
                <p className="text-sm text-blue-700">Implicit — requires iterative solver.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Key Formulas Cheat Sheet */}
        <section className="bg-primary/5 rounded-3xl p-8 space-y-6 border border-primary/20">
          <h2 className="text-2xl font-bold font-display text-center">Key Equations Cheat Sheet</h2>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-primary uppercase tracking-widest">Continuity</p>
              <BlockMath formula="Q = A \cdot v" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-primary uppercase tracking-widest">Bernoulli</p>
              <BlockMath formula="\frac{p}{\rho g} + \frac{v^2}{2g} + z = \text{const}" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-primary uppercase tracking-widest">Darcy-Weisbach</p>
              <BlockMath formula="h_f = f \frac{L}{D}\frac{v^2}{2g}" />
            </div>
          </div>
        </section>
      </div>
    </PageWrapper>
  );
}
