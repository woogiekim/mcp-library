# MCP Library

> AI 대화로 업무 UseCase를 등록하고, 자연어로 도메인 지식을 검색하는 팀 지식 라이브러리

팀의 비즈니스 프로세스를 **시나리오 · 비즈니스 규칙 · 예외 처리** 구조로 저장하고, 누구나 자연어로 빠르게 찾아볼 수 있습니다. 복잡한 업무 지식이 개인의 머릿속에만 있는 문제를 해결합니다.

## Features

- **AI 대화형 등록** — 업무 프로세스를 자연어로 설명하면 LLM이 UseCase 구조로 자동 추출
- **구조화 저장** — 시나리오(단계별), 비즈니스 규칙(제약 조건), 예외 처리를 분리 저장
- **도메인 분류** — order / payment / member / review / coupon / settlement 등 도메인별 관리
- **자연어 검색** — 키워드로 UseCase 목록을 빠르게 탐색
- **Claude Desktop 연동** — MCP 서버로 Claude와 직접 대화하며 UseCase 등록 및 검색
- **OpenAI 호환 LLM** — Anthropic / OpenAI / Groq / Ollama / LM Studio 모두 지원

## Architecture

```
mcp-library/
├── packages/
│   ├── web-app/            # Next.js 14  — 웹 UI
│   ├── mcp-server/         # Spring Boot 3 + Kotlin — REST API + 벡터 검색
│   ├── mcp-claude-desktop/ # Node.js MCP 서버 — Claude Desktop 연동
│   ├── mcp-client-core/    # 공유 MCP 클라이언트 라이브러리
│   └── desktop-app/        # Electron — 웹 앱 래퍼 데스크톱 앱
├── shared/
│   └── types/              # 공유 TypeScript 타입
└── docker-compose.yml
```

```
Claude Desktop ──MCP stdio──▶ mcp-claude-desktop (Node.js)
                                      │ HTTP
Web Browser ──────────────▶ web-app (Next.js :3000)
                                      │ HTTP
                             mcp-server (Spring Boot :8080)
                               ├── PostgreSQL  (구조 저장)
                               └── Qdrant      (벡터 검색)
```

## Installation

### 사전 요구사항

- Node.js 20+
- JDK 21
- Docker & Docker Compose

---

### 방법 1 — Docker Compose (전체 스택 한 번에)

```bash
git clone https://github.com/woogiekim/mcp-library.git
cd mcp-library
docker compose up --build
```

브라우저에서 `http://localhost:3000` 접속.

> **LLM 없이 실행 (기본값)**: `LLM_PROVIDER`가 `mock`으로 설정되어 있어 API 키 없이 바로 실행됩니다. AI 대화 기능은 동작하지 않지만 수동 UseCase 등록 및 검색은 사용할 수 있습니다.

**LLM 프로바이더 지정:**

| 프로바이더 | `LLM_PROVIDER` | 필요한 환경 변수 |
|-----------|----------------|-----------------|
| Mock (기본) | `mock` | 없음 |
| Anthropic | `anthropic` | `LLM_API_KEY` |
| OpenAI | `openai` | `LLM_API_KEY` |
| Groq | `groq` | `LLM_API_KEY`, `LLM_BASE_URL` |
| Ollama | `ollama` | `LLM_BASE_URL` (로컬) |
| LM Studio | `lmstudio` | `LLM_BASE_URL` (로컬) |

```bash
# Anthropic 사용 예시
LLM_PROVIDER=anthropic \
LLM_MODEL=claude-haiku-4-5-20251001 \
LLM_API_KEY=sk-ant-... \
docker compose up --build

# Groq 사용 예시 (무료 쿼터)
LLM_PROVIDER=groq \
LLM_MODEL=llama-3.1-8b-instant \
LLM_BASE_URL=https://api.groq.com/openai/v1 \
LLM_API_KEY=gsk_... \
docker compose up --build

# 로컬 Ollama 사용 예시
LLM_PROVIDER=ollama \
LLM_MODEL=llama3.2:3b \
LLM_BASE_URL=http://host.docker.internal:11434/v1 \
docker compose up --build
```

---

