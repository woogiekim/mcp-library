import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MCP UseCase Platform',
  description: 'Domain knowledge platform powered by MCP',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50 font-sans">
        <header className="border-b bg-white px-6 py-3 flex items-center justify-between">
          <span className="text-lg font-semibold text-gray-900">MCP UseCase Platform</span>
          <nav className="flex gap-4 text-sm text-gray-600">
            <a href="/" className="hover:text-gray-900">Search</a>
            <a href="/history" className="hover:text-gray-900">History</a>
          </nav>
        </header>
        <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  )
}
