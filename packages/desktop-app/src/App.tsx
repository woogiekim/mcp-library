import { useState } from 'react'
import { MCPClientCore } from '@mcp-library/mcp-client-core'
import { TauriMCPAdapter } from './adapter'
import { ChatView } from './views/ChatView'
import { BrowserView } from './views/BrowserView'
import type { UseCase } from '@mcp-library/types'

type View = 'chat' | 'browser'

const client = new MCPClientCore(new TauriMCPAdapter())

export function App() {
  const [view, setView] = useState<View>('chat')
  const [selectedUseCase, setSelectedUseCase] = useState<UseCase | null>(null)

  return (
    <div className="flex h-screen bg-gray-50">
      <nav className="w-14 bg-gray-900 flex flex-col items-center py-4 gap-3">
        <button
          onClick={() => setView('chat')}
          className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm transition-colors ${
            view === 'chat' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
          title="Chat"
        >
          💬
        </button>
        <button
          onClick={() => setView('browser')}
          className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm transition-colors ${
            view === 'browser' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
          title="UseCase Browser"
        >
          📚
        </button>
      </nav>

      <div className="flex-1 overflow-hidden">
        {view === 'chat' && (
          <ChatView client={client} selectedUseCase={selectedUseCase} />
        )}
        {view === 'browser' && (
          <BrowserView client={client} onSelectUseCase={uc => {
            setSelectedUseCase(uc)
            setView('chat')
          }} />
        )}
      </div>
    </div>
  )
}
