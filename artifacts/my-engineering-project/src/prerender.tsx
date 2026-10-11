import React from "react";
import { renderToString } from "react-dom/server";
import { Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Introduction from "./pages/Introduction";
import FAQ from "./pages/FAQ";
import Manual from "./pages/Manual";
import AuraSource from "./pages/AuraSource";
import Skills from "./pages/Skills";
import PracticalEngineering from "./pages/PracticalEngineering";
import StudyGuides from "./pages/StudyGuides";
import Pricing from "./pages/Pricing";
import DeveloperAPI from "./pages/DeveloperAPI";
import Support from "./pages/Support";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

type RouteEntry = {
  Component: React.ComponentType;
  title: string;
  description: string;
  ogType?: "website" | "article";
  ogImage?: string;
  robots?: string;
};

const routeMap: Record<string, RouteEntry> = {
  "/": {
    Component: Home,
    title: "My Engineering Project | selectNsolve Basic for Google Sheets",
    description:
      "My Engineering Project builds selectNsolve Basic, a Google Sheets add-on that helps students and engineers solve equations faster. Learn the methodology and try it free.",
    ogImage: "/og-home.jpg",
  },
  "/introduction": {
    Component: Introduction,
    title: "Introduction | My Engineering Project",
    description:
      "An introduction to My Engineering Project: our mission to make practical engineering math accessible through better tools and clearer study material.",
    ogImage: "/og-introduction.jpg",
  },
  "/faq": {
    Component: FAQ,
    title: "FAQ | My Engineering Project",
    description:
      "Frequently asked questions about My Engineering Project, the selectNsolve Basic Google Sheets add-on, pricing, supported equations, and account help.",
    ogImage: "/og-faq.jpg",
  },
  "/manual": {
    Component: Manual,
    title: "User Manual",
    description: "The selectNsolve user manual for My Engineering Project.",
  },
  "/aura-source": {
    Component: AuraSource,
    title: "Aura Source",
    description: "Aura source documentation.",
    robots: "noindex, nofollow",
  },
  "/skills": {
    Component: Skills,
    title: "Skills | My Engineering Project",
    description:
      "Core engineering and math skills covered by My Engineering Project, from algebra and trigonometry through applied numerical methods.",
    ogImage: "/og-skills.jpg",
  },
  "/practical-engineering": {
    Component: PracticalEngineering,
    title: "Practical Engineering | My Engineering Project",
    description:
      "Real-world practical engineering examples and worked problems showing how selectNsolve Basic and core math skills come together on the job.",
    ogImage: "/og-practical-engineering.jpg",
  },
  "/study-guides": {
    Component: StudyGuides,
    title: "Study Guides | My Engineering Project",
    description:
      "Free and premium study guides for engineering students, covering algebra, calculus, statics, dynamics, and exam preparation strategies.",
    ogImage: "/og-study-guides.jpg",
  },
  "/pricing": {
    Component: Pricing,
    title: "Pricing | My Engineering Project",
    description:
      "Simple pricing for selectNsolve Basic and My Engineering Project study guides. Compare free and paid plans and choose what fits your workflow.",
    ogImage: "/og-pricing.jpg",
  },
  "/developer-api": {
    Component: DeveloperAPI,
    title: "Developer API | My Engineering Project",
    description:
      "Developer API documentation for integrating selectNsolve Basic equation solving into your own apps, scripts, and Google Sheets workflows.",
    ogImage: "/og-developer-api.jpg",
  },
  "/support": {
    Component: Support,
    title: "Support | My Engineering Project",
    description:
      "Get help with selectNsolve Basic and My Engineering Project. Contact support, report issues, and find answers to common installation questions.",
    ogImage: "/og-support.jpg",
  },
  "/privacy-policy": {
    Component: PrivacyPolicy,
    title: "Privacy Policy | My Engineering Project",
    description:
      "Privacy Policy for My Engineering Project LLC and the selectNsolve Basic Google Sheets add-on, including Google API Limited Use disclosure.",
  },
  "/terms-of-service": {
    Component: TermsOfService,
    title: "Terms of Service | My Engineering Project",
    description:
      "Terms of Service governing use of myengineeringproject.com and the selectNsolve Basic Google Sheets add-on.",
  },
};

function makeStaticHook(path: string) {
  return () => [path, (() => {}) as (to: string) => void] as [string, (to: string) => void];
}

export function renderRoute(routePath: string): {
  html: string;
  title: string;
  description: string;
  ogType: "website" | "article";
  ogImage?: string;
  robots: string;
} {
  const entry = routeMap[routePath];
  if (!entry) throw new Error(`Unknown prerender route: ${routePath}`);
  const { Component, title, description, ogType = "website", ogImage, robots = "index,follow" } = entry;
  const hook = makeStaticHook(routePath) as unknown as Parameters<typeof WouterRouter>[0]["hook"];
  const queryClient = new QueryClient();
  const html = renderToString(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter hook={hook}>
          <Layout>
            <Component />
          </Layout>
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>,
  );
  return { html, title, description, ogType, ogImage, robots };
}

export const routes: string[] = Object.keys(routeMap);
