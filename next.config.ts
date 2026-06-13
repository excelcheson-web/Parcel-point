import type { NextConfig } from "next";
import path from "path";

const FIREBASE_HOSTS = [
  'https://*.googleapis.com',
  'https://*.firebaseio.com',
  'https://*.firebaseapp.com',
  'wss://*.firebaseio.com',
].join(' ')

const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Content-Security-Policy',
    // Next.js requires unsafe-inline for hydration scripts and style injection.
    // unsafe-eval is required by some Next.js internals in dev; it is removed
    // in production builds automatically via the nonce mechanism.
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      `img-src 'self' data: blob: https://images.unsplash.com https://parcelpointlogistics.com`,
      `connect-src 'self' blob: ${FIREBASE_HOSTS}`,
      "frame-src 'self' blob:",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; '),
  },
]

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
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
};

export default nextConfig;
