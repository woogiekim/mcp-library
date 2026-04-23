import type { UseCase } from '@mcp-library/types'
import Link from 'next/link'
import { DeleteButton } from './DeleteButton'

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

const domainColor: Record<string, { chip: string; bar: string }> = {
  order:      { chip: 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30',    bar: 'from-violet-400 to-violet-600' },
  member:     { chip: 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30',          bar: 'from-blue-400 to-blue-600' },
  review:     { chip: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30', bar: 'from-emerald-400 to-emerald-600' },
  coupon:     { chip: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',       bar: 'from-amber-400 to-amber-600' },
  settlement: { chip: 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30',          bar: 'from-cyan-400 to-cyan-600' },
  payment:    { chip: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30',          bar: 'from-rose-400 to-rose-600' },
}

function getDomainColor(domain: string) {
  return domainColor[domain.toLowerCase()] ?? {
    chip: 'bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/30',
    bar: 'from-slate-400 to-slate-600',
  }
}

export default async function UseCaseDetailPage({ params }: Props) {
  const useCase = await fetchUseCase(params.id)

  if (!useCase) {
    return (
      <div className="max-w-3xl mx-auto text-center py-24 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-rose-400">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="text-slate-400 font-medium">UseCase를 찾을 수 없습니다</p>
        <Link href="/usecases" className="inline-block text-sm text-violet-400 hover:underline">← 목록으로 돌아가기</Link>
      </div>
    )
  }

  const { chip, bar } = getDomainColor(useCase.domain)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/usecases" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-400 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            목록
          </Link>
          <span className="text-slate-700">/</span>
          <Link href="/" className="text-xs text-slate-500 hover:text-violet-400 transition-colors">검색</Link>
        </div>
        <DeleteButton id={useCase.id} />
      </div>

      {/* Header card */}
      <div className="rounded-2xl border border-[#2A3042] bg-[#161B27] overflow-hidden shadow-sm">
        <div className={`h-1 bg-gradient-to-r ${bar}`} />
        <div className="p-6 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`domain-chip ${chip}`}>{useCase.domain}</span>
            <span className="text-xs font-mono text-slate-500 bg-[#1E2433] px-2 py-0.5 rounded-md border border-[#2A3042]">
              v{useCase.version}
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-100 leading-tight">
            {useCase.title}
          </h1>
          <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />{useCase.scenarios.length} 시나리오</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />{useCase.rules.length} 규칙</span>
            {useCase.exceptions.length > 0 && (
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-400" />{useCase.exceptions.length} 예외</span>
            )}
          </div>
        </div>
      </div>

      {/* Scenarios */}
      <section className="rounded-2xl border border-[#2A3042] bg-[#161B27] overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-[#2A3042] bg-[#1E2433]">
          <span className="w-5 h-5 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shrink-0">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5.5L4 7.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">시나리오</h2>
          <span className="ml-auto text-xs text-slate-600">{useCase.scenarios.length}단계</span>
        </div>
        <ol className="p-6 space-y-0">
          {useCase.scenarios
            .sort((a, b) => a.stepOrder - b.stepOrder)
            .map((step, idx, arr) => (
              <li key={step.id} className="relative flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white text-[11px] font-bold shadow-sm shrink-0 z-10">
                    {step.stepOrder}
                  </div>
                  {idx < arr.length - 1 && (
                    <div className="w-px flex-1 bg-gradient-to-b from-emerald-500/30 to-cyan-500/10 my-1 min-h-[16px]" />
                  )}
                </div>
                <div className={`flex-1 pt-0.5 ${idx < arr.length - 1 ? 'pb-5' : ''}`}>
                  <p className="text-sm text-slate-300 leading-relaxed">{step.description}</p>
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
      <section className="rounded-2xl border border-[#2A3042] bg-[#161B27] overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-[#2A3042] bg-[#1E2433]">
          <span className="w-5 h-5 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <rect x="1.5" y="2" width="7" height="1.2" rx="0.6" fill="white"/>
              <rect x="1.5" y="4.4" width="5" height="1.2" rx="0.6" fill="white"/>
              <rect x="1.5" y="6.8" width="6" height="1.2" rx="0.6" fill="white"/>
            </svg>
          </span>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">비즈니스 규칙</h2>
          <span className="ml-auto text-xs text-slate-600">{useCase.rules.length}개</span>
        </div>
        <ul className="divide-y divide-[#2A3042]">
          {useCase.rules.map(rule => (
            <li key={rule.id} className="flex gap-4 px-6 py-5">
              <div className="w-0.5 shrink-0 rounded-full bg-gradient-to-b from-cyan-400 to-blue-500 self-stretch" />
              <div className="flex-1 space-y-2">
                <p className="text-sm text-slate-300 leading-relaxed">{rule.description}</p>
                <code className="block bg-[#0D1117] text-cyan-300 rounded-lg px-3 py-2 font-mono text-xs leading-relaxed border border-cyan-500/20 overflow-x-auto whitespace-pre-wrap break-all">
                  {rule.constraint}
                </code>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Exceptions */}
      {useCase.exceptions.length > 0 && (
        <section className="rounded-2xl border border-[#2A3042] bg-[#161B27] overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-[#2A3042] bg-[#1E2433]">
            <span className="w-5 h-5 rounded-lg bg-gradient-to-br from-rose-400 to-orange-500 flex items-center justify-center shrink-0">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M5 1.5L8.5 7.5H1.5L5 1.5Z" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/>
                <path d="M5 4v1.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </span>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">예외 처리</h2>
            <span className="ml-auto text-xs text-slate-600">{useCase.exceptions.length}개</span>
          </div>
          <ul className="divide-y divide-[#2A3042]">
            {useCase.exceptions.map(exc => (
              <li key={exc.id} className="flex gap-4 px-6 py-5">
                <div className="w-0.5 shrink-0 rounded-full bg-gradient-to-b from-rose-400 to-orange-500 self-stretch" />
                <div className="flex-1 space-y-1.5">
                  <p className="text-sm text-slate-300 leading-relaxed">{exc.condition}</p>
                  <p className="text-xs text-slate-500">
                    <span className="font-semibold text-rose-400/70">처리: </span>{exc.handling}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
