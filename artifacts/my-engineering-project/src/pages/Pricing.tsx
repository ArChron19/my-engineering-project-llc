import React from "react";
import { Link } from "wouter";
import { PageWrapper } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Zap, BookOpen, Users, Bot, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { BlockMath } from "@/components/MathRenderer";

const MARKETPLACE_URL = "https://workspace.google.com/marketplace";

const plans = [
  {
    id: "basic",
    live: true,
    name: "selectNsolve Basic™",
    tagline: "Free forever",
    icon: BookOpen,
    color: "border-primary",
    headerColor: "bg-primary text-primary-foreground",
    badgeText: "Available Now",
    badgeColor: "bg-green-500 text-white",
    price: "Free",
    priceSub: "No credit card required",
    cta: "Install Free",
    ctaVariant: "default" as const,
    ctaHref: MARKETPLACE_URL,
    external: true,
    features: [
      { label: "Single-variable equation solving", included: true },
      { label: "User-defined variable search bounds", included: true },
      { label: "Standard math operators (+, −, ×, ÷, ^, √)", included: true },
      { label: "Unicode variable names & units", included: true },
      { label: "Google Sheets™ native integration", included: true },
      { label: "Community support", included: true },
    ],
  },
  {
    id: "pro",
    live: false,
    name: "selectNsolve Pro™",
    tagline: "AI-managed multi-variable solver",
    icon: Zap,
    color: "border-border",
    headerColor: "bg-muted/60 text-foreground",
    badgeText: "Coming Soon",
    badgeColor: "bg-secondary text-secondary-foreground",
    price: "$7.99/mo",
    priceSub: "or $59/year — save 38%",
    cta: "Notify Me",
    ctaVariant: "outline" as const,
    ctaHref: "/support",
    external: false,
    features: [
      { label: "Everything in Basic", included: true },
      { label: "Solve systems of up to 30 variables", included: true },
      { label: "AI tracks domain min/max and precision per variable", included: true },
      { label: "Early access to new features", included: true },
      { label: "Student seats included", included: true },
    ],
  },
  {
    id: "classroom",
    live: false,
    name: "selectNsolve Classroom™",
    tagline: "For instructors & institutions",
    icon: Users,
    color: "border-border",
    headerColor: "bg-muted/60 text-foreground",
    badgeText: "Coming Soon",
    badgeColor: "bg-secondary text-secondary-foreground",
    price: "$179/yr",
    priceSub: "\u00A0",
    cta: "Notify Me",
    ctaVariant: "outline" as const,
    ctaHref: "/support",
    external: false,
    features: [
      { label: "Everything in Pro", included: true },
      { label: "Up to 35 student seats", included: true },
      { label: "Shared equation libraries", included: true },
      { label: "Instructor dashboard", included: true },
      { label: "Dedicated onboarding call", included: true },
      { label: "Non-profit / school discounts available", included: true },
    ],
  },
];

const faqs = [
  {
    q: "Is selectNsolve Basic™ really free forever?",
    a: "Yes. Basic will always be free. It is the foundation of our mission to make equation solving accessible to every student and educator.",
  },
  {
    q: "When will Pro and Classroom be available?",
    a: "We are actively developing both tiers. Use the Support page to register your interest and you will be among the first to know when they launch.",
  },
  {
    q: "What equations can Basic solve?",
    a: "Single-variable equations with user-specified search bounds. Works well for implicit and transcendental equations such as Colebrook-White — though convergence depends on the equation type, the bounds you provide, and the precision setting. The add-on narrows the domain dynamically and returns a result within 60 seconds.",
  },
  {
    q: "How does selectNsolve Pro™ work with AI?",
    a: "selectNsolve Pro™ is designed for AI-assisted workflows. An AI agent reads your math text range, decomposes it into individual variable/equation pairs, and creates up to 30 authenticated Google Sheets™ files — one per variable. The add-on solves each file automatically. The AI manages the domain bounds and precision per variable, handling the full system without manual intervention.",
  },
];

