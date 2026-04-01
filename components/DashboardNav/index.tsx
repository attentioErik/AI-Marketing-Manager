'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import styles from './DashboardNav.module.css'

const navLinks = [
  { href: '/dashboard',  label: 'Dashboard',  icon: '⬛' },
  { href: '/settings',   label: 'Innstillinger', icon: '⚙' },
]

export default function DashboardNav({ tenantName }: { tenantName: string }) {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.logo}>attentio</div>
      <div className={styles.logoSub}>{tenantName}</div>

      <div className={styles.links}>
        {navLinks.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className={`${styles.link} ${pathname === href ? styles.active : ''}`}
          >
            <span className={styles.icon}>{icon}</span>
            {label}
          </Link>
        ))}

        <div className={styles.divider} />

        <div className={styles.logoSub} style={{ padding: '0 0.625rem', marginBottom: '0.5rem' }}>
          Agenter
        </div>

        {[
          { slug: 'produkt-og-strategi',  label: 'Produkt & Strategi' },
          { slug: 'seo-spesialist',        label: 'SEO-spesialist' },
          { slug: 'innholdsskaper',         label: 'Innholdsskaper' },
          { slug: 'epost-og-lead',          label: 'E-post & Lead' },
          { slug: 'cro-spesialist',         label: 'CRO-spesialist' },
          { slug: 'vekst-og-lansering',     label: 'Vekst & Lansering' },
          { slug: 'revenue-og-salg',        label: 'Revenue & Salg' },
          { slug: 'visuell-kreator',        label: 'Visuell Kreator' },
        ].map(({ slug, label }) => (
          <Link
            key={slug}
            href={`/agents/${slug}`}
            className={`${styles.link} ${pathname === `/agents/${slug}` ? styles.active : ''}`}
          >
            <span className={styles.icon}>→</span>
            {label}
          </Link>
        ))}
      </div>

      <div className={styles.bottom}>
        <div className={styles.divider} />
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <span className={styles.icon}>↩</span>
          Logg ut
        </button>
      </div>
    </nav>
  )
}
