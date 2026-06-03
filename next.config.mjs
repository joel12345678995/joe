/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable font optimization
  optimizeFonts: false,
  
  // Core features
  reactStrictMode: true,
  swcMinify: true,
  
  // Performance
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Skip ESLint during production builds to avoid CI failures from dev-only lint rules
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Allow production builds even if TypeScript errors are present
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [],
  },
};

export default nextConfig;