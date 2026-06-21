"use client"

import { useState } from "react"
import { ArrowRight, Check, Lightbulb, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { FeedbackMode, QuizQuestion } from "@/lib/quiz-types"

export function QuizRunner({
  questions,
  topic,
  feedback,
  onFinish,
  onExit,
}: {
  questions: QuizQuestion[]
  topic: string
  feedback: FeedbackMode
  onFinish: (answers: number[]) => void
  onExit: () => void
}) {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<number[]>(Array(questions.length).fill(-1))
  const [revealed, setRevealed] = useState(false)

  const q = questions[current]
  const selected = answers[current]
  const isLast = current === questions.length - 1
  const showFeedback = feedback === "immediate" && revealed

  function choose(index: number) {
    if (showFeedback) return
    const next = [...answers]
    next[current] = index
    setAnswers(next)
    if (feedback === "immediate") setRevealed(true)
  }

  function advance() {
    if (isLast) {
      onFinish(answers)
      return
    }
    setCurrent((c) => c + 1)
    setRevealed(false)
  }

  const canAdvance = feedback === "immediate" ? revealed : selected !== -1

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-sm font-medium text-muted-foreground">{topic}</p>
          <Badge variant="secondary" className="shrink-0 tabular-nums">
            {current + 1} / {questions.length}
          </Badge>
        </div>
        <Progress value={((current + 1) / questions.length) * 100} />
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardContent className="flex flex-col gap-5 pt-6">
          <h2 className="text-balance text-lg font-semibold leading-snug">{q.question}</h2>

          <div className="flex flex-col gap-2.5">
            {q.options.map((option, i) => {
              const isSelected = selected === i
              const isCorrect = i === q.correctAnswer
              let state: "idle" | "selected" | "correct" | "wrong" = "idle"
              if (showFeedback) {
                if (isCorrect) state = "correct"
                else if (isSelected) state = "wrong"
              } else if (isSelected) {
                state = "selected"
              }

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => choose(i)}
                  disabled={showFeedback}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border-2 p-3.5 text-left text-sm transition-colors sm:text-base",
                    state === "idle" && "border-border bg-card hover:border-primary/50 hover:bg-secondary",
                    state === "selected" && "border-primary bg-primary/5",
                    state === "correct" && "border-emerald-500 bg-emerald-500/10",
                    state === "wrong" && "border-destructive bg-destructive/10",
                    showFeedback && "cursor-default",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                      state === "correct" && "border-emerald-500 bg-emerald-500 text-white",
                      state === "wrong" && "border-destructive bg-destructive text-white",
                      (state === "idle" || state === "selected") && "border-border bg-secondary text-foreground",
                    )}
                  >
                    {state === "correct" ? (
                      <Check className="size-4" />
                    ) : state === "wrong" ? (
                      <X className="size-4" />
                    ) : (
                      String.fromCharCode(65 + i)
                    )}
                  </span>
                  <span className="flex-1">{option}</span>
                </button>
              )
            })}
          </div>

          {showFeedback && (
            <div
              className={cn(
                "flex flex-col gap-1.5 rounded-xl border p-4",
                selected === q.correctAnswer
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : "border-accent/40 bg-accent/5",
              )}
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Lightbulb className="size-4 text-accent" />
                {selected === q.correctAnswer ? "Correct!" : "Good to know"}
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{q.explanation}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={onExit}>
          Exit
        </Button>
        <Button type="button" onClick={advance} disabled={!canAdvance}>
          {isLast ? "See results" : "Next question"}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
