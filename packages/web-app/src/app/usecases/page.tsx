'use client'

import { useState, useEffect } from 'react'
import { UseCaseCard } from '@/components/UseCaseCard'
import type { UseCase } from '@mcp-library/types'

const DOMAIN_ORDER = ['order', 'payment', 'member', 'review', 'coupon', 'settlement']

const DOMAIN_LABEL: Record<string, string> = {
  order: '주문',
  payment: '결제',
  member: '회원',
  review: '리뷰',
  coupon: '쿠폰',
  settlement: '정산',
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

export default function UseCasesPage() {
  const [useCases, setUseCases] = useState<UseCase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeDomain, setActiveDomain] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/usecases')
      .then(r => r.json())
      .then(data => {
        setUseCases(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(e => {
        setError(String(e))
        setLoading(false)
      })
  }, [])

  const grouped = groupByDomain(useCases)
  const filtered = activeDomain
    ? grouped.filter(([d]) => d === activeDomain)
    : grouped

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-slate-100 tracking-tight">전체 UseCase</h1>
        <p className="text-sm text-slate-500">도메인별로 등록된 모든 UseCase를 확인합니다</p>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl border border-[#2A3042] bg-[#161B27] p-5 space-y-3">
              <div className="shimmer h-4 w-16 rounded-full" />
              <div className="shimmer h-4 w-3/4 rounded-lg" />
              <div className="shimmer h-3 w-1/2 rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6 text-sm text-rose-400">
          서버 연결 오류: {error}
        </div>
      )}

      {!loading && !error && useCases.length === 0 && (
        <div className="text-center py-20 space-y-3">
          <p className="text-slate-500 text-sm">등록된 UseCase가 없습니다</p>
          <a href="/new" className="inline-block mt-2 text-xs text-violet-400 hover:text-violet-300 transition-colors">
            + 첫 번째 UseCase 등록하기
          </a>
        </div>
      )}

      {!loading && !error && useCases.length > 0 && (
        <>
          {/* Domain filter tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveDomain(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                activeDomain === null
                  ? 'bg-violet-500/20 text-violet-300 border-violet-500/40'
                  : 'text-slate-500 border-[#2A3042] hover:border-violet-500/30 hover:text-violet-400'
              }`}
            >
              전체 <span className="ml-1 opacity-60">{useCases.length}</span>
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

          {/* Grouped list */}
          <div className="space-y-8">
            {filtered.map(([domain, ucs]) => (
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
        </>
      )}
    </div>
  )
}
