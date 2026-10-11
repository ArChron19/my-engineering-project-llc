import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "base",
  themeVariables: {
    primaryColor: "#1e3a5f",
    primaryTextColor: "#ffffff",
    primaryBorderColor: "#1e3a5f",
    lineColor: "#4a7ab5",
    secondaryColor: "#f0f4f8",
    tertiaryColor: "#e8f0fe",
    background: "#ffffff",
    mainBkg: "#1e3a5f",
    nodeBorder: "#1e3a5f",
    clusterBkg: "#f0f4f8",
    titleColor: "#1e3a5f",
    edgeLabelBackground: "#ffffff",
    fontFamily: "Inter, sans-serif",
    fontSize: "14px",
  },
  flowchart: { curve: "basis", padding: 20 },
  sequence: { actorMargin: 80 },
});

let diagramCounter = 0;

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

export default function MermaidDiagram({ chart, className = "" }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const id = `mermaid-${++diagramCounter}`;
    mermaid
      .render(id, chart.trim())
      .then(({ svg }) => {
        setSvg(svg);
        setError("");
      })
      .catch((err) => {
        setError(err?.message || "Diagram error");
      });
  }, [chart]);

  if (error) {
    return (
      <div className="text-sm text-muted-foreground italic p-4 bg-muted rounded-xl">
        [Diagram unavailable]
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`flex justify-center items-center overflow-x-auto ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
