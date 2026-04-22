import Link from 'next/link'
import type { UseCase } from '@mcp-library/types'

interface Props {
  useCase: UseCase
}

const domainConfig: Record<string, { header: string; text: string }> = {
  order:      { header: 'from-violet-600 to-violet-500',   text: '#7C3AED' },
  member:     { header: 'from-blue-600 to-blue-500',       text: '#2563EB' },
  review:     { header: 'from-emerald-600 to-emerald-500', text: '#059669' },
  coupon:     { header: 'from-amber-500 to-amber-400',     text: '#D97706' },
  settlement: { header: 'from-cyan-600 to-cyan-500',       text: '#0891B2' },
  payment:    { header: 'from-rose-600 to-rose-500',       text: '#E11D48' },
}

function getConfig(domain: string) {
  return domainConfig[domain.toLowerCase()] ?? { header: 'from-slate-600 to-slate-500', text: '#64748B' }
}

export function UseCaseCard({ useCase }: Props) {
  const cfg = getConfig(useCase.domain)

  return (
    <Link
      href={`/usecase/${useCase.id}`}
      className="group flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden transition-all duration-200 hover:shadow-2xl hover:-translate-y-1 hover:border-transparent"
    >
      {/* Colored domain header */}
      <div className={`bg-gradient-to-r ${cfg.header} px-4 py-3 flex items-center justify-between`}>
        <span className="text-[11px] font-black text-white/90 uppercase tracking-widest">
          {useCase.domain}
        </span>
        <span className="text-[10px] font-mono text-white/60">v{useCase.version}</span>
      </div>

      {/* Card body */}
      <div className="flex-1 px-4 py-4 space-y-3">
        <h3 className="font-bold text-slate-900 group-hover:text-violet-700 transition-colors leading-snug text-[14px]">
          {useCase.title}
        </h3>

        {useCase.rules.length > 0 && (
          <p className="text-[11px] font-mono text-slate-500 bg-slate-50 border border-slate-100 rounded-md px-2.5 py-1.5 line-clamp-2 leading-relaxed">
            {useCase.rules[0].constraint}
          </p>
        )}
      </div>

      {/* Card footer */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span>{useCase.scenarios.length} steps</span>
          <span className="w-px h-3 bg-slate-200" />
          <span>{useCase.rules.length} rules</span>
          {useCase.exceptions?.length > 0 && (
            <>
              <span className="w-px h-3 bg-slate-200" />
              <span className="text-rose-400">{useCase.exceptions.length} exc</span>
            </>
          )}
        </div>
        <span className="text-[11px] font-semibold text-violet-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          보기
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </div>
    </Link>
  )
}
