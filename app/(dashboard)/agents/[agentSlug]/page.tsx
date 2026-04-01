import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getAgentBySlug } from '@/lib/db/queries/agents'
import { getOutputsForAgent } from '@/lib/db/queries/outputs'
import { getRunsForAgent } from '@/lib/db/queries/runs'
import OutputViewer from '@/components/OutputViewer'
import VisualOutputViewer from '@/components/VisualOutputViewer'
import RunHistory from '@/components/RunHistory'
import RunButton from '@/components/RunButton'
import StatusBadge from '@/components/StatusBadge'
import styles from './page.module.css'

export const dynamic = 'force-dynamic'

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ agentSlug: string }>
}) {
  const session = await getSessionFromRequest()
  if (!session) redirect('/login')

  const { agentSlug } = await params
  const agent = await getAgentBySlug(session.tenantId, agentSlug)
  if (!agent) notFound()

  const [{ outputs }, runs] = await Promise.all([
    getOutputsForAgent(agent.id, session.tenantId, 10),
    getRunsForAgent(agent.id, 20),
  ])

  const latestOutput = outputs[0] ?? null
  const latestRun    = runs[0]    ?? null

  const status = latestRun?.status === 'success' ? 'success'
               : latestRun?.status === 'error'   ? 'error'
               : latestRun?.status === 'running'  ? 'running'
               : 'never'

  const isVisual = agent.slug === 'visuell-kreator' || latestOutput?.contentType !== 'markdown'

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <Link href="/dashboard" className={styles.back}>← Dashboard</Link>
          <h1 className={styles.name}>{agent.displayName}</h1>
          {agent.description && <p className={styles.desc}>{agent.description}</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <StatusBadge status={status} />
          <RunButton
            lastRunAt={latestRun?.completedAt?.toISOString() ?? null}
          />
        </div>
      </div>

      {/* Latest output */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          Siste output
          {latestOutput && (
            <span style={{ fontWeight: 400, color: 'var(--color-ui-text-3)', marginLeft: '0.5rem', textTransform: 'none', letterSpacing: 0 }}>
              — Versjon {latestOutput.version} · {new Date(latestOutput.createdAt).toLocaleString('nb-NO')}
            </span>
          )}
        </div>

        {latestOutput ? (
          isVisual
            ? <VisualOutputViewer output={latestOutput} />
            : <OutputViewer content={latestOutput.content} />
        ) : (
          <OutputViewer content={null} />
        )}
      </div>

      {/* Older versions */}
      {outputs.length > 1 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Tidligere versjoner ({outputs.length - 1})</div>
          {outputs.slice(1).map((output) => (
            <details key={output.id} style={{ borderTop: 'var(--border-1) solid var(--color-ui-border)', paddingTop: '0.75rem' }}>
              <summary style={{ cursor: 'pointer', fontSize: 'var(--type-small)', color: 'var(--color-ui-text-3)', marginBottom: '1rem' }}>
                Versjon {output.version} — {new Date(output.createdAt).toLocaleString('nb-NO')}
              </summary>
              <OutputViewer content={output.content} />
            </details>
          ))}
        </div>
      )}

      {/* Run history */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Kjørehistorikk</div>
        <RunHistory runs={runs} />
      </div>
    </div>
  )
}
