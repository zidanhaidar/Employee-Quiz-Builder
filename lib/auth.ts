import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto"
import { cookies } from "next/headers"

const COOKIE_NAME = "session"
const SESSION_DAYS = 30

function secret(): string {
  const s = process.env.SESSION_SECRET
  if (!s) throw new Error("SESSION_SECRET is not set")
  return s
}

// ---- password hashing (scrypt) ----

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex")
  const derived = scryptSync(password, salt, 64).toString("hex")
  return `${salt}:${derived}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(":")
  if (!salt || !key) return false
  const derived = scryptSync(password, salt, 64)
  const keyBuf = Buffer.from(key, "hex")
  if (keyBuf.length !== derived.length) return false
  return timingSafeEqual(keyBuf, derived)
}

// ---- signed session cookie (payload.signature) ----

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url")
}

function encodeToken(userId: number): string {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp })).toString("base64url")
  return `${payload}.${sign(payload)}`
}

function decodeToken(token: string | undefined): number | null {
  if (!token) return null
  const [payload, sig] = token.split(".")
  if (!payload || !sig) return null
  const expected = sign(payload)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const { uid, exp } = JSON.parse(Buffer.from(payload, "base64url").toString())
    if (typeof uid !== "number" || typeof exp !== "number" || Date.now() > exp) return null
    return uid
  } catch {
    return null
  }
}

export async function createSession(userId: number): Promise<void> {
  const store = await cookies()
  store.set(COOKIE_NAME, encodeToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  })
}

export async function destroySession(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

export async function getSessionUserId(): Promise<number | null> {
  const store = await cookies()
  return decodeToken(store.get(COOKIE_NAME)?.value)
}
