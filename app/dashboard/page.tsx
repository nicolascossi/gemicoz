import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import DashboardContent from "@/components/dashboard-content"

export default function Dashboard() {
  const cookieStore = cookies()
  const isAuthenticated = cookieStore.get("authenticated")

  if (isAuthenticated?.value !== "true") {
    redirect("/")
  }

  return <DashboardContent />
}
