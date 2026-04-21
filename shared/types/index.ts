export interface UseCase {
  id: string
  domain: string
  title: string
  version: string
  scenarios: Scenario[]
  rules: Rule[]
  exceptions: Exception[]
  createdAt: string
  updatedAt: string
}

export interface Scenario {
  id: string
  useCaseId: string
  stepOrder: number
  description: string
  expected?: string
}

export interface Rule {
  id: string
  useCaseId: string
  description: string
  constraint: string
}

export interface Exception {
  id: string
  useCaseId: string
  condition: string
  handling: string
}

export interface SearchResult {
  useCases: UseCase[]
  total: number
  query: string
}

export interface LLMResponse {
  answer: string
  usedUseCases: UseCase[]
  confidence: number
}

export interface MCPRequest {
  tool: string
  parameters: Record<string, unknown>
}

export interface MCPResponse {
  result: unknown
  error?: string
}

export type UserRole = 'admin' | 'editor' | 'viewer'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
}
