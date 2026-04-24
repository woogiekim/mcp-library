import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const tools: Tool[] = [
  {
    name: "list_usecases",
    description:
      "MCP Library에 등록된 모든 UseCase 목록을 반환합니다. 도메인, 제목, ID를 확인할 때 사용하세요.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_usecase",
    description:
      "특정 UseCase의 상세 정보(시나리오, 규칙, 예외)를 반환합니다.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "UseCase UUID",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "search_usecases",
    description:
      "키워드로 UseCase를 검색합니다. 하이브리드 검색(벡터+키워드)을 사용합니다.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "검색 쿼리",
        },
        limit: {
          type: "number",
          description: "최대 결과 수 (기본값 10)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "query_usecases",
    description:
      "자연어 질의에 대해 관련 UseCase를 검색하고 LLM이 답변을 생성합니다. 비즈니스 규칙 질문에 사용하세요.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "자연어 질의",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "create_usecase",
    description: "새로운 UseCase를 MCP Library에 등록합니다.",
    inputSchema: {
      type: "object",
      properties: {
        domain: {
          type: "string",
          description: "도메인 (예: order, member, payment)",
        },
        title: {
          type: "string",
          description: "UseCase 제목",
        },
        version: {
          type: "string",
          description: "버전 (기본값: 1.0.0)",
        },
        scenarios: {
          type: "array",
          description: "시나리오 목록",
          items: {
            type: "object",
            properties: {
              stepOrder: { type: "number" },
              description: { type: "string" },
              expected: { type: "string" },
            },
            required: ["stepOrder", "description"],
          },
        },
        rules: {
          type: "array",
          description: "비즈니스 규칙 목록",
          items: {
            type: "object",
            properties: {
              description: { type: "string" },
              constraint: { type: "string" },
            },
            required: ["description", "constraint"],
          },
        },
        exceptions: {
          type: "array",
          description: "예외 처리 목록 (선택)",
          items: {
            type: "object",
            properties: {
              condition: { type: "string" },
              handling: { type: "string" },
            },
            required: ["condition", "handling"],
          },
        },
      },
      required: ["domain", "title", "scenarios", "rules"],
    },
  },
  {
    name: "delete_usecase",
    description: "UseCase를 삭제합니다.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "삭제할 UseCase UUID",
        },
      },
      required: ["id"],
    },
  },
];
