'use client'

import { useState } from 'react'
import { SearchBar } from '@/components/SearchBar'
import { UseCaseCard } from '@/components/UseCaseCard'
import type { UseCase } from '@mcp-library/types'

const DOMAINS = ['전체', 'order', 'payment', 'member', 'review', 'coupon', 'settlement']

const DOMAIN_BADGE: Record<string, string> = {
  전체:       'bg-slate-900 text-white border-slate-900',
  order:      'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100',
  payment:    'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
  member:     'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  review:     'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  coupon:     'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  settlement: 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100',
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
    <div className="space-y-12">
      {/* Hero — full-width gradient band */}
      <div className="-mx-6 -mt-10 px-6 pt-16 pb-12 mb-4 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 border border-violet-200 text-xs font-bold text-violet-700 uppercase tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
            UseCase-Grounded AI Search
          </div>

          <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-slate-900 leading-[1.08]">
            도메인 지식을{' '}
            <span className="text-gradient-violet">자연어</span>
            로 검색
          </h1>

          <p className="text-slate-500 text-base max-w-md mx-auto leading-relaxed">
            팀이 정의한 UseCase 기반으로 AI가 정확하게 답변합니다.
            규칙과 시나리오에 근거한 신뢰할 수 있는 지식 검색.
          </p>

          {/* Search bar */}
          <div className="pt-2">
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 pt-1 border-t border-slate-100 pt-5">
            {[
              { value: '10+', label: 'UseCases' },
              { value: '5',   label: 'Domains' },
              { value: 'MCP', label: 'Powered' },
            ].map((s, i) => (
              <div key={s.label} className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-xl font-black text-slate-900">{s.value}</div>
                  <div className="text-[11px] text-slate-400 font-medium mt-0.5 uppercase tracking-wide">{s.label}</div>
                </div>
                {i < 2 && <div className="w-px h-6 bg-slate-200" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex flex-col rounded-xl border border-slate-100 bg-white overflow-hidden">
              <div className="shimmer h-10 w-full" />
              <div className="px-4 py-4 space-y-3">
                <div className="shimmer h-5 w-3/4 rounded-lg" />
                <div className="shimmer h-4 w-full rounded-md" />
                <div className="shimmer h-4 w-2/3 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div className="space-y-4">
          {/* Result header + domain filter */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700">"{query}"</span>
              <span className="text-xs text-slate-400">— {results.length}개 결과</span>
            </div>

            {/* Domain filter bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {DOMAINS.filter(d => d === '전체' || domainCounts[d] > 0).map(domain => {
                const count = domain === '전체' ? results.length : (domainCounts[domain] ?? 0)
                const isActive = activeDomain === domain
                return (
                  <button
                    key={domain}
                    onClick={() => setActiveDomain(domain)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      isActive
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : (DOMAIN_BADGE[domain] ?? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100')
                    }`}
                  >
                    {domain}
                    <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 ${
                      isActive ? 'bg-white/20 text-white' : 'bg-black/8 text-current'
                    }`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Cards — 2 column grid */}
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
              <button
                onClick={() => setActiveDomain('전체')}
                className="mt-2 text-xs text-violet-600 hover:underline"
              >
                전체 보기
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty search state */}
      {!loading && hasSearched && results.length === 0 && (
        <div className="text-center py-20 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
          </div>
          <div>
            <p className="text-base font-bold text-slate-700">
              &quot;{query}&quot; 검색 결과 없음
            </p>
            <p className="text-sm text-slate-400 mt-1">다른 키워드로 검색하거나 UseCase를 새로 등록해보세요</p>
          </div>
          <a href="/new" className="btn-fa text-sm">
            + UseCase 등록하기
          </a>
        </div>
      )}

      {/* Initial state — quick search */}
      {!hasSearched && (
        <div className="space-y-4 pt-2">
          <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest">
            빠른 검색
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {QUICK_SEARCHES.map(({ label, domain }) => (
              <button
                key={label}
                onClick={() => handleSearch(label)}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 transition-all text-sm text-slate-600 font-medium shadow-sm hover:shadow-md group"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${
                  { order: 'bg-violet-500', payment: 'bg-rose-500', member: 'bg-blue-500', review: 'bg-emerald-500', coupon: 'bg-amber-500', settlement: 'bg-cyan-500' }[domain] ?? 'bg-slate-400'
                }`} />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
