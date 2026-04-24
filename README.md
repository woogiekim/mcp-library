# MCP Library

> AI 대화로 업무 UseCase를 등록하고, 자연어로 도메인 지식을 검색하는 팀 지식 라이브러리

팀의 비즈니스 프로세스를 **시나리오 · 비즈니스 규칙 · 예외 처리** 구조로 저장하고, 누구나 자연어로 빠르게 찾아볼 수 있습니다. 복잡한 업무 지식이 개인의 머릿속에만 있는 문제를 해결합니다.

## Visuals

> 스크린샷 / GIF 추가 예정

## Features

- **AI 대화형 등록** — 업무 프로세스를 자연어로 설명하면 LLM이 UseCase 구조로 자동 추출
- **구조화 저장** — 시나리오(단계별), 비즈니스 규칙(제약 조건), 예외 처리를 분리 저장
- **도메인 분류** — order / payment / member / review / coupon / settlement 등 도메인별 관리
- **자연어 검색** — 키워드로 UseCase 목록을 빠르게 탐색
- **상세 조회 & 삭제** — 등록된 UseCase의 전체 내용 확인 및 관리
- **OpenAI 호환 LLM** — OpenAI API 또는 로컬 Ollama 모두 지원

## Installation

### 사전 요구사항

- Node.js 20+
- JDK 21
- Docker & Docker Compose

### Docker Compose (전체 실행)

```bash
git clone https://github.com/woogiekim/mcp-library.git
cd mcp-library

ANTHROPIC_API_KEY=your_key docker-compose up --build
```

브라우저에서 `http://localhost:3000` 접속

### 로컬 개발 환경

**1. 인프라 실행**

```bash
docker-compose up -d postgres qdrant
```

**2. 백엔드(mcp-server) 실행**

```bash
cd packages/mcp-server
./gradlew bootRun
# → http://localhost:8080
```

환경 변수로 LLM 프로바이더를 선택할 수 있습니다:

| 프로바이더 | `LLM_PROVIDER` | 비고 |
|-----------|----------------|------|
| Ollama (기본) | `ollama` | 로컬 LLM, 별도 설치 필요 |
| Anthropic | `anthropic` | `ANTHROPIC_API_KEY` 필요 |
| OpenAI | `openai` | `OPENAI_API_KEY` 필요 |
| Groq | `groq` | 무료 쿼터 제공 |
| LM Studio | `lmstudio` | 로컬 LLM |

```bash
# Anthropic 사용 예시
LLM_PROVIDER=anthropic \
LLM_MODEL=claude-haiku-4-5-20251001 \
ANTHROPIC_API_KEY=sk-ant-... \
./gradlew bootRun

# Groq 사용 예시
LLM_PROVIDER=groq \
LLM_MODEL=llama-3.1-8b-instant \
LLM_BASE_URL=https://api.groq.com/openai/v1 \
LLM_API_KEY=gsk_... \
./gradlew bootRun
```

**3. 웹 앱 실행**

```bash
# 루트 디렉토리에서
npm install
npm run dev:web
# → http://localhost:3000
```

**4. 웹 앱 환경 변수 설정**

`packages/web-app/.env.local` 파일 생성:

```env
MCP_SERVER_URL=http://localhost:8080

# Ollama (로컬 LLM) — 기본값
LLM_BASE_URL=http://localhost:11434/v1
LLM_MODEL=llama3.2:3b
LLM_API_KEY=ollama

# OpenAI 사용 시
# LLM_BASE_URL=https://api.openai.com/v1
# LLM_MODEL=gpt-4o-mini
# LLM_API_KEY=sk-...
```

## Usage

### UseCase 등록

1. 웹 앱에서 **+ 등록** 클릭
2. AI와 대화하며 업무 프로세스 설명 (예: "결제 취소 프로세스입니다...")
3. LLM이 시나리오 · 규칙 · 예외를 자동 추출 → 미리보기 확인
4. **저장** 클릭

### UseCase 검색

메인 화면 검색창에 자연어로 입력 (예: `결제 취소`, `회원 등급 기준`, `배송 상태 조회`)

## Architecture

```
web-app (Next.js 14)
  ├── /api/chat      → LLM 대화 및 UseCase 추출
  └── /api/usecases  → mcp-server REST 프록시

mcp-server (Spring Boot 3 / Kotlin)
  ├── PostgreSQL     → UseCase 구조 저장
  └── Qdrant         → 벡터 검색 인덱스
```

**패키지 구조**

```
mcp-library/
├── packages/
│   ├── web-app/          # Next.js 14 웹 프론트엔드
│   ├── mcp-server/       # Spring Boot 3 + Kotlin 백엔드
│   ├── mcp-client-core/  # 공유 MCP 클라이언트 라이브러리
│   └── desktop-app/      # Tauri 데스크톱 앱 (React)
├── shared/
│   └── types/            # 공유 TypeScript 타입
└── docker-compose.yml
```

## License

MIT
