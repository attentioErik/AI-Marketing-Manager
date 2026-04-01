import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import RunAgentButton from '@/components/RunAgentButton'
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
    <div className={styles.card}>
      <Link href={`/agents/${agent.slug}`} className={styles.cardBody}>
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
          : <p className={styles.previewEmpty}>Ingen output ennå</p>
        }
      </Link>

      <div className={styles.footer}>
        <RunAgentButton agentId={agent.id} agentName={agent.displayName} />
        <div className={styles.footerRight}>
          {lastRun?.completedAt && (
            <span className={styles.timestamp}>
              {new Date(lastRun.completedAt).toLocaleString('nb-NO', { dateStyle: 'short', timeStyle: 'short' })}
            </span>
          )}
          <Link href={`/agents/${agent.slug}`} className={styles.viewLink}>
            Se output →
          </Link>
        </div>
      </div>
    </div>
  )
}
