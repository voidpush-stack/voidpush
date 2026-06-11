import { MetadataRoute } from "next";

const BASE_URL = "https://voidpush.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { url: BASE_URL,                   priority: 1.0,  changeFrequency: "weekly"  as const },
    { url: `${BASE_URL}/docs`,         priority: 0.9,  changeFrequency: "weekly"  as const },
    { url: `${BASE_URL}/network`,      priority: 0.8,  changeFrequency: "daily"   as const },
    { url: `${BASE_URL}/leaderboard`,  priority: 0.8,  changeFrequency: "daily"   as const },
    { url: `${BASE_URL}/explore`,      priority: 0.8,  changeFrequency: "daily"   as const },
    { url: `${BASE_URL}/showcase`,     priority: 0.8,  changeFrequency: "daily"   as const },
    { url: `${BASE_URL}/blog`,         priority: 0.7,  changeFrequency: "weekly"  as const },
    { url: `${BASE_URL}/waitlist`,     priority: 0.7,  changeFrequency: "monthly" as const },
    { url: `${BASE_URL}/press`,        priority: 0.5,  changeFrequency: "monthly" as const },
    { url: `${BASE_URL}/org`,          priority: 0.7,  changeFrequency: "monthly" as const },
  ];

  // Blog posts
  const blogSlugs = [
    "why-anonymous-code-review-matters",
    "voidpush-protocol-v01",
    "alpha-launch",
    "federation-preview",
  ];

  const blogPages = blogSlugs.map((slug) => ({
    url: `${BASE_URL}/blog/${slug}`,
    priority: 0.6 as number,
    changeFrequency: "monthly" as const,
    lastModified: new Date(),
  }));

  return [...staticPages, ...blogPages];
}
