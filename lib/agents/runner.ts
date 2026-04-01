import Anthropic from '@anthropic-ai/sdk'
import { db, agents, tenants } from '../db/index'
import { createRun, updateRun } from '../db/queries/runs'
import { saveOutput } from '../db/queries/outputs'
import { buildPrompt } from './prompts'
import { eq, and } from 'drizzle-orm'
import type { Agent, Tenant } from '../db/schema'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface RunResult {
  agentId:     string
  agentSlug:   string
  agentName:   string
  runId:       string
  status:      'success' | 'error'
  outputId?:   string
  error?:      string
  durationMs?: number
  tokens?:     { input: number; output: number }
}

export async function runAgent(agent: Agent, tenant: Tenant): Promise<RunResult> {
  const run = await createRun(tenant.id, agent.id)
  const start = Date.now()

  try {
    const { systemPrompt, userMessage } = buildPrompt(agent, tenant)

    // Map model alias to actual model ID
    const modelId = resolveModel(agent.model)

    const message = await anthropic.messages.create({
      model:      modelId,
      max_tokens: 4096,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userMessage }],
    })

    const durationMs    = Date.now() - start
    const inputTokens   = message.usage.input_tokens
    const outputTokens  = message.usage.output_tokens
    const rawContent    = message.content[0].type === 'text' ? message.content[0].text : ''

    // Detect content type from visuell-kreator (JSON output)
    const contentType = agent.slug === 'visuell-kreator' ? detectContentType(rawContent) : 'markdown'
    const assets      = contentType !== 'markdown' ? parseVisualAssets(rawContent) : undefined

    const output = await saveOutput({
      runId:       run.id,
      agentId:     agent.id,
      tenantId:    tenant.id,
      content:     rawContent,
      contentType,
      assets,
    })

    await updateRun(run.id, {
      status:       'success',
      completedAt:  new Date(),
      durationMs,
      inputTokens,
      outputTokens,
    })

    return {
      agentId:   agent.id,
      agentSlug: agent.slug,
      agentName: agent.displayName,
      runId:     run.id,
      status:    'success',
      outputId:  output.id,
      durationMs,
      tokens:    { input: inputTokens, output: outputTokens },
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Ukjent feil'
    await updateRun(run.id, {
      status:       'error',
      completedAt:  new Date(),
      durationMs:   Date.now() - start,
      errorMessage: error,
    })
    return {
      agentId:   agent.id,
      agentSlug: agent.slug,
      agentName: agent.displayName,
      runId:     run.id,
      status:    'error',
      error,
    }
  }
}

export async function runAllAgents(tenantId: string): Promise<RunResult[]> {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1)
  if (!tenant) throw new Error('Tenant ikke funnet')

  const agentList = await db
    .select()
    .from(agents)
    .where(and(eq(agents.tenantId, tenantId), eq(agents.isActive, true)))
    .orderBy(agents.sortOrder)

  const results = await Promise.allSettled(
    agentList.map((agent) => runAgent(agent, tenant))
  )

  return results.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : {
          agentId:   agentList[i].id,
          agentSlug: agentList[i].slug,
          agentName: agentList[i].displayName,
          runId:     '',
          status:    'error' as const,
          error:     r.reason?.message ?? 'Ukjent feil',
        }
  )
}

export async function runSingleAgent(tenantId: string, agentId: string): Promise<RunResult> {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1)
  if (!tenant) throw new Error('Tenant ikke funnet')

  const [agent] = await db.select().from(agents).where(eq(agents.id, agentId)).limit(1)
  if (!agent) throw new Error('Agent ikke funnet')

  return runAgent(agent, tenant)
}

// ── Helpers ──────────────────────────────────────────────

function resolveModel(model: string): string {
  const map: Record<string, string> = {
    sonnet:                  'claude-sonnet-4-6',
    haiku:                   'claude-haiku-4-5-20251001',
    opus:                    'claude-opus-4-6',
    'claude-sonnet-4-6':     'claude-sonnet-4-6',
    'claude-haiku-4-5-20251001': 'claude-haiku-4-5-20251001',
    'claude-opus-4-6':       'claude-opus-4-6',
  }
  return map[model] ?? model
}

function detectContentType(content: string): string {
  try {
    const parsed = JSON.parse(extractJson(content))
    if (parsed?.slides)    return 'carousel'
    if (parsed?.video_url || parsed?.video_prompt) return 'video'
  } catch { /* not JSON */ }
  return 'markdown'
}

function extractJson(content: string): string {
  const match = content.match(/```json\s*([\s\S]*?)```/) ??
                content.match(/(\{[\s\S]*\})/)
  return match?.[1] ?? content
}

function parseVisualAssets(content: string): object | undefined {
  try {
    return JSON.parse(extractJson(content))
  } catch { return undefined }
}
