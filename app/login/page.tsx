import { redirect } from "next/navigation"
import { AuthForm } from "@/components/auth-form"
import { getCurrentUser } from "@/app/actions/auth"

export const dynamic = "force-dynamic"

export default async function LoginPage() {
  const user = await getCurrentUser()
  if (user) redirect("/")

  return (
    <main className="min-h-screen bg-background">
      <AuthForm />
    </main>
  )
}
