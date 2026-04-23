import { NextRequest, NextResponse } from 'next/server'

const LLM_BASE_URL = process.env.LLM_BASE_URL ?? 'http://localhost:11434/v1'
const LLM_MODEL    = process.env.LLM_MODEL    ?? 'llama3.2:3b'
const LLM_API_KEY  = process.env.LLM_API_KEY  ?? 'ollama'

const CHAT_SYSTEM = `당신은 UseCase 도출 전문가입니다. 반드시 한국어로만 답하세요. 영어, 베트남어, 중국어 등 다른 언어는 절대 사용하지 마세요.

사용자가 설명하는 업무 프로세스에 대해 자연스럽게 대화하며 아래 정보를 파악하세요:
1. 도메인 (order/payment/member/review/coupon/settlement 등)
2. UseCase 제목
3. 단계별 시나리오 (누가 무엇을 하고, 기대 결과는?)
4. 비즈니스 규칙 (제약 조건)
5. 예외 상황과 처리 방법

규칙:
- 한 번에 2개 이하의 질문만 하세요
- 간결하고 명확하게 답하세요
- 반드시 한국어로만 답하세요
- 사용자가 충분한 정보를 제공하면 요약해서 확인해주세요`

const EXTRACT_SYSTEM = `아래 대화에서 UseCase를 추출하여 반드시 순수 JSON만 응답하세요. 설명 텍스트 없이 JSON만.

응답 형식:
{
  "domain": "도메인명 영어 소문자 (order/payment/member/review/coupon/settlement 중 선택 또는 새 값)",
  "title": "UseCase 제목 한국어",
  "version": "1.0.0",
  "scenarios": [{"stepOrder": 1, "description": "단계 설명", "expected": "기대 결과 또는 null"}],
  "rules": [{"description": "규칙 설명", "constraint": "제약 조건 의사코드"}],
  "exceptions": [{"condition": "예외 조건", "handling": "처리 방법"}]
}

requirements: scenarios 최소 2개, rules 최소 1개. exceptions 없으면 빈 배열.`

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function POST(req: NextRequest) {
  const { messages, extract } = await req.json() as { messages: Message[]; extract?: boolean }

  const systemPrompt = extract ? EXTRACT_SYSTEM : CHAT_SYSTEM

  try {
    const res = await fetch(`${LLM_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...(!extract ? [
            { role: 'user',      content: '안녕하세요' },
            { role: 'assistant', content: '안녕하세요! 어떤 업무 프로세스를 UseCase로 만들고 싶으신가요?' },
            { role: 'user',      content: '결제 취소 프로세스요' },
            { role: 'assistant', content: '결제 취소 프로세스군요. 도메인은 payment로 설정할게요.\n\n1. 어떤 단계들이 있나요? (예: 취소 요청 → 승인 → 환불)\n2. 취소 가능한 조건이 있나요?' },
          ] : []),
          ...messages,
        ],
        max_tokens: 1024,
        temperature: extract ? 0.1 : 0.7,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: `LLM error: ${text}` }, { status: 502 })
    }

    const data = await res.json()
    const raw: string = data.choices?.[0]?.message?.content ?? ''

    if (extract) {
      const trimmed = raw.trim()
      const codeBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
      const candidate = codeBlock ? codeBlock[1].trim() : trimmed
      const firstBrace = candidate.indexOf('{')
      const lastBrace = candidate.lastIndexOf('}')
      const jsonStr = firstBrace !== -1 && lastBrace > firstBrace
        ? candidate.slice(firstBrace, lastBrace + 1)
        : candidate
      try {
        const useCase = JSON.parse(jsonStr)
        return NextResponse.json({ useCase })
      } catch {
        return NextResponse.json({ error: 'JSON 파싱 실패', raw }, { status: 422 })
      }
    }

    if (!raw.trim()) return NextResponse.json({ error: 'empty response' }, { status: 502 })
    return NextResponse.json({ message: raw.trim() })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
