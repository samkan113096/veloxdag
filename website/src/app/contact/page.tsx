import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contact VeloxDAG",
  description: "Contact the VeloxDAG team for partnerships, mining support, and media inquiries.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
        Contact
      </h1>
      <p className="mt-4 text-slate-400">
        Reach out for mining support, partnerships, media, or security disclosures.
      </p>
      <div className="mt-12 space-y-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="font-semibold text-cyan-300">General inquiries</h2>
          <a href={`mailto:${siteConfig.email}`} className="mt-2 block text-lg text-white hover:text-cyan-400">
            {siteConfig.email}
          </a>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="font-semibold text-cyan-300">Community</h2>
          <ul className="mt-2 space-y-2 text-slate-300">
            <li>Telegram: <a href={siteConfig.telegram} className="text-cyan-400">{siteConfig.telegram}</a></li>
            <li>Twitter: <a href={siteConfig.twitter} className="text-cyan-400">{siteConfig.twitter}</a></li>
            <li>GitHub: <a href={siteConfig.github} className="text-cyan-400">{siteConfig.github}</a></li>
          </ul>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="font-semibold text-cyan-300">Security</h2>
          <p className="mt-2 text-slate-400">
            Report vulnerabilities to security@veloxdag.com. Responsible disclosure appreciated.
          </p>
        </div>
      </div>
    </div>
  );
}
