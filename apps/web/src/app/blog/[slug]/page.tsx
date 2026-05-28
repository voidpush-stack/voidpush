"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import { getPost, getCategoryColor, POSTS } from "../posts";

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug);
  if (!post) notFound();

  const color = getCategoryColor(post.category);
  const idx = POSTS.findIndex((p) => p.slug === params.slug);
  const prev = POSTS[idx + 1];
  const next = POSTS[idx - 1];

  // Parse content into paragraphs/headers
  const sections = post.content.split(/\n\n+/);

  return (
    <>
      <Nav />
      <div style={{ paddingTop: "5rem", minHeight: "100vh", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ borderBottom: "1px solid var(--border)", background: "var(--bg2)", padding: "3rem 2rem 2.5rem", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <Link href="/blog" style={{ fontSize: "0.7rem", color: "var(--muted)", textDecoration: "none", letterSpacing: "0.08em" }}>
                ← journal
              </Link>
              <span style={{ fontSize: "0.63rem", color: "var(--muted)", opacity: 0.4 }}>/</span>
              <span style={{
                fontSize: "0.6rem", padding: "0.2rem 0.6rem",
                background: `${color}18`, color, textTransform: "uppercase",
                letterSpacing: "0.08em", border: `1px solid ${color}30`,
              }}>
                {post.category}
              </span>
            </div>

            <h1 style={{ fontFamily: "var(--display)", fontSize: "clamp(1.75rem,4vw,2.75rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "1.25rem" }}>
              {post.title}
            </h1>

            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", fontSize: "0.7rem", color: "var(--muted)" }}>
              <span>{post.date}</span>
              <span>{post.readMins} min read</span>
              <span style={{ color: "var(--ghost)", marginLeft: "auto", opacity: 0.6 }}>// authored anonymously</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "3rem 2rem" }}>
          <div style={{ fontSize: "1rem", color: "var(--muted)", lineHeight: 1.8, marginBottom: "2.5rem", fontStyle: "italic", borderLeft: `2px solid ${color}`, paddingLeft: "1.25rem" }}>
            {post.excerpt}
          </div>

          <div className="prose">
            {sections.map((section, i) => {
              if (section.startsWith("## ")) {
                return (
                  <h2 key={i} style={{ fontFamily: "var(--display)", fontSize: "1.3rem", fontWeight: 700, letterSpacing: "-0.02em", margin: "2.5rem 0 1rem", color: "var(--text)" }}>
                    {section.replace("## ", "")}
                  </h2>
                );
              }
              if (section.startsWith("### ")) {
                return (
                  <h3 key={i} style={{ fontFamily: "var(--display)", fontSize: "1rem", fontWeight: 700, margin: "2rem 0 0.75rem", color: "var(--ghost)" }}>
                    {section.replace("### ", "")}
                  </h3>
                );
              }
              // Inline code
              const parts = section.split(/(`[^`]+`)/g);
              return (
                <p key={i} style={{ fontSize: "0.88rem", color: "var(--muted)", lineHeight: 1.9, marginBottom: "1.25rem" }}>
                  {parts.map((part, j) =>
                    part.startsWith("`") && part.endsWith("`")
                      ? <code key={j} style={{ background: "var(--bg3)", color: "var(--teal)", padding: "0.1rem 0.4rem", fontSize: "0.82rem", borderRadius: 2 }}>{part.slice(1, -1)}</code>
                      : <span key={j}>{part}</span>
                  )}
                </p>
              );
            })}
          </div>

          {/* Nav between posts */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "4rem", paddingTop: "2rem", borderTop: "1px solid var(--border)" }}>
            {prev ? (
              <Link href={`/blog/${prev.slug}`} style={{ textDecoration: "none", padding: "1.25rem", border: "1px solid var(--border)", background: "var(--bg2)", transition: "border-color 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(167,139,250,.4)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}>
                <div style={{ fontSize: "0.6rem", color: "var(--muted)", marginBottom: "0.5rem", letterSpacing: "0.1em" }}>← OLDER</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text)", fontFamily: "var(--display)", fontWeight: 600 }}>{prev.title}</div>
              </Link>
            ) : <div />}
            {next ? (
              <Link href={`/blog/${next.slug}`} style={{ textDecoration: "none", padding: "1.25rem", border: "1px solid var(--border)", background: "var(--bg2)", textAlign: "right", transition: "border-color 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(167,139,250,.4)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}>
                <div style={{ fontSize: "0.6rem", color: "var(--muted)", marginBottom: "0.5rem", letterSpacing: "0.1em" }}>NEWER →</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text)", fontFamily: "var(--display)", fontWeight: 600 }}>{next.title}</div>
              </Link>
            ) : <div />}
          </div>

          <div style={{ marginTop: "2rem", textAlign: "center" }}>
            <Link href="/blog" style={{ fontSize: "0.72rem", color: "var(--muted)", textDecoration: "none" }}>
              ← Back to journal
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
