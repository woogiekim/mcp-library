import Link from 'next/link'
import type { UseCase } from '@mcp-library/types'

interface Props {
  useCase: UseCase
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

export function UseCaseCard({ useCase }: Props) {
  const color = getDomainColor(useCase.domain)

  return (
    <Link
      href={`/usecase/${useCase.id}`}
      className="group flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden transition-all duration-150 hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex-1 px-4 pt-4 pb-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${color}`}>
            {useCase.domain}
          </span>
          <span className="text-[10px] font-mono text-slate-400">v{useCase.version}</span>
        </div>

        <h3 className="font-semibold text-slate-800 group-hover:text-violet-700 transition-colors leading-snug text-sm">
          {useCase.title}
        </h3>

        {useCase.rules.length > 0 && (
          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
            {useCase.rules[0].constraint}
          </p>
        )}
      </div>

      <div className="px-4 pb-3 flex items-center gap-3 text-[11px] text-slate-400 border-t border-slate-100 pt-2.5">
        <span>{useCase.scenarios.length} 시나리오</span>
        <span className="w-px h-3 bg-slate-200" />
        <span>{useCase.rules.length} 규칙</span>
        {useCase.exceptions?.length > 0 && (
          <>
            <span className="w-px h-3 bg-slate-200" />
            <span className="text-rose-400">{useCase.exceptions.length} 예외</span>
          </>
        )}
        <span className="ml-auto text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-medium">
          보기 →
        </span>
      </div>
    </Link>
  )
}
