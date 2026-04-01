import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { db, agents, tenants } from '../db/index'
import { createRun, updateRun } from '../db/queries/runs'
import { saveOutput } from '../db/queries/outputs'
import { buildPrompt } from './prompts'
import { eq, and } from 'drizzle-orm'
import type { Agent, Tenant } from '../db/schema'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

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

    // Detect content type and generate visual assets
    const contentType = agent.slug === 'visuell-kreator' ? detectContentType(rawContent) : 'markdown'
    let assets: object | undefined
    if (contentType !== 'markdown') {
      assets = await generateVisualAssets(rawContent, contentType)
    } else if (agent.slug === 'innholdsskaper' && process.env.OPENAI_API_KEY) {
      assets = await generateBlogImage(rawContent)
    }

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

interface SlideData {
  title?:        string
  caption?:      string
  cta?:          string
  image_prompt?: string
  url?:          string
}

interface CarouselAssets {
  slides: SlideData[]
}

async function generateVisualAssets(content: string, contentType: string): Promise<object | undefined> {
  let parsed: { slides?: SlideData[] } | undefined
  try {
    parsed = JSON.parse(extractJson(content))
  } catch (e) {
    console.error('[visuell-kreator] JSON parse failed:', e, '\nRaw content:', content.slice(0, 500))
    return undefined
  }

  if (contentType === 'carousel' && parsed?.slides) {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[visuell-kreator] OPENAI_API_KEY ikke satt — returnerer JSON uten bilder')
      return parsed
    }

    const openai = getOpenAI()
    const slides: SlideData[] = parsed.slides

    const generated = await Promise.allSettled(
      slides.map(async (slide: SlideData) => {
        if (!slide.image_prompt) return slide
        try {
          const response = await openai.images.generate({
            model:           'dall-e-3',
            prompt:          slide.image_prompt,
            size:            '1024x1024',
            quality:         'standard',
            n:               1,
            response_format: 'b64_json',
          })
          const b64 = response.data?.[0]?.b64_json
          const url = b64 ? `data:image/png;base64,${b64}` : undefined
          return { ...slide, url }
        } catch (e) {
          console.error(`[visuell-kreator] DALL-E feil for slide:`, slide.image_prompt?.slice(0, 80), e)
          return slide
        }
      })
    )

    const assets: CarouselAssets = {
      ...parsed,
      slides: generated.map((r, i) =>
        r.status === 'fulfilled' ? r.value : slides[i]
      ),
    }
    return assets
  }

  return parsed
}

async function generateBlogImage(content: string): Promise<object | undefined> {
  try {
    const titleMatch = content.match(/^#{1,2}\s+(.+)$/m)
    const title = titleMatch?.[1]?.replace(/[*_`]/g, '').trim() ?? 'AI og digital markedsføring'

    const prompt = `Professional blog header image for an article titled: "${title}".
Dark digital agency aesthetic: near-black background (#08080c), purple (#7752e9) glowing accents, teal (#00d4c8) highlights.
Abstract tech visualization, glassmorphism elements, bokeh lighting.
Wide landscape format, high quality, no text overlays.`

    const openai = getOpenAI()
    const response = await openai.images.generate({
      model:           'dall-e-3',
      prompt,
      size:            '1792x1024',
      quality:         'standard',
      n:               1,
      response_format: 'b64_json',
    })

    const b64 = response.data?.[0]?.b64_json
    if (!b64) return undefined
    return { blog_image_url: `data:image/png;base64,${b64}`, blog_image_alt: title }
  } catch (e) {
    console.error('[innholdsskaper] Bloggbilde-generering feilet:', e)
    return undefined
  }
}
