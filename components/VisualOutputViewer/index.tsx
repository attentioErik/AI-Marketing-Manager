'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Button from '@/components/Button'
import styles from './VisualOutputViewer.module.css'
import type { AgentOutput } from '@/lib/db/schema'

interface Slide { url?: string; caption?: string; image_prompt?: string }
interface Assets { slides?: Slide[]; video_prompt?: string; video_url?: string; graphics?: Slide[] }

export default function VisualOutputViewer({ output }: { output: AgentOutput }) {
  const assets = output.assets as Assets | null

  if (output.contentType === 'carousel' && assets?.slides?.length) {
    return (
      <div className={styles.wrap}>
        <div className={styles.slides}>
          {assets.slides.map((slide, i) => (
            <div key={i} className={styles.slide}>
              {slide.url
                ? <img src={slide.url} alt={`Slide ${i + 1}`} className={styles.slideImg} />
                : <div className={styles.slideImg} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-ui-text-3)', fontSize: 'var(--type-small)' }}>
                    Genererer bilde…
                  </div>
              }
              {slide.caption && <div className={styles.slideCaption}>{slide.caption}</div>}
              {slide.image_prompt && <div className={styles.slidePrompt}>{slide.image_prompt}</div>}
            </div>
          ))}
        </div>

        <div className={styles.actions}>
          {assets.slides.some((s) => s.url) && (
            <Button size="sm" variant="outline" as="a" href={assets.slides.find((s) => s.url)?.url}>
              Last ned eksempel
            </Button>
          )}
        </div>

        {/* Also show raw markdown if present */}
        {output.content && (
          <div className={`${styles.markdownFallback} markdown`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{output.content}</ReactMarkdown>
          </div>
        )}
      </div>
    )
  }

  if (output.contentType === 'video' && assets) {
    return (
      <div className={styles.wrap}>
        {assets.video_url && (
          <video controls style={{ width: '100%', borderRadius: 'var(--radius-card-sm)' }}>
            <source src={assets.video_url} />
          </video>
        )}
        {assets.video_prompt && (
          <div className={styles.videoWrap}>
            <div className={styles.videoLabel}>Videoprompt (Higgsfield)</div>
            <div className={styles.videoPrompt}>{assets.video_prompt}</div>
          </div>
        )}
        <div className={`markdown`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{output.content}</ReactMarkdown>
        </div>
      </div>
    )
  }

  // Fallback: markdown
  return (
    <div className={styles.wrap}>
      <div className="markdown">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{output.content}</ReactMarkdown>
      </div>
    </div>
  )
}
