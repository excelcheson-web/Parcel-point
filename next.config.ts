import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  typescript: {
    // We run explicit type checks in CI/local scripts; this avoids platform-specific
    // typecheck subprocess spawn failures breaking production builds.
    ignoreBuildErrors: true,
  },
  experimental: {
    // Use thread workers and minimal parallelism to avoid child-process spawn
    // failures on constrained Windows environments during `next build`.
    workerThreads: true,
    cpus: 1,
    staticGenerationMaxConcurrency: 1,
    staticGenerationMinPagesPerWorker: 1,
  },
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    qualities: [75, 80],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
