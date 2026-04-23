import { NextRequest, NextResponse } from 'next/server'

const MCP_SERVER_URL = process.env.MCP_SERVER_URL ?? 'http://localhost:8080'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const res = await fetch(`${MCP_SERVER_URL}/usecases/${params.id}`, {
      method: 'DELETE',
    })
    if (res.status === 204 || res.ok) {
      return NextResponse.json({ success: true })
    }
    return NextResponse.json({ error: 'Delete failed' }, { status: res.status })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
