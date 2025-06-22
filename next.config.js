/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs']
  },
  transpilePackages: ['lucide-react'],
  images: {
    domains: [],
  },
}

module.exports = nextConfig