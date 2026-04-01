'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import styles from './OutputViewer.module.css'

interface Assets {
  blog_image_url?: string
  blog_image_alt?: string
}

interface Props {
  content: string | null
  assets?: Assets | null
}

export default function OutputViewer({ content, assets }: Props) {
  if (!content) {
    return (
      <div className={styles.wrap}>
        <p className={styles.empty}>Ingen output ennå.</p>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      {assets?.blog_image_url && (
        <div className={styles.blogHero}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assets.blog_image_url}
            alt={assets.blog_image_alt ?? 'Bloggbilde'}
            className={styles.blogImg}
          />
        </div>
      )}
      <div className="markdown">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  )
}
