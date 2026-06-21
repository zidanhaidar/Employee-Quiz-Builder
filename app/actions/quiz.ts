"use server"

import { generateText, Output } from "ai"
import { google } from "@ai-sdk/google"
import { z } from "zod"
import { desc, eq, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { attempts, quizzes, type QuizQuestion, type QuizRecord } from "@/lib/db/schema"
import { getSessionUserId } from "@/lib/auth"
import type { AttemptItem, QuizHistoryItem } from "@/lib/quiz-types"

export type Difficulty = "Easy" | "Medium" | "Hard" | "Mixed"
export type Language = "English" | "Bahasa Indonesia"

export type GenerateQuizInput = {
  topic: string
  questionCount: number
  difficulty: Difficulty
  language: Language
}

const questionSchema = z.object({
  question: z.string().describe("The full multiple-choice question text."),
  options: z.array(z.string()).length(4).describe("Exactly four answer options."),
  correctAnswer: z.number().int().min(0).max(3).describe("Zero-based index of the single correct option."),
  explanation: z
    .string()
    .describe("A short, warm explanation of why the answer is correct, shown after answering."),
})

const quizSchema = z.object({
  questions: z.array(questionSchema),
})

// ---- helpers ----

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789" // no ambiguous 0/O/1/I/L

function randomCode(len = 6): string {
  let out = ""
  for (let i = 0; i < len; i++) out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
  return out
}

async function uniqueCode(): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const code = randomCode()
    const existing = await db.select({ id: quizzes.id }).from(quizzes).where(eq(quizzes.code, code)).limit(1)
    if (existing.length === 0) return code
  }
  return randomCode(8)
}

function sanitizeQuestions(raw: QuizQuestion[]): QuizQuestion[] {
  return raw.filter(
    (q) =>
      q &&
      typeof q.question === "string" &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      Number.isInteger(q.correctAnswer) &&
      q.correctAnswer >= 0 &&
      q.correctAnswer <= 3,
  )
}

// ---- generation ----

export async function generateQuiz(input: GenerateQuizInput): Promise<{
  ok: boolean
  questions?: QuizQuestion[]
  error?: string
}> {
  const topic = input.topic.trim()
  if (!topic) return { ok: false, error: "Please enter a topic." }

  const count = Math.min(Math.max(input.questionCount, 1), 20)

  const system = `You are a careful pediatric and child-development content expert writing quizzes for employees of The Parentinc, a parenting company.

Your job is to produce accurate, engaging multiple-choice questions.

Rules:
- Each question has exactly 4 options and exactly ONE correct answer.
- Content must be factually accurate and aligned with mainstream pediatric / child-development guidance (WHO, AAP, IDAI).
- Frame guidance as a "general recommendation" — never present medical advice as absolute or as a diagnosis.
- Vary the angle across questions: factual recall, real-life scenarios, "what would you do", and myth-busting.
- Questions must be non-repetitive and clearly relevant to the topic.
- Tone: professional but warm, accessible, and supportive — knowledgeable without being clinical or condescending.
- Each explanation should be 1-3 sentences and teach the "why", so the quiz doubles as a learning tool.
- Difficulty "${input.difficulty}": ${input.difficulty === "Mixed" ? "include a spread of easy, medium, and hard questions." : `target ${input.difficulty.toLowerCase()} difficulty.`}
- Write ALL content (questions, options, explanations) in ${input.language}.`

  const prompt = `Create a quiz of exactly ${count} multiple-choice questions on the topic: "${topic}".`

  try {
    const { experimental_output } = await generateText({
      model: google("gemini-2.5-flash"),
      system,
      prompt,
      experimental_output: Output.object({ schema: quizSchema }),
    })

    const questions = sanitizeQuestions(experimental_output.questions).slice(0, count)

    if (questions.length === 0) {
      return { ok: false, error: "The model returned no valid questions. Please try again." }
    }

    return { ok: true, questions }
  } catch (err) {
    console.log("[v0] generateQuiz error:", err instanceof Error ? err.message : String(err))
    return { ok: false, error: "Something went wrong generating the quiz. Please try again." }
  }
}

// ---- creator CRUD (auth required) ----

export async function saveQuiz(
  input: GenerateQuizInput & { questions: QuizQuestion[] },
): Promise<{ ok: boolean; id?: number; code?: string; error?: string }> {
  const userId = await getSessionUserId()
  if (!userId) return { ok: false, error: "You must be logged in." }

  const questions = sanitizeQuestions(input.questions)
  if (questions.length === 0) return { ok: false, error: "No valid questions to save." }

  try {
    const code = await uniqueCode()
    const [row] = await db
      .insert(quizzes)
      .values({
        userId,
        code,
        topic: input.topic.trim(),
        difficulty: input.difficulty,
        language: input.language,
        questionCount: questions.length,
        questions,
      })
      .returning({ id: quizzes.id, code: quizzes.code })
    revalidatePath("/")
    return { ok: true, id: row.id, code: row.code }
  } catch (err) {
    console.log("[v0] saveQuiz error:", err instanceof Error ? err.message : String(err))
    return { ok: false, error: "Could not save the quiz." }
  }
}

