"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { importQuiz } from "@/app/actions/quiz"

export function ImportQuiz({ onImported }: { onImported?: (code: string) => void }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = "" // allow re-selecting the same file
    if (!file) return

    setLoading(true)
    try {
      const text = await file.text()
      const res = await importQuiz(text)
      if (!res.ok || !res.code) {
        toast.error(res.error ?? "Could not import that file.")
        return
      }
      toast.success(`Quiz imported · code ${res.code}`)
      router.refresh()
      onImported?.(res.code)
    } catch {
      toast.error("Could not read that file.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-dashed border-border/70 bg-transparent">
      <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
        <Upload className="size-6 text-muted-foreground" />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">Import a quiz from JSON</p>
          <p className="max-w-xs text-sm text-muted-foreground text-pretty">
            Upload a quiz file exported from here to add it to your library with a fresh share code.
          </p>
        </div>
        <input ref={inputRef} type="file" accept="application/json,.json" className="hidden" onChange={handleFile} />
        <Button type="button" variant="outline" disabled={loading} onClick={() => inputRef.current?.click()}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          Choose JSON file
        </Button>
      </CardContent>
    </Card>
  )
}
