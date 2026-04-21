import { useState, useRef, useEffect } from 'react'
import type { MCPClientCore } from '@mcp-library/mcp-client-core'
import type { LLMResponse, UseCase } from '@mcp-library/types'

interface Message {
  role: 'user' | 'assistant'
  content: string
  usedUseCases?: UseCase[]
}

interface Props {
  client: MCPClientCore
  selectedUseCase: UseCase | null
}

export function ChatView({ client, selectedUseCase }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (selectedUseCase) {
      setInput(`"${selectedUseCase.title}" UseCase에 대해 설명해줘`)
    }
  }, [selectedUseCase])

  async function handleSend() {
    const q = input.trim()
    if (!q || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setLoading(true)
    try {
      const res: LLMResponse = await client.query(q)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.answer,
        usedUseCases: res.usedUseCases,
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '오류가 발생했습니다. 다시 시도해주세요.',
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-20 text-sm">
            도메인 정책, 개발 규칙, UseCase에 대해 질문하세요
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.usedUseCases && msg.usedUseCases.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap gap-1">
                  {msg.usedUseCases.map(uc => (
                    <span key={uc.id} className="text-xs text-gray-400">
                      📎 {uc.title}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-gray-400 shadow-sm">
              생각 중...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t bg-white p-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="질문을 입력하세요..."
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          전송
        </button>
      </div>
    </div>
  )
}
