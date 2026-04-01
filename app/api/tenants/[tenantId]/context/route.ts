import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth/session'
import { db, tenants } from '@/lib/db/index'
import { eq } from 'drizzle-orm'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const session = await getSessionFromRequest()
  if (!session) return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })

  const { tenantId } = await params
  if (tenantId !== session.tenantId) {
    return NextResponse.json({ error: 'Ingen tilgang' }, { status: 403 })
  }

  const { product_marketing_context } = await request.json()
  if (typeof product_marketing_context !== 'string') {
    return NextResponse.json({ error: 'Ugyldig innhold' }, { status: 400 })
  }

  await db
    .update(tenants)
    .set({ productMarketingContext: product_marketing_context, updatedAt: new Date() })
    .where(eq(tenants.id, tenantId))

  return NextResponse.json({ ok: true })
}
