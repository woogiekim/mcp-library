/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@mcp-library/types', '@mcp-library/mcp-client-core'],
}

module.exports = nextConfig
