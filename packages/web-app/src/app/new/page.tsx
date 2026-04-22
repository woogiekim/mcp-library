'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ExtractedUseCase {
  domain: string
  title: string
  version: string
  scenarios: { stepOrder: number; description: string; expected: string | null }[]
  rules: { description: string; constraint: string }[]
  exceptions: { condition: string; handling: string }[]
}

const GREETING = '안녕하세요! 어떤 업무 프로세스를 UseCase로 만들고 싶으신가요?\n예: "주문 취소 프로세스", "회원 등급 산정 방식", "리뷰 작성 정책" 등 자유롭게 설명해주세요.'

export default function NewUseCasePage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: GREETING },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [extracted, setExtracted] = useState<ExtractedUseCase | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedId, setSavedId] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, extracted])

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMsg: Message = { role: 'user', content: input.trim() }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })
      const data = await res.json()
      if (data.message) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleExtract() {
    setExtracting(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, extract: true }),
      })
      const data = await res.json()
      if (data.useCase) {
        setExtracted(data.useCase)
      } else {
        alert('추출에 실패했습니다. 더 자세히 설명해주세요.')
      }
    } finally {
      setExtracting(false)
    }
  }

  async function handleSave() {
    if (!extracted) return
    setSaving(true)
    try {
      const payload = {
        ...extracted,
        scenarios: extracted.scenarios.map(s => ({ ...s, expected: s.expected ?? undefined })),
        exceptions: extracted.exceptions ?? [],
      }
      const res = await fetch('/api/usecases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok && data.id) {
        setSaved(true)
        setSavedId(data.id)
      } else {
        alert('저장 실패: ' + JSON.stringify(data))
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/" className="text-xs text-slate-400 hover:text-violet-600 flex items-center gap-1 transition-colors">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M8 10L4 6l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              홈으로
            </Link>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">UseCase 등록</h1>
          <p className="text-sm text-slate-500 mt-0.5">AI와 대화하며 UseCase를 자연스럽게 도출하세요</p>
        </div>

        <button
          onClick={handleExtract}
          disabled={messages.length < 3 || extracting || saved}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:from-violet-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-violet-200 hover:shadow-lg active:scale-95"
        >
          {extracting ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              추출 중...
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              UseCase 추출하기
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-5 gap-5 min-h-[600px]">
        {/* Chat panel */}
        <div className="col-span-3 flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-sm">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 4h10M2 7h7M2 10h5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700">UseCase 분석가</p>
              <p className="text-xs text-slate-400">AI가 대화로 UseCase를 도출합니다</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center mr-2 mt-0.5 shrink-0">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <circle cx="5" cy="5" r="4" fill="white" fillOpacity="0.9"/>
                    </svg>
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-violet-600 to-blue-600 text-white rounded-tr-sm shadow-md shadow-violet-100'
                      : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-sm'
                  }`}
                >
                  {msg.content.split('\n').map((line, j) => (
                    <span key={j}>{line}{j < msg.content.split('\n').length - 1 && <br/>}</span>
                  ))}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center mr-2 mt-0.5 shrink-0">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <circle cx="5" cy="5" r="4" fill="white" fillOpacity="0.9"/>
                  </svg>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-100 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="업무 프로세스를 자유롭게 설명하세요..."
                disabled={loading || saved}
                className="flex-1 text-sm px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all placeholder:text-slate-400 disabled:bg-slate-50"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading || saved}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:from-violet-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M14 2L7 9M14 2L9.5 14L7 9L2 6.5L14 2Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Preview panel */}
        <div className="col-span-2 flex flex-col gap-4">
          {!extracted ? (
            <div className="flex-1 rounded-2xl border border-dashed border-slate-200 bg-white flex flex-col items-center justify-center p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-300">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M8 7h8M8 12h8M8 17h5" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-400">AI와 대화 후</p>
              <p className="text-xs text-slate-300 mt-1">[UseCase 추출하기]를 누르면<br/>여기에 구조가 나타납니다</p>
            </div>
          ) : saved ? (
            <div className="flex-1 rounded-2xl border border-emerald-200 bg-emerald-50 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-600">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-base font-bold text-emerald-700">등록 완료!</p>
              <p className="text-xs text-emerald-600 mt-1 font-mono break-all px-2">{savedId}</p>
              <div className="flex gap-2 mt-5">
                <Link
                  href={`/usecase/${savedId}`}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
                >
                  상세 보기
                </Link>
                <Link
                  href="/"
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-colors"
                >
                  홈으로
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 overflow-y-auto">
              {/* Domain + title */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="space-y-1.5">
                    <span className="domain-chip bg-violet-50 text-violet-700 ring-1 ring-violet-200">
                      {extracted.domain}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{extracted.title}</h3>
                    <span className="text-xs font-mono text-slate-400">v{extracted.version}</span>
                  </div>
                  <div className="text-xs text-slate-400 text-right shrink-0 space-y-0.5">
                    <div>{extracted.scenarios.length} 시나리오</div>
                    <div>{extracted.rules.length} 규칙</div>
                    {extracted.exceptions.length > 0 && <div>{extracted.exceptions.length} 예외</div>}
                  </div>
                </div>
              </div>

              {/* Scenarios */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">시나리오</h4>
                <ol className="space-y-2">
                  {extracted.scenarios.map(s => (
                    <li key={s.stepOrder} className="flex gap-3">
                      <span className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {s.stepOrder}
                      </span>
                      <div>
                        <p className="text-xs text-slate-700">{s.description}</p>
                        {s.expected && <p className="text-xs text-slate-400 mt-0.5">→ {s.expected}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Rules */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">규칙</h4>
                <ul className="space-y-2">
                  {extracted.rules.map((r, i) => (
                    <li key={i} className="flex gap-2">
                      <div className="w-1 rounded-full bg-gradient-to-b from-cyan-400 to-blue-500 shrink-0" />
                      <div>
                        <p className="text-xs text-slate-700">{r.description}</p>
                        <code className="text-xs text-cyan-600 font-mono">{r.constraint}</code>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Exceptions */}
              {extracted.exceptions.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">예외</h4>
                  <ul className="space-y-2">
                    {extracted.exceptions.map((e, i) => (
                      <li key={i} className="flex gap-2">
                        <div className="w-1 rounded-full bg-gradient-to-b from-rose-400 to-orange-400 shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-slate-700">{e.condition}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{e.handling}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 disabled:opacity-50 transition-all shadow-md shadow-violet-200 hover:shadow-lg active:scale-[0.98]"
              >
                {saving ? '저장 중...' : '✓ UseCase 등록하기'}
              </button>

              <button
                onClick={() => { setExtracted(null) }}
                className="w-full py-2 rounded-xl text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                다시 대화하기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
