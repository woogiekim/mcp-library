import Link from 'next/link'
import type { UseCase } from '@mcp-library/types'

interface Props {
  useCase: UseCase
}

const domainStyle: Record<string, { chip: string; glow: string; dot: string }> = {
  order:      { chip: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',  glow: 'hover:shadow-violet-100',   dot: 'bg-violet-500' },
  member:     { chip: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',        glow: 'hover:shadow-blue-100',     dot: 'bg-blue-500' },
  review:     { chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', glow: 'hover:shadow-emerald-100', dot: 'bg-emerald-500' },
  coupon:     { chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',     glow: 'hover:shadow-amber-100',    dot: 'bg-amber-500' },
  settlement: { chip: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200',        glow: 'hover:shadow-cyan-100',     dot: 'bg-cyan-500' },
  payment:    { chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',        glow: 'hover:shadow-rose-100',     dot: 'bg-rose-500' },
}

function getDomainStyle(domain: string) {
  return domainStyle[domain.toLowerCase()] ?? {
    chip: 'bg-slate-50 text-slate-600 ring-1 ring-slate-200',
    glow: 'hover:shadow-slate-100',
    dot: 'bg-slate-400',
  }
}

export function UseCaseCard({ useCase }: Props) {
  const style = getDomainStyle(useCase.domain)

  return (
    <Link
      href={`/usecase/${useCase.id}`}
      className={`group block rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 card-hover hover:border-slate-200 hover:shadow-lg ${style.glow}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2 min-w-0">
          {/* Domain + version row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`domain-chip ${style.chip} flex items-center gap-1`}>
              <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
              {useCase.domain}
            </span>
            <span className="text-xs text-slate-400 font-mono">v{useCase.version}</span>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-slate-900 group-hover:text-violet-700 transition-colors leading-snug">
            {useCase.title}
          </h3>

          {/* First rule preview */}
          {useCase.rules.length > 0 && (
            <p className="text-xs text-slate-500 line-clamp-1 font-mono">
              {useCase.rules[0].constraint}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="shrink-0 flex flex-col items-end gap-1 text-xs text-slate-400">
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
          {useCase.exceptions && useCase.exceptions.length > 0 && (
            <span className="flex items-center gap-1 text-rose-400">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M5 1L9 8H1L5 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M5 4.5v1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {useCase.exceptions.length} exc
            </span>
          )}
        </div>
      </div>

      {/* Bottom arrow indicator on hover */}
      <div className="mt-3 flex items-center gap-1 text-xs text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity">
        <span>상세 보기</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </Link>
  )
}
