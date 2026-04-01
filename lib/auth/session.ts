import { db, sessions, users, tenants } from '../db/index'
import { eq, and, gt } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'
import { COOKIE_NAME, SESSION_DURATION_MS } from './constants'

export interface SessionPayload {
  sessionId:  string
  userId:     string
  tenantId:   string
  email:      string
  tenantSlug: string
  tenantName: string
}

export async function createSession(userId: string, tenantId: string): Promise<string> {
  const token     = randomBytes(64).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

  await db.insert(sessions).values({ userId, tenantId, token, expiresAt })
  return token
}

export async function validateSession(token: string): Promise<SessionPayload | null> {
  const result = await db
    .select({
      sessionId:  sessions.id,
      userId:     sessions.userId,
      tenantId:   sessions.tenantId,
      expiresAt:  sessions.expiresAt,
      email:      users.email,
      tenantSlug: tenants.slug,
      tenantName: tenants.name,
    })
    .from(sessions)
    .innerJoin(users,   eq(sessions.userId,   users.id))
    .innerJoin(tenants, eq(sessions.tenantId, tenants.id))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1)

  if (!result[0]) return null
  const { expiresAt: _, ...payload } = result[0]
  return payload
}

export async function deleteSession(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.token, token))
}

export async function getSessionFromRequest(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return validateSession(token)
}

export function setSessionCookie(token: string): { name: string; value: string; options: object } {
  return {
    name:  COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path:     '/',
      maxAge:   SESSION_DURATION_MS / 1000,
    },
  }
}

