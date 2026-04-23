'use client'

import { useState } from 'react'
import { SearchBar } from '@/components/SearchBar'
import { UseCaseCard } from '@/components/UseCaseCard'
import type { UseCase } from '@mcp-library/types'

export default function HomePage() {
  const [results, setResults] = useState<UseCase[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  async function handleSearch(q: string) {
    setQuery(q)
    setLoading(true)
    setHasSearched(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.useCases ?? [])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center space-y-5 pt-14 pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-medium text-violet-400">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          MCP · UseCase-Grounded AI
        </div>

        <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-slate-100 leading-[1.1]">
          도메인 지식을{' '}
          <span className="text-gradient-violet">자연어</span>
          로 검색
        </h1>

        <p className="text-slate-500 text-sm max-w-lg mx-auto leading-relaxed">
          팀이 정의한 UseCase를 기반으로 AI가 정확하게 답변합니다.
          규칙과 시나리오에 근거한 신뢰할 수 있는 지식 검색.
        </p>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto">
        <SearchBar onSearch={handleSearch} />
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3 max-w-2xl mx-auto">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl border border-[#2A3042] bg-[#161B27] p-5 space-y-3">
              <div className="flex gap-2">
                <div className="shimmer h-5 w-16 rounded-full" />
                <div className="shimmer h-5 w-12 rounded-full" />
              </div>
              <div className="shimmer h-4 w-3/4 rounded-lg" />
              <div className="shimmer h-3 w-1/2 rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-600">검색어</span>
            <span className="px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-300 text-xs font-semibold border border-violet-500/30">
              {query}
            </span>
            <span className="text-xs text-slate-600">— {results.length}개 결과</span>
          </div>

          <div className="grid gap-3">
            {results.map(uc => (
              <UseCaseCard key={uc.id} useCase={uc} />
            ))}
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && hasSearched && results.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#1E2433] flex items-center justify-center mx-auto">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-500">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
          </div>
          <p className="text-sm text-slate-400 font-medium">
            &quot;{query}&quot;에 해당하는 UseCase가 없습니다
          </p>
          <p className="text-xs text-slate-600">다른 키워드로 검색해보세요</p>
        </div>
      )}

      {/* Initial empty state */}
      {!hasSearched && (
        <div className="space-y-3 max-w-xl mx-auto">
          <p className="text-center text-[10px] text-slate-600 uppercase tracking-widest font-semibold">검색 예시</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { label: '결제 취소 정책', emoji: '💳' },
              { label: '회원 등급 기준', emoji: '🏅' },
              { label: '주문 취소 조건', emoji: '📦' },
              { label: '쿠폰 적용 규칙', emoji: '🎟' },
              { label: '리뷰 작성 정책', emoji: '⭐' },
            ].map(({ label, emoji }) => (
              <button
                key={label}
                onClick={() => handleSearch(label)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#2A3042] bg-[#161B27] hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-violet-300 transition-all text-xs text-slate-500 group"
              >
                <span>{emoji}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
