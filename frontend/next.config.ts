import type { NextConfig } from "next";

const apiProxyTarget = process.env.API_PROXY_TARGET ?? "http://localhost:8100";

const nextConfig: NextConfig = {
  // standalone uniquement pour Docker ; Netlify/Vercel utilisent leur propre runtime
  ...(process.env.DOCKER_BUILD === "true" ? { output: "standalone" as const } : {}),
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiProxyTarget}/api/v1/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "randomuser.me" },
    ],
  },
};

export default nextConfig;
