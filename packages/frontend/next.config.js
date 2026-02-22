/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@dualis/shared'],
  output: 'standalone',
  images: {
    remotePatterns: [],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Use polling to avoid EMFILE errors on macOS with low maxfiles limit
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules/**', '**/.next/**', '**/.git/**'],
      };
    }
    return config;
  },
};

module.exports = nextConfig;
