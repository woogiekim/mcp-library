'use client'

import { useState } from 'react'
import { SearchBar } from '@/components/SearchBar'
import { UseCaseCard } from '@/components/UseCaseCard'
import type { UseCase } from '@mcp-library/types'

const DOMAINS = ['전체', 'order', 'payment', 'member', 'review', 'coupon', 'settlement']

const DOMAIN_BADGE: Record<string, string> = {
  전체:       'bg-slate-800 text-white',
  order:      'bg-violet-50 text-violet-700 hover:bg-violet-100',
  payment:    'bg-rose-50 text-rose-700 hover:bg-rose-100',
  member:     'bg-blue-50 text-blue-700 hover:bg-blue-100',
  review:     'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
  coupon:     'bg-amber-50 text-amber-700 hover:bg-amber-100',
  settlement: 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100',
}

const QUICK_SEARCHES = [
  { label: '결제 취소 정책', domain: 'payment' },
  { label: '회원 등급 기준', domain: 'member' },
  { label: '주문 취소 조건', domain: 'order' },
  { label: '리뷰 작성 규칙', domain: 'review' },
  { label: '쿠폰 적용 정책', domain: 'coupon' },
]

export default function HomePage() {
  const [results, setResults] = useState<UseCase[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [activeDomain, setActiveDomain] = useState('전체')

  async function handleSearch(q: string) {
    setQuery(q)
    setLoading(true)
    setHasSearched(true)
    setActiveDomain('전체')
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.useCases ?? [])
    } finally {
      setLoading(false)
    }
  }

  const filtered = activeDomain === '전체'
    ? results
    : results.filter(uc => uc.domain.toLowerCase() === activeDomain)

  const domainCounts = results.reduce<Record<string, number>>((acc, uc) => {
    const d = uc.domain.toLowerCase()
    acc[d] = (acc[d] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="text-center space-y-5 pt-6">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
          도메인 지식을 자연어로 검색
        </h1>
        <p className="text-slate-500 text-base max-w-md mx-auto">
          팀이 정의한 UseCase 기반으로 AI가 정확하게 답변합니다.
        </p>
        <div className="max-w-xl mx-auto">
          <SearchBar onSearch={handleSearch} />
        </div>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex flex-col rounded-xl border border-slate-100 bg-white overflow-hidden">
              <div className="shimmer h-4 w-3/4 rounded m-4" />
              <div className="px-4 pb-4 space-y-2">
                <div className="shimmer h-4 w-full rounded" />
                <div className="shimmer h-3 w-2/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700">"{query}"</span>
              <span className="text-xs text-slate-400">— {results.length}개 결과</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {DOMAINS.filter(d => d === '전체' || domainCounts[d] > 0).map(domain => {
                const count = domain === '전체' ? results.length : (domainCounts[domain] ?? 0)
                const isActive = activeDomain === domain
                return (
                  <button
                    key={domain}
                    onClick={() => setActiveDomain(domain)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-slate-800 text-white'
                        : (DOMAIN_BADGE[domain] ?? 'bg-slate-50 text-slate-600 hover:bg-slate-100')
                    }`}
                  >
                    {domain}
                    <span className={`text-[10px] font-bold ${isActive ? 'text-white/70' : 'text-current opacity-60'}`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {filtered.map(uc => (
              <UseCaseCard key={uc.id} useCase={uc} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-10">
              <p className="text-sm text-slate-500">
                <span className="font-semibold">{activeDomain}</span> 도메인에 결과가 없습니다
              </p>
              <button onClick={() => setActiveDomain('전체')} className="mt-2 text-xs text-violet-600 hover:underline">
                전체 보기
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty search state */}
      {!loading && hasSearched && results.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <p className="text-base font-semibold text-slate-700">"{query}" 검색 결과 없음</p>
          <p className="text-sm text-slate-400">다른 키워드로 검색하거나 UseCase를 새로 등록해보세요</p>
          <a href="/new" className="btn-fa text-sm mt-2 inline-flex">+ UseCase 등록하기</a>
        </div>
      )}

      {/* Initial state */}
      {!hasSearched && (
        <div className="space-y-3 pt-2">
          <p className="text-center text-xs font-medium text-slate-400 uppercase tracking-widest">
            빠른 검색
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {QUICK_SEARCHES.map(({ label }) => (
              <button
                key={label}
                onClick={() => handleSearch(label)}
                className="px-4 py-2 rounded-full border border-slate-200 bg-white hover:border-violet-300 hover:text-violet-700 transition-all text-sm text-slate-600 font-medium"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
