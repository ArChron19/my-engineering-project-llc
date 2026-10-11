import { useEffect, useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
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
import Subscribe from "./pages/Subscribe";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/introduction" component={Introduction} />
        <Route path="/faq" component={FAQ} />
        <Route path="/manual" component={Manual} />
        <Route path="/aura-source" component={AuraSource} />
        <Route path="/skills" component={Skills} />
        <Route path="/practical-engineering" component={PracticalEngineering} />
        <Route path="/study-guides" component={StudyGuides} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/developer-api" component={DeveloperAPI} />
        <Route path="/support" component={Support} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/terms-of-service" component={TermsOfService} />
        <Route path="/subscribe" component={Subscribe} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function ClientOnlyToaster() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <Toaster />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <ClientOnlyToaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
