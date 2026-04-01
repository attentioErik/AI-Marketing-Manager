import { redirect } from 'next/navigation'
import { getSessionFromRequest } from '@/lib/auth/session'
import { db, tenants } from '@/lib/db/index'
import { eq } from 'drizzle-orm'
import ContextEditor from '@/components/ContextEditor'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const session = await getSessionFromRequest()
  if (!session) redirect('/login')

  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, session.tenantId)).limit(1)
  if (!tenant) redirect('/login')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-48)' }}>
      <div>
        <h1>Innstillinger</h1>
        <p style={{ color: 'var(--color-ui-text-2)', marginTop: '0.5rem' }}>
          Rediger bedriftskonteksten som alle agentene bruker som grunnlag.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-16)' }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-ui-text-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Product Marketing Context — {tenant.name}
        </div>
        <ContextEditor tenantId={tenant.id} initial={tenant.productMarketingContext} />
      </div>
    </div>
  )
}
