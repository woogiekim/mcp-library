'use client'

import { useState, useEffect, useRef } from 'react'

interface Props {
  onSearch: (query: string) => void
}

export function SearchBar({ onSearch }: Props) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (value.trim()) onSearch(value.trim())
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className={`relative flex items-center rounded-2xl border-2 bg-white transition-all duration-200 shadow-sm ${
        focused
          ? 'border-violet-500 shadow-lg shadow-violet-100 ring-4 ring-violet-100/50'
          : 'border-slate-200 hover:border-slate-300'
      }`}>
        <div className="absolute left-5 text-slate-400 pointer-events-none">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="결제 취소 정책, 회원 등급 기준, 배송 상태 조회..."
          className="w-full pl-14 pr-40 py-5 bg-transparent text-base text-slate-800 placeholder:text-slate-400 outline-none rounded-2xl"
        />

        {/* ⌘K hint */}
        {!focused && !value && (
          <div className="absolute right-32 flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 border border-slate-200 rounded">⌘</kbd>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 border border-slate-200 rounded">K</kbd>
          </div>
        )}

        <button
          type="submit"
          disabled={!value.trim()}
          className="absolute right-3 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-violet-200 hover:shadow-lg active:scale-95"
        >
          검색
        </button>
      </div>

      <p className="mt-3 text-center text-xs text-slate-400">
        자연어로 도메인 지식을 검색하세요 — UseCase 기반 AI가 답변합니다
      </p>
    </form>
  )
}
