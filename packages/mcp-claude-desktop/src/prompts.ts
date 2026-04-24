import { Prompt, GetPromptResult } from "@modelcontextprotocol/sdk/types.js";

export const prompts: Prompt[] = [
  {
    name: "register_usecase",
    description:
      "대화형으로 UseCase를 등록합니다. 도메인, 제목, 시나리오, 규칙을 단계별로 수집해 자동 등록합니다.",
    arguments: [],
  },
  {
    name: "analyze_requirements",
    description:
      "요구사항 텍스트를 분석해 UseCase를 추출하고 일괄 등록합니다. requirements 인자에 문서 내용을 입력하세요.",
    arguments: [
      {
        name: "requirements",
        description: "분석할 요구사항 텍스트 (기능 명세서, 회의록, 기획서 등)",
        required: true,
      },
    ],
  },
];

export function getPrompt(name: string, args: Record<string, string>): GetPromptResult {
  switch (name) {
    case "register_usecase":
      return {
        description: "UseCase 등록 대화형 가이드",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `MCP Library에 새 UseCase를 등록해줘.

다음 순서로 진행해:
1. 먼저 list_usecases로 기존 도메인 목록을 확인해
2. 아래 항목을 나에게 물어봐:
   - 도메인 (기존 도메인 중 선택하거나 새 도메인 입력)
   - UseCase 제목
   - 시나리오 (단계별 흐름, 최소 2개)
   - 비즈니스 규칙 (최소 1개)
   - 예외 처리 (선택)
3. 내가 답변하면 create_usecase tool로 등록해줘
4. 등록 완료 후 결과를 요약해줘`,
            },
          },
        ],
      };

    case "analyze_requirements":
      return {
        description: "요구사항 분석 후 UseCase 일괄 등록",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `다음 요구사항 문서를 분석해서 UseCase를 추출하고 MCP Library에 등록해줘.

## 요구사항 문서
${args.requirements ?? "(내용 없음)"}

## 지시사항
1. 문서에서 독립적인 기능/플로우를 UseCase 단위로 식별해
2. 각 UseCase에 대해:
   - domain: 영문 소문자 (order, member, payment, review 등)
   - title: 한국어 또는 영문 제목
   - scenarios: 단계별 흐름 (stepOrder 1부터 순서대로)
   - rules: 비즈니스 규칙과 제약 조건
   - exceptions: 예외 상황 처리 (있는 경우)
3. 추출한 UseCase 목록을 먼저 나에게 보여줘 (등록 전 확인)
4. 내가 확인하면 bulk_create_usecases tool로 일괄 등록해줘`,
            },
          },
        ],
      };

    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
}
