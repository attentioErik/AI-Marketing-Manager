import type { Agent, Tenant } from '../db/schema'

export function buildPrompt(agent: Agent, tenant: Tenant): {
  systemPrompt: string
  userMessage: string
} {
  const today = new Date().toLocaleDateString('nb-NO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const systemPrompt = `${agent.systemPrompt}

---

## Autonomt kjøremodus

Du kjøres i dag (${today}) som en del av ${tenant.name}s automatiserte marketing-team.

**Kritiske regler:**
- Aldri still brukeren spørsmål. Dokumenter antakelser øverst i output under "## Antakelser".
- Lever alltid konkret, handlingsbart innhold — ikke generiske råd.
- All output skal speile Attentio AS sin tone of voice: direkte, modig, resultatorientert.
- Skriv på norsk med mindre noe annet er eksplisitt bedt om.`

  const userMessage = `${agent.schedulePrompt ?? 'Gjennomfør dine ukentlige oppgaver.'}

---

## Bedriftskontekst

${tenant.productMarketingContext}

---

Start med "## Antakelser" (maksimalt 3 kulepunkter med antakelser du gjør), deretter direkte til output.`

  return { systemPrompt, userMessage }
}
