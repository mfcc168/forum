import type { NextConfig } from "next";

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        port: '',
        pathname: '/avatars/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  serverExternalPackages: ["mongodb"],
  
  // Turbopack development optimizations
  turbopack: {
    // Configure Turbopack bundling rules
    rules: {
      // SVG handling with SVGR
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // Enable gzip compression
  compress: true,
  
  // Disable X-Powered-By header
  poweredByHeader: false,
  
  webpack: (config, { dev, isServer }) => {
    // Node.js polyfill fallbacks for client builds
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "mongodb-client-encryption": false,
        "aws4": false,
        "net": false,
        "dns": false,
        "tls": false,
        "fs": false,
        "child_process": false,
        "crypto": false,
        "stream": false,
        "util": false,
        "url": false,
        "zlib": false,
        "http": false,
        "https": false,
        "assert": false,
        "os": false,
        "path": false,
        "timers/promises": false, // Fix for MongoDB OIDC callback workflow
        "timers": false
      }
    }
    
    // Production webpack optimizations
    if (!dev && !isServer) {
      // Enable tree shaking for dead code elimination
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      
      // Configure chunk splitting strategy
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // Separate chunk for third-party libraries
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            enforce: true,
          },
          // Shared components chunk optimization
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
          // Forum-specific code bundle
          forum: {
            test: /[\\/](components[\\/]forum|app[\\/]forum)[\\/]/,
            name: 'forum',
            chunks: 'all',
            enforce: true,
          },
          // UI components bundle
          ui: {
            test: /[\\/]components[\\/]ui[\\/]/,
            name: 'ui',
            chunks: 'all',
            enforce: true,
          },
        },
      };
    }
    
    return config;
  },
};

export default withBundleAnalyzer(nextConfig);
