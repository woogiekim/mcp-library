import type { UseCase } from '@mcp-library/types'
import Link from 'next/link'
import { DeleteButton } from './DeleteButton'
import { BackButton } from './BackButton'

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
  order:      'bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30',
  member:     'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30',
  review:     'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
  coupon:     'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
  settlement: 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30',
  payment:    'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30',
}

function getDomainChip(domain: string) {
  return domainColor[domain.toLowerCase()] ?? 'bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/30'
}

export default async function UseCaseDetailPage({ params }: Props) {
  const useCase = await fetchUseCase(params.id)

  if (!useCase) {
    return (
      <div className="max-w-2xl mx-auto w-full text-center py-24 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-rose-400">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="text-slate-400 font-medium">UseCase를 찾을 수 없습니다</p>
        <Link href="/" className="inline-block text-sm text-violet-400 hover:underline">← 목록으로 돌아가기</Link>
      </div>
    )
  }

  const chip = getDomainChip(useCase.domain)

  return (
    <div className="max-w-2xl mx-auto w-full space-y-3">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-2">
        <BackButton />
        <DeleteButton id={useCase.id} />
      </div>

      {/* Header card */}
      <div className="rounded-2xl border border-[#2A3042] bg-[#161B27] p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 min-w-0">
            <span className={`domain-chip inline-flex ${chip}`}>{useCase.domain}</span>
            <h1 className="text-base font-black text-slate-200 leading-snug">{useCase.title}</h1>
            <span className="text-[10px] font-mono text-slate-600">v{useCase.version}</span>
          </div>
          <div className="text-[10px] text-slate-600 text-right shrink-0 space-y-1 pt-1">
            <div className="flex items-center gap-1 justify-end"><div className="w-2 h-2 rounded-full bg-emerald-400" />{useCase.scenarios.length} 시나리오</div>
            <div className="flex items-center gap-1 justify-end"><div className="w-2 h-2 rounded-full bg-cyan-400" />{useCase.rules.length} 규칙</div>
            {useCase.exceptions.length > 0 && (
              <div className="flex items-center gap-1 justify-end"><div className="w-2 h-2 rounded-full bg-rose-400" />{useCase.exceptions.length} 예외</div>
            )}
          </div>
        </div>
      </div>

      {/* Scenarios */}
      <div className="rounded-2xl border border-[#2A3042] bg-[#161B27] p-5 shadow-sm">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">시나리오</h4>
        <ol className="space-y-4">
          {useCase.scenarios
            .sort((a, b) => a.stepOrder - b.stepOrder)
            .map((s, idx, arr) => (
              <li key={s.id} className="flex gap-3 relative">
                {idx < arr.length - 1 && (
                  <div className="absolute left-[9px] top-5 bottom-[-12px] w-px bg-gradient-to-b from-emerald-500/30 to-cyan-500/10" />
                )}
                <span className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-white text-[10px] font-black flex items-center justify-center shrink-0 shadow-sm shadow-emerald-900/50 relative z-10">
                  {s.stepOrder}
                </span>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-xs text-slate-300 leading-relaxed">{s.description}</p>
                  {s.expected && (
                    <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                      <span className="text-emerald-400">→</span> {s.expected}
                    </p>
                  )}
                </div>
              </li>
            ))}
        </ol>
      </div>

      {/* Rules */}
      <div className="rounded-2xl border border-[#2A3042] bg-[#161B27] p-5 shadow-sm">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">비즈니스 규칙</h4>
        <ul className="space-y-3">
          {useCase.rules.map(rule => (
            <li key={rule.id} className="border-l-[3px] border-cyan-400 pl-3">
              <p className="text-xs text-slate-300 leading-relaxed">{rule.description}</p>
              {rule.constraint && (
                <code className="mt-1.5 block bg-[#0D1117] text-cyan-300 rounded-lg px-3 py-1.5 font-mono text-[10px] leading-relaxed overflow-x-auto border border-[#2A3042]">
                  {rule.constraint}
                </code>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Exceptions */}
      {useCase.exceptions.length > 0 && (
        <div className="rounded-2xl border border-[#2A3042] bg-[#161B27] p-5 shadow-sm">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">예외 처리</h4>
          <ul className="space-y-3">
            {useCase.exceptions.map(exc => (
              <li key={exc.id} className="border-l-[3px] border-rose-400 pl-3">
                <p className="text-xs font-semibold text-slate-300">{exc.condition}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{exc.handling}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
