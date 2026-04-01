import StatusBadge from '@/components/StatusBadge'
import styles from './RunHistory.module.css'
import type { AgentRun } from '@/lib/db/schema'

export default function RunHistory({ runs }: { runs: AgentRun[] }) {
  if (!runs.length) {
    return <p className={styles.empty}>Ingen kjøringer ennå.</p>
  }

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Tidspunkt</th>
            <th>Status</th>
            <th>Varighet</th>
            <th>Tokens</th>
            <th>Trigget av</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.id}>
              <td>{run.createdAt ? new Date(run.createdAt).toLocaleString('nb-NO') : '—'}</td>
              <td>
                <StatusBadge
                  status={
                    run.status === 'success' ? 'success'
                    : run.status === 'error'  ? 'error'
                    : run.status === 'running' ? 'running'
                    : 'pending'
                  }
                />
              </td>
              <td>{run.durationMs ? `${(run.durationMs / 1000).toFixed(1)}s` : '—'}</td>
              <td>
                {run.inputTokens && run.outputTokens
                  ? `${run.inputTokens + run.outputTokens} (↑${run.inputTokens} ↓${run.outputTokens})`
                  : '—'}
              </td>
              <td>{run.triggeredBy}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
