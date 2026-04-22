import Link from 'next/link'
import type { UseCase } from '@mcp-library/types'

interface Props {
  useCase: UseCase
}

const domainConfig: Record<string, {
  label: string
  badge: string
  stripe: string
  shadow: string
}> = {
  order:      { label: 'Order',      badge: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',  stripe: 'bg-violet-500',   shadow: 'hover:shadow-violet-100/60' },
  member:     { label: 'Member',     badge: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',        stripe: 'bg-blue-500',     shadow: 'hover:shadow-blue-100/60' },
  review:     { label: 'Review',     badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', stripe: 'bg-emerald-500', shadow: 'hover:shadow-emerald-100/60' },
  coupon:     { label: 'Coupon',     badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',     stripe: 'bg-amber-500',    shadow: 'hover:shadow-amber-100/60' },
  settlement: { label: 'Settlement', badge: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200',        stripe: 'bg-cyan-500',     shadow: 'hover:shadow-cyan-100/60' },
  payment:    { label: 'Payment',    badge: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',        stripe: 'bg-rose-500',     shadow: 'hover:shadow-rose-100/60' },
}

function getConfig(domain: string) {
  return domainConfig[domain.toLowerCase()] ?? {
    label: domain,
    badge: 'bg-slate-50 text-slate-600 ring-1 ring-slate-200',
    stripe: 'bg-slate-400',
    shadow: 'hover:shadow-slate-100/60',
  }
}

export function UseCaseCard({ useCase }: Props) {
  const cfg = getConfig(useCase.domain)

  return (
    <Link
      href={`/usecase/${useCase.id}`}
      className={`group flex rounded-xl border border-slate-100 bg-white overflow-hidden transition-all duration-200 hover:border-slate-200 hover:shadow-xl ${cfg.shadow} hover:-translate-y-0.5`}
    >
      {/* Left accent stripe */}
      <div className={`w-1 shrink-0 ${cfg.stripe}`} />

      <div className="flex-1 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1.5 min-w-0">
            {/* Domain badge + version */}
            <div className="flex items-center gap-2">
              <span className={`domain-chip ${cfg.badge}`}>
                {useCase.domain}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">v{useCase.version}</span>
            </div>

            {/* Title */}
            <h3 className="font-bold text-slate-900 group-hover:text-violet-700 transition-colors leading-snug text-[15px]">
              {useCase.title}
            </h3>

            {/* Rule preview */}
            {useCase.rules.length > 0 && (
              <p className="text-xs text-slate-500 line-clamp-1 font-mono bg-slate-50 rounded px-2 py-0.5 w-fit max-w-full truncate">
                {useCase.rules[0].constraint}
              </p>
            )}
          </div>

          {/* Stats + arrow */}
          <div className="shrink-0 flex flex-col items-end gap-2">
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M1 6L3.5 9L11 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {useCase.scenarios.length} steps
              </span>
              <span className="flex items-center gap-1">
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <rect x="1.5" y="2" width="9" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M4 5.5h4M4 7.5h2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {useCase.rules.length} rules
              </span>
              {useCase.exceptions && useCase.exceptions.length > 0 && (
                <span className="text-rose-400 flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1.5l4.5 8H1.5L6 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                    <path d="M6 5.5v1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  {useCase.exceptions.length}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-xs text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
              상세 보기
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
