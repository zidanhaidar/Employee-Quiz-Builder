"use client"

import { Check, RotateCcw, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ExportActions } from "@/components/export-actions"
import { cn } from "@/lib/utils"
import type { QuizConfig, QuizQuestion } from "@/lib/quiz-types"

function performanceMessage(pct: number): { title: string; body: string } {
  if (pct === 100)
    return { title: "Perfect score!", body: "You clearly know your stuff — ready to support parents with confidence." }
  if (pct >= 80)
    return { title: "Excellent work!", body: "A strong grasp of the material. A quick review of the misses and you're golden." }
  if (pct >= 60)
    return { title: "Nicely done.", body: "A solid foundation. Revisit the explanations below to sharpen the details." }
  if (pct >= 40)
    return { title: "Good start.", body: "You're getting there. The explanations below are a great way to fill the gaps." }
  return { title: "Room to grow.", body: "No worries — every expert started here. Read through the explanations and try again." }
}

export function QuizResults({
  questions,
  answers,
  config,
  onRetake,
  onNewQuiz,
}: {
  questions: QuizQuestion[]
  answers: number[]
  config: QuizConfig
  onRetake: () => void
  onNewQuiz: () => void
}) {
  const total = questions.length
  const correct = questions.reduce((acc, q, i) => acc + (answers[i] === q.correctAnswer ? 1 : 0), 0)
  const pct = Math.round((correct / total) * 100)
  const msg = performanceMessage(pct)

  return (
    <div className="flex flex-col gap-5">
      <Card className="overflow-hidden border-border/70 shadow-sm">
        <div className="flex flex-col items-center gap-4 bg-primary px-6 py-8 text-center text-primary-foreground">
          <div className="flex size-24 flex-col items-center justify-center rounded-full bg-primary-foreground/15">
            <span className="text-3xl font-bold tabular-nums">{pct}%</span>
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-balance">{msg.title}</h2>
            <p className="text-sm text-primary-foreground/85 text-pretty">{msg.body}</p>
          </div>
          <p className="text-sm font-medium">
            You scored <span className="font-bold">{correct}</span> out of {total}
          </p>
        </div>
        <CardContent className="flex flex-col gap-3 pt-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={onRetake} variant="outline" className="flex-1">
              <RotateCcw className="size-4" />
              Retake this quiz
            </Button>
            <Button onClick={onNewQuiz} className="flex-1">
              <Sparkles className="size-4" />
              New quiz
            </Button>
          </div>
          <Separator />
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-muted-foreground">Export this quiz for training</p>
            <ExportActions
              questions={questions}
              meta={{ topic: config.topic, difficulty: config.difficulty, language: config.language }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <h3 className="px-1 text-sm font-semibold text-muted-foreground">Review answers</h3>
        {questions.map((q, i) => {
          const userAnswer = answers[i]
          const wasCorrect = userAnswer === q.correctAnswer
          return (
            <Card key={i} className="border-border/70">
              <CardContent className="flex flex-col gap-3 pt-5">
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-white",
                      wasCorrect ? "bg-emerald-500" : "bg-destructive",
                    )}
                  >
                    {wasCorrect ? <Check className="size-4" /> : <X className="size-4" />}
                  </span>
                  <p className="text-pretty font-medium leading-snug">
                    {i + 1}. {q.question}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 pl-9 text-sm">
                  {q.options.map((opt, oi) => {
                    const isCorrect = oi === q.correctAnswer
                    const isUserWrong = oi === userAnswer && !wasCorrect
                    return (
                      <div
                        key={oi}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-2.5 py-1.5",
                          isCorrect && "bg-emerald-500/10 font-medium text-emerald-700 dark:text-emerald-400",
                          isUserWrong && "bg-destructive/10 text-destructive line-through",
                        )}
                      >
                        <span className="text-xs font-semibold">{String.fromCharCode(65 + oi)}.</span>
                        <span>{opt}</span>
                        {isCorrect && <Check className="ml-auto size-3.5" />}
                      </div>
                    )
                  })}
                  {userAnswer === -1 && <p className="text-xs italic text-muted-foreground">No answer selected</p>}
                  <p className="mt-1 rounded-lg bg-muted px-2.5 py-2 text-muted-foreground leading-relaxed">
                    {q.explanation}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
