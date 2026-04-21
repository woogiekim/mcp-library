import { useState, useEffect } from 'react'
import type { MCPClientCore } from '@mcp-library/mcp-client-core'
import type { UseCase } from '@mcp-library/types'

interface Props {
  client: MCPClientCore
  onSelectUseCase: (uc: UseCase) => void
}

export function BrowserView({ client, onSelectUseCase }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UseCase[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) search(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  async function search(q: string) {
    setLoading(true)
    try {
      const useCases = await client.searchUseCases(q)
      setResults(useCases)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">UseCase 탐색</h2>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="도메인 또는 제목으로 검색..."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {loading && <p className="text-sm text-gray-400 text-center py-4">검색 중...</p>}
        {!loading && results.map(uc => (
          <button
            key={uc.id}
            onClick={() => onSelectUseCase(uc)}
            className="w-full text-left rounded-lg border border-gray-100 bg-white p-3 hover:border-blue-200 transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs rounded-full bg-blue-50 px-2 py-0.5 text-blue-700 font-medium">
                {uc.domain}
              </span>
              <span className="text-xs text-gray-400">v{uc.version}</span>
            </div>
            <p className="text-sm font-medium text-gray-800">{uc.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {uc.scenarios.length} steps · {uc.rules.length} rules
            </p>
          </button>
        ))}
        {!loading && query && results.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">검색 결과 없음</p>
        )}
      </div>
    </div>
  )
}