export default function Pricing() {
  return (
    <PageWrapper className="max-w-none px-4 sm:px-6 md:px-10">
      <div className="max-w-6xl mx-auto space-y-20">

        {/* Hero */}
        <div className="text-center space-y-6 max-w-3xl mx-auto pt-4">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-sm border border-primary/20">
            Simple, transparent pricing
          </div>
          <h1 className="text-4xl md:text-6xl font-bold font-display text-primary">
            Start Free. Grow With Us.
          </h1>
          <p className="text-xl text-muted-foreground">
            selectNsolve Basic™ is available now at no cost. Pro and Classroom tiers are in development — register your interest and we'll notify you at launch.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative flex flex-col border-2 overflow-hidden transition-shadow",
                  plan.color,
                  plan.live ? "hover:shadow-xl shadow-lg shadow-primary/10" : "opacity-75"
                )}
              >
                {plan.badgeText && (
                  <div className={cn("absolute top-4 right-4 text-xs font-bold px-3 py-1 rounded-full", plan.badgeColor)}>
                    {plan.badgeText}
                  </div>
                )}

                <CardHeader className={cn("p-8 space-y-4", plan.headerColor)}>
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    plan.live ? "bg-primary-foreground/20" : "bg-foreground/10"
                  )}>
                    <Icon size={24} className={plan.live ? "text-primary-foreground" : "text-foreground"} />
                  </div>
                  <div>
                    <CardTitle className={cn("text-xl", plan.live && "text-primary-foreground")}>{plan.name}</CardTitle>
                    <p className={cn("text-sm mt-1", plan.live ? "text-primary-foreground/80" : "text-muted-foreground")}>{plan.tagline}</p>
                  </div>
                  <div>
                    <div className={cn("text-4xl font-bold font-display", plan.live && "text-primary-foreground")}>{plan.price}</div>
                    <p className={cn("text-xs mt-1", plan.live ? "text-primary-foreground/70" : "text-muted-foreground")}>{plan.priceSub}</p>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col p-8 space-y-6">
                  <ul className="space-y-3 flex-1">
                    {plan.features.map((f) => (
                      <li key={f.label} className="flex items-start gap-3 text-sm">
                        {f.included
                          ? <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          : <X className="w-4 h-4 text-muted-foreground/30 flex-shrink-0 mt-0.5" />}
                        <span className={f.included ? "text-foreground" : "text-muted-foreground/50 line-through"}>{f.label}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.external ? (
                    <Button size="lg" variant={plan.ctaVariant} className="w-full" asChild>
                      <a href={plan.ctaHref} target="_blank" rel="noopener noreferrer">{plan.cta}</a>
                    </Button>
                  ) : (
                    <Button size="lg" variant={plan.ctaVariant} className="w-full" asChild>
                      <Link href={plan.ctaHref}>{plan.cta}</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* AI / API Section */}
        <section className="space-y-10">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100 text-violet-700 font-semibold text-sm border border-violet-200">
              <Bot size={15} /> Coming Soon
            </div>
            <h2 className="text-3xl md:text-4xl font-bold font-display">selectNsolve Pro™ — Built for AI Agents</h2>
            <p className="text-lg text-muted-foreground">
              Pro tier is designed ground-up for AI-managed workflows. An agent reads your math text, decomposes a system of equations, and orchestrates up to 30 authenticated files to solve each variable automatically — no manual intervention required.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* What Pro offers */}
            <Card className="border-violet-200 bg-violet-50/50">
              <CardContent className="p-8 space-y-6">
                <h3 className="text-xl font-bold font-display">What Pro Offers AI Agents</h3>
                <ul className="space-y-4">
                  {[
                    { icon: "⊗", label: "Systems of up to 30 variables", desc: "An agent decomposes a multi-variable problem and solves each unknown in its own authenticated file simultaneously." },
                    { icon: "⊕", label: "Implicit & transcendental equations", desc: "Suited for equations that cannot be rearranged analytically — the add-on narrows the domain dynamically. Convergence depends on the equation, bounds, and precision." },
                    { icon: "⇥", label: "AI-managed domain bounds", desc: "The agent sets and adjusts min/max bounds per variable, using wide initial domains to guard against the add-on's known out-of-bounds edge case." },
                    { icon: "σ", label: "Per-variable precision control", desc: "Precision is specified individually per equation, letting the agent balance speed and accuracy across the system." },
                  ].map(({ icon, label, desc }) => (
                    <li key={label} className="flex gap-4">
                      <span className="text-2xl text-violet-600 font-mono w-8 flex-shrink-0">{icon}</span>
                      <div>
                        <p className="font-semibold text-foreground">{label}</p>
                        <p className="text-sm text-muted-foreground">{desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Example AI use case */}
            <Card className="border-violet-200 bg-violet-50/50">
              <CardContent className="p-8 space-y-6">
                <h3 className="text-xl font-bold font-display">Example: Pipe Network Analysis</h3>
                <div className="space-y-5">
                  <p className="text-sm text-muted-foreground">
                    A system of pipe equations has 5 unknowns — friction factor, velocity, Reynolds number, head loss, and flow rate — each appearing in coupled implicit equations.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-violet-700 uppercase tracking-widest">Agent workflow</p>
                    <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                      <li>Agent reads the user's contiguous math text range</li>
                      <li>Decomposes into 5 variable/equation pairs</li>
                      <li>Creates 5 authenticated files, one per variable</li>
                      <li>Writes cloned math text with wide domain bounds into each</li>
                      <li>Add-on solves each file; agent reads back all 5 results</li>
                    </ol>
                  </div>
                  <div className="bg-background rounded-xl p-3 border border-violet-200">
                    <BlockMath formula="\frac{1}{\sqrt{f}} + 2\log_{10}\!\left(\frac{\varepsilon}{3.7D} + \frac{2.51}{Re\sqrt{f}}\right) = 0 \;\Big|\; 0.0001" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* How it could work */}
          <Card className="border-violet-200 overflow-hidden">
            <CardHeader className="bg-violet-700 text-white p-8">
              <div className="flex items-center gap-3">
                <Bot size={28} />
                <CardTitle className="text-2xl text-white">How selectNsolve Pro™ Works</CardTitle>
              </div>
              <p className="text-violet-200 mt-2">
                A Pro-authenticated AI agent orchestrates the full solve cycle — from reading your math text to returning results — without any manual steps.
              </p>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    step: "1",
                    title: "Agent reads one range",
                    desc: "The AI agent reads a single contiguous range of selectNsolve math text — constants, variable definitions, and equations — and decomposes it into individual variable/equation pairs.",
                    example: "sheets_read_range(sheetId, \"A1:B40\")",
                  },
                  {
                    step: "2",
                    title: "Agent creates authenticated files",
                    desc: "For each variable, the agent creates a separate authenticated Google Sheets™ file, clones the shared constants and the relevant equation, and sets wide domain bounds and precision.",
                    example: "sheets_apply_template(varPair, bounds, precision)",
                  },
                  {
                    step: "3",
                    title: "Add-on solves, agent reads results",
                    desc: "The add-on runs automatically in each authenticated file, narrowing the domain toward a solution. The agent reads back all results and assembles the full output.",
                    example: "f = 0.0182, Re = 4.21×10⁴, ...",
                  },
                ].map(({ step, title, desc, example }) => (
                  <div key={step} className="space-y-3">
                    <div className="w-9 h-9 rounded-full bg-violet-700 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {step}
                    </div>
                    <h4 className="font-bold text-foreground">{title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                    <code className="block text-xs bg-muted p-3 rounded-lg font-mono text-violet-700">{example}</code>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-muted-foreground text-sm max-w-xl">
                  selectNsolve Pro™ is coming soon. Register your interest and be among the first to access AI-managed multi-variable solving.
                </p>
                <Button size="lg" className="bg-violet-700 hover:bg-violet-800 text-white flex-shrink-0" asChild>
                  <Link href="/support">
                    Register Interest <ArrowRight size={16} className="ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* FAQ */}
        <section className="space-y-6 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold font-display text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-card border border-border rounded-2xl p-6 space-y-2">
                <h3 className="font-bold text-foreground">{faq.q}</h3>
                <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="bg-primary rounded-3xl p-12 text-center text-primary-foreground space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold font-display">Ready to start solving?</h2>
          <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto">
            selectNsolve Basic™ is free today. Install it in Google Sheets™ and try it on your next equation.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 border-0" asChild>
              <a href={MARKETPLACE_URL} target="_blank" rel="noopener noreferrer">Install selectNsolve Basic™</a>
            </Button>
            <Button size="lg" className="bg-primary-foreground/20 hover:bg-primary-foreground/30 border border-primary-foreground/30 text-primary-foreground" asChild>
              <Link href="/support">Contact Us</Link>
            </Button>
          </div>
        </section>

      </div>
    </PageWrapper>
  );
}
