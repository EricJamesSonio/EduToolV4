"use client";

import { Fragment, useMemo, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Block =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; lines: string[] }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

interface ListState {
  type: "ul" | "ol" | null;
  items: string[];
}

const BULLET_RE = /^\s*[-*•●▪◦–]\s+(.+)$/;
const ORDERED_RE = /^\s*\d+[.)]\s+(.+)$/;
const MD_HEADING_RE = /^\s*(#{1,6})\s+(.+?)\s*#*\s*$/;
const BOLD_ONLY_RE = /^\*\*([^*\n]+)\*\*$/;

function cleanText(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/[\u00a0\u2007\u202f]/g, " ")
    .replace(/[\u200b\u200c\u200d\ufeff]/g, "")
    .replace(/\t/g, "    ")
    .replace(/[ ]+$/gm, "");
}

function headingText(line: string, prevBlank: boolean): string | null {
  const text = line.trim();
  if (!prevBlank || text.length === 0 || text.length > 80) return null;

  const bold = text.match(BOLD_ONLY_RE);
  if (bold) return bold[1].trim();

  if (text.endsWith(":")) return text.replace(/:\s*$/, "");

  const letters = text.replace(/[^A-Za-z]/g, "");
  const isAllCaps = letters.length >= 3 && text === text.toUpperCase();
  if (isAllCaps && !/[.!?]$/.test(text)) return text;

  return null;
}

function parseBlocks(raw: string): Block[] {
  const lines = cleanText(raw).split("\n");
  const blocks: Block[] = [];
  const paragraph: string[] = [];
  const cur: ListState = { type: null, items: [] };
  let prevBlank = true;

  function flushParagraph(): void {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", lines: paragraph.splice(0, paragraph.length) });
    }
  }

  function flushList(): void {
    if (cur.type && cur.items.length > 0) {
      blocks.push({ type: cur.type, items: cur.items.splice(0, cur.items.length) });
    }
    cur.type = null;
    cur.items.length = 0;
  }

  function flushAll(): void {
    flushParagraph();
    flushList();
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim() === "") {
      flushAll();
      prevBlank = true;
      continue;
    }

    const md = line.match(MD_HEADING_RE);
    if (md) {
      flushAll();
      blocks.push({
        type: "heading",
        level: md[1].length <= 2 ? 2 : 3,
        text: md[2].trim(),
      });
      prevBlank = false;
      continue;
    }

    const bullet = line.match(BULLET_RE);
    if (bullet) {
      flushParagraph();
      if (cur.type !== "ul") {
        flushList();
        cur.type = "ul";
      }
      cur.items.push(bullet[1].trim());
      prevBlank = false;
      continue;
    }

    const ordered = line.match(ORDERED_RE);
    if (ordered) {
      flushParagraph();
      if (cur.type !== "ol") {
        flushList();
        cur.type = "ol";
      }
      cur.items.push(ordered[1].trim());
      prevBlank = false;
      continue;
    }

    if (cur.type && cur.items.length > 0 && /^\s+\S/.test(line)) {
      cur.items[cur.items.length - 1] += " " + line.trim();
      prevBlank = false;
      continue;
    }

    const heading = paragraph.length === 0 ? headingText(line, prevBlank) : null;
    if (heading) {
      flushAll();
      blocks.push({ type: "heading", level: 3, text: heading });
      prevBlank = false;
      continue;
    }

    flushList();
    paragraph.push(line.trim());
    prevBlank = false;
  }

  flushAll();
  return blocks;
}

function renderInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*\n]+\*\*)/g);
  return parts.map((part, i) =>
    part.length > 4 && part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

interface LessonContentProps {
  content: string | null | undefined;
  className?: string;
}

export function LessonContent({ content, className }: LessonContentProps): React.JSX.Element {
  const blocks = useMemo(() => parseBlocks(content ?? ""), [content]);

  if (blocks.length === 0) {
    return <p className="text-sm text-muted-foreground">No content available.</p>;
  }

  return (
    <div className={cn("space-y-4 text-sm leading-7 text-foreground break-words", className)}>
      {blocks.map((block, i) => {
        if (block.type === "heading") {
          return block.level === 2 ? (
            <h3 key={i} className="mt-2 text-lg font-semibold leading-snug first:mt-0">
              {renderInline(block.text)}
            </h3>
          ) : (
            <h4 key={i} className="mt-1 text-base font-semibold leading-snug first:mt-0">
              {renderInline(block.text)}
            </h4>
          );
        }

        if (block.type === "ul") {
          return (
            <ul key={i} className="list-disc space-y-1.5 pl-6">
              {block.items.map((item, j) => (
                <li key={j}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        }

        if (block.type === "ol") {
          return (
            <ol key={i} className="list-decimal space-y-1.5 pl-6">
              {block.items.map((item, j) => (
                <li key={j}>{renderInline(item)}</li>
              ))}
            </ol>
          );
        }

        return (
          <p key={i}>
            {block.lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {renderInline(l)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}