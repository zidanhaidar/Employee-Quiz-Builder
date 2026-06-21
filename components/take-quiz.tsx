"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Check, Heart, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { QuizRunner } from "@/components/quiz-runner"
import { cn } from "@/lib/utils"
import { submitAttempt, type PublicQuiz } from "@/app/actions/quiz"

type Stage = "name" | "taking" | "results"

export function TakeQuiz({ quiz, initialName = "" }: { quiz: PublicQuiz; initialName?: string }) {
  const [stage, setStage] = useState<Stage>(initialName.trim() ? "taking" : "name")
  const [name, setName] = useState(initialName.trim())
  const [submitting, setSubmitting] = useState(false)
  const [answers, setAnswers] = useState<number[]>([])
  const [result, setResult] = useState<{ score: number; total: number } | null>(null)

  function startWithName(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return toast.error("Please enter your name.")
    setStage("taking")
  }

  async function finish(finalAnswers: number[]) {
    setAnswers(finalAnswers)
    setSubmitting(true)
    const res = await submitAttempt({ code: quiz.code, takerName: name.trim(), answers: finalAnswers })
    setSubmitting(false)
    if (!res.ok) {
      toast.error(res.error ?? "Could not record your attempt.")
      return
    }
    setResult({ score: res.score ?? 0, total: res.total ?? quiz.questions.length })
    setStage("results")
  }

  if (stage === "name") {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-12">
        <header className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Heart className="size-3.5 text-accent" />
            The Parentinc · Learning
          </div>
          <h1 className="text-balance text-2xl font-bold tracking-tight">{quiz.topic}</h1>
          <p className="text-sm text-muted-foreground">
            {quiz.questions.length} questions · {quiz.difficulty}
          </p>
        </header>
        <Card className="border-border/70 shadow-sm">
          <CardContent className="pt-6">
            <form onSubmit={startWithName} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Your name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" autoComplete="name" />
              </div>
              <Button type="submit" size="lg" className="w-full">
                Start quiz
                <ArrowRight className="size-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (stage === "taking") {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:py-12">
        {submitting && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Recording your score…
          </div>
        )}
        <QuizRunner
          questions={quiz.questions}
          topic={quiz.topic}
          feedback="end"
          onFinish={finish}
          onExit={() => setStage("name")}
        />
      </div>
    )
  }

  // results
  const total = result?.total ?? quiz.questions.length
  const score = result?.score ?? 0
  const pct = Math.round((score / total) * 100)

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-8 sm:py-12">
      <Card className="overflow-hidden border-border/70 shadow-sm">
        <div className="flex flex-col items-center gap-4 bg-primary px-6 py-8 text-center text-primary-foreground">
          <div className="flex size-24 flex-col items-center justify-center rounded-full bg-primary-foreground/15">
            <span className="text-3xl font-bold tabular-nums">{pct}%</span>
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-balance">Nice work, {name.trim()}!</h2>
            <p className="text-sm text-primary-foreground/85">Your score has been recorded.</p>
          </div>
          <p className="text-sm font-medium">
            You scored <span className="font-bold">{score}</span> out of {total}
          </p>
        </div>
        <CardContent className="flex flex-col gap-3 pt-5">
          <Button render={<Link href="/take" />} nativeButton={false} className="w-full">
            Take another quiz
          </Button>
          <Separator />
          <p className="px-1 text-sm font-medium text-muted-foreground">Review answers</p>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        {quiz.questions.map((q, i) => {
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
