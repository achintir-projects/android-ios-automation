/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ["localhost"],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://api-gateway:80/api/:path*",
      },
    ];
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:80",
  },
};

module.exports = nextConfig;
