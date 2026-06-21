import { notFound } from "next/navigation"
import { TakeQuiz } from "@/components/take-quiz"
import { getQuizByCode } from "@/app/actions/quiz"

export const dynamic = "force-dynamic"

export default async function TakeCodePage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>
  searchParams: Promise<{ name?: string }>
}) {
  const { code } = await params
  const { name } = await searchParams
  const res = await getQuizByCode(code)
  if (!res.ok || !res.quiz) notFound()

  return (
    <main className="min-h-screen bg-background">
      <TakeQuiz quiz={res.quiz} initialName={name ?? ""} />
    </main>
  )
}
