import React from "react";
import { PageWrapper } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { BlockMath, InlineMath } from "@/components/MathRenderer";
import MermaidDiagram from "@/components/MermaidDiagram";

const iterativeFlowchart = `
flowchart TD
    A([Start: Define f₀ = 0.02]) --> B[Compute RHS\\nwith current f]
    B --> C[Apply Colebrook-White\\nto get new f]
    C --> D{|f_new − f| < ε?}
    D -- No --> E[Set f = f_new]
    E --> B
    D -- Yes --> F([Converged: Output f])
    style A fill:#1e3a5f,color:#fff
    style F fill:#1e3a5f,color:#fff
    style D fill:#e8f0fe,color:#1e3a5f
`;

const parametricDiagram = `
flowchart LR
    P[Parameters\\nD, ε, Re] --> S[selectNsolve\\nBasic™]
    S --> F[Friction Factor f]
    F --> H[Head Loss h_f\\nDarcy-Weisbach]
    S --> O[Optimization\\nVary D or ε]
    style S fill:#1e3a5f,color:#fff
    style O fill:#4a7ab5,color:#fff
`;

export default function PracticalEngineering() {
  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="space-y-4 pb-8 border-b border-border">
          <h1 className="text-4xl md:text-6xl font-bold font-display text-primary">Practical Engineering</h1>
          <p className="text-xl text-muted-foreground">
            Applying theoretical mathematics to real-world engineering challenges.
          </p>
        </header>

        <section className="space-y-8">
          <h2 className="text-3xl font-bold font-display">The Colebrook-White Equation</h2>
          
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
            <p>
              The Colebrook-White equation is a pivotal mathematical formula in fluid dynamics facilitating
              the calculation of the Darcy friction factor. Developed by Cyril Frank Colebrook and Charles
              Metcalf White in 1937, this equation revolutionized the field of hydraulic engineering.
            </p>
            <p>
              While numerical solutions and approximations have been developed to simplify calculation,
              the Colebrook-White equation <strong>cannot be solved explicitly</strong> for the friction
              factor, <em>f</em>. It requires iterative solving — a perfect use case for selectNsolve Basic™.
            </p>
          </div>

          {/* KaTeX Equation */}
          <Card className="bg-gradient-to-br from-card to-muted border-primary/20 overflow-hidden shadow-lg shadow-primary/5">
            <CardContent className="p-8 md:p-12 flex flex-col items-center gap-4">
              <p className="text-sm font-semibold text-primary uppercase tracking-widest">Colebrook-White Equation</p>
              <BlockMath formula="\frac{1}{\sqrt{f}} = -2\log_{10}\!\left(\frac{\varepsilon}{3.7D} + \frac{2.51}{Re\sqrt{f}}\right)" />
              <div className="text-sm text-muted-foreground grid grid-cols-2 sm:grid-cols-4 gap-4 text-center mt-2 w-full max-w-xl">
                <div><InlineMath formula="f" /> — Darcy friction factor</div>
                <div><InlineMath formula="\varepsilon" /> — pipe roughness (m)</div>
                <div><InlineMath formula="D" /> — pipe diameter (m)</div>
                <div><InlineMath formula="Re" /> — Reynolds number</div>
              </div>
            </CardContent>
          </Card>

          {/* Reynolds Number */}
          <Card className="border-secondary/30 bg-secondary/5">
            <CardContent className="p-8 space-y-4">
              <h3 className="text-xl font-bold font-display">Supporting Equations</h3>
              <p className="text-muted-foreground">The Reynolds number and Darcy-Weisbach head loss equation work together with Colebrook-White:</p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-secondary uppercase tracking-wide">Reynolds Number</p>
                  <BlockMath formula="Re = \frac{\rho\, v\, D}{\mu} = \frac{v\, D}{\nu}" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-secondary uppercase tracking-wide">Darcy-Weisbach Head Loss</p>
                  <BlockMath formula="h_f = f \cdot \frac{L}{D} \cdot \frac{v^2}{2g}" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Iterative Solving Diagram */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold font-display">Iterative Solving Process</h3>
            <p className="text-muted-foreground">
              Because <InlineMath formula="f" /> appears on both sides of the equation, a numerical solver
              must iterate until convergence. selectNsolve Basic™ handles this automatically:
            </p>
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <MermaidDiagram chart={iterativeFlowchart} />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Typical convergence achieved in 4–10 iterations — selectNsolve™ handles this in one click.
            </p>
          </div>

          <div className="mt-6">
            <img
              src={`${import.meta.env.BASE_URL}images/colebrook_white_example.jpg`}
              alt="Colebrook-White equation example in selectNsolve"
              className="w-full rounded-2xl border border-border shadow-md"
            />
            <p className="text-sm text-muted-foreground text-center mt-2">Colebrook-White equation solved using selectNsolve Basic™</p>
          </div>
        </section>

        <section className="space-y-6 pt-8">
          <h2 className="text-3xl font-bold font-display">Optimization</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            By modeling equations like Colebrook-White in Google Sheets™ using selectNsolve™, engineers can
            instantly evaluate how changes in pipe diameter (<InlineMath formula="D" />), roughness (<InlineMath formula="\varepsilon" />),
            or Reynolds number (<InlineMath formula="Re" />) affect the friction factor. This turns a tedious
            iterative hand-calculation into an interactive design tool.
          </p>

          {/* Parametric Design Flow */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <MermaidDiagram chart={parametricDiagram} />
          </div>

          <div className="mt-4">
            <img
              src={`${import.meta.env.BASE_URL}images/optimization.jpg`}
              alt="Optimization example"
              className="w-full rounded-2xl border border-border shadow-md"
            />
            <p className="text-sm text-muted-foreground text-center mt-2">Optimization in action with selectNsolve Basic™</p>
          </div>
        </section>
      </div>
    </PageWrapper>
  );
}
