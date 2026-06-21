"use client"

import { useState } from "react"
import { Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { Difficulty, FeedbackMode, Language, QuizConfig } from "@/lib/quiz-types"

const EXAMPLES = [
  "Child development milestones from 0–3 years",
  "Essential infant nutrition & MPASI facts every parent should know",
  "Safe sleep practices for newborns",
  "Managing toddler tantrums with positive discipline",
]

export function QuizSetup({
  onGenerate,
  loading,
}: {
  onGenerate: (config: QuizConfig) => void
  loading: boolean
}) {
  const [topic, setTopic] = useState("")
  const [questionCount, setQuestionCount] = useState(10)
  const [difficulty, setDifficulty] = useState<Difficulty>("Mixed")
  const [language, setLanguage] = useState<Language>("English")
  const [feedback, setFeedback] = useState<FeedbackMode>("immediate")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!topic.trim() || loading) return
    onGenerate({ topic: topic.trim(), questionCount, difficulty, language, feedback })
  }

  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="pt-6">
        <form onSubmit={submit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="topic" className="text-base">
              What should this quiz be about?
            </Label>
            <Textarea
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Child development milestones from 0–3 years"
              className="min-h-24 resize-none text-base"
              disabled={loading}
            />
            <div className="flex flex-wrap gap-2 pt-1">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  disabled={loading}
                  onClick={() => setTopic(ex)}
                  className="rounded-full border border-border bg-secondary px-3 py-1 text-xs text-secondary-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="count">Number of questions</Label>
                <span className="text-sm font-semibold tabular-nums text-primary">{questionCount}</span>
              </div>
              <Slider
                id="count"
                min={3}
                max={20}
                step={1}
                value={[questionCount]}
                onValueChange={(v) => setQuestionCount(Array.isArray(v) ? v[0] : v)}
                disabled={loading}
              />
            </div>

            <div className="flex flex-col gap-3">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)} disabled={loading}>
                <SelectTrigger id="difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                  <SelectItem value="Mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-3">
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={(v) => setLanguage(v as Language)} disabled={loading}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Bahasa Indonesia">Bahasa Indonesia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-3">
              <Label>Show answers</Label>
              <RadioGroup
                value={feedback}
                onValueChange={(v) => setFeedback(v as FeedbackMode)}
                className="flex gap-4 pt-1"
                disabled={loading}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="immediate" id="fb-immediate" />
                  <Label htmlFor="fb-immediate" className="font-normal">
                    After each question
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="end" id="fb-end" />
                  <Label htmlFor="fb-end" className="font-normal">
                    At the end
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <Button type="submit" size="lg" disabled={loading || !topic.trim()} className="w-full">
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Generating your quiz…
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Generate quiz
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
