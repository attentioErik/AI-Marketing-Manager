import { db, agentOutputs, type AgentOutput } from '../index'
import { eq, and, desc } from 'drizzle-orm'

export async function saveOutput(data: {
  runId: string
  agentId: string
  tenantId: string
  content: string
  contentType?: string
  assets?: object
}): Promise<AgentOutput> {
  const summary = data.content.replace(/[#*`>\-]/g, '').trim().slice(0, 280)

  // Increment version
  const [latest] = await db
    .select({ version: agentOutputs.version })
    .from(agentOutputs)
    .where(and(eq(agentOutputs.tenantId, data.tenantId), eq(agentOutputs.agentId, data.agentId)))
    .orderBy(desc(agentOutputs.createdAt))
    .limit(1)

  const version = (latest?.version ?? 0) + 1

  const [output] = await db
    .insert(agentOutputs)
    .values({
      runId: data.runId,
      agentId: data.agentId,
      tenantId: data.tenantId,
      content: data.content,
      summary,
      contentType: data.contentType ?? 'markdown',
      assets: data.assets ?? null,
      version,
    })
    .returning()
  return output
}

export async function getOutputsForAgent(
  agentId: string,
  tenantId: string,
  limit = 10,
  offset = 0
): Promise<{ outputs: AgentOutput[]; total: number }> {
  const [outputs, countResult] = await Promise.all([
    db
      .select()
      .from(agentOutputs)
      .where(and(eq(agentOutputs.agentId, agentId), eq(agentOutputs.tenantId, tenantId)))
      .orderBy(desc(agentOutputs.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: agentOutputs.id })
      .from(agentOutputs)
      .where(and(eq(agentOutputs.agentId, agentId), eq(agentOutputs.tenantId, tenantId))),
  ])
  return { outputs, total: countResult.length }
}
