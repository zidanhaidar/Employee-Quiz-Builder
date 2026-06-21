"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Heart, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getQuizByCode } from "@/app/actions/quiz"

export function CodeEntry({ initialCode = "" }: { initialCode?: string }) {
  const router = useRouter()
  const [code, setCode] = useState(initialCode)
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    const trimmedCode = code.trim().toUpperCase()
    const trimmedName = name.trim()
    if (!trimmedCode) return toast.error("Please enter a quiz code.")
    if (!trimmedName) return toast.error("Please enter your name.")

    setLoading(true)
    const res = await getQuizByCode(trimmedCode)
    setLoading(false)
    if (!res.ok) {
      toast.error(res.error ?? "No quiz found for that code.")
      return
    }
    router.push(`/take/${trimmedCode}?name=${encodeURIComponent(trimmedName)}`)
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-12">
      <header className="flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <Heart className="size-3.5 text-accent" />
          The Parentinc · Learning
        </div>
        <h1 className="text-balance text-2xl font-bold tracking-tight">Take a quiz</h1>
        <p className="max-w-sm text-pretty text-sm text-muted-foreground leading-relaxed">
          Enter the quiz code you were given and your name to begin.
        </p>
      </header>

      <Card className="border-border/70 shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="code">Quiz code</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. AB3K7Q"
                className="text-center text-lg font-semibold tracking-[0.3em]"
                maxLength={8}
                disabled={loading}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Your name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" disabled={loading} autoComplete="name" />
            </div>
            <Button type="submit" size="lg" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Finding your quiz…
                </>
              ) : (
                <>
                  Start quiz
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        Creating quizzes?{" "}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}
