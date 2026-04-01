'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './RunButton.module.css'

interface RunResult {
  agentSlug: string
  agentName: string
  status:    'success' | 'error'
  error?:    string
}

export default function RunButton({ lastRunAt }: { lastRunAt?: string | null }) {
  const router   = useRouter()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<RunResult[] | null>(null)

  async function handleRun() {
    setLoading(true)
    setResults(null)

    const res  = await fetch('/api/agents/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    const data = await res.json()

    setLoading(false)
    setResults(data.runs ?? [])
    router.refresh()
  }

  const successCount = results?.filter((r) => r.status === 'success').length ?? 0
  const errorCount   = results?.filter((r) => r.status === 'error').length ?? 0

  return (
    <div className={styles.wrap}>
      <button className={styles.btn} onClick={handleRun} disabled={loading}>
        {loading ? <span className={styles.spinner} /> : '⚡'}
        {loading ? 'Agentene jobber…' : 'Sett alle agenter i arbeid'}
      </button>

      {lastRunAt && !results && (
        <span className={styles.meta}>
          Sist kjørt: {new Date(lastRunAt).toLocaleString('nb-NO')}
        </span>
      )}

      {results && (
        <div className={styles.results}>
          {successCount > 0 && (
            <span className={`${styles.pill} ${styles.success}`}>
              ✓ {successCount} fullført
            </span>
          )}
          {errorCount > 0 && (
            <span className={`${styles.pill} ${styles.error}`}>
              ✗ {errorCount} feil
            </span>
          )}
          {results.filter((r) => r.status === 'error').map((r) => (
            <span key={r.agentSlug} className={`${styles.pill} ${styles.error}`}>
              {r.agentName}: {r.error}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
