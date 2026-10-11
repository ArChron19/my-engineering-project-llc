import React from "react";
import { Link } from "wouter";
import { PageWrapper } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { InlineMath } from "@/components/MathRenderer";
import { Target, BookOpen, Calculator, Check } from "lucide-react";

export default function Home() {
  return (
    <PageWrapper className="p-0 sm:p-0 md:p-0 max-w-none">
      {/* Hero Image Banner */}
      <section className="relative w-full">
        <img
          src={`${import.meta.env.BASE_URL}images/home-hero.jpeg`}
          alt="A teacher and a student working through engineering problems"
          className="w-full h-64 md:h-96 lg:h-[28rem] object-cover"
        />
      </section>

      {/* Hero Text Section */}
      <section className="relative w-full py-16 md:py-24 px-6 flex flex-col items-center justify-center text-center overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4 border border-primary/20">
            <Check size={13} className="text-primary" />
            Free Forever — Available Now
          </div>
          <h1 className="text-5xl md:text-7xl font-bold font-display text-foreground leading-tight">
            Math Made <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Simple</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            selectNsolve Basic™ empowers students and teachers to solve equations together in real-time using Google Sheets™ — no programming knowledge required.
          </p>
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <Link href="/introduction">Get Started Free</Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto bg-background/50 backdrop-blur-sm" asChild>
              <Link href="/pricing">View Plans</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Organize, Strategize, Minimize Section */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold font-display">Organize, Strategize and Minimize</h2>
            <p className="text-lg text-muted-foreground">
              The selectNsolve Basic™ add-on is not a substitute for pen and paper practice. Test takers must be able to quickly read a problem, draw a schematic, produce key equations and follow through to generate a solution.
            </p>
            <p className="text-lg text-muted-foreground">
              Add to this limited space with which to show work and one can quickly see that how to take a test is almost as important as knowing what will be on a test.
            </p>
            <p className="text-lg text-muted-foreground font-medium text-foreground">
              As is the case of most office tools, Google Sheets™ has many untapped resources. With no understanding of spreadsheets, anyone can begin solving equations.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <img
              src={`${import.meta.env.BASE_URL}images/businesswoman_laptop.jpeg`}
              alt="Businesswoman at laptop"
              className="rounded-2xl object-cover w-full h-48 shadow-md"
            />
            <img
              src={`${import.meta.env.BASE_URL}images/male_student_exam.jpg`}
              alt="Student taking exam"
              className="rounded-2xl object-cover w-full h-48 shadow-md mt-8"
            />
            <img
              src={`${import.meta.env.BASE_URL}images/college_students_learning.jpeg`}
              alt="College students learning together"
              className="rounded-2xl object-cover w-full h-48 shadow-md col-span-2"
            />
          </div>
        </div>
      </section>

      {/* The Engineering Approach */}
      <section className="py-20 px-6 bg-primary text-primary-foreground">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold font-display">The Engineering Approach to Test-Taking</h2>
            <p className="text-primary-foreground/80 text-lg">
              Both engineering work and exam success share a common goal: reaching the answer efficiently. Here's a professional secret:
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Strategic Accuracy", desc: "Professional engineers typically work within 3 significant digits.", icon: Target },
              { title: "Test Efficiency", desc: "For multiple-choice exams, 1-2 significant digits is often sufficient to identify the correct answer.", icon: Calculator },
              { title: "Speed Beats Precision", desc: "Getting to a reliable estimate quickly beats calculating exact values slowly.", icon: BookOpen }
            ].map((feature, i) => (
              <div key={i} className="bg-primary-foreground/10 border border-primary-foreground/20 rounded-2xl p-8 hover:bg-primary-foreground/15 transition-colors">
                <feature.icon size={32} className="text-secondary mb-6" />
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-primary-foreground/80 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works — SVG Process Flow */}
      <section className="py-20 px-6 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold font-display">How selectNsolve Basic™ Works</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Three simple steps turn any Google Sheet into a live equation solver — no coding, no special software.
          </p>
        </div>

        {/* SVG Process Diagram */}
        <div className="overflow-x-auto">
          <svg
            viewBox="0 0 760 200"
            className="w-full max-w-3xl mx-auto block"
            aria-label="Three-step process: Write, Select, Solve"
            role="img"
          >
            {/* Step 1 */}
            <rect x="20" y="40" width="180" height="120" rx="16" fill="#1e3a5f" />
            <text x="110" y="85" textAnchor="middle" fill="#93c5fd" fontSize="11" fontWeight="bold" letterSpacing="1">STEP 1</text>
            <text x="110" y="110" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">Write</text>
            <text x="110" y="130" textAnchor="middle" fill="#cbd5e1" fontSize="11">equations in cells</text>
            <text x="110" y="148" textAnchor="middle" fill="#93c5fd" fontSize="13" fontFamily="monospace">f(x) = 0 | 0.001</text>

            {/* Arrow 1 → 2 */}
            <path d="M200 100 L280 100" stroke="#4a7ab5" strokeWidth="2.5" markerEnd="url(#arrow)" />
            <text x="240" y="90" textAnchor="middle" fill="#6b7280" fontSize="10">select cells</text>

            {/* Step 2 */}
            <rect x="280" y="40" width="200" height="120" rx="16" fill="#14532d" />
            <text x="380" y="85" textAnchor="middle" fill="#86efac" fontSize="11" fontWeight="bold" letterSpacing="1">STEP 2</text>
            <text x="380" y="110" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">Define</text>
            <text x="380" y="130" textAnchor="middle" fill="#bbf7d0" fontSize="11">constants &amp; variables</text>
            <text x="380" y="148" textAnchor="middle" fill="#86efac" fontSize="12" fontFamily="monospace">g = 9.81 m/s²</text>

            {/* Arrow 2 → 3 */}
            <path d="M480 100 L560 100" stroke="#4a7ab5" strokeWidth="2.5" markerEnd="url(#arrow)" />
            <text x="520" y="90" textAnchor="middle" fill="#6b7280" fontSize="10">run add-on</text>

            {/* Step 3 */}
            <rect x="560" y="40" width="180" height="120" rx="16" fill="#7c3aed" />
            <text x="650" y="85" textAnchor="middle" fill="#c4b5fd" fontSize="11" fontWeight="bold" letterSpacing="1">STEP 3</text>
            <text x="650" y="110" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">Solve</text>
            <text x="650" y="130" textAnchor="middle" fill="#ddd6fe" fontSize="11">result in your sheet</text>
            <text x="650" y="148" textAnchor="middle" fill="#c4b5fd" fontSize="13" fontFamily="monospace">x = 3.14</text>

            {/* Arrowhead marker */}
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#4a7ab5" />
              </marker>
            </defs>
          </svg>
        </div>

        {/* Inline math showcase */}
        <div className="grid sm:grid-cols-3 gap-6 text-center">
          {[
            { label: "Quadratic roots", formula: "x^2 - 4x + 3 = 0" },
            { label: "Energy balance", formula: "\\tfrac{1}{2}mv^2 = mgh" },
            { label: "Colebrook-White", formula: "\\frac{1}{\\sqrt{f}} = -2\\log_{10}(\\cdots)" },
          ].map(({ label, formula }) => (
            <div key={label} className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest">{label}</p>
              <InlineMath formula={formula} className="text-lg" />
            </div>
          ))}
        </div>
      </section>

      {/* Product Lineup */}
      <section className="py-20 px-6 bg-muted/40">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold font-display">The selectNsolve Suite</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free with Basic. Grow into AI-managed multi-variable solving and institution-wide collaboration.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "selectNsolve Basic™",
                status: "Available Now",
                statusColor: "bg-green-100 text-green-700 border-green-200",
                price: "Free",
                desc: "Single-variable equation solving in Google Sheets™. Unicode variable names, user-defined bounds, standard math operators. No credit card required.",
                border: "border-primary",
                cta: "Install Free",
                href: "/introduction",
                ctaStyle: "bg-primary text-primary-foreground hover:bg-primary/90",
              },
              {
                name: "selectNsolve Pro™",
                status: "Coming Soon",
                statusColor: "bg-amber-100 text-amber-700 border-amber-200",
                price: "$7.99/mo",
                desc: "AI-managed multi-variable solver. Solve systems of up to 30 variables. AI tracks domain bounds and precision per variable automatically.",
                border: "border-border",
                cta: "Notify Me",
                href: "/support",
                ctaStyle: "border border-border bg-background hover:bg-muted text-foreground",
              },
              {
                name: "selectNsolve Classroom™",
                status: "Coming Soon",
                statusColor: "bg-amber-100 text-amber-700 border-amber-200",
                price: "$179/yr",
                desc: "For instructors and institutions. Everything in Pro plus up to 35 student seats, shared equation libraries, and an instructor dashboard.",
                border: "border-border",
                cta: "Notify Me",
                href: "/support",
                ctaStyle: "border border-border bg-background hover:bg-muted text-foreground",
              },
            ].map(({ name, status, statusColor, price, desc, border, cta, href, ctaStyle }) => (
              <div key={name} className={`bg-card rounded-2xl border-2 ${border} p-6 flex flex-col gap-4 shadow-sm`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-lg leading-tight">{name}</p>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${statusColor}`}>{status}</span>
                </div>
                <p className="text-2xl font-bold font-display text-primary">{price}</p>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{desc}</p>
                <Link href={href}>
                  <button className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${ctaStyle}`}>
                    {cta}
                  </button>
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/pricing">
              <span className="text-primary font-semibold text-sm underline underline-offset-4 hover:text-primary/80 cursor-pointer">
                Compare all plans in detail →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Learn Creatively */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <img
            src={`${import.meta.env.BASE_URL}images/computer_classroom.jpg`}
            alt="Computer classroom learning"
            className="rounded-3xl object-cover w-full h-72 shadow-xl order-2 md:order-1"
          />
          <div className="space-y-6 order-1 md:order-2">
            <h2 className="text-3xl md:text-5xl font-bold font-display">Learn Creatively</h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Today's students have instant access to AI-powered homework help for every subject, including mathematics and sciences. While these tools provide answers, they don't always build understanding.
            </p>
            <p className="text-lg text-foreground font-medium">
              Instead of passive answer-retrieval, students engage actively with mathematics through hands-on problem-solving, collaborative learning, and visual demonstrations.
            </p>
            <Button size="lg" asChild>
              <Link href="/skills">Explore Creative Learning</Link>
            </Button>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}
