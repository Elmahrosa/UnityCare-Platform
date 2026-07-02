/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  poweredByHeader: false,
  images: { remotePatterns: [{ protocol: "https", hostname: "health.elmahrosa.org" }], unoptimized: true },
};

module.exports = nextConfig;
