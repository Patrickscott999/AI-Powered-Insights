/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname);
    return config;
  },
  // Add compatibility with Netlify
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  output: 'export',
}

module.exports = nextConfig 