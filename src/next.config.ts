
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  experimental: {
    turbopack: {
      // This helps Turbopack resolve the correct project root, fixing the build error.
      resolveAlias: {
        '.': '.',
      },
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
