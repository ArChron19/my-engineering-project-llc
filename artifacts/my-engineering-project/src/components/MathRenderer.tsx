import React, { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface MathProps {
  formula: string;
  display?: boolean;
  className?: string;
}

export function Math({ formula, display = false, className = "" }: MathProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (ref.current) {
      try {
        katex.render(formula, ref.current, {
          displayMode: display,
          throwOnError: false,
          trust: true,
        });
      } catch {
        if (ref.current) ref.current.textContent = formula;
      }
    }
  }, [formula, display]);

  return <span ref={ref} className={className} />;
}

export function BlockMath({ formula, className = "" }: { formula: string; className?: string }) {
  return (
    <div className={`overflow-x-auto py-2 ${className}`}>
      <Math formula={formula} display={true} />
    </div>
  );
}

export function InlineMath({ formula, className = "" }: { formula: string; className?: string }) {
  return <Math formula={formula} display={false} className={className} />;
}
