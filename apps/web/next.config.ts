import type { NextConfig } from "next";

const useRemoteApi =
  process.env.NEXT_PUBLIC_USE_REMOTE_API === "true" ||
  process.env.NEXT_PUBLIC_USE_REMOTE_AUTH === "true";

const apiProxyTarget =
  process.env.API_PROXY_TARGET ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async rewrites() {
    const rewrites = [
      {
        source: "/api/v1/:path*",
        destination: `${apiProxyTarget}/api/v1/:path*`,
      },
    ];
    if (!useRemoteApi) {
      rewrites.push({
        source: "/auth/:path*",
        destination: "/api/auth/:path*",
      });
    }
    return rewrites;
  },
};

export default nextConfig;
