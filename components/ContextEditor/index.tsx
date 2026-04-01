'use client'

import { useState } from 'react'
import Button from '@/components/Button'
import styles from './ContextEditor.module.css'

interface Props {
  tenantId: string
  initial:  string
}

export default function ContextEditor({ tenantId, initial }: Props) {
  const [value,   setValue]   = useState(initial)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    await fetch(`/api/tenants/${tenantId}/context`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ product_marketing_context: value }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className={styles.wrap}>
      <textarea
        className={styles.textarea}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        spellCheck={false}
      />
      <div className={styles.actions}>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Lagrer…' : 'Lagre kontekst'}
        </Button>
        {saved && <span className={styles.saved}>✓ Lagret</span>}
      </div>
    </div>
  )
}
