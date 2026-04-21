import type { UseCase } from '@mcp-library/types'

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

export default async function UseCaseDetailPage({ params }: Props) {
  const useCase = await fetchUseCase(params.id)

  if (!useCase) {
    return (
      <div className="text-center py-20 text-gray-400">
        UseCase를 찾을 수 없습니다.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
            {useCase.domain}
          </span>
          <span className="text-sm text-gray-400">v{useCase.version}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{useCase.title}</h1>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">시나리오</h2>
        <ol className="space-y-2">
          {useCase.scenarios
            .sort((a, b) => a.stepOrder - b.stepOrder)
            .map(step => (
              <li key={step.id} className="flex gap-3 rounded-lg bg-white border border-gray-100 p-4">
                <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                  {step.stepOrder}
                </span>
                <div>
                  <p className="text-sm text-gray-800">{step.description}</p>
                  {step.expected && (
                    <p className="mt-1 text-xs text-gray-400">기대 결과: {step.expected}</p>
                  )}
                </div>
              </li>
            ))}
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">규칙</h2>
        <ul className="space-y-2">
          {useCase.rules.map(rule => (
            <li key={rule.id} className="rounded-lg bg-amber-50 border border-amber-100 p-4">
              <p className="text-sm font-medium text-amber-900">{rule.description}</p>
              <p className="text-xs text-amber-700 mt-1">제약: {rule.constraint}</p>
            </li>
          ))}
        </ul>
      </section>

      {useCase.exceptions.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">예외 처리</h2>
          <ul className="space-y-2">
            {useCase.exceptions.map(exc => (
              <li key={exc.id} className="rounded-lg bg-red-50 border border-red-100 p-4">
                <p className="text-sm font-medium text-red-900">조건: {exc.condition}</p>
                <p className="text-xs text-red-700 mt-1">처리: {exc.handling}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
