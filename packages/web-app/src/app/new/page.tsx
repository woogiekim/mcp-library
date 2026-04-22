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
  order:      'bg-violet-100 text-violet-700 ring-1 ring-violet-200',
  payment:    'bg-rose-100 text-rose-700 ring-1 ring-rose-200',
  member:     'bg-blue-100 text-blue-700 ring-1 ring-blue-200',
  review:     'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
  coupon:     'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
  settlement: 'bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200',
}

function getDomainChip(domain: string) {
  return DOMAIN_CHIP[domain] ?? 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
}

function nowTime() {
  return new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
}

const GREETING = '안녕하세요! 어떤 업무 프로세스를 UseCase로 만들고 싶으신가요?\n예: "주문 취소 프로세스", "회원 등급 산정 방식", "리뷰 작성 정책" 등 자유롭게 설명해주세요.'

type Step = 'chat' | 'extracting' | 'extracted' | 'saved'

export default function NewUseCasePage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: GREETING, time: nowTime() },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [extracted, setExtracted] = useState<ExtractedUseCase | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState('')
  const [step, setStep] = useState<Step>('chat')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const extractingRef = useRef(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, step])

  async function autoExtract(msgs: Message[]) {
    if (extractingRef.current) return
    extractingRef.current = true
    setStep('extracting')
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs.map(({ role, content }) => ({ role, content })), extract: true }),
      })
      const data = await res.json()
      if (data.useCase) {
        setExtracted(data.useCase)
        setStep('extracted')
      } else {
        setStep('chat')
      }
    } catch {
      setStep('chat')
    } finally {
      extractingRef.current = false
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading || step === 'saved' || step === 'extracting') return
    const userMsg: Message = { role: 'user', content: input.trim(), time: nowTime() }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)
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
        if (data.readyToExtract) {
          autoExtract(updated)
        }
      }
    } finally {
      setLoading(false)
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
        setSavedId(data.id)
        setStep('saved')
      } else {
        alert('저장 실패: ' + JSON.stringify(data))
      }
    } finally {
      setSaving(false)
    }
  }

  const isIdle = step === 'chat' || step === 'extracting'

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 130px)', minHeight: '580px' }}>
      {/* Page header */}
      <div className="flex items-center justify-between mb-5 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-slate-400 hover:text-violet-600 transition-colors p-1">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 13L5 8l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">UseCase 등록</h1>
            <p className="text-xs text-slate-400 mt-0.5">AI와 대화하면 자동으로 UseCase가 도출됩니다</p>
          </div>
        </div>

        {/* Progress stepper */}
        <div className="flex items-center gap-0">
          {(['chat', 'extracted', 'saved'] as const).map((s, i) => {
            const labels = ['대화', '검토', '등록']
            const isDone = (step === 'extracted' && i === 0) || (step === 'saved' && i <= 1)
            const isCurrent = (step === 'chat' || step === 'extracting') ? s === 'chat' : step === s
            return (
              <div key={s} className="flex items-center">
                <div className="flex items-center gap-1.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                    isDone
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                        ? 'bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-sm shadow-violet-200'
                        : 'bg-slate-100 text-slate-400'
                  }`}>
                    {isDone ? (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (i + 1)}
                  </div>
                  <span className={`text-xs font-medium ${isCurrent ? 'text-violet-700' : isDone ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {labels[i]}
                  </span>
                </div>
                {i < 2 && (
                  <div className={`w-8 h-px mx-1.5 ${isDone ? 'bg-emerald-300' : 'bg-slate-200'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-5 gap-5 flex-1 min-h-0">
        {/* Chat panel */}
        <div className="col-span-3 flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* AI header */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white shrink-0">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-sm shadow-violet-200">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2L13.196 5V11L8 14L2.804 11V5L8 2Z" fill="white" fillOpacity="0.9"/>
                </svg>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">UseCase 분석가</p>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">AI · 온라인</p>
            </div>
            {step === 'extracting' && (
              <div className="ml-auto flex items-center gap-1.5 text-[10px] text-violet-600 font-bold">
                <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                UseCase 추출 중...
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
                      ? 'bg-gradient-to-br from-violet-600 to-blue-600 text-white rounded-tr-none shadow-md shadow-violet-100'
                      : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none shadow-sm'
                  }`}>
                    {msg.content.split('\n').map((line, j, arr) => (
                      <span key={j}>{line}{j < arr.length - 1 && <br/>}</span>
                    ))}
                  </div>
                  <span className="text-[10px] mt-1 px-1 text-slate-300">{msg.time}</span>
                </div>
              </div>
            ))}

            {(loading || step === 'extracting') && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M5 1L8.73 3.25V7.75L5 10L1.27 7.75V3.25L5 1Z" fill="white" fillOpacity="0.9"/>
                  </svg>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1.5">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-violet-400"
                      style={{ animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="shrink-0 px-4 py-3 border-t border-slate-100 bg-white/95 backdrop-blur-sm">
            <div className="flex gap-2 items-center">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="업무 프로세스를 자유롭게 설명하세요..."
                disabled={loading || !isIdle}
                className="flex-1 text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none placeholder:text-slate-400 disabled:text-slate-400 bg-white transition-all"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading || !isIdle}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 text-white flex items-center justify-center shadow-md shadow-violet-200 hover:shadow-violet-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M14 2L7 9M14 2L9.5 14L7 9L2 6.5L14 2Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Preview panel */}
        <div className="col-span-2 flex flex-col min-h-0 overflow-y-auto">
          {step === 'chat' ? (
            <div className="flex-1 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center min-h-0">
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
              <p className="text-sm font-semibold text-slate-600">대화하면 자동으로 도출됩니다</p>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                AI와 자연스럽게 대화하세요.<br/>
                충분한 정보가 모이면 자동으로<br/>
                <span className="text-violet-500 font-medium">UseCase가 추출</span>됩니다
              </p>
            </div>
          ) : step === 'extracting' ? (
            <div className="flex-1 flex flex-col items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-200">
                <svg className="animate-spin w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              </div>
              <p className="text-sm font-bold text-violet-700">UseCase 추출 중...</p>
              <p className="text-xs text-violet-500 mt-1">대화 내용을 분석하고 있습니다</p>
            </div>
          ) : step === 'saved' ? (
            <div className="flex-1 flex flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4 shadow-sm shadow-emerald-100">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M5 14l6.5 6.5L23 8" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-base font-black text-emerald-700">등록 완료!</p>
              <p className="text-xs text-emerald-600 mt-1">UseCase가 성공적으로 저장되었습니다</p>
              <div className="flex gap-2 mt-5 w-full">
                <Link
                  href={`/usecase/${savedId}`}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-400 hover:to-cyan-400 transition-all text-center shadow-sm shadow-emerald-100"
                >
                  상세 보기
                </Link>
                <Link
                  href="/new"
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors text-center"
                >
                  새 UseCase
                </Link>
              </div>
              <Link href="/" className="mt-3 text-xs text-slate-400 hover:text-slate-600 transition-colors">
                홈으로 돌아가기
              </Link>
            </div>
          ) : extracted ? (
            <div className="flex flex-col gap-3">
              {/* Domain + title card */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2 min-w-0">
                    <span className={`domain-chip inline-flex ${getDomainChip(extracted.domain)}`}>
                      {extracted.domain}
                    </span>
                    <h3 className="text-sm font-black text-slate-900 leading-snug">{extracted.title}</h3>
                    <span className="text-[10px] font-mono text-slate-400">v{extracted.version}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 text-right shrink-0 space-y-1 pt-1">
                    <div className="flex items-center gap-1 justify-end">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      {extracted.scenarios.length} 시나리오
                    </div>
                    <div className="flex items-center gap-1 justify-end">
                      <div className="w-2 h-2 rounded-full bg-cyan-400" />
                      {extracted.rules.length} 규칙
                    </div>
                    {extracted.exceptions.length > 0 && (
                      <div className="flex items-center gap-1 justify-end">
                        <div className="w-2 h-2 rounded-full bg-rose-400" />
                        {extracted.exceptions.length} 예외
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Scenarios */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">시나리오</h4>
                <ol className="space-y-4">
                  {extracted.scenarios.map((s, idx) => (
                    <li key={s.stepOrder} className="flex gap-3 relative">
                      {idx < extracted.scenarios.length - 1 && (
                        <div className="absolute left-[9px] top-5 bottom-[-12px] w-px bg-gradient-to-b from-emerald-200 to-cyan-100" />
                      )}
                      <span className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-white text-[10px] font-black flex items-center justify-center shrink-0 shadow-sm shadow-emerald-100 relative z-10">
                        {s.stepOrder}
                      </span>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-xs text-slate-700 leading-relaxed">{s.description}</p>
                        {s.expected && (
                          <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                            <span className="text-emerald-400">→</span> {s.expected}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Rules */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">비즈니스 규칙</h4>
                <ul className="space-y-3">
                  {extracted.rules.map((r, i) => (
                    <li key={i} className="border-l-[3px] border-cyan-400 pl-3">
                      <p className="text-xs text-slate-700 leading-relaxed">{r.description}</p>
                      {r.constraint && (
                        <code className="mt-1.5 block bg-slate-900 text-cyan-300 rounded-lg px-3 py-1.5 font-mono text-[10px] leading-relaxed overflow-x-auto">
                          {r.constraint}
                        </code>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Exceptions */}
              {extracted.exceptions.length > 0 && (
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">예외 처리</h4>
                  <ul className="space-y-3">
                    {extracted.exceptions.map((e, i) => (
                      <li key={i} className="border-l-[3px] border-rose-400 pl-3">
                        <p className="text-xs font-semibold text-slate-700">{e.condition}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{e.handling}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 rounded-2xl text-sm font-bold bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:from-violet-500 hover:to-blue-500 transition-all shadow-md shadow-violet-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <button
                onClick={() => { setExtracted(null); setStep('chat') }}
                className="w-full py-2 rounded-xl text-xs text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all"
              >
                ← 다시 대화하기
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
