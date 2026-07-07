import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "ch-pink.vercel.app"],
    },
  },
};

export default nextConfig;
