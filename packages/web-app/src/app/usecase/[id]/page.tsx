import type { UseCase } from '@mcp-library/types'
import Link from 'next/link'

interface Props {
  params: { id: string }
}

async function fetchUseCase(id: string): Promise<UseCase | null> {
  try {
    const res = await fetch(`${process.env.MCP_SERVER_URL}/usecases/${id}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

const domainConfig: Record<string, { header: string; badge: string }> = {
  order:      { header: 'from-violet-600 to-violet-500',   badge: 'bg-violet-100 text-violet-800 ring-violet-200' },
  member:     { header: 'from-blue-600 to-blue-500',       badge: 'bg-blue-100 text-blue-800 ring-blue-200' },
  review:     { header: 'from-emerald-600 to-emerald-500', badge: 'bg-emerald-100 text-emerald-800 ring-emerald-200' },
  coupon:     { header: 'from-amber-500 to-amber-400',     badge: 'bg-amber-100 text-amber-800 ring-amber-200' },
  settlement: { header: 'from-cyan-600 to-cyan-500',       badge: 'bg-cyan-100 text-cyan-800 ring-cyan-200' },
  payment:    { header: 'from-rose-600 to-rose-500',       badge: 'bg-rose-100 text-rose-800 ring-rose-200' },
}

function getConfig(domain: string) {
  return domainConfig[domain.toLowerCase()] ?? {
    header: 'from-slate-600 to-slate-500',
    badge: 'bg-slate-100 text-slate-700 ring-slate-200',
  }
}

export default async function UseCaseDetailPage({ params }: Props) {
  const useCase = await fetchUseCase(params.id)

  if (!useCase) {
    return (
      <div className="text-center py-24 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-rose-400">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="text-slate-600 font-semibold">UseCase를 찾을 수 없습니다</p>
        <Link href="/" className="btn-fa text-sm">← 검색으로 돌아가기</Link>
      </div>
    )
  }

  const cfg = getConfig(useCase.domain)

  return (
    <div className="max-w-3xl space-y-8">
      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        검색으로 돌아가기
      </Link>

      {/* Domain header card */}
      <div className={`rounded-2xl overflow-hidden border border-slate-100 shadow-sm`}>
        <div className={`bg-gradient-to-r ${cfg.header} px-6 py-5`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-white/80 uppercase tracking-widest">{useCase.domain}</span>
            <span className="text-[11px] font-mono text-white/60">v{useCase.version}</span>
          </div>
          <h1 className="mt-2 text-2xl font-black text-white leading-snug">{useCase.title}</h1>
        </div>
        <div className="px-6 py-3 bg-white flex items-center gap-4 text-xs text-slate-400 border-t border-slate-100">
          <span>{useCase.scenarios.length} 시나리오</span>
          <span className="w-1 h-1 rounded-full bg-slate-200" />
          <span>{useCase.rules.length} 규칙</span>
          {useCase.exceptions.length > 0 && (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-200" />
              <span className="text-rose-400">{useCase.exceptions.length} 예외</span>
            </>
          )}
        </div>
      </div>

      {/* Scenarios */}
      <section className="space-y-3">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-5 h-5 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5.5L4 7.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          시나리오
        </h2>

        <ol className="space-y-0">
          {useCase.scenarios
            .sort((a, b) => a.stepOrder - b.stepOrder)
            .map((step, idx, arr) => (
              <li key={step.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-emerald-100 shrink-0 z-10">
                    {step.stepOrder}
                  </div>
                  {idx < arr.length - 1 && (
                    <div className="w-px flex-1 bg-gradient-to-b from-emerald-200 to-cyan-100 my-1 min-h-[16px]" />
                  )}
                </div>
                <div className="flex-1 pb-5 pt-1.5">
                  <p className="text-sm text-slate-800 font-medium leading-relaxed">{step.description}</p>
                  {step.expected && (
                    <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      {step.expected}
                    </p>
                  )}
                </div>
              </li>
            ))}
        </ol>
      </section>

      {/* Rules */}
      <section className="space-y-3">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-5 h-5 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <rect x="1.5" y="2" width="7" height="1.2" rx="0.6" fill="white"/>
              <rect x="1.5" y="4.4" width="5" height="1.2" rx="0.6" fill="white"/>
              <rect x="1.5" y="6.8" width="6" height="1.2" rx="0.6" fill="white"/>
            </svg>
          </span>
          규칙
        </h2>

        <ul className="space-y-2.5">
          {useCase.rules.map(rule => (
            <li key={rule.id} className="rounded-xl bg-white border border-slate-100 overflow-hidden shadow-sm">
              <div className="flex">
                <div className="w-1 shrink-0 bg-gradient-to-b from-cyan-400 to-blue-500" />
                <div className="flex-1 p-4 space-y-2">
                  <p className="text-sm text-slate-800 font-medium">{rule.description}</p>
                  {rule.constraint && (
                    <code className="block bg-slate-900 text-cyan-300 rounded-lg px-3 py-2 font-mono text-xs leading-relaxed overflow-x-auto">
                      {rule.constraint}
                    </code>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Exceptions */}
      {useCase.exceptions.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-5 h-5 rounded-lg bg-gradient-to-br from-rose-400 to-orange-500 flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M5 1.5L8.5 7.5H1.5L5 1.5Z" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/>
                <path d="M5 4v1.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </span>
            예외 처리
          </h2>

          <ul className="space-y-2.5">
            {useCase.exceptions.map(exc => (
              <li key={exc.id} className="rounded-xl bg-white border border-slate-100 overflow-hidden shadow-sm">
                <div className="flex">
                  <div className="w-1 shrink-0 bg-gradient-to-b from-rose-400 to-orange-500" />
                  <div className="flex-1 p-4 space-y-1">
                    <p className="text-sm font-semibold text-slate-800">{exc.condition}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{exc.handling}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
