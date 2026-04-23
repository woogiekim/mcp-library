'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant'
  content: string
  time: string
}

interface ExtractedUseCase {
  domain: string
  title: string
  version: string
  scenarios: { stepOrder: number; description: string; expected: string | null }[]
  rules: { description: string; constraint: string }[]
  exceptions: { condition: string; handling: string }[]
}

const DOMAIN_CHIP: Record<string, string> = {
  order:      'bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30',
  payment:    'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30',
  member:     'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30',
  review:     'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
  coupon:     'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
  settlement: 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30',
}

function getDomainChip(domain: string) {
  return DOMAIN_CHIP[domain] ?? 'bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/30'
}

function nowTime() {
  return new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
}

const GREETING = '안녕하세요! 어떤 업무 프로세스를 UseCase로 만들고 싶으신가요?\n예: "주문 취소 프로세스", "회원 등급 산정 방식", "리뷰 작성 정책" 등 자유롭게 설명해주세요.'

export default function NewUseCasePage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: GREETING, time: nowTime() },
  ])
  const [input, setInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [extracted, setExtracted] = useState<ExtractedUseCase | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, chatLoading])

  // AI 응답 후 백그라운드에서 오른쪽 패널 자동 갱신
  async function backgroundExtract(msgs: Message[]) {
    setExtracting(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: msgs.map(({ role, content }) => ({ role, content })),
          extract: true,
        }),
      })
      const data = await res.json()
      if (data.useCase) {
        const uc = data.useCase
        setExtracted({
          ...uc,
          scenarios:  Array.isArray(uc.scenarios)  ? uc.scenarios  : [],
          rules:      Array.isArray(uc.rules)       ? uc.rules      : [],
          exceptions: Array.isArray(uc.exceptions)  ? uc.exceptions : [],
        })
      }
    } catch {
      // 조용히 실패 — 채팅은 계속
    } finally {
      setExtracting(false)
    }
  }

  async function sendMessage() {
    if (!input.trim() || chatLoading || savedId) return
    const userMsg: Message = { role: 'user', content: input.trim(), time: nowTime() }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    if (inputRef.current) inputRef.current.style.height = '42px'
    setChatLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })) }),
      })
      const data = await res.json()
      if (data.message) {
        const updated = [...next, { role: 'assistant' as const, content: data.message, time: nowTime() }]
        setMessages(updated)
        // AI 응답 후 백그라운드 추출 (채팅 흐름을 막지 않음)
        backgroundExtract(updated)
      } else if (data.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: '⚠ 오류가 발생했습니다. 다시 시도해주세요.', time: nowTime() }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠ 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.', time: nowTime() }])
    } finally {
      setChatLoading(false)
    }
  }

  async function handleSave() {
    if (!extracted) return
    setSaving(true)
    try {
      const payload = {
        ...extracted,
        scenarios: extracted.scenarios.map(s => ({ ...s, expected: s.expected ?? undefined })),
        exceptions: extracted.exceptions,
      }
      const res = await fetch('/api/usecases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok && data.id) {
        setSavedId(data.id)
      } else {
        alert('저장 실패: ' + JSON.stringify(data))
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 130px)', minHeight: '580px' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 shrink-0">
        <Link href="/" className="text-slate-500 hover:text-violet-400 transition-colors p-1">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 13L5 8l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-black text-slate-100 tracking-tight leading-none">UseCase 등록</h1>
          <p className="text-xs text-slate-500 mt-0.5">대화하면 오른쪽 패널이 자동으로 갱신됩니다</p>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-5 gap-5 flex-1 min-h-0">

        {/* ── 채팅 패널 ── */}
        <div className="col-span-3 flex flex-col rounded-2xl border border-[#2A3042] bg-[#161B27] shadow-sm overflow-hidden">
          {/* AI header */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-[#2A3042] bg-[#1E2433] shrink-0">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-sm shadow-violet-900/50">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2L13.196 5V11L8 14L2.804 11V5L8 2Z" fill="white" fillOpacity="0.9"/>
                </svg>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#1E2433]" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">UseCase 분석가</p>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide">AI · 온라인</p>
            </div>
            {extracting && (
              <div className="ml-auto flex items-center gap-1.5 text-[10px] text-violet-400">
                <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                분석 중...
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 min-h-0">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M5 1L8.73 3.25V7.75L5 10L1.27 7.75V3.25L5 1Z" fill="white" fillOpacity="0.9"/>
                    </svg>
                  </div>
                )}
                <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[82%]`}>
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-violet-600 to-blue-600 text-white rounded-tr-none shadow-md shadow-violet-900/50'
                      : 'bg-[#1E2433] text-slate-300 border border-[#2A3042] rounded-tl-none shadow-sm'
                  }`}>
                    {msg.content.split('\n').map((line, j, arr) => (
                      <span key={j}>{line}{j < arr.length - 1 && <br/>}</span>
                    ))}
                  </div>
                  <span className="text-[10px] mt-1 px-1 text-slate-600">{msg.time}</span>
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M5 1L8.73 3.25V7.75L5 10L1.27 7.75V3.25L5 1Z" fill="white" fillOpacity="0.9"/>
                  </svg>
                </div>
                <div className="bg-[#1E2433] border border-[#2A3042] rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1.5">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-violet-400"
                      style={{ animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 px-4 py-3 border-t border-[#2A3042] bg-[#161B27]/95 backdrop-blur-sm">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={e => {
                  setInput(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
                }}
                placeholder="업무 프로세스를 자유롭게 설명하세요... (Shift+Enter로 줄바꿈)"
                disabled={chatLoading || !!savedId}
                className="flex-1 text-sm px-4 py-2.5 rounded-xl border border-[#2A3042] focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none placeholder:text-slate-600 disabled:text-slate-600 bg-[#1E2433] text-slate-200 transition-all resize-none overflow-hidden leading-relaxed"
                style={{ minHeight: '42px', maxHeight: '120px' }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || chatLoading || !!savedId}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 text-white flex items-center justify-center shadow-md shadow-violet-900/50 hover:shadow-violet-900/70 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M14 2L7 9M14 2L9.5 14L7 9L2 6.5L14 2Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ── 오른쪽 패널 ── */}
        <div className="col-span-2 flex flex-col min-h-0 overflow-y-auto gap-3">

          {/* 저장 완료 */}
          {savedId ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center flex-1">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center mb-4">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M5 14l6.5 6.5L23 8" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-base font-black text-emerald-400">등록 완료!</p>
              <p className="text-xs text-emerald-500 mt-1">UseCase가 성공적으로 저장되었습니다</p>
              <div className="flex gap-2 mt-5 w-full">
                <Link href={`/usecase/${savedId}`}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-center shadow-sm shadow-emerald-900/50">
                  상세 보기
                </Link>
                <Link href="/new"
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-colors text-center">
                  새 UseCase
                </Link>
              </div>
              <Link href="/" className="mt-3 text-xs text-slate-600 hover:text-slate-400 transition-colors">홈으로</Link>
            </div>

          ) : extracted ? (
            <>
              {/* 분석 중 뱃지 */}
              {extracting && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-500/5 border border-violet-500/20 text-[10px] text-violet-400">
                  <svg className="animate-spin w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  대화 내용을 반영해 업데이트 중...
                </div>
              )}

              {/* Domain + title */}
              <div className="rounded-2xl border border-[#2A3042] bg-[#161B27] p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2 min-w-0">
                    <span className={`domain-chip inline-flex ${getDomainChip(extracted.domain)}`}>{extracted.domain}</span>
                    <h3 className="text-sm font-black text-slate-200 leading-snug">{extracted.title}</h3>
                    <span className="text-[10px] font-mono text-slate-600">v{extracted.version}</span>
                  </div>
                  <div className="text-[10px] text-slate-600 text-right shrink-0 space-y-1 pt-1">
                    <div className="flex items-center gap-1 justify-end"><div className="w-2 h-2 rounded-full bg-emerald-400" />{extracted.scenarios.length} 시나리오</div>
                    <div className="flex items-center gap-1 justify-end"><div className="w-2 h-2 rounded-full bg-cyan-400" />{extracted.rules.length} 규칙</div>
                    {extracted.exceptions.length > 0 && (
                      <div className="flex items-center gap-1 justify-end"><div className="w-2 h-2 rounded-full bg-rose-400" />{extracted.exceptions.length} 예외</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Scenarios */}
              {extracted.scenarios.length > 0 && (
                <div className="rounded-2xl border border-[#2A3042] bg-[#161B27] p-5 shadow-sm">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">시나리오</h4>
                  <ol className="space-y-4">
                    {extracted.scenarios.map((s, idx) => (
                      <li key={s.stepOrder} className="flex gap-3 relative">
                        {idx < extracted.scenarios.length - 1 && (
                          <div className="absolute left-[9px] top-5 bottom-[-12px] w-px bg-gradient-to-b from-emerald-500/30 to-cyan-500/10" />
                        )}
                        <span className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-white text-[10px] font-black flex items-center justify-center shrink-0 shadow-sm shadow-emerald-900/50 relative z-10">
                          {s.stepOrder}
                        </span>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className="text-xs text-slate-300 leading-relaxed">{s.description}</p>
                          {s.expected && (
                            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                              <span className="text-emerald-400">→</span> {s.expected}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Rules */}
              {extracted.rules.length > 0 && (
                <div className="rounded-2xl border border-[#2A3042] bg-[#161B27] p-5 shadow-sm">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">비즈니스 규칙</h4>
                  <ul className="space-y-3">
                    {extracted.rules.map((r, i) => (
                      <li key={i} className="border-l-[3px] border-cyan-400 pl-3">
                        <p className="text-xs text-slate-300 leading-relaxed">{r.description}</p>
                        {r.constraint && (
                          <code className="mt-1.5 block bg-[#0D1117] text-cyan-300 rounded-lg px-3 py-1.5 font-mono text-[10px] leading-relaxed overflow-x-auto border border-[#2A3042]">
                            {r.constraint}
                          </code>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Exceptions */}
              {extracted.exceptions.length > 0 && (
                <div className="rounded-2xl border border-[#2A3042] bg-[#161B27] p-5 shadow-sm">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">예외 처리</h4>
                  <ul className="space-y-3">
                    {extracted.exceptions.map((e, i) => (
                      <li key={i} className="border-l-[3px] border-rose-400 pl-3">
                        <p className="text-xs font-semibold text-slate-300">{e.condition}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{e.handling}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={saving || extracting}
                className="w-full py-3 rounded-2xl text-sm font-bold bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:from-violet-500 hover:to-blue-500 transition-all shadow-md shadow-violet-900/50 disabled:opacity-50 disabled:cursor-not-allowed sticky bottom-0"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    저장 중...
                  </span>
                ) : '✓ UseCase 등록하기'}
              </button>
            </>

          ) : (
            /* 아직 추출된 내용 없음 */
            <div className="flex-1 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#2A3042] bg-[#161B27] p-8 text-center">
              <div className="mb-5">
                <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
                  <defs>
                    <linearGradient id="hg" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.15"/>
                      <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.15"/>
                    </linearGradient>
                    <linearGradient id="hg2" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.5"/>
                      <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.5"/>
                    </linearGradient>
                  </defs>
                  <path d="M36 4L65.4 21V55L36 72L6.6 55V21L36 4Z" fill="url(#hg)" stroke="url(#hg2)" strokeWidth="1.5"/>
                  <path d="M36 18L52 27.6V46.4L36 56L20 46.4V27.6L36 18Z" fill="none" stroke="url(#hg2)" strokeWidth="1" strokeDasharray="3 2"/>
                  <circle cx="36" cy="36" r="6" fill="url(#hg2)"/>
                </svg>
              </div>
              {extracting ? (
                <>
                  <p className="text-sm font-semibold text-violet-400">분석 중...</p>
                  <p className="text-xs text-slate-600 mt-1">대화 내용에서 UseCase를 도출하고 있습니다</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-slate-500">대화를 시작해보세요</p>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    AI와 대화하면 이 패널에<br/>
                    <span className="text-violet-400 font-medium">UseCase가 자동으로 채워집니다</span>
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
