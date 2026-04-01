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

interface AgentInfo {
  id:          string
  slug:        string
  displayName: string
}

type Phase = 'idle' | 'fetching' | 'running' | 'done'

export default function RunButton({ lastRunAt }: { lastRunAt?: string | null }) {
  const router = useRouter()
  const [phase, setPhase]         = useState<Phase>('idle')
  const [total, setTotal]         = useState(0)
  const [completed, setCompleted] = useState(0)
  const [results, setResults]     = useState<RunResult[] | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)

  async function handleRun() {
    setPhase('fetching')
    setResults(null)
    setFetchError(null)
    setTotal(0)
    setCompleted(0)

    let agentList: AgentInfo[]
    try {
      const res = await fetch('/api/agents')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      agentList = data.agents ?? []
    } catch {
      setFetchError('Kunne ikke hente agentliste')
      setPhase('idle')
      return
    }

    if (agentList.length === 0) {
      setPhase('done')
      setResults([])
      return
    }

    setPhase('running')
    setTotal(agentList.length)

    const promises = agentList.map((agent: AgentInfo) =>
      fetch('/api/agents/run', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ agentId: agent.id }),
      })
      .then(async (res) => {
        const data = await res.json()
        const run: RunResult = data.runs?.[0] ?? {
          agentSlug: agent.slug,
          agentName: agent.displayName,
          status:    'error' as const,
          error:     res.ok ? 'Ukjent feil' : `HTTP ${res.status}`,
        }
        setCompleted((n) => n + 1)
        return run
      })
      .catch((): RunResult => {
        setCompleted((n) => n + 1)
        return { agentSlug: agent.slug, agentName: agent.displayName, status: 'error', error: 'Nettverksfeil' }
      })
    )

    const settled = await Promise.allSettled(promises)
    const runs = settled.map((r) =>
      r.status === 'fulfilled' ? r.value : null
    ).filter(Boolean) as RunResult[]

    setResults(runs)
    setPhase('done')
    router.refresh()
  }

  const successCount = results?.filter((r) => r.status === 'success').length ?? 0
  const errorCount   = results?.filter((r) => r.status === 'error').length ?? 0
  const isDisabled   = phase === 'fetching' || phase === 'running'

  return (
    <div className={styles.wrap}>
      <button className={styles.btn} onClick={handleRun} disabled={isDisabled}>
        {isDisabled ? <span className={styles.spinner} /> : '⚡'}
        {phase === 'fetching' ? 'Henter agenter…' :
         phase === 'running'  ? 'Agentene jobber…' :
         'Sett alle agenter i arbeid'}
      </button>

      {phase === 'running' && total > 0 && (
        <div
          className={styles.progressWrap}
          role="progressbar"
          aria-valuenow={completed}
          aria-valuemax={total}
          aria-label={`${completed} av ${total} agenter fullført`}
        >
          <div
            className={styles.progressBar}
            style={{ width: `${Math.round((completed / total) * 100)}%` }}
          />
        </div>
      )}

      {phase === 'running' && (
        <span className={styles.meta}>{completed} av {total} agenter fullført…</span>
      )}

      {fetchError && phase === 'idle' && (
        <span className={`${styles.pill} ${styles.error}`}>{fetchError}</span>
      )}

      {lastRunAt && !results && phase === 'idle' && !fetchError && (
        <span className={styles.meta}>
          Sist kjørt: {new Date(lastRunAt).toLocaleString('nb-NO')}
        </span>
      )}

      {results && phase === 'done' && (
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
