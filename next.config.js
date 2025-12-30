/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for client-side only deployment
  output: 'export',

  // GitHub Pages configuration
  // For custom domain or root deployment, set NEXT_PUBLIC_BASE_PATH to empty string
  // For repository deployment (username.github.io/repo-name), set to '/repo-name'
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',

  reactStrictMode: true,
  images: {
    unoptimized: true,
  },

  // Security headers (moved from middleware.ts for static export compatibility)
  //
  // IMPORTANT: These headers work ONLY on platforms with Next.js integration:
  // ✅ Vercel (automatically applied at edge)
  // ✅ Netlify (applies headers from Next.js config)
  // ✅ Cloudflare Pages (with Next.js support)
  //
  // ❌ For traditional hosting (nginx, Apache, S3, GitHub Pages), these headers
  //    are IGNORED. You MUST configure them at your web server/CDN level.
  //    See SELF_HOSTING.md for nginx/Apache configuration examples.
  //
  // This configuration serves as:
  // 1. Automatic security for Vercel/Netlify deployments
  // 2. Reference documentation for required headers on other platforms
  async headers() {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    // Content-Security-Policy
    const csp = [
      "default-src 'self'",
      isDevelopment
        ? "script-src 'self' 'unsafe-eval' 'unsafe-inline' https:"
        : "script-src 'self' 'unsafe-inline' https:",
      "style-src 'self' 'unsafe-inline' https:",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https:",
      "connect-src 'self' https: ws: wss:",
      "frame-src 'self' https: http:",
      "media-src 'self' https:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      ...(isDevelopment ? [] : ['upgrade-insecure-requests']),
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
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
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // HSTS header should be configured at the web server/CDN level for HTTPS
          // as Next.js static export can't check protocol at build time
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
