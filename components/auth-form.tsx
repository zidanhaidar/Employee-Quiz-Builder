"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Heart, Loader2, LogIn, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { logIn, signUp } from "@/app/actions/auth"

type Mode = "login" | "signup"

export function AuthForm() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    const res =
      mode === "signup"
        ? await signUp({ name, email, password })
        : await logIn({ email, password })
    setLoading(false)

    if (!res.ok) {
      toast.error(res.error ?? "Something went wrong.")
      return
    }
    toast.success(mode === "signup" ? "Account created" : "Welcome back")
    router.replace("/")
    router.refresh()
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-12">
      <header className="flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <Heart className="size-3.5 text-accent" />
          The Parentinc · Learning
        </div>
        <h1 className="text-balance text-2xl font-bold tracking-tight">Parenting Quiz Generator</h1>
        <p className="max-w-sm text-pretty text-sm text-muted-foreground leading-relaxed">
          Sign in to create and manage quizzes. Taking a quiz with a code doesn&apos;t need an account.
        </p>
      </header>

      <div className="flex gap-1 rounded-xl border border-border bg-secondary p-1">
        {(
          [
            { id: "login", label: "Log in", icon: LogIn },
            { id: "signup", label: "Sign up", icon: UserPlus },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              mode === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={submit} className="flex flex-col gap-4">
            {mode === "signup" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" disabled={loading} autoComplete="name" />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@theparentinc.com" disabled={loading} autoComplete="email" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"} disabled={loading} autoComplete={mode === "signup" ? "new-password" : "current-password"} />
            </div>
            <Button type="submit" size="lg" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Please wait…
                </>
              ) : mode === "signup" ? (
                <>
                  <UserPlus className="size-4" />
                  Create account
                </>
              ) : (
                <>
                  <LogIn className="size-4" />
                  Log in
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        Have a quiz code?{" "}
        <Link href="/take" className="font-medium text-primary underline-offset-4 hover:underline">
          Take a quiz
        </Link>
      </p>
    </div>
  )
}
