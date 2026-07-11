/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Ensure @napi-rs/canvas (native canvas polyfill for pdfjs-dist) is not bundled
  // but available as an external dependency in serverless environments (Vercel)
  // Also externalize pdfjs-dist to prevent Turbopack from breaking its dynamic requires
  serverExternalPackages: ["@napi-rs/canvas", "pdfjs-dist"],
  async headers() {
    return [
      {
        // Allow mobile app to call API routes from any origin
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PATCH,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
          // Security headers
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ]
  },
}

export default nextConfig
