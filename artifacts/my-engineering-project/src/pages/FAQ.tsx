import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { PageWrapper } from "@/components/Layout";

const faqs = [
  {
    q: "What is the primary function of the selectNsolve Basic™ Add-on?",
    a: "It empowers students and teachers to solve single-variable equations collaboratively in real-time within Google Sheets™, without requiring programming knowledge."
  },
  {
    q: "What platform is required to use selectNsolve™?",
    a: "All selectNsolve™ products are built as add-ons for Google Sheets™. Basic is available now; Basic Plus, Pro and Classroom are coming soon."
  },
  {
    q: "How does this approach transform traditional homework?",
    a: "Instead of passive answer-retrieval like with AI tools, students engage actively with mathematics through hands-on problem-solving in a familiar environment and collaborative learning."
  },
  {
    q: "Why does My Engineering Project LLC state that finding an exact solution is often unnecessary?",
    a: "Professional engineers typically work within 3 significant digits. For multiple-choice exams, 1-2 significant digits is often sufficient to identify the correct answer, emphasizing speed and intuition over slow precision."
  },
  {
    q: "What is the focus of the Practical Engineering section of the website?",
    a: "It focuses on applying engineering principles to real-world math, such as the Colebrook-White equation for fluid dynamics, teaching strategic problem solving over purely academic calculation."
  },
  {
    q: "What resource is provided to help students prepare for exams?",
    a: "We offer comprehensive Study Guides, Quick References, and tools that teach the 'Engineering Approach to Test-Taking', minimizing cognitive load."
  },
  {
    q: "Beyond formulas, how does the 'Learn Creatively' section approach problem-solving?",
    a: "It emphasizes leveraging the full power of Unicode within Google Sheets™ to enable global collaboration, preserve international data integrity, and build advanced multilingual documentation."
  },
  {
    q: "What can selectNsolve Pro™ do that Basic cannot?",
    a: "Pro is designed for AI-managed multi-variable workflows. Where Basic solves one variable at a time, Pro handles systems of up to 30 variables simultaneously. An AI agent manages the domain bounds and precision per variable automatically — no manual intervention required."
  },
  {
    q: "Who is selectNsolve Classroom™ designed for?",
    a: "Classroom is built for instructors and institutions. It includes everything in Pro plus up to 35 student seats, shared equation libraries, an instructor dashboard, a dedicated onboarding call, and discounts for non-profits and schools."
  },
  {
    q: "How do I get notified when Pro or Classroom launches?",
    a: "Use the Support page to register your interest. We'll notify you as soon as either tier becomes available."
  }
];

function AccordionItem({ q, a, isOpen, onClick }: { q: string; a: string; isOpen: boolean; onClick: () => void }) {
  return (
    <div className="border border-border/60 rounded-2xl bg-card overflow-hidden transition-all hover:border-primary/30">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
      >
        <span className="font-bold text-lg pr-8">{q}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="text-primary" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-6 pb-6 pt-0 text-muted-foreground leading-relaxed">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto space-y-10">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl md:text-6xl font-bold font-display text-primary">Frequently Asked Questions</h1>
          <p className="text-xl text-muted-foreground">Everything you need to know about selectNsolve™</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <AccordionItem
              key={idx}
              q={faq.q}
              a={faq.a}
              isOpen={openIndex === idx}
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
            />
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}
