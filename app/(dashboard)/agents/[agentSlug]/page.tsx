import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getAgentBySlug } from '@/lib/db/queries/agents'
import { getOutputsForAgent } from '@/lib/db/queries/outputs'
import { getRunsForAgent } from '@/lib/db/queries/runs'
import OutputViewer from '@/components/OutputViewer'
import VisualOutputViewer from '@/components/VisualOutputViewer'
import RunAgentButton from '@/components/RunAgentButton'
import StatusBadge from '@/components/StatusBadge'
import styles from './page.module.css'
import type { AgentOutput, AgentRun } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

function formatDate(date: Date | string) {
  return new Date(date).toLocaleString('nb-NO', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatDuration(ms: number | null) {
  if (!ms) return '—'
  return ms < 60000 ? `${Math.round(ms / 1000)}s` : `${Math.round(ms / 60000)}m`
}

export default async function AgentDetailPage({
  params,
  searchParams,
}: {
  params:       Promise<{ agentSlug: string }>
  searchParams: Promise<{ run?: string }>
}) {
  const session = await getSessionFromRequest()
  if (!session) redirect('/login')

  const { agentSlug } = await params
  const { run: selectedRunId } = await searchParams

  const agent = await getAgentBySlug(session.tenantId, agentSlug)
  if (!agent) notFound()

  const [{ outputs }, runs] = await Promise.all([
    getOutputsForAgent(agent.id, session.tenantId, 20),
    getRunsForAgent(agent.id, 20),
  ])

  // Build map: runId → output
  const outputByRunId = new Map<string, AgentOutput>()
  for (const o of outputs) outputByRunId.set(o.runId, o)

  // Determine which run is selected
  const activeRun: AgentRun | null =
    (selectedRunId ? runs.find((r) => r.id === selectedRunId) : null) ?? runs[0] ?? null

  const activeOutput: AgentOutput | null = activeRun ? (outputByRunId.get(activeRun.id) ?? null) : null

  const latestRun = runs[0] ?? null
  const status = latestRun?.status === 'success' ? 'success'
               : latestRun?.status === 'error'   ? 'error'
               : latestRun?.status === 'running'  ? 'running'
               : 'never'

  const isVisual = activeOutput?.contentType === 'carousel' || activeOutput?.contentType === 'video'
  const blogAssets = activeOutput?.assets as { blog_image_url?: string; blog_image_alt?: string } | null

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <Link href="/dashboard" className={styles.back}>← Dashboard</Link>
          <h1 className={styles.name}>{agent.displayName}</h1>
          {agent.description && <p className={styles.desc}>{agent.description}</p>}
        </div>
        <div className={styles.headerActions}>
          <StatusBadge status={status} />
          <RunAgentButton agentId={agent.id} agentName={agent.displayName} />
        </div>
      </header>

      {/* Two-column layout */}
      <div className={styles.main}>
        {/* Sidebar: rapport-liste */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            Rapporter
            <span className={styles.sidebarCount}>{runs.length}</span>
          </div>

          {runs.length === 0 ? (
            <p className={styles.sidebarEmpty}>Ingen kjøringer ennå.</p>
          ) : (
            <nav className={styles.runList}>
              {runs.map((run) => {
                const isSelected = run.id === (activeRun?.id ?? '')
                const hasOutput  = outputByRunId.has(run.id)
                const runStatus  = run.status === 'success' ? 'success'
                                 : run.status === 'error'   ? 'error'
                                 : run.status === 'running'  ? 'running'
                                 : 'pending'

                return (
                  <Link
                    key={run.id}
                    href={`/agents/${agentSlug}?run=${run.id}`}
                    className={`${styles.runItem} ${isSelected ? styles.runItemActive : ''}`}
                  >
                    <div className={styles.runItemTop}>
                      <span className={styles.runDate}>
                        {run.completedAt ? formatDate(run.completedAt) : formatDate(run.createdAt)}
                      </span>
                      <StatusBadge status={runStatus} />
                    </div>
                    <div className={styles.runItemMeta}>
                      <span className={styles.runDuration}>{formatDuration(run.durationMs)}</span>
                      {hasOutput && (
                        <span className={styles.runVersion}>
                          v{outputByRunId.get(run.id)?.version}
                        </span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </nav>
          )}
        </aside>

        {/* Main content: selected report */}
        <section className={styles.content}>
          {activeOutput ? (
            <>
              <div className={styles.contentMeta}>
                <span className={styles.contentVersion}>Versjon {activeOutput.version}</span>
                <span className={styles.contentDate}>{formatDate(activeOutput.createdAt)}</span>
                {activeRun?.inputTokens != null && activeRun.outputTokens != null && (
                  <span className={styles.contentTokens}>
                    {(activeRun.inputTokens + activeRun.outputTokens).toLocaleString()} tokens
                  </span>
                )}
              </div>

              {isVisual
                ? <VisualOutputViewer output={activeOutput} />
                : <OutputViewer content={activeOutput.content} assets={blogAssets} />
              }
            </>
          ) : activeRun && activeRun.status === 'error' ? (
            <div className={styles.errorState}>
              <div className={styles.errorTitle}>Kjøringen feilet</div>
              <p className={styles.errorMsg}>{activeRun.errorMessage ?? 'Ukjent feil'}</p>
            </div>
          ) : activeRun && activeRun.status === 'running' ? (
            <div className={styles.emptyState}>Agenten kjører…</div>
          ) : runs.length === 0 ? (
            <div className={styles.emptyState}>
              Ingen rapporter ennå. Trykk «Kjør AI-Agent» for å starte.
            </div>
          ) : (
            <div className={styles.emptyState}>Velg en rapport fra listen.</div>
          )}
        </section>
      </div>
    </div>
  )
}
