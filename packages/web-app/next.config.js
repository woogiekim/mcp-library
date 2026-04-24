const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: ['@mcp-library/types', '@mcp-library/mcp-client-core'],
}

module.exports = nextConfig
