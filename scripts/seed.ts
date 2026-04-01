/**
 * Seed script — Attentio AS + 8 agents
 * Run: npx tsx scripts/seed.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../lib/db/schema'
import { hashPassword } from '../lib/auth/password'
import { readFileSync } from 'fs'
import { join } from 'path'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

// ── Read product marketing context ────────────────────────
const productMarketingContext = readFileSync(
  join(__dirname, '../../.agents/product-marketing-context.md'),
  'utf-8'
)

// ── Read agent system prompts ─────────────────────────────
function readAgentPrompt(slug: string): string {
  try {
    const raw = readFileSync(
      join(__dirname, `../../.claude/agents/${slug}.md`),
      'utf-8'
    )
    // Strip frontmatter
    return raw.replace(/^---[\s\S]*?---\n/, '').trim()
  } catch {
    return `You are the ${slug} agent for Attentio AS marketing team.`
  }
}

// ── Agent definitions ─────────────────────────────────────
const agentDefs = [
  {
    slug: 'produkt-og-strategi',
    displayName: 'Produkt & Strategi',
    description: 'Posisjonering, kundeinnsikt, konkurranseanalyse og prisstrategi',
    model: 'claude-sonnet-4-6',
    sortOrder: 0,
    schedulePrompt: `Du kjører som produkt-og-strategi-agent i autonomt modus for Attentio AS.

OPPGAVER FOR DENNE KJØRINGEN:
1. Analyser Attentios konkurranseposisjon i det norske AI-byrå-markedet
2. Identifiser topp 3 kundesmertepunkter basert på kjent ICP
3. Anbefal én psykologisk prinsipp å anvende på eksisterende markedsmateriell
4. Gi en mini-prisingsreview med konverteringsanbefalinger

Lever konkrete, handlingsbare funn. Ingen generiske råd.`,
  },
  {
    slug: 'seo-spesialist',
    displayName: 'SEO-spesialist',
    description: 'Organisk synlighet, teknisk SEO, programmatisk SEO og schema markup',
    model: 'claude-haiku-4-5-20251001',
    sortOrder: 1,
    schedulePrompt: `Du kjører som seo-spesialist-agent i autonomt modus for Attentio AS.

OPPGAVER FOR DENNE KJØRINGEN:
1. Produser en mini-SEO-audit-sjekkliste for attentio.no (5 tekniske områder)
2. Generer 2 programmatiske SEO-side-utkast for AI-chatbot-tjenesten
3. Skriv én AI-SEO-optimalisert artikkeltittel og metabeskrivelse for 3 tjenestersider
4. List opp 10 target-keywords med estimert søkevolum og vanskelighetsgrad
5. Anbefal intern lenkestrategi for de viktigste landingssidene

Bruk Attentios kjente kontekst. Lever konkret innhold klart for implementering.`,
  },
  {
    slug: 'innholdsskaper',
    displayName: 'Innholdsskaper',
    description: 'Copy, blogg, sosiale medier, annonsetekster og innholdsstrategi',
    model: 'claude-sonnet-4-6',
    sortOrder: 2,
    schedulePrompt: `Du kjører som innholdsskaper-agent i autonomt modus for Attentio AS.

OPPGAVER FOR DENNE KJØRINGEN:
1. Produser innholdskalender for kommende 2 uker (LinkedIn + Facebook, 5-7 poster per kanal)
2. Skriv ukens blogginnlegg (600-900 ord) om et relevant AI/markedsføring-tema
3. Produser 3 annonsekreativer per aktiv kampanje (AI-chatbot, nettside-design)
4. Revider og forbedre headlinen og sub-headlinen på attentio.no/tjenester/ai-chatbot

Tone: Direkte, modig, resultatorientert. Bruk Attentio brand-stemme.`,
  },
  {
    slug: 'epost-og-lead',
    displayName: 'E-post & Lead',
    description: 'Kalde e-poster, e-postsekvenser, lead magnets og gratisverktøy',
    model: 'claude-haiku-4-5-20251001',
    sortOrder: 3,
    schedulePrompt: `Du kjører som epost-og-lead-agent i autonomt modus for Attentio AS.

OPPGAVER FOR DENNE KJØRINGEN:
1. Skriv én nurturing-e-post til eksisterende leads (emne, preview-tekst, body, CTA)
2. Produser 3 kalde e-postvarianter til norske SMB-er (5-100 ansatte)
3. Lag én ny lead magnet-idé med tittel, format og innholdsstruktur
4. Oppdater e-postsekvens-struktur for ny bruker-onboarding (5 e-poster, overskrifter + hensikt)

Mål: Konvertering, ikke bare åpning. Konkrete CTAer.`,
  },
  {
    slug: 'cro-spesialist',
    displayName: 'CRO-spesialist',
    description: 'Konverteringsoptimalisering, A/B-testing og funnel-analyse',
    model: 'claude-sonnet-4-6',
    sortOrder: 4,
    schedulePrompt: `Du kjører som cro-spesialist-agent i autonomt modus for Attentio AS.

OPPGAVER FOR DENNE KJØRINGEN:
1. Gjennomfør konverteringsaudit av attentio.no: hjemmeside, prisside, kontaktside
2. Skriv én dokumentert A/B-testhypotese med testoppsett og suksesskriterier
3. Lever prioritert CRO-backlog med 5 hypoteser rangert etter potensiell effekt × innsats
4. Anbefal konkrete endringer i kontaktskjemaet for høyere fullføring
5. Analyser chatbot-konverteringsflyten og foreslå 2-3 forbedringer

Benchmark mot bransje-CVR for digitalbyrå (typisk 2-5% for kontaktsider).`,
  },
  {
    slug: 'vekst-og-lansering',
    displayName: 'Vekst & Lansering',
    description: 'Betalt annonsering, lanseringsstrategier og referralprogram',
    model: 'claude-sonnet-4-6',
    sortOrder: 5,
    schedulePrompt: `Du kjører som vekst-og-lansering-agent i autonomt modus for Attentio AS.

OPPGAVER FOR DENNE KJØRINGEN:
1. Produser kampanjestruktur for Meta Ads: AI-chatbot-kampanje (målgruppe, budsjett, kreative retninger)
2. Skriv 3 nye annonsetekst-kombinasjoner (headline + beskrivelse + CTA) for Google Ads
3. Evaluer ett veksteksperiment fra backlog og anbefal om det skal kjøres
4. Oppdater referral-program-strukturen med ett nytt insentiv-forslag
5. Lag en 4-ukers lanseringsplan for én ny tjeneste (f.eks. AI-automatisering)

Fokuser på kanaler med lav CAC og skalerbarhet.`,
  },
  {
    slug: 'revenue-og-salg',
    displayName: 'Revenue & Salg',
    description: 'RevOps, salgsenablement, churn-forebygging og analytics',
    model: 'claude-haiku-4-5-20251001',
    sortOrder: 6,
    schedulePrompt: `Du kjører som revenue-og-salg-agent i autonomt modus for Attentio AS.

OPPGAVER FOR DENNE KJØRINGEN:
1. Produser ukentlig revenue-snapshot-mal (MQL, SQL, lukkede deals, MRR-endring)
2. Analyser churn-risiko for et typisk Attentio-kundesegment og anbefal tiltak
3. Oppdater lead-scoring-modell med nye kriterier basert på ICP
4. Lag én battlecard mot topkonkurrent (ukjent navn → bruk "AI-byrå X")
5. Valider UTM-struktur og attribution-modell — anbefal forbedringer

Lever alt klart for implementering i CRM/analytics-plattform.`,
  },
  {
    slug: 'visuell-kreator',
    displayName: 'Visuell Kreator',
    description: 'Karuselllinnlegg (PNG), sosiale grafikker og videoinnhold via Nanobanana og Higgsfield',
    model: 'claude-sonnet-4-6',
    sortOrder: 7,
    schedulePrompt: `Du kjører som visuell-kreator-agent i autonomt modus for Attentio AS.

OPPGAVER FOR DENNE KJØRINGEN:
1. Produser et 5-slide Instagram-karusell-konsept om "Hvorfor AI-chatbot for din bedrift"
   - Slide 1: Hook/tittel
   - Slides 2-4: Tre nøkkelpoenger med tall/fakta
   - Slide 5: CTA
   - For hvert slide: tittel, brødtekst (maks 30 ord), bildeprompt for Nanobanana

2. Lag bildeprompts (på engelsk) for 3 sosiale medier-grafikker i Attentio-brand:
   - Mørk bakgrunn (#08080c), lilla (#7752e9) og teal (#00d4c8) aksenter
   - Bricolage Grotesque-stil (bold, moderne)

3. Lag én videoprompt for Higgsfield (15-30 sek reklamefilm for AI-chatbot-tjenesten)

Svar i strukturert JSON-format for API-kall.`,
  },
]

async function main() {
  console.log('🌱 Seeder Attentio AS...')

  // ── Insert tenant ──────────────────────────────────────
  const [tenant] = await db
    .insert(schema.tenants)
    .values({
      slug:                    'attentio',
      name:                    'Attentio AS',
      domain:                  'marketing.attentio.no',
      productMarketingContext: productMarketingContext,
    })
    .onConflictDoUpdate({
      target: schema.tenants.slug,
      set: {
        productMarketingContext: productMarketingContext,
        updatedAt: new Date(),
      },
    })
    .returning()

  console.log(`✅ Tenant: ${tenant.name} (${tenant.id})`)

  // ── Insert agents ──────────────────────────────────────
  for (const def of agentDefs) {
    const systemPrompt = readAgentPrompt(def.slug)

    const [agent] = await db
      .insert(schema.agents)
      .values({
        tenantId:       tenant.id,
        slug:           def.slug,
        displayName:    def.displayName,
        description:    def.description,
        systemPrompt:   systemPrompt,
        schedulePrompt: def.schedulePrompt,
        model:          def.model,
        sortOrder:      def.sortOrder,
      })
      .onConflictDoUpdate({
        target: [schema.agents.tenantId, schema.agents.slug],
        set: {
          displayName:    def.displayName,
          description:    def.description,
          systemPrompt:   systemPrompt,
          schedulePrompt: def.schedulePrompt,
          model:          def.model,
          updatedAt:      new Date(),
        },
      })
      .returning()

    console.log(`  ✅ Agent: ${agent.displayName} (${agent.model})`)
  }

  // ── Insert admin user ──────────────────────────────────
  const adminEmail    = process.env.ADMIN_EMAIL    ?? 'admin@attentio.no'
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'attentio2026'
  const hashed        = await hashPassword(adminPassword)

  await db
    .insert(schema.users)
    .values({
      tenantId:       tenant.id,
      email:          adminEmail,
      hashedPassword: hashed,
      role:           'admin',
    })
    .onConflictDoUpdate({
      target: schema.users.email,
      set: { hashedPassword: hashed },
    })

  console.log(`  ✅ Admin user: ${adminEmail}`)
  console.log('\n🎉 Seed komplett!')
}

main().catch((e) => { console.error(e); process.exit(1) })
