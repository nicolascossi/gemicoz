import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import LoginForm from "@/components/login-form"

export default function Home() {
  const cookieStore = cookies()
  const isAuthenticated = cookieStore.get("authenticated")

  if (isAuthenticated?.value === "true") {
    redirect("/dashboard")
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <LoginForm />
    </main>
  )
}
