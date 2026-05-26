import type { Metadata } from "next";
import Link from "next/link";
import fs from "fs";
import path from "path";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Litepaper — VeloxDAG Technical Overview",
  description:
    "VeloxDAG (VELX) litepaper: BlockDAG architecture, fair launch tokenomics, PoW security, mining, and roadmap. 20+ page technical document.",
};

function getLitepaperContent(): string {
  try {
    const p = path.join(process.cwd(), "..", "docs", "litepaper", "VELOXDAG-LITEPAPER.md");
    return fs.readFileSync(p, "utf-8");
  } catch {
    return "# VeloxDAG Litepaper\n\nDownload the full document from the repository docs/litepaper/ folder.";
  }
}

function renderMarkdown(md: string) {
  const lines = md.split("\n");
  const elements: ReactNode[] = [];
  let key = 0;
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length) {
      elements.push(
        <ul key={key++} className="list-disc pl-6 mb-4 text-slate-300 space-y-1">
          {listItems.map((li, i) => (
            <li key={i}>{li}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  for (const line of lines) {
    if (line.startsWith("# ")) {
      flushList();
      elements.push(
        <h1 key={key++} className="text-4xl font-bold mt-12 mb-6 bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
          {line.slice(2)}
        </h1>
      );
    } else if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={key++} className="text-2xl font-bold mt-10 mb-4 text-cyan-300 border-b border-cyan-500/20 pb-2">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={key++} className="text-xl font-semibold mt-6 mb-3 text-violet-300">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith("- ")) {
      listItems.push(line.slice(2));
    } else if (line.startsWith("|")) {
      flushList();
      elements.push(
        <pre key={key++} className="overflow-x-auto text-sm text-cyan-200 mb-4">
          {line}
        </pre>
      );
    } else if (line.trim() === "") {
      flushList();
    } else if (line.startsWith("---")) {
      flushList();
      elements.push(<hr key={key++} className="my-8 border-slate-800" />);
    } else {
      flushList();
      elements.push(
        <p key={key++} className="mb-4 text-slate-300 leading-relaxed">
          {line}
        </p>
      );
    }
  }
  flushList();
  return elements;
}

export default function LitepaperPage() {
  const content = getLitepaperContent();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">VeloxDAG Litepaper</h1>
          <p className="mt-2 text-slate-400">Full technical document · 22 sections · Fair Launch PoW BlockDAG</p>
        </div>
        <a
          href="/VELOXDAG-LITEPAPER.md"
          download
          className="rounded-lg border border-cyan-500/40 px-4 py-2 text-sm text-cyan-300 hover:bg-cyan-500/10"
        >
          Download .md
        </a>
      </div>
      <article className="prose-velox">{renderMarkdown(content)}</article>
      <div className="mt-12 rounded-xl border border-cyan-500/20 bg-slate-900/50 p-6 text-center">
        <p className="text-slate-400">Ready to mine?</p>
        <Link href="/tutorial" className="mt-4 inline-block text-cyan-400 hover:underline">
          Start mining VELX →
        </Link>
      </div>
    </div>
  );
}
