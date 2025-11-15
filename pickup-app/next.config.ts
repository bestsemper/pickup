import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: 'export',  // ← ADD THIS LINE!

  /* config options here */
  images: {
    unoptimized: true,
    domains: ['maps.googleapis.com', 'maps.gstatic.com'],
  },
  // swcMinify: true,
};

export default nextConfig;
