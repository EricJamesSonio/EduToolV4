"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";

export interface HelpTopic {
  title: string;
  content: string;
}

interface HelpCenterProps {
  title?: string;
  description: string;
  topics: HelpTopic[];
}

export function HelpCenter({
  title = "Help Center",
  description,
  topics,
}: HelpCenterProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="container mx-auto max-w-3xl py-6">
      <PageHeader title={title} description={description} />

      <div className="divide-y divide-border rounded-xl border border-border bg-card text-card-foreground shadow-sm">
        {topics.map((topic, i) => (
          <details
            key={i}
            className="group"
            open={openIndex === i}
            onToggle={(e) =>
              setOpenIndex((e.target as HTMLDetailsElement).open ? i : null)
            }
          >
            <summary className="flex cursor-pointer items-center gap-3 px-5 py-4 text-sm font-medium text-foreground transition-colors hover:text-primary list-none [&::-webkit-details-marker]:hidden">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground transition-colors group-open:bg-primary group-open:text-primary-foreground">
                ?
              </span>
              <span>{topic.title}</span>
              <svg
                className="ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </summary>
            <div className="pb-6 pl-14 pr-5">
              <div className="prose prose-sm prose-gray max-w-none text-muted-foreground">
                <RenderContent text={topic.content} />
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

function RenderContent({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return (
            <h3 key={i} className="pt-2 text-sm font-semibold text-foreground">
              {line.slice(3)}
            </h3>
          );
        }
        if (line.startsWith("---")) {
          return <hr key={i} className="my-3 border-border" />;
        }
        if (line.startsWith("- **")) {
          const match = line.match(/- \*\*(.+?)\*\*(.*)/);
          if (match) {
            return (
              <p key={i} className="text-sm leading-relaxed">
                <span className="font-medium text-foreground">{match[1]}</span>
                {match[2]}
              </p>
            );
          }
        }
        if (line.startsWith("- ")) {
          return (
            <p key={i} className="text-sm leading-relaxed">
              <span className="mr-1.5 text-muted-foreground">•</span>
              {line.slice(2)}
            </p>
          );
        }
        if (/^\d+\.\s/.test(line)) {
          return (
            <p key={i} className="text-sm leading-relaxed">
              {line}
            </p>
          );
        }
        if (line.trim() === "") {
          return <div key={i} className="h-1" />;
        }
        return (
          <p key={i} className="text-sm leading-relaxed">
            {line}
          </p>
        );
      })}
    </div>
  );
}