### 방법 2 — 로컬 개발 환경

**1. 인프라 실행**

```bash
docker compose up -d postgres qdrant
```

**2. 백엔드 실행**

```bash
cd packages/mcp-server
./gradlew bootRun
# → http://localhost:8080
```

LLM 프로바이더를 환경 변수로 선택합니다:

```bash
# Anthropic
LLM_PROVIDER=anthropic LLM_MODEL=claude-haiku-4-5-20251001 LLM_API_KEY=sk-ant-... ./gradlew bootRun

# Groq
LLM_PROVIDER=groq LLM_MODEL=llama-3.1-8b-instant \
  LLM_BASE_URL=https://api.groq.com/openai/v1 LLM_API_KEY=gsk_... ./gradlew bootRun

# Ollama (로컬)
LLM_PROVIDER=ollama LLM_MODEL=llama3.2:3b ./gradlew bootRun
```

**3. 웹 앱 실행**

```bash
# 루트 디렉토리에서
npm install
npm run dev:web
# → http://localhost:3000
```

**4. Electron 데스크톱 앱 실행 (선택)**

웹 앱(`:3000`)이 실행 중인 상태에서:

```bash
npm run dev:desktop
```

---

### Claude Desktop MCP 서버 연동

Claude Desktop에서 직접 UseCase를 등록하고 검색할 수 있습니다.

**1. 의존성 설치**

```bash
npm install
```

**2. Claude Desktop 설정 파일 편집**

설정 파일 위치:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mcp-library": {
      "command": "npx",
      "args": ["tsx", "/절대경로/mcp-library/packages/mcp-claude-desktop/src/index.ts"],
      "env": {
        "MCP_SERVER_URL": "http://localhost:8080"
      }
    }
  }
}
```

> `mcp-server`가 실행 중이어야 합니다 (`docker compose up mcp-server` 또는 로컬 실행).

**3. Claude Desktop 재시작**

MCP 서버가 연결되면 Claude와 다음과 같이 대화할 수 있습니다:

- `"주문 취소 프로세스를 등록해줘"` → `register_usecase` 프롬프트 활성화
- `"결제 관련 유스케이스 찾아줘"` → `search_usecases` 도구 호출
- `"요구사항 문서를 분석해서 유스케이스로 만들어줘"` → `analyze_requirements` 프롬프트 활성화

**사용 가능한 MCP 도구:**

| 도구 | 설명 |
|------|------|
| `list_usecases` | 전체 UseCase 목록 조회 |
| `get_usecase` | 특정 UseCase 상세 조회 |
| `search_usecases` | 키워드로 UseCase 검색 |
| `query_usecases` | 자연어로 의미 기반 검색 |
| `create_usecase` | UseCase 단건 등록 |
| `bulk_create_usecases` | UseCase 다건 일괄 등록 |
| `delete_usecase` | UseCase 삭제 |

**사용 가능한 MCP 프롬프트:**

| 프롬프트 | 설명 |
|---------|------|
| `register_usecase` | 대화형으로 UseCase 등록 가이드 |
| `analyze_requirements` | 요구사항 텍스트 분석 후 UseCase 일괄 추출 |

---

## Usage

### 웹 앱에서 UseCase 등록

1. `http://localhost:3000` 접속
2. **+ 등록** 클릭
3. AI와 대화하며 업무 프로세스 설명
4. LLM이 시나리오 · 규칙 · 예외를 자동 추출 → 미리보기 확인
5. **저장** 클릭

### UseCase 검색

메인 화면 검색창에 키워드 입력 (예: `결제 취소`, `회원 등급 기준`, `배송 상태 조회`)

---

## Tech Stack

| 레이어 | 기술 |
|--------|------|
| 웹 프론트엔드 | Next.js 14, Tailwind CSS |
| 백엔드 API | Spring Boot 3, Kotlin 2.1, JPA |
| 벡터 검색 | Qdrant |
| 관계형 DB | PostgreSQL 16 |
| MCP 서버 | Node.js, `@modelcontextprotocol/sdk` |
| 데스크톱 앱 | Electron 31 |
| 컨테이너 | Docker, Docker Compose |

## License

MIT
