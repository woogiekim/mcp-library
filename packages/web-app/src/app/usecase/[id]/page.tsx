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
  order:      'bg-violet-100 text-violet-700',
  member:     'bg-blue-100 text-blue-700',
  review:     'bg-emerald-100 text-emerald-700',
  coupon:     'bg-amber-100 text-amber-700',
  settlement: 'bg-cyan-100 text-cyan-700',
  payment:    'bg-rose-100 text-rose-700',
}

function getDomainColor(domain: string) {
  return domainColor[domain.toLowerCase()] ?? 'bg-slate-100 text-slate-600'
}

export default async function UseCaseDetailPage({ params }: Props) {
  const useCase = await fetchUseCase(params.id)

  if (!useCase) {
    return (
      <div className="text-center py-24 space-y-4">
        <p className="text-slate-600 font-semibold">UseCase를 찾을 수 없습니다</p>
        <Link href="/" className="btn-fa text-sm">← 검색으로 돌아가기</Link>
      </div>
    )
  }

  const color = getDomainColor(useCase.domain)

  return (
    <div className="max-w-3xl space-y-8">
      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        검색으로 돌아가기
      </Link>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${color}`}>
            {useCase.domain}
          </span>
          <span className="text-xs font-mono text-slate-400">v{useCase.version}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 leading-snug">{useCase.title}</h1>
        <div className="flex items-center gap-3 text-xs text-slate-400">
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

      <div className="border-t border-slate-100" />

      {/* Scenarios */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">시나리오</h2>
        <ol className="space-y-0">
          {useCase.scenarios
            .sort((a, b) => a.stepOrder - b.stepOrder)
            .map((step, idx, arr) => (
              <li key={step.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-semibold shrink-0 z-10">
                    {step.stepOrder}
                  </div>
                  {idx < arr.length - 1 && (
                    <div className="w-px flex-1 bg-slate-200 my-1 min-h-[16px]" />
                  )}
                </div>
                <div className="flex-1 pb-5 pt-1">
                  <p className="text-sm text-slate-800 leading-relaxed">{step.description}</p>
                  {step.expected && (
                    <p className="mt-1 text-xs text-slate-500">→ {step.expected}</p>
                  )}
                </div>
              </li>
            ))}
        </ol>
      </section>

      {/* Rules */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">규칙</h2>
        <ul className="space-y-2">
          {useCase.rules.map(rule => (
            <li key={rule.id} className="rounded-lg border border-slate-200 overflow-hidden">
              <div className="flex">
                <div className="w-1 shrink-0 bg-violet-500" />
                <div className="flex-1 p-4 space-y-2">
                  <p className="text-sm text-slate-800">{rule.description}</p>
                  {rule.constraint && (
                    <code className="block bg-slate-900 text-cyan-300 rounded-md px-3 py-2 font-mono text-xs leading-relaxed overflow-x-auto">
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
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">예외 처리</h2>
          <ul className="space-y-2">
            {useCase.exceptions.map(exc => (
              <li key={exc.id} className="rounded-lg border border-slate-200 overflow-hidden">
                <div className="flex">
                  <div className="w-1 shrink-0 bg-rose-400" />
                  <div className="flex-1 p-4 space-y-1">
                    <p className="text-sm font-medium text-slate-800">{exc.condition}</p>
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
