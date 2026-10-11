import React from "react";
import { PageWrapper } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { BlockMath, InlineMath } from "@/components/MathRenderer";
import MermaidDiagram from "@/components/MermaidDiagram";

const elementsDiagram = `
flowchart TD
    MT[Math Text Selection] --> C[Constants\\nName = Number]
    MT --> V[Variables\\nVar = N > Min < Max]
    MT --> D[Derivations\\nName = RHS]
    MT --> F[Formulas\\nLOG10, SIN, ...]
    MT --> CR[Cell References\\nName = cell]
    C --> EQ[Equation\\nLHS = RHS | Precision]
    V --> EQ
    D --> EQ
    F --> EQ
    CR --> EQ
    EQ --> SOL([selectNsolve™ solves for unknown])
    style MT fill:#1e3a5f,color:#fff
    style EQ fill:#4a7ab5,color:#fff
    style SOL fill:#1e3a5f,color:#fff
`;

export default function Introduction() {
  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold font-display text-primary">Introduction to selectNsolve Basic™</h1>
          <p className="text-xl text-muted-foreground">Master the minimal syntax required to transform your Google Sheets™ into a powerful equation solver.</p>
        </div>

        <section className="space-y-6">
          <h2 className="text-3xl font-bold font-display border-b border-border pb-2">Math Shouldn't Be Terrifying</h2>
          <p className="text-lg leading-relaxed">
            selectNsolve Basic™ is an add-on that solves single-variable equations with minimal requirements. Any text in individual cells containing a single equal sign ("=") is automatically recognized as "math text."
          </p>

          {/* Standard format with KaTeX */}
          <Card className="bg-primary/5 border-primary/20 mt-8">
            <CardContent className="p-8 space-y-6">
              <h3 className="text-xl font-bold text-primary">Standard Equation Format</h3>
              <div className="bg-background rounded-xl p-6 shadow-inner border border-border">
                <BlockMath formula="\underbrace{\text{LHS}}_{\text{left side}} = \underbrace{\text{RHS}}_{\text{right side}} \;\Big|\; \underbrace{\text{precision}}_{0 < n \leq 1}" />
              </div>
              <p className="text-muted-foreground text-center text-sm">
                The pipe character <code className="bg-muted px-1.5 py-0.5 rounded font-mono">|</code> flags the cell as an equation and sets the precision — a value greater than 0 and up to 1 (e.g. <code className="bg-muted px-1.5 py-0.5 rounded font-mono">0.0001</code>). Closer to 1 means higher precision; the add-on narrows min and max toward the solution, subject to a 60-second limit.
              </p>

              {/* Example equations */}
              <div className="space-y-3 pt-2">
                <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Quick Examples</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-muted rounded-xl p-4 space-y-2">
                    <p className="text-xs font-semibold text-primary uppercase">Quadratic</p>
                    <BlockMath formula="x^2 - 5x + 6 = 0 \;\Big|\; 0.001" />
                  </div>
                  <div className="bg-muted rounded-xl p-4 space-y-2">
                    <p className="text-xs font-semibold text-primary uppercase">Energy Balance</p>
                    <BlockMath formula="\frac{1}{2}mv^2 = mgh \;\Big|\; 0.01" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8">
            <img
              src={`${import.meta.env.BASE_URL}images/instructions_c1.png`}
              alt="selectNsolve Basic instructions example"
              className="w-full rounded-2xl border border-border shadow-md"
            />
            <p className="text-sm text-muted-foreground text-center mt-2">selectNsolve Basic™ — instructions example</p>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold font-display">Operators</h3>
            <p className="text-muted-foreground">
              Control characters and Unicode math operators are supported. We embrace all Unicode math operators for current and future mathematical notation.
            </p>
            <div className="bg-muted rounded-xl p-4 text-center">
              <BlockMath formula="+\;-\;\times\;\div\;\wedge\;\sqrt{\phantom{x}}\;\log\;\sin\;\cos" />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-bold font-display">Names and Units</h3>
            <p className="text-muted-foreground">
              You can use any sequence of one or more Unicode characters (excluding math operators) to define your variable names and units.
            </p>
            <div className="bg-muted rounded-xl p-4 space-y-2 text-sm font-mono">
              <div>velocity_m/s, <InlineMath formula="\rho" />, Δh, α, T_c°</div>
              <div>力, давление, سرعة</div>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <h2 className="text-3xl font-bold font-display border-b border-border pb-2">Defining Elements</h2>
          
          <div className="grid sm:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6 space-y-3">
                <h4 className="text-lg font-bold">Constants</h4>
                <BlockMath formula="g = 9.81\;\text{m/s}^2" />
                <BlockMath formula="\rho_{\text{water}} = 1000\;\text{kg/m}^3" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-3">
                <h4 className="text-lg font-bold">Variables (with bounds)</h4>
                <BlockMath formula="v = 10 > 0 < 100" />
                <p className="text-sm text-muted-foreground">Initial value plus bounds — the solver searches between the lower (≥) and upper (≤) bounds.</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-3">
                <h4 className="text-lg font-bold">Derivations</h4>
                <BlockMath formula="A = \pi r^2" />
                <BlockMath formula="Q = A \cdot v" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-3">
                <h4 className="text-lg font-bold">Formulas & Cell References</h4>
                <div className="font-mono bg-muted p-3 rounded-lg text-sm">Formulas:LOG10; SIN; COS</div>
                <div className="font-mono bg-muted p-3 rounded-lg text-sm">Name = [A2]</div>
              </CardContent>
            </Card>
          </div>

          {/* Element relationship diagram */}
          <div className="space-y-3">
            <h3 className="text-2xl font-bold font-display">How the Elements Work Together</h3>
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <MermaidDiagram chart={elementsDiagram} />
            </div>
          </div>
        </section>

        <section className="bg-secondary/10 p-8 rounded-3xl border border-secondary/20 space-y-6">
          <h2 className="text-2xl font-bold font-display text-secondary-foreground">Important Note About Units</h2>
          <p className="text-lg">
            While the software helps you solve equations quickly, understanding and correctly manipulating units (dimensions) is critical. Unit manipulation remains an essential skill for any test-taker or professional engineer.
          </p>
          <ul className="space-y-3 list-disc list-inside ml-4 text-muted-foreground font-medium">
            <li>Input values use consistent units</li>
            <li>Output values are interpreted with correct units</li>
            <li>Unit conversions are performed accurately</li>
          </ul>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <img
                src={`${import.meta.env.BASE_URL}images/units1.png`}
                alt="Units example 1"
                className="w-full rounded-xl border border-border shadow-sm"
              />
            </div>
            <div>
              <img
                src={`${import.meta.env.BASE_URL}images/units2.png`}
                alt="Units example 2"
                className="w-full rounded-xl border border-border shadow-sm"
              />
            </div>
          </div>
        </section>

        <section className="text-center py-12">
          <h3 className="text-2xl font-bold mb-4">Ready to begin?</h3>
          <p className="text-muted-foreground mb-8">
            Start with simple constants and variables, then progress to more complex equations as you become comfortable with the syntax.
          </p>
        </section>
      </div>
    </PageWrapper>
  );
}
