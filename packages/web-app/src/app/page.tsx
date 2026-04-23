import type { UseCase } from '@mcp-library/types'
import { LibraryView } from '@/components/LibraryView'

async function fetchAllUseCases(): Promise<UseCase[]> {
  try {
    const res = await fetch(`${process.env.MCP_SERVER_URL}/usecases`, {
      next: { revalidate: 30 },
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export default async function HomePage() {
  const useCases = await fetchAllUseCases()
  return <LibraryView initialUseCases={useCases} />
}
