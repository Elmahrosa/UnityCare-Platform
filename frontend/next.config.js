/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: { domains: ['health.elmahrosa.org'], unoptimized: true },
};

module.exports = nextConfig;
