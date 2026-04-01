import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth/session'
import { runAllAgents, runSingleAgent } from '@/lib/agents/runner'

export const maxDuration = 300 // Vercel Pro: up to 5 min for parallel agent runs

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest()
  if (!session) {
    return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const { agentId } = body as { agentId?: string }

  try {
    if (agentId) {
      const result = await runSingleAgent(session.tenantId, agentId)
      return NextResponse.json({ runs: [result] })
    } else {
      const results = await runAllAgents(session.tenantId)
      return NextResponse.json({ runs: results })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Noe gikk galt'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
