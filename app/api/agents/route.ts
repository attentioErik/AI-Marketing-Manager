import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth/session'
import { db, agents } from '@/lib/db/index'
import { eq, and } from 'drizzle-orm'

export async function GET(_request: NextRequest) {
  const session = await getSessionFromRequest()
  if (!session) return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })

  const agentList = await db
    .select({ id: agents.id, slug: agents.slug, displayName: agents.displayName })
    .from(agents)
    .where(and(eq(agents.tenantId, session.tenantId), eq(agents.isActive, true)))
    .orderBy(agents.sortOrder)

  return NextResponse.json({ agents: agentList })
}
