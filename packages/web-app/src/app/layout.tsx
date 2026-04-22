import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MCP UseCase Platform',
  description: 'Domain knowledge platform powered by MCP',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen font-sans">
        {/* Dark header — Font Awesome style high-contrast nav */}
        <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800">
          <div className="max-w-6xl mx-auto px-6 py-0 flex items-center justify-between h-14">
            <a href="/" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-violet-900/50">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1L12.196 4V10L7 13L1.804 10V4L7 1Z" fill="white" fillOpacity="0.95"/>
                </svg>
              </div>
              <span className="text-sm font-bold tracking-tight text-white">
                MCP UseCase
              </span>
            </a>

            <nav className="flex items-center gap-1">
              <a
                href="/"
                className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-all"
              >
                검색
              </a>
              <a
                href="/new"
                className="ml-2 px-4 py-1.5 text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 rounded-md transition-all shadow-sm shadow-violet-900/50"
              >
                + UseCase 등록
              </a>
            </nav>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-10">
          {children}
        </main>

        <footer className="mt-20 bg-slate-900 border-t border-slate-800 py-10">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-start justify-between gap-8">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                      <path d="M7 1L12.196 4V10L7 13L1.804 10V4L7 1Z" fill="white"/>
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-white">MCP UseCase Platform</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                  팀의 도메인 지식을 UseCase로 구조화하고<br/>AI 기반 검색으로 빠르게 활용하세요.
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-600 font-mono">Powered by MCP · Ollama · Qdrant</p>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
