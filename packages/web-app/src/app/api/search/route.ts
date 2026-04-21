import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q') ?? ''
  if (!query.trim()) {
    return NextResponse.json({ useCases: [], total: 0 })
  }

  try {
    const res = await fetch(`${process.env.MCP_SERVER_URL}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit: 10 }),
    })

    if (!res.ok) {
      return NextResponse.json({ useCases: [], total: 0 }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
