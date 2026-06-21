import { jsonb, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core"
import type { QuizQuestion } from "@/lib/quiz-types"

export type { QuizQuestion }

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull().default(""),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  code: text("code").notNull().unique(),
  topic: text("topic").notNull(),
  difficulty: text("difficulty").notNull().default("Mixed"),
  language: text("language").notNull().default("English"),
  questionCount: integer("question_count").notNull().default(10),
  questions: jsonb("questions").$type<QuizQuestion[]>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const attempts = pgTable("attempts", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id")
    .notNull()
    .references(() => quizzes.id, { onDelete: "cascade" }),
  takerName: text("taker_name").notNull(),
  score: integer("score").notNull(),
  total: integer("total").notNull(),
  answers: jsonb("answers").$type<number[]>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export type QuizRecord = typeof quizzes.$inferSelect
export type UserRecord = typeof users.$inferSelect
export type AttemptRecord = typeof attempts.$inferSelect
