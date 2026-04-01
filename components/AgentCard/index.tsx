import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import styles from './AgentCard.module.css'
import type { Agent, AgentOutput, AgentRun } from '@/lib/db/schema'

interface Props {
  agent:      Agent
  lastOutput: AgentOutput | null
  lastRun:    AgentRun    | null
}

export default function AgentCard({ agent, lastOutput, lastRun }: Props) {
  const status = lastRun?.status === 'success' ? 'success'
               : lastRun?.status === 'error'   ? 'error'
               : lastRun?.status === 'running'  ? 'running'
               : 'never'

  const preview = lastOutput?.summary ?? null

  return (
    <Link href={`/agents/${agent.slug}`} className={styles.card}>
      <div className={styles.top}>
        <div>
          <div className={styles.name}>{agent.displayName}</div>
          {agent.description && (
            <div className={styles.desc}>{agent.description}</div>
          )}
        </div>
        <StatusBadge status={status} />
      </div>

      {preview
        ? <p className={styles.preview}>{preview}</p>
        : <p className={styles.previewEmpty}>Ingen output ennå — trykk «Sett agentene i arbeid»</p>
      }

      <div className={styles.footer}>
        <span className={styles.timestamp}>
          {lastRun?.completedAt
            ? new Date(lastRun.completedAt).toLocaleString('nb-NO', { dateStyle: 'short', timeStyle: 'short' })
            : '—'}
        </span>
        <span className={styles.viewLink}>Se output →</span>
      </div>
    </Link>
  )
}
