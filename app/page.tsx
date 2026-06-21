import { redirect } from "next/navigation"
import { QuizApp } from "@/components/quiz-app"
import { getQuizHistory } from "@/app/actions/quiz"
import { getCurrentUser } from "@/app/actions/auth"

export const dynamic = "force-dynamic"

export default async function Page() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const history = await getQuizHistory()

  return (
    <main className="min-h-screen bg-background">
      <QuizApp user={user} history={history} />
    </main>
  )
}
