import { requireAppSession } from "@/core/auth"
import { isDemoSession } from "@/core/demo/is-demo-session"
import { SettingsView } from "@/domains/users/adapters/next/components/settings-view"

export async function SettingsPage() {
  const session = await requireAppSession()

  return (
    <SettingsView
      name={session.appUser.name}
      lastName={session.appUser.lastName ?? ""}
      phone={session.appUser.phone ?? ""}
      email={session.appUser.email}
      isDemo={isDemoSession(session)}
    />
  )
}
