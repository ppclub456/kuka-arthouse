import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /* Avoid dev server fetching remote URLs (can hang behind firewall / slow DNS). */
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
