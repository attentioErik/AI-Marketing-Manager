import styles from './StatusBadge.module.css'

type Status = 'success' | 'error' | 'running' | 'pending' | 'never'

const labels: Record<Status, string> = {
  success: 'Fullført',
  error:   'Feil',
  running: 'Kjører',
  pending: 'Venter',
  never:   'Ikke kjørt',
}

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`${styles.badge} ${styles[status]}`}>
      <span className={styles.dot} aria-hidden />
      {labels[status]}
    </span>
  )
}
