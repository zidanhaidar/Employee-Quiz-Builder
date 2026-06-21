"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Clock, Loader2, Play, Trash2, Users } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ExportActions } from "@/components/export-actions"
import { ShareQuiz } from "@/components/share-quiz"
import { deleteQuiz } from "@/app/actions/quiz"
import type { AttemptItem, QuizHistoryItem } from "@/lib/quiz-types"

function formatDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

function scoreColor(score: number, total: number): string {
  const pct = total > 0 ? (score / total) * 100 : 0
  if (pct >= 80) return "text-emerald-600 dark:text-emerald-400"
  if (pct >= 50) return "text-amber-600 dark:text-amber-400"
  return "text-destructive"
}

function Attempts({ attempts }: { attempts: AttemptItem[] }) {
  const [open, setOpen] = useState(false)
  if (attempts.length === 0) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Users className="size-3.5" /> No attempts yet
      </p>
    )
  }
  const shown = open ? attempts : attempts.slice(0, 3)
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <Users className="size-3.5" />
        {attempts.length} {attempts.length === 1 ? "attempt" : "attempts"}
        {attempts.length > 3 && <span className="underline underline-offset-2">{open ? "show less" : "show all"}</span>}
      </button>
      <div className="flex flex-col divide-y divide-border/60 rounded-lg border border-border/60">
        {shown.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
            <span className="truncate font-medium">{a.takerName}</span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="text-xs text-muted-foreground">{formatDate(a.createdAt)}</span>
              <span className={`font-semibold tabular-nums ${scoreColor(a.score, a.total)}`}>
                {a.score}/{a.total}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function QuizHistory({
  history,
  onTake,
}: {
  history: QuizHistoryItem[]
  onTake: (item: QuizHistoryItem) => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<number | null>(null)

  if (history.length === 0) {
    return (
      <Card className="border-dashed border-border/70 bg-transparent">
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
          <Clock className="size-6 text-muted-foreground" />
          <p className="text-sm font-medium">No saved quizzes yet</p>
          <p className="max-w-xs text-sm text-muted-foreground text-pretty">
            Every quiz you generate is saved here with a share code so your team can take it.
          </p>
        </CardContent>
      </Card>
    )
  }

  function handleDelete(id: number) {
    setDeletingId(id)
    startTransition(async () => {
      const res = await deleteQuiz(id)
      if (res.ok) {
        toast.success("Quiz deleted")
        router.refresh()
      } else {
        toast.error("Could not delete quiz")
      }
      setDeletingId(null)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {history.map((item) => (
        <Card key={item.id} className="border-border/70">
          <CardContent className="flex flex-col gap-3 pt-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <p className="text-pretty font-medium leading-snug">{item.topic}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  {formatDate(item.createdAt)}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                <Badge variant="secondary">{item.questionCount} Q</Badge>
                <Badge variant="outline">{item.difficulty}</Badge>
              </div>
            </div>

            <ShareQuiz code={item.code} />

            <Attempts attempts={item.attempts} />

            <Separator />

            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={() => onTake(item)}>
                <Play className="size-4" />
                Preview
              </Button>
              <ExportActions
                questions={item.questions}
                meta={{ topic: item.topic, difficulty: item.difficulty, language: item.language }}
              />
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground hover:text-destructive"
                disabled={pending && deletingId === item.id}
                onClick={() => handleDelete(item.id)}
              >
                {pending && deletingId === item.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
