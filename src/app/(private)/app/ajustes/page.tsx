export default function SettingsPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-foreground">Ajustes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configuración de cuenta, boda, proveedores y publicación.
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
        Esta sección queda reservada para conectar usuarios, proveedores de auth, dominio público y preferencias de la boda.
      </div>
    </section>
  )
}
