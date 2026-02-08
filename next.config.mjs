/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用 Turbopack（Next.js 15 推荐）
  // turbopack 通过 npm run dev --turbopack 启用
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zrocwujtcgehsqsrwptc.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
