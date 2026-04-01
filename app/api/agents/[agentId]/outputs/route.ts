import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getOutputsForAgent } from '@/lib/db/queries/outputs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const session = await getSessionFromRequest()
  if (!session) return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })

  const { agentId } = await params
  const { searchParams } = request.nextUrl
  const limit  = Math.min(parseInt(searchParams.get('limit')  ?? '10'), 50)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  const { outputs, total } = await getOutputsForAgent(agentId, session.tenantId, limit, offset)
  return NextResponse.json({ outputs, total })
}
