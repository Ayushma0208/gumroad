import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async rewrites() {
    if (process.env.NEXT_PUBLIC_USE_REMOTE_AUTH === "true") {
      return [];
    }
    return [
      {
        source: "/auth/:path*",
        destination: "/api/auth/:path*",
      },
    ];
  },
};

export default nextConfig;
