/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.ampre.ca',
      },
      {
        protocol: 'https',
        hostname: 'query.ampre.ca',
      },
      {
        protocol: 'https',
        hostname: '*.repliers.io',
      },
    ],
    unoptimized: false,
  },
};

module.exports = nextConfig;
