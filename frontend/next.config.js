/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: { remotePatterns: [{ protocol: "https", hostname: "health.elmahrosa.org" }], unoptimized: true },
};

module.exports = nextConfig;
