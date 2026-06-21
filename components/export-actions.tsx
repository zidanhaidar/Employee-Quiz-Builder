"use client"

import { useState } from "react"
import { Check, Copy, Download, FileJson } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import type { QuizQuestion } from "@/lib/quiz-types"
import { downloadFile, quizToJson, quizToText, slugify, type ExportMeta } from "@/lib/export"

export function ExportActions({
  questions,
  meta,
  size = "sm",
}: {
  questions: QuizQuestion[]
  meta: ExportMeta
  size?: "sm" | "default"
}) {
  const [copied, setCopied] = useState<"json" | "text" | null>(null)

  async function copy(kind: "json" | "text") {
    const content = kind === "json" ? quizToJson(questions, meta) : quizToText(questions, meta)
    try {
      await navigator.clipboard.writeText(content)
      setCopied(kind)
      toast.success(kind === "json" ? "JSON copied to clipboard" : "Quiz text copied to clipboard")
      setTimeout(() => setCopied(null), 1500)
    } catch {
      toast.error("Could not copy. Try downloading instead.")
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size={size} onClick={() => copy("json")}>
        {copied === "json" ? <Check className="size-4" /> : <Copy className="size-4" />}
        Copy JSON
      </Button>
      <Button type="button" variant="outline" size={size} onClick={() => copy("text")}>
        {copied === "text" ? <Check className="size-4" /> : <FileJson className="size-4" />}
        Copy text
      </Button>
      <Button
        type="button"
        variant="outline"
        size={size}
        onClick={() => {
          downloadFile(`${slugify(meta.topic)}.json`, quizToJson(questions, meta))
          toast.success("Downloaded JSON file")
        }}
      >
        <Download className="size-4" />
        Download
      </Button>
    </div>
  )
}
