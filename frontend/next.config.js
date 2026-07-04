/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  poweredByHeader: false,
  images: { remotePatterns: [{ protocol: "https", hostname: "health.elmahrosa.org" }], unoptimized: true },
  async rewrites() {
    return [
      { source: "/", destination: "/landing.html" },
    ];
  },
};

module.exports = nextConfig;
