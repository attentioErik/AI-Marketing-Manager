import { NextRequest, NextResponse } from 'next/server'
import { db, users } from '@/lib/db/index'
import { eq } from 'drizzle-orm'
import { verifyPassword } from '@/lib/auth/password'
import { createSession, setSessionCookie } from '@/lib/auth/session'

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'E-post og passord er påkrevd' }, { status: 400 })
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)

  if (!user || !user.hashedPassword) {
    return NextResponse.json({ error: 'Feil e-post eller passord' }, { status: 401 })
  }

  const valid = await verifyPassword(password, user.hashedPassword)
  if (!valid) {
    return NextResponse.json({ error: 'Feil e-post eller passord' }, { status: 401 })
  }

  // Update last login
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id))

  const token  = await createSession(user.id, user.tenantId)
  const cookie = setSessionCookie(token)

  const response = NextResponse.json({ ok: true })
  response.cookies.set(cookie.name, cookie.value, cookie.options as Parameters<typeof response.cookies.set>[2])
  return response
}
