import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MCP UseCase Platform',
  description: 'Domain knowledge platform powered by MCP',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen font-sans flex flex-col">
        <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0D1117]/80 border-b border-[#2A3042]/60">
          <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-violet-900/50">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1L12.196 4V10L7 13L1.804 10V4L7 1Z" fill="white" fillOpacity="0.9"/>
                </svg>
              </div>
              <span className="text-sm font-bold tracking-tight text-gradient-violet">
                MCP UseCase Platform
              </span>
            </a>

            <nav className="flex items-center gap-1">
              <a
                href="/"
                className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-violet-400 hover:bg-violet-500/10 rounded-md transition-all"
              >
                라이브러리
              </a>
              <div className="w-px h-3 bg-[#2A3042] mx-1" />
              <a
                href="/new"
                className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-md transition-all"
              >
                + 등록
              </a>
              <div className="w-px h-3 bg-[#2A3042] mx-1" />
              <span className="px-2.5 py-1 text-xs font-semibold bg-gradient-to-r from-violet-500 to-cyan-400 text-white rounded-full shadow-sm shadow-violet-900/50">
                Beta
              </span>
            </nav>
          </div>
        </header>

        <main className="w-full max-w-2xl mx-auto px-6 py-10 flex-1">
          {children}
        </main>

        <footer className="mt-6 border-t border-[#2A3042] py-3">
          <div className="max-w-5xl mx-auto px-6 flex items-center justify-between text-xs text-slate-500">
            <span>MCP UseCase Platform</span>
            <span className="text-gradient-cyan font-medium">Powered by MCP · Ollama · Qdrant</span>
          </div>
        </footer>
      </body>
    </html>
  )
}
