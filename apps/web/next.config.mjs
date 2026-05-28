/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@voidpush/ui", "@voidpush/types", "@voidpush/crypto"],
  async rewrites() {
    return [
      {
        source: "/api/relay/:path*",
        destination: `${process.env.RELAY_API_URL || "http://localhost:8000"}/:path*`,
      },
      {
        source: "/api/score/:path*",
        destination: `${process.env.SCORE_ENGINE_URL || "http://localhost:8001"}/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