const importSchema = z.object({
  topic: z.string().min(1),
  difficulty: z.string().optional(),
  language: z.string().optional(),
  questions: z
    .array(
      z.object({
        question: z.string().min(1),
        options: z.array(z.string()).length(4),
        correctAnswer: z.number().int().min(0).max(3),
        explanation: z.string().default(""),
      }),
    )
    .min(1),
})

export async function importQuiz(json: string): Promise<{ ok: boolean; code?: string; error?: string }> {
  const userId = await getSessionUserId()
  if (!userId) return { ok: false, error: "You must be logged in." }

  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return { ok: false, error: "That file isn't valid JSON." }
  }

  const result = importSchema.safeParse(parsed)
  if (!result.success) {
    return { ok: false, error: "The JSON doesn't match the quiz format (topic + questions with 4 options each)." }
  }

  const data = result.data
  try {
    const code = await uniqueCode()
    const [row] = await db
      .insert(quizzes)
      .values({
        userId,
        code,
        topic: data.topic.trim(),
        difficulty: data.difficulty ?? "Mixed",
        language: data.language ?? "English",
        questionCount: data.questions.length,
        questions: data.questions,
      })
      .returning({ code: quizzes.code })
    revalidatePath("/")
    return { ok: true, code: row.code }
  } catch (err) {
    console.log("[v0] importQuiz error:", err instanceof Error ? err.message : String(err))
    return { ok: false, error: "Could not import the quiz." }
  }
}

export async function getQuizHistory(): Promise<QuizHistoryItem[]> {
  const userId = await getSessionUserId()
  if (!userId) return []

  try {
    const rows = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.userId, userId))
      .orderBy(desc(quizzes.createdAt))
      .limit(50)

    if (rows.length === 0) return []

    const quizIds = rows.map((r) => r.id)
    const attemptRows = await db
      .select()
      .from(attempts)
      .where(inArray(attempts.quizId, quizIds))
      .orderBy(desc(attempts.createdAt))

    const byQuiz = new Map<number, AttemptItem[]>()
    for (const a of attemptRows) {
      const list = byQuiz.get(a.quizId) ?? []
      list.push({
        id: a.id,
        takerName: a.takerName,
        score: a.score,
        total: a.total,
        createdAt: a.createdAt,
      })
      byQuiz.set(a.quizId, list)
    }

    return rows.map((r: QuizRecord) => ({
      id: r.id,
      code: r.code,
      topic: r.topic,
      difficulty: r.difficulty,
      language: r.language,
      questionCount: r.questionCount,
      questions: r.questions,
      createdAt: r.createdAt,
      attempts: byQuiz.get(r.id) ?? [],
    }))
  } catch (err) {
    console.log("[v0] getQuizHistory error:", err instanceof Error ? err.message : String(err))
    return []
  }
}

export async function deleteQuiz(id: number): Promise<{ ok: boolean }> {
  const userId = await getSessionUserId()
  if (!userId) return { ok: false }
  try {
    await db.delete(quizzes).where(eq(quizzes.id, id))
    revalidatePath("/")
    return { ok: true }
  } catch (err) {
    console.log("[v0] deleteQuiz error:", err instanceof Error ? err.message : String(err))
    return { ok: false }
  }
}

// ---- public taker flow (no auth) ----

export type PublicQuiz = {
  id: number
  code: string
  topic: string
  difficulty: string
  language: string
  questions: QuizQuestion[]
}

export async function getQuizByCode(code: string): Promise<{ ok: boolean; quiz?: PublicQuiz; error?: string }> {
  const normalized = code.trim().toUpperCase()
  if (!normalized) return { ok: false, error: "Please enter a quiz code." }

  try {
    const [row] = await db.select().from(quizzes).where(eq(quizzes.code, normalized)).limit(1)
    if (!row) return { ok: false, error: "No quiz found for that code." }
    return {
      ok: true,
      quiz: {
        id: row.id,
        code: row.code,
        topic: row.topic,
        difficulty: row.difficulty,
        language: row.language,
        questions: row.questions,
      },
    }
  } catch (err) {
    console.log("[v0] getQuizByCode error:", err instanceof Error ? err.message : String(err))
    return { ok: false, error: "Could not load that quiz." }
  }
}

export async function submitAttempt(input: {
  code: string
  takerName: string
  answers: number[]
}): Promise<{ ok: boolean; score?: number; total?: number; error?: string }> {
  const name = input.takerName.trim()
  if (!name) return { ok: false, error: "Please enter your name." }

  try {
    const [row] = await db.select().from(quizzes).where(eq(quizzes.code, input.code.trim().toUpperCase())).limit(1)
    if (!row) return { ok: false, error: "Quiz not found." }

    const total = row.questions.length
    // authoritative scoring on the server
    const score = row.questions.reduce(
      (acc, q, i) => acc + (input.answers[i] === q.correctAnswer ? 1 : 0),
      0,
    )

    await db.insert(attempts).values({
      quizId: row.id,
      takerName: name,
      score,
      total,
      answers: input.answers.map((a) => (Number.isInteger(a) ? a : -1)),
    })
    revalidatePath("/")
    return { ok: true, score, total }
  } catch (err) {
    console.log("[v0] submitAttempt error:", err instanceof Error ? err.message : String(err))
    return { ok: false, error: "Could not record your attempt." }
  }
}
