import { CodeEntry } from "@/components/code-entry"

export const dynamic = "force-dynamic"

export default async function TakePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>
}) {
  const { code } = await searchParams
  return (
    <main className="min-h-screen bg-background">
      <CodeEntry initialCode={code ?? ""} />
    </main>
  )
}
