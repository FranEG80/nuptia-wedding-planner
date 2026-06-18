"use client"

import { cn } from "@/lib/utils"
import { WEDDING } from "@/lib/wedding-data"
import {
  LayoutDashboard,
  Mail,
  Globe,
  Users,
  Heart,
  Settings,
  LogOut,
  X,
} from "lucide-react"

export type ViewId = "dashboard" | "invitation" | "website" | "guests"

export const NAV_ITEMS: { id: ViewId; label: string; icon: typeof Heart }[] = [
  { id: "dashboard", label: "Inicio", icon: LayoutDashboard },
  { id: "invitation", label: "Invitación Digital", icon: Mail },
  { id: "website", label: "Web de Bodas", icon: Globe },
  { id: "guests", label: "Invitados", icon: Users },
]

export function Sidebar({
  active,
  onChange,
  open,
  onClose,
}: {
  active: ViewId
  onChange: (id: ViewId) => void
  open: boolean
  onClose: () => void
}) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-foreground/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-6 py-7">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
              <Heart className="h-5 w-5" fill="currentColor" />
            </span>
            <div className="leading-tight">
              <p className="font-serif text-xl tracking-wide">Velvet</p>
              <p className="text-xs text-sidebar-foreground/60">Estudio de Bodas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-sidebar-foreground/70 hover:bg-sidebar-accent lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = active === item.id
            return (
              <button
                key={item.id}
                onClick={() => {
                  onChange(item.id)
                  onClose()
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-primary font-medium text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="space-y-1 px-4 pb-4">
          <div className="my-3 h-px bg-sidebar-border" />
          <button className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent">
            <Settings className="h-[18px] w-[18px]" strokeWidth={1.75} />
            Ajustes
          </button>
          <button className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent">
            <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} />
            Cerrar sesión
          </button>
        </div>

        <div className="flex items-center gap-3 border-t border-sidebar-border px-6 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground">
            {WEDDING.brideName[0]}
            {WEDDING.groomName[0]}
          </span>
          <div className="leading-tight">
            <p className="text-sm font-medium">
              {WEDDING.brideName} &amp; {WEDDING.groomName}
            </p>
            <p className="text-xs text-sidebar-foreground/60">Plan Premium</p>
          </div>
        </div>
      </aside>
    </>
  )
}
