'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import styles from './OutputViewer.module.css'

export default function OutputViewer({ content }: { content: string | null }) {
  if (!content) {
    return (
      <div className={styles.wrap}>
        <p className={styles.empty}>Ingen output ennå.</p>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <div className="markdown">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  )
}
