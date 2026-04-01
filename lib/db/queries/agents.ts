import { db, agents, agentOutputs, type Agent, type AgentOutput } from '../index'
import { eq, and, desc } from 'drizzle-orm'

export async function getAgentsForTenant(tenantId: string): Promise<Agent[]> {
  return db
    .select()
    .from(agents)
    .where(and(eq(agents.tenantId, tenantId), eq(agents.isActive, true)))
    .orderBy(agents.sortOrder)
}

export async function getAgentBySlug(tenantId: string, slug: string): Promise<Agent | undefined> {
  const result = await db
    .select()
    .from(agents)
    .where(and(eq(agents.tenantId, tenantId), eq(agents.slug, slug)))
    .limit(1)
  return result[0]
}

export async function getLatestOutputsForTenant(
  tenantId: string
): Promise<Record<string, AgentOutput>> {
  const allAgents = await getAgentsForTenant(tenantId)
  const map: Record<string, AgentOutput> = {}

  await Promise.all(
    allAgents.map(async (agent) => {
      const [latest] = await db
        .select()
        .from(agentOutputs)
        .where(and(eq(agentOutputs.tenantId, tenantId), eq(agentOutputs.agentId, agent.id)))
        .orderBy(desc(agentOutputs.createdAt))
        .limit(1)
      if (latest) map[agent.slug] = latest
    })
  )

  return map
}
