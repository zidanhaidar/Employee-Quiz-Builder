"use server"

import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import {
  createSession,
  destroySession,
  getSessionUserId,
  hashPassword,
  verifyPassword,
} from "@/lib/auth"

export type AuthUser = { id: number; email: string; name: string }
export type AuthResult = { ok: boolean; error?: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function signUp(formData: {
  name: string
  email: string
  password: string
}): Promise<AuthResult> {
  const name = formData.name.trim()
  const email = formData.email.trim().toLowerCase()
  const password = formData.password

  if (!name) return { ok: false, error: "Please enter your name." }
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Please enter a valid email address." }
  if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." }

  try {
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
    if (existing.length > 0) return { ok: false, error: "An account with that email already exists." }

    const [row] = await db
      .insert(users)
      .values({ name, email, passwordHash: hashPassword(password) })
      .returning({ id: users.id })

    await createSession(row.id)
    return { ok: true }
  } catch (err) {
    console.log("[auth] signUp error:", err instanceof Error ? err.message : String(err))
    return { ok: false, error: "Could not create your account. Please try again." }
  }
}

export async function logIn(formData: { email: string; password: string }): Promise<AuthResult> {
  const email = formData.email.trim().toLowerCase()
  const password = formData.password

  try {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return { ok: false, error: "Incorrect email or password." }
    }
    await createSession(user.id)
    return { ok: true }
  } catch (err) {
    console.log("[auth] logIn error:", err instanceof Error ? err.message : String(err))
    return { ok: false, error: "Could not log you in. Please try again." }
  }
}

export async function logOut(): Promise<void> {
  await destroySession()
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const userId = await getSessionUserId()
  if (!userId) return null
  try {
    const [user] = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    return user ?? null
  } catch (err) {
    console.log("[auth] getCurrentUser error:", err instanceof Error ? err.message : String(err))
    return null
  }
}
