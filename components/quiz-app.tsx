"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BookOpen, CheckCircle2, History, Heart, LogOut, Play, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { QuizSetup } from "@/components/quiz-setup"
import { QuizRunner } from "@/components/quiz-runner"
import { QuizResults } from "@/components/quiz-results"
import { QuizHistory } from "@/components/quiz-history"
import { ImportQuiz } from "@/components/import-quiz"
import { ShareQuiz } from "@/components/share-quiz"
import { generateQuiz, saveQuiz } from "@/app/actions/quiz"
import { logOut } from "@/app/actions/auth"
import type { AuthUser } from "@/app/actions/auth"
import type { QuizConfig, QuizHistoryItem, QuizQuestion } from "@/lib/quiz-types"

type Screen = "setup" | "created" | "taking" | "results"
type Tab = "create" | "history"

export function QuizApp({ user, history }: { user: AuthUser; history: QuizHistoryItem[] }) {
  const router = useRouter()
  const [screen, setScreen] = useState<Screen>("setup")
  const [tab, setTab] = useState<Tab>("create")
  const [loading, setLoading] = useState(false)
  const [config, setConfig] = useState<QuizConfig | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [answers, setAnswers] = useState<number[]>([])
  const [createdCode, setCreatedCode] = useState<string | null>(null)

  async function handleGenerate(cfg: QuizConfig) {
    setLoading(true)
    const res = await generateQuiz({
      topic: cfg.topic,
      questionCount: cfg.questionCount,
      difficulty: cfg.difficulty,
      language: cfg.language,
    })

    if (!res.ok || !res.questions) {
      setLoading(false)
      toast.error(res.error ?? "Could not generate the quiz.")
      return
    }

    const saved = await saveQuiz({
      topic: cfg.topic,
      questionCount: res.questions.length,
      difficulty: cfg.difficulty,
      language: cfg.language,
      questions: res.questions,
    })
    setLoading(false)

    if (!saved.ok || !saved.code) {
      toast.error(saved.error ?? "Quiz generated but could not be saved.")
      return
    }

    setConfig(cfg)
    setQuestions(res.questions)
    setCreatedCode(saved.code)
    setScreen("created")
    router.refresh()
  }

  function takeFromHistory(item: QuizHistoryItem) {
    setConfig({
      topic: item.topic,
      questionCount: item.questionCount,
      difficulty: (item.difficulty as QuizConfig["difficulty"]) ?? "Mixed",
      language: (item.language as QuizConfig["language"]) ?? "English",
      feedback: "immediate",
    })
    setQuestions(item.questions)
    setCreatedCode(item.code)
    setScreen("taking")
  }

  function finish(finalAnswers: number[]) {
    setAnswers(finalAnswers)
    setScreen("results")
  }

  function newQuiz() {
    setScreen("setup")
    setTab("create")
    setConfig(null)
    setQuestions([])
    setAnswers([])
    setCreatedCode(null)
  }

  async function handleLogout() {
    await logOut()
    router.replace("/login")
    router.refresh()
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:py-12">
      <header className="flex flex-col items-center gap-3 text-center">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Heart className="size-3.5 text-accent" />
            The Parentinc · Learning
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="hidden sm:inline">{user.name || user.email}</span>
            <Button size="sm" variant="ghost" onClick={handleLogout}>
              <LogOut className="size-4" />
              Log out
            </Button>
          </div>
        </div>
        <h1 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">Parenting Knowledge Quiz Generator</h1>
        <p className="max-w-md text-pretty text-sm text-muted-foreground leading-relaxed">
          Create a quiz on any parenting topic, share a code with your team, and track who took it and how they scored.
        </p>
      </header>

      {screen === "setup" && (
        <>
          <div className="flex gap-1 rounded-xl border border-border bg-secondary p-1">
            {(
              [
                { id: "create", label: "Create quiz", icon: BookOpen },
                { id: "history", label: `History${history.length ? ` (${history.length})` : ""}`, icon: History },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  tab === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>

          {tab === "create" ? (
            <div className="flex flex-col gap-4">
              <QuizSetup onGenerate={handleGenerate} loading={loading} />
              <ImportQuiz onImported={() => setTab("history")} />
            </div>
          ) : (
            <QuizHistory history={history} onTake={takeFromHistory} />
          )}
        </>
      )}

      {screen === "created" && config && createdCode && (
        <Card className="overflow-hidden border-border/70 shadow-sm">
          <div className="flex flex-col items-center gap-3 bg-primary px-6 py-8 text-center text-primary-foreground">
            <CheckCircle2 className="size-10" />
            <h2 className="text-xl font-bold text-balance">Quiz created!</h2>
            <p className="text-sm text-primary-foreground/85 text-pretty">
              Share this code or link so your team can take “{config.topic}”.
            </p>
            <div className="mt-1 rounded-xl bg-primary-foreground/15 px-6 py-3 font-mono text-3xl font-bold tracking-[0.3em]">
              {createdCode}
            </div>
          </div>
          <CardContent className="flex flex-col gap-4 pt-5">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-muted-foreground">Share</p>
              <ShareQuiz code={createdCode} size="default" />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="outline" className="flex-1" onClick={() => setScreen("taking")}>
                <Play className="size-4" />
                Preview quiz
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  newQuiz()
                  setTab("history")
                }}
              >
                <Sparkles className="size-4" />
                Done
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {screen === "taking" && config && (
        <QuizRunner
          questions={questions}
          topic={config.topic}
          feedback={config.feedback}
          onFinish={finish}
          onExit={newQuiz}
        />
      )}

      {screen === "results" && config && (
        <QuizResults
          questions={questions}
          answers={answers}
          config={config}
          onRetake={() => {
            setAnswers([])
            setScreen("taking")
          }}
          onNewQuiz={newQuiz}
        />
      )}

      <footer className="pt-2 text-center text-xs text-muted-foreground text-pretty">
        Content is AI-generated for learning and reflects general pediatric guidance (WHO, AAP, IDAI). It is not medical
        advice.
      </footer>
    </div>
  )
}
