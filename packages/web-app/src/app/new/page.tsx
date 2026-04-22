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

const domainColor: Record<string, string> = {
  order: 'bg-violet-100 text-violet-700',
  payment: 'bg-rose-100 text-rose-700',
  member: 'bg-blue-100 text-blue-700',
  review: 'bg-emerald-100 text-emerald-700',
  coupon: 'bg-amber-100 text-amber-700',
  settlement: 'bg-cyan-100 text-cyan-700',
}

function getDomainColor(domain: string) {
  return domainColor[domain] ?? 'bg-slate-100 text-slate-600'
}

function nowTime() {
  return new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
}

const GREETING = '안녕하세요! 어떤 업무 프로세스를 UseCase로 만들고 싶으신가요?\n예: "주문 취소 프로세스", "회원 등급 산정 방식", "리뷰 작성 정책" 등 자유롭게 설명해주세요.'

type Step = 'chat' | 'extracted' | 'saved'

export default function NewUseCasePage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: GREETING, time: nowTime() },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [extracted, setExtracted] = useState<ExtractedUseCase | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState('')
  const [step, setStep] = useState<Step>('chat')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage() {
    if (!input.trim() || loading || step === 'saved') return
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
        setMessages(prev => [...prev, { role: 'assistant', content: data.message, time: nowTime() }])
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
        body: JSON.stringify({ messages: messages.map(({ role, content }) => ({ role, content })), extract: true }),
      })
      const data = await res.json()
      if (data.useCase) {
        setExtracted(data.useCase)
        setStep('extracted')
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
        setSavedId(data.id)
        setStep('saved')
      } else {
        alert('저장 실패: ' + JSON.stringify(data))
      }
    } finally {
      setSaving(false)
    }
  }

  const canExtract = messages.length >= 3 && step === 'chat'

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 130px)', minHeight: '580px' }}>
      {/* Page header */}
      <div className="flex items-center justify-between mb-5 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-slate-400 hover:text-slate-700 transition-colors p-1">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 13L5 8l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900">UseCase 등록</h1>
            <p className="text-xs text-slate-400">AI와 대화하며 UseCase를 도출하세요</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-0">
          {(['chat', 'extracted', 'saved'] as Step[]).map((s, i) => {
            const labels = ['대화', '검토', '등록']
            const isDone = (step === 'extracted' && i === 0) || (step === 'saved' && i <= 1)
            const isCurrent = step === s
            return (
              <div key={s} className="flex items-center">
                <div className="flex items-center gap-1.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold transition-all ${
                    isDone ? 'bg-emerald-500 text-white'
                    : isCurrent ? 'bg-violet-600 text-white'
                    : 'bg-slate-100 text-slate-400'
                  }`}>
                    {isDone ? (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (i + 1)}
                  </div>
                  <span className={`text-xs ${isCurrent ? 'text-violet-700 font-medium' : isDone ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {labels[i]}
                  </span>
                </div>
                {i < 2 && <div className={`w-8 h-px mx-1.5 ${isDone ? 'bg-emerald-300' : 'bg-slate-200'}`} />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-5 gap-5 flex-1 min-h-0">
        {/* Chat panel */}
        <div className="col-span-3 flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden">
          {/* AI header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1.5L11.5 4.25V9.75L7 12.5L2.5 9.75V4.25L7 1.5Z" fill="white" fillOpacity="0.9"/>
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">UseCase 분석가</p>
              <p className="text-[10px] text-slate-400">AI · 온라인</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-md bg-violet-600 flex items-center justify-center shrink-0 mt-1">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M5 1L8.73 3.25V7.75L5 10L1.27 7.75V3.25L5 1Z" fill="white" fillOpacity="0.9"/>
                    </svg>
                  </div>
                )}
                <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[82%]`}>
                  <div className={`rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-violet-600 text-white rounded-tr-none'
                      : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none'
                  }`}>
                    {msg.content.split('\n').map((line, j, arr) => (
                      <span key={j}>{line}{j < arr.length - 1 && <br/>}</span>
                    ))}
                  </div>
                  <span className="text-[10px] mt-1 px-1 text-slate-300">{msg.time}</span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-md bg-violet-600 flex items-center justify-center shrink-0 mt-1">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M5 1L8.73 3.25V7.75L5 10L1.27 7.75V3.25L5 1Z" fill="white" fillOpacity="0.9"/>
                  </svg>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl rounded-tl-none px-4 py-3 flex items-center gap-1.5">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-slate-400"
                      style={{ animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="shrink-0 px-4 py-3 border-t border-slate-100">
            {canExtract && (
              <div className="mb-2">
                <button
                  onClick={handleExtract}
                  disabled={extracting}
                  className="btn-fa w-full justify-center text-xs disabled:opacity-50"
                >
                  {extracting ? 'UseCase 추출 중...' : 'UseCase 추출하기'}
                </button>
              </div>
            )}
            <div className="flex gap-2 items-center">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="업무 프로세스를 자유롭게 설명하세요..."
                disabled={loading || step === 'saved'}
                className="flex-1 text-sm px-4 py-2.5 rounded-lg border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none placeholder:text-slate-400 disabled:text-slate-400 bg-white"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading || step === 'saved'}
                className="btn-fa w-10 h-10 !p-0 justify-center disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M12.5 1.5L6.5 7.5M12.5 1.5L8.5 12.5L6.5 7.5L1.5 5.5L12.5 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Preview panel */}
        <div className="col-span-2 flex flex-col min-h-0 overflow-y-auto">
          {step === 'chat' ? (
            <div className="flex-1 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-8 text-center">
              <p className="text-sm font-medium text-slate-500">추출 결과가 여기 나타납니다</p>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                AI와 충분히 대화한 후<br/>
                <span className="text-violet-600">UseCase 추출하기</span>를 눌러주세요
              </p>
              {messages.length < 3 && (
                <p className="mt-4 text-[11px] text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">
                  최소 {3 - messages.length}개의 대화가 더 필요합니다
                </p>
              )}
            </div>
          ) : step === 'saved' ? (
            <div className="flex-1 flex flex-col items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M4 11l5 5L18 6" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-base font-bold text-emerald-700">등록 완료!</p>
              <p className="text-xs text-emerald-600 mt-1">UseCase가 저장되었습니다</p>
              <div className="flex gap-2 mt-5 w-full">
                <Link href={`/usecase/${savedId}`} className="flex-1 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-center">
                  상세 보기
                </Link>
                <Link href="/new" className="flex-1 py-2 rounded-lg text-xs font-semibold border border-emerald-300 text-emerald-700 hover:bg-emerald-100 transition-colors text-center">
                  새 UseCase
                </Link>
              </div>
              <Link href="/" className="mt-3 text-xs text-slate-400 hover:text-slate-600 transition-colors">
                홈으로 돌아가기
              </Link>
            </div>
          ) : extracted ? (
            <div className="flex flex-col gap-3">
              {/* Domain + title */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${getDomainColor(extracted.domain)}`}>
                    {extracted.domain}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">v{extracted.version}</span>
                </div>
                <h3 className="text-sm font-semibold text-slate-900">{extracted.title}</h3>
                <div className="flex gap-3 text-[10px] text-slate-400">
                  <span>{extracted.scenarios.length} 시나리오</span>
                  <span>{extracted.rules.length} 규칙</span>
                  {extracted.exceptions.length > 0 && <span>{extracted.exceptions.length} 예외</span>}
                </div>
              </div>

              {/* Scenarios */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">시나리오</h4>
                <ol className="space-y-3">
                  {extracted.scenarios.map((s) => (
                    <li key={s.stepOrder} className="flex gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                        {s.stepOrder}
                      </span>
                      <div className="flex-1">
                        <p className="text-xs text-slate-700 leading-relaxed">{s.description}</p>
                        {s.expected && <p className="text-[10px] text-slate-400 mt-0.5">→ {s.expected}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Rules */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">비즈니스 규칙</h4>
                <ul className="space-y-3">
                  {extracted.rules.map((r, i) => (
                    <li key={i} className="border-l-2 border-violet-400 pl-3">
                      <p className="text-xs text-slate-700">{r.description}</p>
                      {r.constraint && (
                        <code className="mt-1 block bg-slate-900 text-cyan-300 rounded px-2 py-1.5 font-mono text-[10px] overflow-x-auto">
                          {r.constraint}
                        </code>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Exceptions */}
              {extracted.exceptions.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">예외 처리</h4>
                  <ul className="space-y-3">
                    {extracted.exceptions.map((e, i) => (
                      <li key={i} className="border-l-2 border-rose-400 pl-3">
                        <p className="text-xs font-medium text-slate-700">{e.condition}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{e.handling}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-fa w-full justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '저장 중...' : 'UseCase 등록하기'}
              </button>
              <button
                onClick={() => { setExtracted(null); setStep('chat') }}
                className="w-full py-2 rounded-lg text-xs text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all"
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
