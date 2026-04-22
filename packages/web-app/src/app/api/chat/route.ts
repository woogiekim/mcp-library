import { NextRequest, NextResponse } from 'next/server'

const LLM_BASE_URL = process.env.LLM_BASE_URL ?? 'http://localhost:11434/v1'
const LLM_MODEL    = process.env.LLM_MODEL    ?? 'llama3.2:3b'
const LLM_API_KEY  = process.env.LLM_API_KEY  ?? 'ollama'

const CHAT_SYSTEM = `당신은 UseCase 도출을 돕는 비즈니스 분석가입니다.
사용자가 설명하는 업무 프로세스를 UseCase로 만들 수 있도록 자연스럽게 대화하며 아래 정보를 파악하세요:
1. 도메인 (order/payment/member/review 등)
2. UseCase 제목
3. 단계별 시나리오 (누가 무엇을 하고, 기대 결과는?)
4. 비즈니스 규칙 (제약 조건, 불변식)
5. 예외 상황과 처리 방법

한 번에 2개 이하의 질문만 하세요. 충분한 정보가 모이면 "이제 UseCase를 추출할 준비가 됐어요! 아래 [추출하기] 버튼을 눌러주세요."라고 안내하세요.
한국어로 대화하세요. 간결하게 답하세요.`

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
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        max_tokens: 1024,
        temperature: extract ? 0.1 : 0.7,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: `LLM error: ${text}` }, { status: 502 })
    }

    const data = await res.json()
    const content: string = data.choices?.[0]?.message?.content ?? ''

    if (extract) {
      // JSON 블록 추출 (```json ... ``` 형태 처리)
      const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) ?? content.match(/(\{[\s\S]*\})/)
      const jsonStr = jsonMatch ? (jsonMatch[1] ?? jsonMatch[0]) : content
      try {
        const useCase = JSON.parse(jsonStr.trim())
        return NextResponse.json({ useCase })
      } catch {
        return NextResponse.json({ error: 'JSON 파싱 실패', raw: content }, { status: 422 })
      }
    }

    return NextResponse.json({ message: content })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
