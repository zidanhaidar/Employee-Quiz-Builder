"use client"

import { useState } from "react"
import { Check, Copy, Link2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export function ShareQuiz({ code, size = "sm" }: { code: string; size?: "sm" | "default" }) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null)

  function shareUrl() {
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    return `${origin}/take/${code}`
  }

  async function copy(kind: "code" | "link") {
    const value = kind === "code" ? code : shareUrl()
    try {
      await navigator.clipboard.writeText(value)
      setCopied(kind)
      toast.success(kind === "code" ? "Code copied" : "Share link copied")
      setTimeout(() => setCopied(null), 1500)
    } catch {
      toast.error("Could not copy. Copy it manually: " + value)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size={size} onClick={() => copy("code")}>
        {copied === "code" ? <Check className="size-4" /> : <Copy className="size-4" />}
        Code: <span className="font-mono font-semibold tracking-wide">{code}</span>
      </Button>
      <Button type="button" variant="outline" size={size} onClick={() => copy("link")}>
        {copied === "link" ? <Check className="size-4" /> : <Link2 className="size-4" />}
        Copy link
      </Button>
    </div>
  )
}
