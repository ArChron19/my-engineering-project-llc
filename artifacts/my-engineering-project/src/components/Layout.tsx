import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Home, BookOpen, HelpCircle, Lightbulb, PenTool, Book, MessageSquare, Shield, FileText, BadgeDollarSign, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/introduction", label: "Introduction", icon: BookOpen },
  { path: "/faq", label: "FAQ", icon: HelpCircle },
  { path: "/manual", label: "User Manual", icon: BookOpen },
  { path: "/skills", label: "Skills", icon: Lightbulb },
  { path: "/practical-engineering", label: "Practical Engineering", icon: PenTool },
  { path: "/study-guides", label: "Study Guides", icon: Book },
  { path: "/pricing", label: "Pricing", icon: BadgeDollarSign },
  { path: "/developer-api", label: "Developer API", icon: Code2 },
  { path: "/support", label: "Support", icon: MessageSquare },
  { path: "/privacy-policy", label: "Privacy Policy", icon: Shield },
  { path: "/terms-of-service", label: "Terms of Service", icon: FileText },
];

export function PageWrapper({ children, className }: { children: React.ReactNode; className?: string }) {
  const [location] = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={cn("w-full max-w-6xl mx-auto p-4 sm:p-6 md:p-10", className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkIsDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkIsDesktop();
    window.addEventListener("resize", checkIsDesktop);
    return () => window.removeEventListener("resize", checkIsDesktop);
  }, []);

  // Close sidebar on route change for mobile
  useEffect(() => {
    if (!isDesktop) setIsSidebarOpen(false);
  }, [location, isDesktop]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Mobile Header */}
      {!isDesktop && (
        <header className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md border-b border-border z-40 flex items-center px-4 shadow-sm">
          <button
            onClick={toggleSidebar}
            className="p-2 -ml-2 text-foreground hover:bg-muted rounded-lg transition-colors"
            aria-label="Toggle navigation"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <Link href="/" className="ml-2 flex items-center min-w-0">
            <img
              src={`${import.meta.env.BASE_URL}images/mep-llc-logo.png`}
              alt="My Engineering Project LLC"
              className="h-10 w-auto object-contain"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          </Link>
        </header>
      )}

      {/* Sidebar Overlay (Mobile) */}
      {!isDesktop && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-72 bg-card border-r border-border shadow-xl lg:shadow-none transition-transform duration-300 ease-in-out flex flex-col",
          isSidebarOpen || isDesktop ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 lg:h-24 flex items-center px-4 border-b border-border/50 shrink-0">
          <Link href="/" className="block w-full">
            <img
              src={`${import.meta.env.BASE_URL}images/mep-llc-logo.png`}
              alt="My Engineering Project LLC"
              className="h-12 lg:h-16 w-auto object-contain mx-auto"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium text-sm",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                    : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                )}
              >
                <Icon size={18} className={cn("transition-transform duration-200", isActive ? "scale-110" : "group-hover:scale-110")} />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="p-6 border-t border-border/50 text-xs text-muted-foreground shrink-0">
          &copy; 2026 My Engineering Project LLC<br/>
          All rights reserved.
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 relative overflow-y-auto min-h-screen bg-background flex flex-col",
        !isDesktop && "pt-16" // offset for mobile header
      )}>
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </main>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-card/40 mt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="text-center sm:text-left">
          <p className="font-medium text-foreground">My Engineering Project LLC</p>
          <p>
            Contact:{" "}
            <a
              href="mailto:support@myengineeringproject.com"
              className="text-primary hover:underline underline-offset-2"
            >
              support@myengineeringproject.com
            </a>
          </p>
        </div>
        <nav className="flex items-center gap-5">
          <Link
            href="/privacy-policy"
            className="hover:text-primary transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms-of-service"
            className="hover:text-primary transition-colors"
          >
            Terms of Service
          </Link>
        </nav>
      </div>
    </footer>
  );
}
