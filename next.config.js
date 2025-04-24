/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['images.unsplash.com'],
  },
  // Disable Vercel's automatic favicon injection
  webpack: (config) => {
    return config;
  },
  // Disable Vercel's default favicon
  assetPrefix: '',
}

module.exports = nextConfig