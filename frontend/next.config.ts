import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone uniquement pour Docker ; Netlify/Vercel utilisent leur propre runtime
  ...(process.env.DOCKER_BUILD === "true" ? { output: "standalone" as const } : {}),
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "randomuser.me" },
    ],
  },
};

export default nextConfig;
