import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MCP UseCase Platform',
  description: 'Domain knowledge platform powered by MCP',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen font-sans bg-white">
        <header className="sticky top-0 z-50 bg-white border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1L12.196 4V10L7 13L1.804 10V4L7 1Z" fill="white" fillOpacity="0.95"/>
                </svg>
              </div>
              <span className="text-sm font-bold tracking-tight text-slate-900">
                MCP UseCase
              </span>
            </a>

            <nav className="flex items-center gap-4">
              <a href="/" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
                검색
              </a>
              <a href="/new" className="btn-fa text-sm">
                + UseCase 등록
              </a>
            </nav>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-10">
          {children}
        </main>

        <footer className="mt-20 border-t border-slate-100 py-8">
          <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1L12.196 4V10L7 13L1.804 10V4L7 1Z" fill="white"/>
                </svg>
              </div>
              <span className="text-sm font-bold text-slate-800">MCP UseCase Platform</span>
            </div>
            <p className="text-xs text-slate-400 font-mono">Powered by MCP · Ollama · Qdrant</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
