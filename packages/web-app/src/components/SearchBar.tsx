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
        <div className="absolute left-4 text-slate-500 pointer-events-none">
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
          className="search-input w-full pl-12 pr-4 py-4 rounded-full border border-[#2A3042] bg-[#161B27] text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 transition-all shadow-lg shadow-black/30"
        />
      </div>

      <p className="mt-2.5 text-center text-xs text-slate-600">
        자연어로 도메인 지식을 검색하세요 — UseCase 기반 AI가 답변합니다
      </p>
    </form>
  )
}
