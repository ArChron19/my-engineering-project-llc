import { useEffect, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { PageWrapper } from "@/components/Layout";

type Section = { id: string; title: string };
type MarkdownPageProps = {
  title: string;
  source: string;
  contents?: boolean;
  noIndex?: boolean;
};

export default function MarkdownPage({
  title,
  source,
  contents = false,
  noIndex = false,
}: MarkdownPageProps) {
  const [content, setContent] = useState<{
    html: string;
    sections: Section[];
  } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    const previousRobots = Array.from(
      document.querySelectorAll<HTMLMetaElement>('meta[name="robots"]'),
    );
    const previousValues = previousRobots.map((meta) => meta.content);
    let addedRobots: HTMLMetaElement | undefined;
    if (noIndex) {
      if (previousRobots.length) {
        previousRobots.forEach((meta) => {
          meta.content = "noindex, nofollow";
        });
      } else {
        addedRobots = document.createElement("meta");
        addedRobots.name = "robots";
        addedRobots.content = "noindex, nofollow";
        document.head.appendChild(addedRobots);
      }
    }
    return () => {
      document.title = previousTitle;
      previousRobots.forEach((meta, index) => {
        // A direct visit may start with the prerendered Aura noindex tag.
        // Do not carry that restriction onto another page after navigation.
        meta.content = noIndex ? "index,follow" : previousValues[index];
      });
      addedRobots?.remove();
    };
  }, [title, noIndex]);

  useEffect(() => {
    const controller = new AbortController();
    setContent(null);
    setFailed(false);
    async function load() {
      try {
        const response = await fetch(source, {
          cache: "no-cache",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Could not load Markdown");
        const markdown = (await response.text())
          .replace(/<!--[\s\S]*?(?:-->|$)/g, "")
          .replace(/^keywords:.*(?:\r?\n|$)/gm, "");
        const html = DOMPurify.sanitize(marked.parse(markdown, { async: false }));
        const container = document.createElement("div");
        container.innerHTML = html;
        const sections: Section[] = [];
        const usedIds = new Set<string>();
        container.querySelectorAll("h2").forEach((heading) => {
          const text = heading.textContent ?? "";
          const base = text.toLowerCase().trim()
            .replace(/[^\p{L}\p{N}\s-]/gu, "")
            .replace(/\s+/g, "-") || "section";
          let id = base;
          let suffix = 2;
          while (usedIds.has(id)) id = `${base}-${suffix++}`;
          usedIds.add(id);
          heading.id = id;
          sections.push({ id, title: text });
        });
        if (!controller.signal.aborted) {
          setContent({ html: container.innerHTML, sections });
        }
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      }
    }
    void load();
    return () => controller.abort();
  }, [source]);

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl md:text-5xl font-bold font-display text-primary">
          {title}
        </h1>
        {failed ? (
          <p role="alert" className="text-destructive">
            Could not load this page. Please try again later or contact{" "}
            <a href="mailto:support@myengineeringproject.com" className="underline">
              support@myengineeringproject.com
            </a>.
          </p>
        ) : !content ? (
          <p role="status" className="text-muted-foreground">Loading…</p>
        ) : (
          <>
            {contents && content.sections.length > 0 && (
              <nav aria-label="Contents" className="rounded-2xl border border-border bg-card p-6">
                <h2 className="text-xl font-bold font-display mb-3">Contents</h2>
                <ul className="space-y-2">
                  {content.sections.map((section) => (
                    <li key={section.id}>
                      <a href={`#${section.id}`} className="text-primary underline underline-offset-4">
                        {section.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
            <article
              className="space-y-4 leading-relaxed text-foreground break-words [&_h1]:text-3xl [&_h1]:font-display [&_h1]:font-bold [&_h2]:text-2xl [&_h2]:font-display [&_h2]:font-bold [&_h2]:text-primary [&_h2]:mt-8 [&_h2]:scroll-mt-24 [&_h3]:text-xl [&_h3]:font-bold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_a]:text-primary [&_a]:underline [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-muted [&_pre]:p-4 [&_code]:font-mono [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_table]:block [&_table]:overflow-x-auto [&_th]:border [&_th]:p-3 [&_td]:border [&_td]:p-3 [&_img]:max-w-full"
              dangerouslySetInnerHTML={{ __html: content.html }}
            />
          </>
        )}
      </div>
    </PageWrapper>
  );
}
