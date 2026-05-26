import type { Metadata } from "next";
import Link from "next/link";
import { blogPosts } from "@/lib/blog-posts";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "VeloxDAG blog: mining guides, BlockDAG technology, fair launch tokenomics, Kaspa comparisons, and VELX news.",
};

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
        Blog
      </h1>
      <p className="mt-4 text-slate-400">
        {blogPosts.length} articles on mining, BlockDAG tech, and the fair launch revolution.
      </p>
      <ul className="mt-12 space-y-6">
        {blogPosts.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="block rounded-xl border border-slate-800 bg-slate-900/40 p-6 transition hover:border-cyan-500/40"
            >
              <time className="text-xs text-cyan-500">{post.date}</time>
              <h2 className="mt-2 text-xl font-semibold text-white hover:text-cyan-300">
                {post.title}
              </h2>
              <p className="mt-2 text-slate-400">{post.excerpt}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {post.tags.map((t) => (
                  <span key={t} className="text-xs text-violet-400">#{t}</span>
                ))}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
