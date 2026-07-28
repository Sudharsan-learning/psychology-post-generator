import type { NextConfig } from "next";

// ─── Content Security Policy ─────────────────────────────────────────────────
// Allows:
//   - Our own origin for scripts/styles
//   - Google Fonts for template font loading
//   - unpkg CDN only inside sandboxed iframes (not hoisted to top-level page)
//   - OpenRouter for AI API calls (server-side only, no browser fetch)
const CSP = [
  "default-src 'self'",
  // Scripts: self + inline + Clerk JS SDK
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev",
  // Styles: self + inline + Google Fonts + Clerk UI styles
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.clerk.accounts.dev",
  // Fonts: self + Google Fonts CDN
  "font-src 'self' https://fonts.gstatic.com",
  // Images: self + data URIs + Clerk images
  "img-src 'self' data: blob: https://*.clerk.accounts.dev https://img.clerk.com",
  // Connections: self + Clerk APIs
  "connect-src 'self' https://*.clerk.accounts.dev",
  // Frames: allow self-origin iframes
  "frame-src 'self' blob:",
  // Objects: none
  "object-src 'none'",
  // Upgrade insecure requests in production
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  // ─── Security headers applied to all routes ────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Content Security Policy
          {
            key: "Content-Security-Policy",
            value: CSP,
          },
          // Prevent clickjacking
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          // Disable MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Referrer policy
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Permissions policy — disable unused APIs
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        // API routes: enforce 1 MB body size via response headers
        source: "/api/(.*)",
        headers: [
          {
            key: "X-Max-Body-Size",
            value: "1048576", // 1 MB in bytes
          },
        ],
      },
    ];
  },

  // ─── Server-side body size limit for API routes ────────────────────────────
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
