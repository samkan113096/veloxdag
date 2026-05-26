"use client";

import Link from "next/link";
import { useState } from "react";

const nav = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/tutorial", label: "Mine" },
  { href: "/wallet", label: "Wallet" },
  { href: "/blog", label: "Blog" },
  { href: "/team", label: "Team" },
  { href: "/litepaper", label: "Litepaper" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-cyan-500/20 bg-[#06080f]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
            VeloxDAG
          </span>
          <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-xs text-cyan-300">
            VELX
          </span>
        </Link>
        <nav className="hidden gap-6 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-slate-300 transition hover:text-cyan-400"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/tutorial"
          className="hidden rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white md:inline-block"
        >
          Start Mining
        </Link>
        <button
          type="button"
          className="md:hidden text-slate-300"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          ☰
        </button>
      </div>
      {open && (
        <nav className="border-t border-cyan-500/20 px-4 py-4 md:hidden flex flex-col gap-3">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-slate-300"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
