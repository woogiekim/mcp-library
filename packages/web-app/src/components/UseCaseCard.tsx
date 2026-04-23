import Link from 'next/link'
import type { UseCase } from '@mcp-library/types'

interface Props {
  useCase: UseCase
}

const domainStyle: Record<string, { chip: string; glow: string; dot: string }> = {
  order:      { chip: 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30',    glow: 'hover:shadow-violet-900/40',   dot: 'bg-violet-400' },
  member:     { chip: 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30',          glow: 'hover:shadow-blue-900/40',     dot: 'bg-blue-400' },
  review:     { chip: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30', glow: 'hover:shadow-emerald-900/40',  dot: 'bg-emerald-400' },
  coupon:     { chip: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',       glow: 'hover:shadow-amber-900/40',    dot: 'bg-amber-400' },
  settlement: { chip: 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30',          glow: 'hover:shadow-cyan-900/40',     dot: 'bg-cyan-400' },
  payment:    { chip: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30',          glow: 'hover:shadow-rose-900/40',     dot: 'bg-rose-400' },
}

function getDomainStyle(domain: string) {
  return domainStyle[domain.toLowerCase()] ?? {
    chip: 'bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/30',
    glow: 'hover:shadow-slate-900/40',
    dot: 'bg-slate-400',
  }
}

export function UseCaseCard({ useCase }: Props) {
  const style = getDomainStyle(useCase.domain)
  const hasExceptions = useCase.exceptions && useCase.exceptions.length > 0

  return (
    <Link
      href={`/usecase/${useCase.id}`}
      className={`group block rounded-2xl border border-[#2A3042] bg-[#161B27] p-5 shadow-sm transition-all duration-200 card-hover hover:border-violet-500/40 hover:shadow-lg h-36 overflow-hidden ${style.glow}`}
    >
      <div className="flex items-start justify-between gap-4 h-full">
        <div className="flex-1 flex flex-col gap-2 min-w-0 h-full">
          {/* Row 1: domain chip + version */}
          <div className="flex items-center gap-2 shrink-0">
            <span className={`domain-chip ${style.chip} flex items-center gap-1`}>
              <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
              {useCase.domain}
            </span>
            <span className="text-xs text-slate-600 font-mono">v{useCase.version}</span>
          </div>

          {/* Row 2: title */}
          <h3 className="font-semibold text-slate-200 group-hover:text-violet-300 transition-colors leading-snug line-clamp-1 shrink-0">
            {useCase.title}
          </h3>

          {/* Row 3: constraint — always reserve height */}
          <p className="text-xs text-slate-500 line-clamp-1 font-mono shrink-0">
            {useCase.rules.length > 0 ? useCase.rules[0].constraint : ' '}
          </p>

          {/* Row 4: hover cue — pushes to bottom */}
          <div className="mt-auto flex items-center gap-1 text-xs text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
            <span>상세 보기</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Right: stats — always 3 rows to keep width stable */}
        <div className="shrink-0 flex flex-col items-end gap-1 text-xs text-slate-600">
          <span className="flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M5 3v2.5L6.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {useCase.scenarios.length} steps
          </span>
          <span className="flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <rect x="1" y="2" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M3 5h4M3 7h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {useCase.rules.length} rules
          </span>
          <span className={`flex items-center gap-1 text-rose-400/70 ${hasExceptions ? '' : 'invisible'}`}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M5 1L9 8H1L5 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M5 4.5v1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {useCase.exceptions?.length ?? 0} exc
          </span>
        </div>
      </div>
    </Link>
  )
}
