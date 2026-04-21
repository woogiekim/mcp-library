'use client'

import { useState } from 'react'
import { SearchBar } from '@/components/SearchBar'
import { UseCaseCard } from '@/components/UseCaseCard'
import type { UseCase } from '@mcp-library/types'

export default function HomePage() {
  const [results, setResults] = useState<UseCase[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')

  async function handleSearch(q: string) {
    setQuery(q)
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.useCases ?? [])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">UseCase 검색</h1>
        <p className="text-gray-500">도메인 지식을 자연어로 검색하세요</p>
      </div>

      <SearchBar onSearch={handleSearch} />

      {loading && (
        <div className="text-center text-gray-400 py-12">검색 중...</div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">
            &quot;{query}&quot; 검색 결과 — {results.length}개
          </p>
          <div className="grid gap-4">
            {results.map(uc => (
              <UseCaseCard key={uc.id} useCase={uc} />
            ))}
          </div>
        </div>
      )}

      {!loading && query && results.length === 0 && (
        <div className="text-center text-gray-400 py-12">
          검색 결과가 없습니다.
        </div>
      )}
    </div>
  )
}
