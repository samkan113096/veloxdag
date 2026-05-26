import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export function Footer() {
  return (
    <footer className="border-t border-cyan-500/20 bg-[#04060c] mt-20">
      <div className="mx-auto max-w-6xl px-4 py-12 grid gap-8 md:grid-cols-4">
        <div>
          <p className="font-bold text-lg bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
            {siteConfig.name}
          </p>
          <p className="mt-2 text-sm text-slate-400">{siteConfig.tagline}</p>
        </div>
        <div>
          <p className="font-semibold text-slate-200 mb-3">Explore</p>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><Link href="/about" className="hover:text-cyan-400">About</Link></li>
            <li><Link href="/tutorial" className="hover:text-cyan-400">Mining Tutorial</Link></li>
            <li><Link href="/blog" className="hover:text-cyan-400">Blog</Link></li>
            <li><Link href="/litepaper" className="hover:text-cyan-400">Litepaper</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-200 mb-3">Community</p>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><a href={siteConfig.telegram} className="hover:text-cyan-400">Telegram</a></li>
            <li><a href={siteConfig.twitter} className="hover:text-cyan-400">Twitter / X</a></li>
            <li><a href={siteConfig.github} className="hover:text-cyan-400">GitHub</a></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-200 mb-3">Legal</p>
          <p className="text-xs text-slate-500">
            Cryptocurrency mining involves risk. Not financial advice. Do your own research.
          </p>
        </div>
      </div>
      <div className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} VeloxDAG · Fair Launch PoW BlockDAG · Open Source
      </div>
    </footer>
  );
}
