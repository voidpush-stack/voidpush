"use client";

import Link from "next/link";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import { POSTS, getCategoryColor, type BlogPost } from "./posts";

export default function BlogPage() {
  const featured = POSTS[0];
  const rest = POSTS.slice(1);

  return (
    <>
      <Nav />
      <div style={{ paddingTop: "5rem", minHeight: "100vh", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ borderBottom: "1px solid var(--border)", background: "var(--bg2)", padding: "3rem 2rem 2rem" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div className="s-tag">Journal</div>
            <h1 style={{ fontFamily: "var(--display)", fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "0.75rem" }}>
              Protocol updates.<br />Anonymity essays.
            </h1>
            <p style={{ color: "var(--muted)", fontSize: "0.82rem", lineHeight: 1.8, maxWidth: 480 }}>
              Technical writing about the VoidPush protocol, anonymity research, and community updates. Written by ghosts, for ghosts.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 2rem" }}>
          {/* Featured post */}
          <Link href={`/blog/${featured.slug}`} style={{ textDecoration: "none", display: "block" }}>
            <div
              className="featured-card"
              style={{
                border: "1px solid var(--border)",
                background: "var(--bg2)",
                padding: "2.5rem",
                marginBottom: "2rem",
                position: "relative",
                overflow: "hidden",
                transition: "border-color 0.2s",
              }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,var(--ghost2),var(--ghost))" }} />
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                <CategoryBadge category={featured.category} />
                <span style={{ fontSize: "0.63rem", color: "var(--muted)" }}>{featured.date}</span>
                <span style={{ fontSize: "0.63rem", color: "var(--muted)" }}>·</span>
                <span style={{ fontSize: "0.63rem", color: "var(--muted)" }}>{featured.readMins} min read</span>
                <span style={{ fontSize: "0.63rem", padding: "0.15rem 0.5rem", background: "rgba(167,139,250,0.1)", color: "var(--ghost)", marginLeft: "auto" }}>featured</span>
              </div>
              <h2 style={{ fontFamily: "var(--display)", fontSize: "clamp(1.4rem,3vw,2rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "0.75rem", color: "var(--text)" }}>
                {featured.title}
              </h2>
              <p style={{ color: "var(--muted)", fontSize: "0.82rem", lineHeight: 1.8, maxWidth: 640 }}>
                {featured.excerpt}
              </p>
              <div style={{ marginTop: "1.5rem", fontSize: "0.72rem", color: "var(--ghost)" }}>
                Read post →
              </div>
            </div>
          </Link>

          {/* Post grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1px", background: "var(--border)", border: "1px solid var(--border)" }}>
            {rest.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>

          {/* Category filter */}
          <div style={{ marginTop: "3rem", padding: "1.5rem", border: "1px solid var(--border)", background: "var(--bg2)" }}>
            <div style={{ fontSize: "0.63rem", color: "var(--muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1rem" }}>
              Categories
            </div>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {(["protocol","anonymity","release","community"] as const).map((cat) => (
                <div key={cat} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.72rem" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: getCategoryColor(cat), display: "inline-block" }} />
                  <span style={{ color: "var(--muted)", textTransform: "capitalize" }}>{cat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />

      <style>{`
        .featured-card:hover { border-color: rgba(167,139,250,0.4) !important; }
        @media(max-width:768px){ .post-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </>
  );
}

function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} style={{ textDecoration: "none" }}>
      <div
        style={{
          padding: "2rem",
          background: "var(--bg2)",
          height: "100%",
          transition: "background 0.2s",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg3)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg2)")}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
          <CategoryBadge category={post.category} />
          <span style={{ fontSize: "0.6rem", color: "var(--muted)", marginLeft: "auto" }}>{post.readMins}m</span>
        </div>
        <h3 style={{ fontFamily: "var(--display)", fontSize: "1rem", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "0.75rem", color: "var(--text)", lineHeight: 1.3 }}>
          {post.title}
        </h3>
        <p style={{ fontSize: "0.72rem", color: "var(--muted)", lineHeight: 1.8, flex: 1 }}>
          {post.excerpt}
        </p>
        <div style={{ marginTop: "1.25rem", fontSize: "0.63rem", color: "var(--muted)" }}>
          {post.date}
        </div>
      </div>
    </Link>
  );
}

function CategoryBadge({ category }: { category: BlogPost["category"] }) {
  const color = getCategoryColor(category);
  return (
    <span style={{
      fontSize: "0.6rem",
      padding: "0.2rem 0.6rem",
      background: `${color}18`,
      color,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      border: `1px solid ${color}30`,
    }}>
      {category}
    </span>
  );
}
