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

const domainColor: Record<string, string> = {
  order:      'bg-violet-500/15 text-violet-300 ring-violet-500/30',
  member:     'bg-blue-500/15 text-blue-300 ring-blue-500/30',
  review:     'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  coupon:     'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  settlement: 'bg-cyan-500/15 text-cyan-300 ring-cyan-500/30',
  payment:    'bg-rose-500/15 text-rose-300 ring-rose-500/30',
}

function getDomainColor(domain: string) {
  return domainColor[domain.toLowerCase()] ?? 'bg-slate-500/15 text-slate-300 ring-slate-500/30'
}

export default async function UseCaseDetailPage({ params }: Props) {
  const useCase = await fetchUseCase(params.id)

  if (!useCase) {
    return (
      <div className="text-center py-24 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-rose-400">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="text-slate-400 font-medium">UseCase를 찾을 수 없습니다</p>
        <Link href="/" className="inline-block text-sm text-violet-400 hover:underline">← 검색으로 돌아가기</Link>
      </div>
    )
  }

  const chipClass = getDomainColor(useCase.domain)

  return (
    <div className="space-y-10">
      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-400 transition-colors">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        검색으로 돌아가기
      </Link>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`domain-chip ring-1 ${chipClass}`}>
            {useCase.domain}
          </span>
          <span className="text-xs font-mono text-slate-500 bg-[#1E2433] px-2 py-0.5 rounded-md border border-[#2A3042]">
            v{useCase.version}
          </span>
        </div>

        <h1 className="text-3xl font-black tracking-tight text-slate-100 leading-tight">
          {useCase.title}
        </h1>

        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>{useCase.scenarios.length} 시나리오</span>
          <span className="w-1 h-1 rounded-full bg-[#2A3042]" />
          <span>{useCase.rules.length} 규칙</span>
          {useCase.exceptions.length > 0 && (
            <>
              <span className="w-1 h-1 rounded-full bg-[#2A3042]" />
              <span>{useCase.exceptions.length} 예외</span>
            </>
          )}
        </div>
      </div>

      {/* Scenarios — Timeline */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-5 h-5 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5.5L4 7.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          시나리오
        </h2>

        <ol className="relative space-y-0">
          {useCase.scenarios
            .sort((a, b) => a.stepOrder - b.stepOrder)
            .map((step, idx, arr) => (
              <li key={step.id} className="relative flex gap-4 pb-0">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-emerald-900/50 shrink-0 z-10">
                    {step.stepOrder}
                  </div>
                  {idx < arr.length - 1 && (
                    <div className="w-px flex-1 bg-gradient-to-b from-emerald-500/30 to-cyan-500/10 my-1 min-h-[20px]" />
                  )}
                </div>

                <div className="flex-1 pb-5 pt-1">
                  <p className="text-sm text-slate-300 font-medium leading-relaxed">{step.description}</p>
                  {step.expected && (
                    <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
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
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
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
            <li key={rule.id} className="rounded-xl bg-[#161B27] border border-[#2A3042] overflow-hidden shadow-sm">
              <div className="flex">
                <div className="w-1 shrink-0 bg-gradient-to-b from-cyan-400 to-blue-500" />
                <div className="flex-1 p-4 space-y-1.5">
                  <p className="text-sm text-slate-300 font-medium">{rule.description}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500 shrink-0">제약:</span>
                    <code className="text-xs text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-md font-mono border border-cyan-500/20">
                      {rule.constraint}
                    </code>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Exceptions */}
      {useCase.exceptions.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
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
              <li key={exc.id} className="rounded-xl bg-[#161B27] border border-[#2A3042] overflow-hidden shadow-sm">
                <div className="flex">
                  <div className="w-1 shrink-0 bg-gradient-to-b from-rose-400 to-orange-500" />
                  <div className="flex-1 p-4 space-y-1">
                    <p className="text-xs font-semibold text-rose-400 uppercase tracking-wide">조건</p>
                    <p className="text-sm text-slate-300 font-medium">{exc.condition}</p>
                    <p className="text-xs text-slate-500 pt-1">
                      <span className="font-semibold text-slate-400">처리: </span>
                      {exc.handling}
                    </p>
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
