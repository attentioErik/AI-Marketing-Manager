import { db, agentRuns, type AgentRun } from '../index'
import { eq, and, desc } from 'drizzle-orm'

export async function createRun(tenantId: string, agentId: string): Promise<AgentRun> {
  const [run] = await db
    .insert(agentRuns)
    .values({ tenantId, agentId, status: 'running', startedAt: new Date() })
    .returning()
  return run
}

export async function updateRun(
  runId: string,
  data: Partial<Pick<AgentRun, 'status' | 'completedAt' | 'durationMs' | 'inputTokens' | 'outputTokens' | 'errorMessage'>>
): Promise<void> {
  await db.update(agentRuns).set(data).where(eq(agentRuns.id, runId))
}

export async function getRunsForAgent(agentId: string, limit = 20): Promise<AgentRun[]> {
  return db
    .select()
    .from(agentRuns)
    .where(eq(agentRuns.agentId, agentId))
    .orderBy(desc(agentRuns.createdAt))
    .limit(limit)
}
