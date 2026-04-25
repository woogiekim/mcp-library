# MCP Library

> A team knowledge library for registering business use cases through AI conversation and searching domain knowledge with natural language.

Store your team's business processes in a structured **Scenarios · Business Rules · Exception Handling** format, making it easy for anyone to find them with natural language queries. Solve the problem of complex business knowledge existing only in individual team members' heads.

## Features

- **AI-driven registration** — Describe a business process in natural language and the LLM automatically extracts it into a structured UseCase
- **Structured storage** — Stores scenarios (step-by-step), business rules (constraints), and exception handling separately
- **Domain classification** — Manage by domain: order / payment / member / review / coupon / settlement, etc.
- **Natural language search** — Quickly find UseCases by keyword
- **Claude Desktop integration** — Register and search UseCases by chatting directly with Claude via MCP
- **OpenAI-compatible LLM** — Supports Anthropic / OpenAI / Groq / Ollama / LM Studio

## Architecture

```
mcp-library/
├── packages/
│   ├── web-app/            # Next.js 14  — Web UI
│   ├── mcp-server/         # Spring Boot 3 + Kotlin — REST API + vector search
│   ├── mcp-claude-desktop/ # Node.js MCP server — Claude Desktop integration
│   ├── mcp-client-core/    # Shared MCP client library
│   └── desktop-app/        # Electron — Desktop wrapper for the web app
├── shared/
│   └── types/              # Shared TypeScript types
└── docker-compose.yml
```

```
Claude Desktop ──MCP stdio──▶ mcp-claude-desktop (Node.js)
                                      │ HTTP
Web Browser ──────────────▶ web-app (Next.js :3000)
                                      │ HTTP
                             mcp-server (Spring Boot :8080)
                               ├── PostgreSQL  (structured storage)
                               └── Qdrant      (vector search index)
```

## Installation

### Prerequisites

- Node.js 20+
- JDK 21
- Docker & Docker Compose

---

### Option 1 — Docker Compose (full stack at once)

```bash
git clone https://github.com/woogiekim/mcp-library.git
cd mcp-library
docker compose up --build
```

Open `http://localhost:3000` in your browser.

> **Running without an LLM (default)**: `LLM_PROVIDER` defaults to `mock`, so no API key is required. AI conversation features won't work, but you can still register and search UseCases manually.

**Selecting an LLM provider:**

| Provider | `LLM_PROVIDER` | Required env vars |
|----------|----------------|-------------------|
| Mock (default) | `mock` | none |
| Anthropic | `anthropic` | `LLM_API_KEY` |
| OpenAI | `openai` | `LLM_API_KEY` |
| Groq | `groq` | `LLM_API_KEY`, `LLM_BASE_URL` |
| Ollama | `ollama` | `LLM_BASE_URL` (local) |
| LM Studio | `lmstudio` | `LLM_BASE_URL` (local) |

```bash
# Anthropic
LLM_PROVIDER=anthropic \
LLM_MODEL=claude-haiku-4-5-20251001 \
LLM_API_KEY=sk-ant-... \
docker compose up --build

# Groq (free tier available)
LLM_PROVIDER=groq \
LLM_MODEL=llama-3.1-8b-instant \
LLM_BASE_URL=https://api.groq.com/openai/v1 \
LLM_API_KEY=gsk_... \
docker compose up --build

# Local Ollama
LLM_PROVIDER=ollama \
LLM_MODEL=llama3.2:3b \
LLM_BASE_URL=http://host.docker.internal:11434/v1 \
docker compose up --build
```

---

### Option 2 — Local development

**1. Start infrastructure**

```bash
docker compose up -d postgres qdrant
```

**2. Start the backend**

```bash
cd packages/mcp-server
./gradlew bootRun
# → http://localhost:8080
```

Select an LLM provider via environment variables:

```bash
# Anthropic
LLM_PROVIDER=anthropic LLM_MODEL=claude-haiku-4-5-20251001 LLM_API_KEY=sk-ant-... ./gradlew bootRun

# Groq
LLM_PROVIDER=groq LLM_MODEL=llama-3.1-8b-instant \
  LLM_BASE_URL=https://api.groq.com/openai/v1 LLM_API_KEY=gsk_... ./gradlew bootRun

# Local Ollama
LLM_PROVIDER=ollama LLM_MODEL=llama3.2:3b ./gradlew bootRun
```

**3. Start the web app**

```bash
# From the repo root
npm install
npm run dev:web
# → http://localhost:3000
```

**4. Start the Electron desktop app (optional)**

With the web app running on `:3000`:

```bash
npm run dev:desktop
```

---

### Claude Desktop MCP Integration

Register and search UseCases directly from Claude Desktop.

**1. Install dependencies**

```bash
npm install
```

**2. Edit the Claude Desktop config file**

Config file location:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mcp-library": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/mcp-library/packages/mcp-claude-desktop/src/index.ts"],
      "env": {
        "MCP_SERVER_URL": "http://localhost:8080"
      }
    }
  }
}
```

> `mcp-server` must be running (`docker compose up mcp-server` or local).

**3. Restart Claude Desktop**

Once the MCP server connects, you can chat with Claude like:

- `"Register the order cancellation process"` → activates `register_usecase` prompt
- `"Find use cases related to payment"` → calls `search_usecases` tool
- `"Analyze this requirements document and create use cases"` → activates `analyze_requirements` prompt

**Available MCP tools:**

| Tool | Description |
|------|-------------|
| `list_usecases` | List all UseCases |
| `get_usecase` | Get details of a specific UseCase |
| `search_usecases` | Search UseCases by keyword |
| `query_usecases` | Semantic search with natural language |
| `create_usecase` | Register a single UseCase |
| `bulk_create_usecases` | Register multiple UseCases at once |
| `delete_usecase` | Delete a UseCase |

**Available MCP prompts:**

| Prompt | Description |
|--------|-------------|
| `register_usecase` | Guided conversational UseCase registration |
| `analyze_requirements` | Analyze requirements text and extract UseCases in bulk |

---

## Usage

### Registering a UseCase via Web App

1. Open `http://localhost:3000`
2. Click **+ Register**
3. Describe the business process in conversation with the AI
4. The LLM extracts scenarios, rules, and exceptions → preview the result
5. Click **Save**

### Searching UseCases

Type a keyword into the search bar on the main page (e.g., `payment cancellation`, `membership tier rules`, `delivery status lookup`)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Web frontend | Next.js 14, Tailwind CSS |
| Backend API | Spring Boot 3, Kotlin 2.1, JPA |
| Vector search | Qdrant |
| Relational DB | PostgreSQL 16 |
| MCP server | Node.js, `@modelcontextprotocol/sdk` |
| Desktop app | Electron 31 |
| Container | Docker, Docker Compose |

## License

MIT
