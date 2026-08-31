import { imageHosts } from './image-hosts.config.mjs';

const isExport = process.env.CAPACITOR_EXPORT === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(isExport ? { output: 'export', trailingSlash: true } : {}),
  productionBrowserSourceMaps: false,
  distDir: process.env.DIST_DIR || '.next',
  serverExternalPackages: ['better-sqlite3'],
  experimental: {
    optimizePackageImports: ['lucide-react', '@heroicons/react', 'recharts'],
  },
  ...(!isExport ? {
    // Proxy API calls to the standalone Express backend (works in dev mode)
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:4029/api/:path*',
        },
      ];
    },
  } : {}),
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: imageHosts,
    minimumCacheTTL: 3600,
  },
};
export default nextConfig;