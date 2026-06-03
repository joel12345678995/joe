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
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [],
  },
};

export default nextConfig;