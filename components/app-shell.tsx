"use client"

import { useState } from "react"
import { Sidebar, type ViewId } from "@/components/sidebar"
import { DashboardView } from "@/components/views/dashboard-view"
import { InvitationView } from "@/components/views/invitation-view"
import { WebsiteView } from "@/components/views/website-view"
import { GuestsView } from "@/components/views/guests-view"
import { Menu, Bell, Eye, Mail, Users, CalendarClock } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const NOTIFICATIONS = [
  { icon: Users, text: "Marta y Luis han confirmado su asistencia", time: "hace 2 h" },
  { icon: Mail, text: "Quedan 14 invitaciones por enviar", time: "hace 5 h" },
  { icon: CalendarClock, text: "Recordatorio: cierra el menú con el catering", time: "ayer" },
]

const TITLES: Record<ViewId, { title: string; subtitle: string }> = {
  dashboard: { title: "Inicio", subtitle: "Vuestro panel de control" },
  invitation: { title: "Estudio de Diseño", subtitle: "Invitación digital" },
  website: { title: "Web de Bodas", subtitle: "Configura los módulos del evento" },
  guests: { title: "Invitados", subtitle: "Gestión y distribución" },
}

export function AppShell() {
  const [view, setView] = useState<ViewId>("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const meta = TITLES[view]

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar active={view} onChange={setView} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border bg-background/85 px-5 py-4 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border border-border p-2 text-foreground lg:hidden"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="font-serif text-xl text-foreground sm:text-2xl">{meta.title}</h1>
              <p className="text-xs text-muted-foreground">{meta.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("website")}
              className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground transition-colors hover:bg-secondary/50 sm:inline-flex"
            >
              <Eye className="h-4 w-4" /> Previsualizar
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="relative rounded-lg border border-border bg-card p-2.5 text-foreground transition-colors hover:bg-secondary/50"
                aria-label="Notificaciones"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {NOTIFICATIONS.map((n, i) => {
                    const Icon = n.icon
                    return (
                      <DropdownMenuItem key={i} className="flex items-start gap-3 py-2.5">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="flex flex-col gap-0.5">
                          <span className="text-sm leading-snug text-foreground">{n.text}</span>
                          <span className="text-xs text-muted-foreground">{n.time}</span>
                        </span>
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-7 sm:px-8">
          {view === "dashboard" && <DashboardView onNavigate={setView} />}
          {view === "invitation" && <InvitationView />}
          {view === "website" && <WebsiteView />}
          {view === "guests" && <GuestsView />}
        </main>
      </div>
    </div>
  )
}
