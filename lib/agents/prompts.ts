import type { Agent, Tenant } from '../db/schema'

export function buildPrompt(agent: Agent, tenant: Tenant): {
  systemPrompt: string
  userMessage: string
} {
  const today = new Date().toLocaleDateString('nb-NO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  // visuell-kreator must output pure JSON — different system suffix
  if (agent.slug === 'visuell-kreator') {
    const systemPrompt = `${agent.systemPrompt}

---

## Autonomt kjøremodus

Du kjøres i dag (${today}) som en del av ${tenant.name}s automatiserte marketing-team.

**Kritiske regler:**
- Svar KUN med én enkelt \`\`\`json ... \`\`\` kodeblokk. Ingen tekst utenfor blokken.
- Ikke legg til overskrifter, kommentarer, forklaringer eller noe annet.
- Bildeprompts skal alltid være på engelsk.
- JSON-strukturen MÅ inneholde et "slides"-array med minst 5 elementer.`

    const userMessage = `${agent.schedulePrompt ?? 'Produser ukentlig karuselllinnlegg.'}

---

## Bedriftskontekst

${tenant.productMarketingContext}

---

Output: kun én \`\`\`json\`\`\` kodeblokk, ingenting annet.`

    return { systemPrompt, userMessage }
  }

  // All other agents
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
