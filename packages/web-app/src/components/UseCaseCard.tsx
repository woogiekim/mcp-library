import Link from 'next/link'
import type { UseCase } from '@mcp-library/types'

interface Props {
  useCase: UseCase
}

export function UseCaseCard({ useCase }: Props) {
  return (
    <Link
      href={`/usecase/${useCase.id}`}
      className="block rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:border-blue-200 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              {useCase.domain}
            </span>
            <span className="text-xs text-gray-400">v{useCase.version}</span>
          </div>
          <h3 className="font-semibold text-gray-900">{useCase.title}</h3>
          {useCase.rules.length > 0 && (
            <p className="text-sm text-gray-500 line-clamp-1">
              {useCase.rules[0].description}
            </p>
          )}
        </div>
        <div className="shrink-0 text-xs text-gray-400 whitespace-nowrap">
          {useCase.scenarios.length} steps · {useCase.rules.length} rules
        </div>
      </div>
    </Link>
  )
}
