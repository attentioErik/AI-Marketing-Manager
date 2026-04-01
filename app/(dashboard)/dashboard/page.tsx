import { redirect } from 'next/navigation'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getAgentsForTenant, getLatestOutputsForTenant } from '@/lib/db/queries/agents'
import { db, agentRuns, agents } from '@/lib/db/index'
import { eq, and, desc } from 'drizzle-orm'
import AgentGrid from '@/components/AgentGrid'
import RunButton from '@/components/RunButton'
import styles from './page.module.css'
import type { AgentRun } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

async function getLastRunsForTenant(tenantId: string): Promise<Record<string, AgentRun>> {
  const agentList = await getAgentsForTenant(tenantId)
  const map: Record<string, AgentRun> = {}

  await Promise.all(
    agentList.map(async (agent) => {
      const [run] = await db
        .select()
        .from(agentRuns)
        .where(and(eq(agentRuns.tenantId, tenantId), eq(agentRuns.agentId, agent.id)))
        .orderBy(desc(agentRuns.createdAt))
        .limit(1)
      if (run) map[agent.slug] = run
    })
  )
  return map
}

export default async function DashboardPage() {
  const session = await getSessionFromRequest()
  if (!session) redirect('/login')

  const [agentList, lastOutputs, lastRuns] = await Promise.all([
    getAgentsForTenant(session.tenantId),
    getLatestOutputsForTenant(session.tenantId),
    getLastRunsForTenant(session.tenantId),
  ])

  // Most recent run timestamp across all agents
  const lastRunAt = Object.values(lastRuns)
    .map((r) => r.completedAt?.toISOString() ?? '')
    .filter(Boolean)
    .sort()
    .at(-1) ?? null

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.topRow}>
          <h1 className={styles.title}>
            Marketing<br /><em>Dashboard</em>
          </h1>
          <RunButton lastRunAt={lastRunAt} />
        </div>
        <p className={styles.sub}>
          Trykk «Sett agentene i arbeid» for å kjøre alle 8 agentene parallelt.
          Resultater vises i kortene nedenfor.
        </p>
      </div>

      <div>
        <div className={styles.sectionTitle}>Agenter — {session.tenantName}</div>
        <AgentGrid
          agents={agentList}
          lastOutputs={lastOutputs}
          lastRuns={lastRuns}
        />
      </div>
    </div>
  )
}
