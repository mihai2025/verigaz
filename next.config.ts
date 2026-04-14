import type { NextConfig } from "next"
import { DOMAIN } from "@/lib/config/domain"

const nextConfig: NextConfig = {
  images: {
    deviceSizes: [640, 750, 828, 1080],
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: DOMAIN.cdnDomain,
        pathname: "/**",
      },
      // bucket R2 partajat cu ghidulfunerar (pentru media.ghidulfunerar.ro)
      {
        protocol: "https",
        hostname: "media.ghidulfunerar.ro",
        pathname: "/verigaz/**",
      },
    ],
  },
  async redirects() {
    return []
  },
}

export default nextConfig
