import { redirect } from "next/navigation"

export default function PrivateAppIndexPage() {
  redirect("/app/dashboard")
}
