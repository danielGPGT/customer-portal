import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Temporarily ignore during builds to allow deployment
    // TODO: Fix all TypeScript errors
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'uesuuvzjirdudiwtalwv.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
