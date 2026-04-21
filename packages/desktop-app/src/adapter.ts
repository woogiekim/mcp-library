import { invoke } from '@tauri-apps/api/tauri'
import type { MCPAdapter } from '@mcp-library/mcp-client-core'
import type { MCPRequest, MCPResponse } from '@mcp-library/types'

export class TauriMCPAdapter implements MCPAdapter {
  async send(request: MCPRequest): Promise<MCPResponse> {
    try {
      const result = await invoke<unknown>('mcp_tool_call', {
        tool: request.tool,
        parameters: request.parameters,
      })
      return { result }
    } catch (error) {
      return { result: null, error: String(error) }
    }
  }
}
