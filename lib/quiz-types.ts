export type QuizQuestion = {
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

export type Difficulty = "Easy" | "Medium" | "Hard" | "Mixed"
export type Language = "English" | "Bahasa Indonesia"
export type FeedbackMode = "immediate" | "end"

export type QuizConfig = {
  topic: string
  questionCount: number
  difficulty: Difficulty
  language: Language
  feedback: FeedbackMode
}

export type AttemptItem = {
  id: number
  takerName: string
  score: number
  total: number
  createdAt: string | Date
}

export type QuizHistoryItem = {
  id: number
  code: string
  topic: string
  difficulty: string
  language: string
  questionCount: number
  questions: QuizQuestion[]
  createdAt: string | Date
  attempts: AttemptItem[]
}
