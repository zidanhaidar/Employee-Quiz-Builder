import type { QuizQuestion } from "@/lib/quiz-types"

export type ExportMeta = {
  topic: string
  difficulty: string
  language: string
}

export function quizToJson(questions: QuizQuestion[], meta: ExportMeta): string {
  return JSON.stringify(
    {
      topic: meta.topic,
      difficulty: meta.difficulty,
      language: meta.language,
      questionCount: questions.length,
      questions,
    },
    null,
    2,
  )
}

export function quizToText(questions: QuizQuestion[], meta: ExportMeta): string {
  const lines: string[] = []
  lines.push(`Quiz: ${meta.topic}`)
  lines.push(`Difficulty: ${meta.difficulty}  |  Language: ${meta.language}  |  Questions: ${questions.length}`)
  lines.push("")
  questions.forEach((q, i) => {
    lines.push(`${i + 1}. ${q.question}`)
    q.options.forEach((opt, oi) => {
      const letter = String.fromCharCode(65 + oi)
      const marker = oi === q.correctAnswer ? " (correct)" : ""
      lines.push(`   ${letter}. ${opt}${marker}`)
    })
    lines.push(`   Explanation: ${q.explanation}`)
    lines.push("")
  })
  return lines.join("\n")
}

export function downloadFile(filename: string, content: string, type = "application/json") {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "quiz"
  )
}
