import type { LLMResponse, MCPRequest, MCPResponse, SearchResult, UseCase } from '@mcp-library/types'

export interface MCPAdapter {
  send(request: MCPRequest): Promise<MCPResponse>
}

export class MCPClientCore {
  private adapter: MCPAdapter
  private cache = new Map<string, unknown>()

  constructor(adapter: MCPAdapter) {
    this.adapter = adapter
  }

  async query(input: string): Promise<LLMResponse> {
    const useCases = await this.searchUseCases(input)
    const context = this.buildContext(useCases)
    return this.callLLM(input, context)
  }

  async searchUseCases(query: string): Promise<UseCase[]> {
    const cacheKey = `search:${query}`
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as UseCase[]
    }

    const response = await this.adapter.send({
      tool: 'search_usecases',
      parameters: { query, limit: 5 },
    })

    const result = (response.result as SearchResult).useCases
    this.cache.set(cacheKey, result)
    return result
  }

  async getUseCase(id: string): Promise<UseCase> {
    const cacheKey = `usecase:${id}`
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as UseCase
    }

    const response = await this.adapter.send({
      tool: 'get_usecase_detail',
      parameters: { id },
    })

    const useCase = response.result as UseCase
    this.cache.set(cacheKey, useCase)
    return useCase
  }

  clearCache(): void {
    this.cache.clear()
  }

  private buildContext(useCases: UseCase[]): string {
    return useCases.map(uc => `
## ${uc.title} (${uc.domain})
Rules: ${uc.rules.map(r => r.description).join(', ')}
Scenarios: ${uc.scenarios.map(s => `${s.stepOrder}. ${s.description}`).join('\n')}
    `.trim()).join('\n\n')
  }

  private async callLLM(query: string, context: string): Promise<LLMResponse> {
    const response = await this.adapter.send({
      tool: 'call_llm',
      parameters: { query, context },
    })
    return response.result as LLMResponse
  }
}
