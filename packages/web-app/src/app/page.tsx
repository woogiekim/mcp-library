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
    <div className="space-y-10">
      {/* Hero */}
      <div className="text-center space-y-4 pt-6 pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 border border-violet-100 text-xs font-medium text-violet-600 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
          MCP · UseCase-Grounded AI
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
          도메인 지식을{' '}
          <span className="text-gradient-violet">자연어</span>
          로 검색
        </h1>

        <p className="text-slate-500 text-base max-w-xl mx-auto leading-relaxed">
          팀이 정의한 UseCase를 기반으로 AI가 정확하게 답변합니다.
          <br />
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
            <div key={i} className="rounded-2xl border border-slate-100 bg-white p-5 space-y-3">
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
            <span className="text-xs font-medium text-slate-400">검색어</span>
            <span className="px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 text-xs font-semibold border border-violet-100">
              {query}
            </span>
            <span className="text-xs text-slate-400">— {results.length}개 결과</span>
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
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            &quot;{query}&quot;에 해당하는 UseCase가 없습니다
          </p>
          <p className="text-xs text-slate-400">다른 키워드로 검색해보세요</p>
        </div>
      )}

      {/* Initial empty state */}
      {!hasSearched && (
        <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto pt-4">
          {[
            { label: '결제 취소 정책', emoji: '💳' },
            { label: '회원 등급 기준', emoji: '🏅' },
            { label: '주문 취소 조건', emoji: '📦' },
          ].map(({ label, emoji }) => (
            <button
              key={label}
              onClick={() => handleSearch(label)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-100 bg-white hover:border-violet-200 hover:bg-violet-50/50 transition-all text-center group"
            >
              <span className="text-xl">{emoji}</span>
              <span className="text-xs text-slate-500 group-hover:text-violet-600 transition-colors leading-snug">{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
