import AgentCard from '@/components/AgentCard'
import styles from './AgentGrid.module.css'
import type { Agent, AgentOutput, AgentRun } from '@/lib/db/schema'

interface Props {
  agents:      Agent[]
  lastOutputs: Record<string, AgentOutput>
  lastRuns:    Record<string, AgentRun>
}

export default function AgentGrid({ agents, lastOutputs, lastRuns }: Props) {
  return (
    <div className={styles.grid}>
      {agents.map((agent) => (
        <AgentCard
          key={agent.id}
          agent={agent}
          lastOutput={lastOutputs[agent.slug] ?? null}
          lastRun={lastRuns[agent.slug]    ?? null}
        />
      ))}
    </div>
  )
}
