import { redirect } from 'next/navigation'
import { getSessionFromRequest } from '@/lib/auth/session'
import { db, tenants } from '@/lib/db/index'
import { eq } from 'drizzle-orm'
import DashboardNav from '@/components/DashboardNav'
import styles from './layout.module.css'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionFromRequest()
  if (!session) redirect('/login')

  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, session.tenantId)).limit(1)
  if (!tenant) redirect('/login')

  return (
    <div className={styles.shell}>
      <DashboardNav tenantName={tenant.name} />
      <main className={styles.main}>{children}</main>
    </div>
  )
}
