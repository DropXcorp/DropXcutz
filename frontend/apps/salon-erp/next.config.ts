import type { NextConfig } from "next";

// Keep browser requests on the ERP origin. This avoids third-party cookie and
// CORS failures when the ERP and API are deployed on different hosts.
const backendApiUrl = (
  process.env.SALON_BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5000/api"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendApiUrl}/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${backendApiUrl.replace(/\/api$/, "")}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
