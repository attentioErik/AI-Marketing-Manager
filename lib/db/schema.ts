import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ── Tenants ──────────────────────────────────────────────
export const tenants = pgTable('tenants', {
  id:                      uuid('id').primaryKey().defaultRandom(),
  slug:                    text('slug').notNull().unique(),
  name:                    text('name').notNull(),
  domain:                  text('domain').unique(),
  productMarketingContext: text('product_marketing_context').notNull().default(''),
  logoUrl:                 text('logo_url'),
  isActive:                boolean('is_active').notNull().default(true),
  createdAt:               timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:               timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Agents ───────────────────────────────────────────────
export const agents = pgTable('agents', {
  id:             uuid('id').primaryKey().defaultRandom(),
  tenantId:       uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  slug:           text('slug').notNull(),
  displayName:    text('display_name').notNull(),
  description:    text('description'),
  systemPrompt:   text('system_prompt').notNull(),
  schedulePrompt: text('schedule_prompt'),
  model:          text('model').notNull().default('claude-sonnet-4-6'),
  isActive:       boolean('is_active').notNull().default(true),
  sortOrder:      integer('sort_order').notNull().default(0),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('agents_tenant_slug_idx').on(t.tenantId, t.slug),
])

// ── Agent Runs ───────────────────────────────────────────
export const agentRuns = pgTable('agent_runs', {
  id:           uuid('id').primaryKey().defaultRandom(),
  tenantId:     uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  agentId:      uuid('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  triggeredBy:  text('triggered_by').notNull().default('manual'),
  status:       text('status').notNull().default('pending'),
  startedAt:    timestamp('started_at', { withTimezone: true }),
  completedAt:  timestamp('completed_at', { withTimezone: true }),
  durationMs:   integer('duration_ms'),
  inputTokens:  integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  errorMessage: text('error_message'),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Agent Outputs ────────────────────────────────────────
export const agentOutputs = pgTable('agent_outputs', {
  id:          uuid('id').primaryKey().defaultRandom(),
  runId:       uuid('run_id').notNull().references(() => agentRuns.id, { onDelete: 'cascade' }),
  agentId:     uuid('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  tenantId:    uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  content:     text('content').notNull(),
  summary:     text('summary'),
  contentType: text('content_type').notNull().default('markdown'),
  assets:      jsonb('assets'),
  version:     integer('version').notNull().default(1),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('outputs_tenant_agent_idx').on(t.tenantId, t.agentId, t.createdAt),
])

// ── Users ────────────────────────────────────────────────
export const users = pgTable('users', {
  id:             uuid('id').primaryKey().defaultRandom(),
  tenantId:       uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  email:          text('email').notNull().unique(),
  hashedPassword: text('hashed_password'),
  role:           text('role').notNull().default('admin'),
  lastLoginAt:    timestamp('last_login_at', { withTimezone: true }),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Sessions ─────────────────────────────────────────────
export const sessions = pgTable('sessions', {
  id:        uuid('id').primaryKey().defaultRandom(),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tenantId:  uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  token:     text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('sessions_token_idx').on(t.token),
])

// ── Relations ────────────────────────────────────────────
export const tenantsRelations = relations(tenants, ({ many }) => ({
  agents:  many(agents),
  users:   many(users),
  runs:    many(agentRuns),
  outputs: many(agentOutputs),
}))

export const agentsRelations = relations(agents, ({ one, many }) => ({
  tenant:  one(tenants, { fields: [agents.tenantId], references: [tenants.id] }),
  runs:    many(agentRuns),
  outputs: many(agentOutputs),
}))

export const agentRunsRelations = relations(agentRuns, ({ one, many }) => ({
  tenant:  one(tenants, { fields: [agentRuns.tenantId], references: [tenants.id] }),
  agent:   one(agents,  { fields: [agentRuns.agentId],  references: [agents.id] }),
  outputs: many(agentOutputs),
}))

export const agentOutputsRelations = relations(agentOutputs, ({ one }) => ({
  run:    one(agentRuns, { fields: [agentOutputs.runId],    references: [agentRuns.id] }),
  agent:  one(agents,    { fields: [agentOutputs.agentId],  references: [agents.id] }),
  tenant: one(tenants,   { fields: [agentOutputs.tenantId], references: [tenants.id] }),
}))

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant:   one(tenants, { fields: [users.tenantId], references: [tenants.id] }),
  sessions: many(sessions),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user:   one(users,   { fields: [sessions.userId],   references: [users.id] }),
  tenant: one(tenants, { fields: [sessions.tenantId], references: [tenants.id] }),
}))

// ── Type exports ─────────────────────────────────────────
export type Tenant      = typeof tenants.$inferSelect
export type Agent       = typeof agents.$inferSelect
export type AgentRun    = typeof agentRuns.$inferSelect
export type AgentOutput = typeof agentOutputs.$inferSelect
export type User        = typeof users.$inferSelect
export type Session     = typeof sessions.$inferSelect
