/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  poweredByHeader: false,
  images: { remotePatterns: [{ protocol: "https", hostname: "health.elmahrosa.org" }], unoptimized: true },
  async redirects() {
    return [
      { source: "/", destination: "/landing.html", permanent: true },
    ];
  },
};

module.exports = nextConfig;
