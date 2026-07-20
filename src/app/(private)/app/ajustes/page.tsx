import { SettingsPage } from "@/domains/users/adapters/next/pages/settings-page"

export default function AjustesRoutePage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-foreground">Ajustes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Datos de tu cuenta.
        </p>
      </div>
      <SettingsPage />
    </section>
  )
}
