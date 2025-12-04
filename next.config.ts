import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 确保服务端环境变量不暴露给客户端
  serverExternalPackages: ['@google/genai'],
}

export default nextConfig
