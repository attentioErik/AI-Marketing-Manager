'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './RunAgentButton.module.css'

interface Props {
  agentId:   string
  agentName: string
}

export default function RunAgentButton({ agentId, agentName }: Props) {
  const router = useRouter()
  const [loading, setLoading]   = useState(false)
  const [status, setStatus]     = useState<'idle' | 'success' | 'error'>('idle')

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)
    setStatus('idle')

    try {
      const res = await fetch('/api/agents/run', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ agentId }),
      })
      const data = await res.json()
      const run  = data.runs?.[0]
      setStatus(run?.status === 'success' ? 'success' : 'error')
      router.refresh()
    } catch {
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      className={`${styles.btn} ${status === 'success' ? styles.success : ''} ${status === 'error' ? styles.error : ''}`}
      onClick={handleClick}
      disabled={loading}
      title={`Kjør ${agentName}`}
    >
      {loading
        ? <><span className={styles.spinner} /> Kjører…</>
        : status === 'success'
          ? '✓ Fullført'
          : status === 'error'
            ? '✗ Feil'
            : '▶ Kjør AI-Agent'}
    </button>
  )
}
