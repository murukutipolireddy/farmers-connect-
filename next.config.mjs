import { imageHosts } from './image-hosts.config.mjs';

const isExport = process.env.CAPACITOR_EXPORT === 'true' || process.env.GITHUB_PAGES === 'true';
const isGitHubPages = process.env.GITHUB_PAGES === 'true';
const basePath = isGitHubPages ? '/farmers-connect-' : (process.env.BASE_PATH || '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(basePath ? { basePath, assetPrefix: `${basePath}/` } : {}),
  ...(isExport ? { output: 'export', trailingSlash: true } : {}),
  
  // Performance & Optimization Flags
  compress: true,
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  distDir: process.env.DIST_DIR || '.next',
  serverExternalPackages: ['better-sqlite3'],
  
  // Package import optimization for rapid tree-shaking and smaller JS bundles
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@heroicons/react',
      'recharts',
      'framer-motion',
      'sonner',
    ],
  },

  // Cache headers for fast client delivery in server mode
  ...(!isExport ? {
    async headers() {
      return [
        {
          source: '/:all*(svg|jpg|png|webp|avif|woff2|woff)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable',
            },
          ],
        },
        {
          source: '/_next/static/:path*',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable',
            },
          ],
        },
      ];
    },
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