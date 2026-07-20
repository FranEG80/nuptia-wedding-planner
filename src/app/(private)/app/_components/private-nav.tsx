"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  Heart,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Mail,
  Settings,
  Users,
  X,
} from "lucide-react"

import { signOutAction } from "@/core/auth/actions"
import { cn } from "@/shared/lib/utils"

const navItems = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/invitacion", label: "Invitación Digital", icon: Mail },
  { href: "/app/web", label: "Web de Bodas", icon: Globe },
  { href: "/app/invitados", label: "Invitados", icon: Users },
  { href: "/app/tareas", label: "Tareas", icon: ListChecks },
  { href: "/app/ajustes", label: "Ajustes", icon: Settings },
]

export function PrivateNav({
  userName,
  collapsed,
  onCollapsedChange,
  mobileOpen,
  onMobileOpenChange,
}: {
  userName: string
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  mobileOpen?: boolean
  onMobileOpenChange?: (open: boolean) => void
}) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            aria-hidden="true"
            onClick={() => onMobileOpenChange?.(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-sidebar text-sidebar-foreground lg:hidden">
            <button
              type="button"
              className="absolute right-3 top-3 rounded-md p-1 text-sidebar-foreground/60 transition-colors hover:text-sidebar-foreground"
              aria-label="Cerrar menú"
              onClick={() => onMobileOpenChange?.(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3 px-6 py-7">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
                <Heart className="h-5 w-5 fill-current" />
              </span>
              <div className="leading-tight">
                <p className="font-serif text-xl tracking-wide">Nuptia</p>
                <p className="text-xs text-sidebar-foreground/60">Estudio de Bodas</p>
              </div>
            </div>
            <nav className="flex-1 space-y-1 px-4">
              {navItems.map((item) => {
                if (item.active === false) {
                  return null
                }
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => onMobileOpenChange?.(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors",
                      isActive
                        ? "bg-sidebar-primary font-medium text-sidebar-primary-foreground shadow-sm"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <div className="space-y-1 px-4 pb-4">
              <div className="my-3 h-px bg-sidebar-border" />
              <form action={signOutAction}>
                <button
                  type="submit"
                  onClick={() => onMobileOpenChange?.(false)}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent"
                >
                  <LogOut className="h-4.5 w-4.5" strokeWidth={1.75} />
                  Cerrar sesión
                </button>
              </form>
            </div>
            <div className="flex items-center gap-3 border-t border-sidebar-border px-6 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground">
                {userName.slice(0, 2).toUpperCase()}
              </span>
              <div className="leading-tight">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-sidebar-foreground/60">Plan desarrollo</p>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Desktop sidebar */}
      <aside
        className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col overflow-y-auto bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:flex",
        collapsed ? "w-20" : "w-72",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 px-6 py-7",
          collapsed && "justify-center px-3",
        )}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
          <Heart className="h-5 w-5 fill-current" />
        </span>
        <div className={cn("leading-tight", collapsed && "sr-only")}>
          <p className="font-serif text-xl tracking-wide">Nuptia</p>
          <p className="text-xs text-sidebar-foreground/60">Estudio de Bodas</p>
        </div>
      </div>

      <div className={cn("px-4 pb-4", collapsed && "px-3")}>
        <button
          type="button"
          onClick={() => onCollapsedChange(!collapsed)}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
            collapsed && "justify-center px-0",
          )}
          aria-label={collapsed ? "Abrir menú lateral" : "Colapsar menú lateral"}
          title={collapsed ? "Abrir menú lateral" : "Colapsar menú lateral"}
        >
          {collapsed ? (
            <ChevronRight className="h-4.5 w-4.5" strokeWidth={1.75} />
          ) : (
            <ChevronLeft className="h-4.5 w-4.5" strokeWidth={1.75} />
          )}
          <span className={cn(collapsed && "sr-only")}>
            {collapsed ? "Abrir menú" : "Colapsar menú"}
          </span>
        </button>
      </div>

      <nav className={cn("flex-1 space-y-1 px-4", collapsed && "px-3")}>
        {navItems.map((item) => {
          if (item.active === false) {
            return null
          }
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors",
                collapsed && "justify-center px-0",
                isActive
                  ? "bg-sidebar-primary font-medium text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
              title={item.label}
            >
              <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
              <span className={cn(collapsed && "sr-only")}>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className={cn("space-y-1 px-4 pb-4", collapsed && "px-3")}>
        <div className="my-3 h-px bg-sidebar-border" />
        <form action={signOutAction}>
          <button
            type="submit"
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent",
              collapsed && "justify-center px-0",
            )}
            title="Cerrar sesión"
          >
            <LogOut className="h-4.5 w-4.5" strokeWidth={1.75} />
            <span className={cn(collapsed && "sr-only")}>Cerrar sesión</span>
          </button>
        </form>
      </div>

      <div
        className={cn(
          "flex items-center gap-3 border-t border-sidebar-border px-6 py-4",
          collapsed && "justify-center px-3",
        )}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground">
          {userName.slice(0, 2).toUpperCase()}
        </span>
        <div className={cn("leading-tight", collapsed && "sr-only")}>
          <p className="text-sm font-medium">{userName}</p>
          <p className="text-xs text-sidebar-foreground/60">Plan desarrollo</p>
        </div>
      </div>
    </aside>
    </>
  )
}
