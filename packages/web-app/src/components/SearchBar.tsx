'use client'

import { useState } from 'react'

interface Props {
  onSearch: (query: string) => void
}

export function SearchBar({ onSearch }: Props) {
  const [value, setValue] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (value.trim()) onSearch(value.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative flex items-center">
        {/* Search icon */}
        <div className="absolute left-4 text-slate-400 pointer-events-none">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
        </div>

        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="결제 취소 정책, 회원 등급 기준, 배송 상태 조회..."
          className="search-input w-full pl-12 pr-36 py-4 rounded-2xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all shadow-sm"
        />

        <button
          type="submit"
          disabled={!value.trim()}
          className="absolute right-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-violet-200 hover:shadow-lg hover:shadow-violet-200 active:scale-95"
        >
          검색
        </button>
      </div>

      {/* Subtle hint */}
      <p className="mt-2.5 text-center text-xs text-slate-400">
        자연어로 도메인 지식을 검색하세요 — UseCase 기반 AI가 답변합니다
      </p>
    </form>
  )
}
