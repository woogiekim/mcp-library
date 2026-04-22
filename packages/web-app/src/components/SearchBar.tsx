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
      <div className={`relative flex items-center rounded-2xl border-2 bg-white transition-all duration-150 ${
        focused
          ? 'border-violet-500 ring-2 ring-violet-100 shadow-sm'
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
          className="w-full pl-14 pr-6 py-4 bg-transparent text-base text-slate-800 placeholder:text-slate-400 outline-none rounded-2xl"
        />
      </div>

      <p className="mt-3 text-center text-xs text-slate-400">
        Enter로 검색 &nbsp;·&nbsp;
        <kbd className="font-mono bg-slate-100 border border-slate-200 rounded px-1 py-0.5">⌘K</kbd>
        &nbsp;로 포커스
      </p>
    </form>
  )
}
