'use client'

import { useState } from 'react'
import { SearchBar } from '@/components/SearchBar'
import { UseCaseCard } from '@/components/UseCaseCard'
import type { UseCase } from '@mcp-library/types'

const DOMAIN_ORDER = ['order', 'payment', 'member', 'review', 'coupon', 'settlement']
const DOMAIN_LABEL: Record<string, string> = {
  order: '주문', payment: '결제', member: '회원',
  review: '리뷰', coupon: '쿠폰', settlement: '정산',
}
const DOMAIN_COLOR: Record<string, string> = {
  order:      'text-violet-400 border-violet-500/30 bg-violet-500/10',
  payment:    'text-rose-400 border-rose-500/30 bg-rose-500/10',
  member:     'text-blue-400 border-blue-500/30 bg-blue-500/10',
  review:     'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  coupon:     'text-amber-400 border-amber-500/30 bg-amber-500/10',
  settlement: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
}

function getDomainColor(domain: string) {
  return DOMAIN_COLOR[domain] ?? 'text-slate-400 border-slate-500/30 bg-slate-500/10'
}

function groupByDomain(useCases: UseCase[]): [string, UseCase[]][] {
  const map = new Map<string, UseCase[]>()
  for (const uc of useCases) {
    const d = uc.domain.toLowerCase()
    if (!map.has(d)) map.set(d, [])
    map.get(d)!.push(uc)
  }
  const ordered: [string, UseCase[]][] = []
  for (const d of DOMAIN_ORDER) {
    if (map.has(d)) ordered.push([d, map.get(d)!])
  }
  for (const [d, ucs] of map) {
    if (!DOMAIN_ORDER.includes(d)) ordered.push([d, ucs])
  }
  return ordered
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-[#2A3042] bg-[#161B27] p-5 h-36 overflow-hidden">
      <div className="flex items-start justify-between gap-4 h-full">
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="shimmer h-5 w-16 rounded-full" />
            <div className="shimmer h-3 w-8 rounded" />
          </div>
          <div className="shimmer h-[22px] w-2/3 rounded-lg shrink-0" />
          <div className="shimmer h-3 w-1/2 rounded shrink-0" />
          <div className="mt-auto shimmer h-3 w-14 rounded" />
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          <div className="shimmer h-3 w-12 rounded" />
          <div className="shimmer h-3 w-10 rounded" />
          <div className="shimmer h-3 w-8 rounded" />
        </div>
      </div>
    </div>
  )
}

interface Props {
  initialUseCases: UseCase[]
}

export function LibraryView({ initialUseCases }: Props) {
  const [activeDomain, setActiveDomain] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UseCase[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [isSearchMode, setIsSearchMode] = useState(false)

  async function handleSearch(q: string) {
    setQuery(q)
    setIsSearchMode(true)
    setSearchLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setSearchResults(data.useCases ?? [])
    } finally {
      setSearchLoading(false)
    }
  }

  function clearSearch() {
    setQuery('')
    setIsSearchMode(false)
    setSearchResults([])
  }

  const grouped = groupByDomain(initialUseCases)
  const displayGroups = isSearchMode
    ? groupByDomain(searchResults)
    : (activeDomain ? grouped.filter(([d]) => d === activeDomain) : grouped)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="pt-8 pb-2 space-y-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-medium text-violet-400">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            MCP · UseCase-Grounded AI
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-100">
            도메인 UseCase 라이브러리
          </h1>
          <p className="text-slate-500 text-sm">
            팀이 정의한 UseCase를 검색하거나 도메인별로 탐색하세요.
          </p>
        </div>

        <SearchBar onSearch={handleSearch} />
      </div>

      {/* Controls row — always same height to prevent layout shift */}
      <div className="min-h-[36px] flex items-center">
        {isSearchMode ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600">검색어</span>
            <span className="px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-300 text-xs font-semibold border border-violet-500/30">
              {query}
            </span>
            <button
              onClick={clearSearch}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              초기화
            </button>
          </div>
        ) : initialUseCases.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveDomain(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                activeDomain === null
                  ? 'bg-violet-500/20 text-violet-300 border-violet-500/40'
                  : 'text-slate-500 border-[#2A3042] hover:border-violet-500/30 hover:text-violet-400'
              }`}
            >
              전체 <span className="ml-1 opacity-60">{initialUseCases.length}</span>
            </button>
            {grouped.map(([domain, ucs]) => (
              <button
                key={domain}
                onClick={() => setActiveDomain(activeDomain === domain ? null : domain)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  activeDomain === domain
                    ? getDomainColor(domain)
                    : 'text-slate-500 border-[#2A3042] hover:border-violet-500/30 hover:text-violet-400'
                }`}
              >
                {DOMAIN_LABEL[domain] ?? domain}
                <span className="ml-1 opacity-60">{ucs.length}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Search skeleton */}
      {searchLoading && (
        <div className="space-y-8">
          {[1, 2].map(group => (
            <div key={group}>
              <div className="flex items-center gap-3 mb-3">
                <div className="shimmer h-5 w-14 rounded-full" />
                <div className="shimmer h-3 w-6 rounded" />
                <div className="flex-1 h-px bg-[#2A3042]" />
              </div>
              <div className="grid gap-3">
                {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grouped list */}
      {!searchLoading && displayGroups.length > 0 && (
        <div className="space-y-8">
          {displayGroups.map(([domain, ucs]) => (
            <section key={domain}>
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getDomainColor(domain)}`}>
                  {DOMAIN_LABEL[domain] ?? domain}
                </span>
                <span className="text-xs text-slate-600">{ucs.length}개</span>
                <div className="flex-1 h-px bg-[#2A3042]" />
              </div>
              <div className="grid gap-3">
                {ucs.map(uc => (
                  <UseCaseCard key={uc.id} useCase={uc} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Search: no results */}
      {isSearchMode && !searchLoading && searchResults.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#1E2433] flex items-center justify-center mx-auto">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-500">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
          </div>
          <p className="text-sm text-slate-400 font-medium">&quot;{query}&quot;에 해당하는 UseCase가 없습니다</p>
          <button onClick={clearSearch} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
            전체 목록으로 돌아가기
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isSearchMode && initialUseCases.length === 0 && (
        <div className="text-center py-20 space-y-3">
          <p className="text-slate-500 text-sm">등록된 UseCase가 없습니다</p>
          <a href="/new" className="inline-block mt-2 text-xs text-violet-400 hover:text-violet-300 transition-colors">
            + 첫 번째 UseCase 등록하기
          </a>
        </div>
      )}
    </div>
  )
}
