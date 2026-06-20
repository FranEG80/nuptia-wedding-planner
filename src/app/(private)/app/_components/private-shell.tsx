"use client"

import {
  type ReactNode,
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"

import { PrivateNav } from "@/app/(private)/app/_components/private-nav"
import { cn } from "@/shared/lib/utils"

const PRIVATE_NAV_COLLAPSED_STORAGE_KEY = "nuptia:private-nav-collapsed"
const PRIVATE_NAV_COLLAPSED_EVENT = "nuptia:private-nav-collapsed-change"

function getPrivateNavCollapsedSnapshot() {
  return (
    window.localStorage.getItem(PRIVATE_NAV_COLLAPSED_STORAGE_KEY) === "true"
  )
}

function getServerPrivateNavCollapsedSnapshot() {
  return false
}

function subscribeToPrivateNavCollapsedChange(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange)
  window.addEventListener(PRIVATE_NAV_COLLAPSED_EVENT, onStoreChange)

  return () => {
    window.removeEventListener("storage", onStoreChange)
    window.removeEventListener(PRIVATE_NAV_COLLAPSED_EVENT, onStoreChange)
  }
}

function persistPrivateNavCollapsed(collapsed: boolean) {
  window.localStorage.setItem(
    PRIVATE_NAV_COLLAPSED_STORAGE_KEY,
    String(collapsed),
  )
  window.dispatchEvent(new Event(PRIVATE_NAV_COLLAPSED_EVENT))
}

export function PrivateShell({
  userName,
  userEmail,
  children,
}: {
  userName: string
  userEmail: string
  children: ReactNode
}) {
  const pathname = usePathname()
  const collapsed = useSyncExternalStore(
    subscribeToPrivateNavCollapsedChange,
    getPrivateNavCollapsedSnapshot,
    getServerPrivateNavCollapsedSnapshot,
  )
  const setCollapsed = useCallback((nextCollapsed: boolean) => {
    persistPrivateNavCollapsed(nextCollapsed)
  }, [])
  const [mobileOpen, setMobileOpen] = useState(false)

  const isInvitationRoute = pathname.startsWith("/app/invitacion")

  useEffect(() => {
    function handlePreviewMode(event: Event) {
      const previewEvent = event as CustomEvent<{ mode?: string }>

      if (previewEvent.detail?.mode === "desktop") {
        setCollapsed(true)
      }
    }

    window.addEventListener("nuptia:invitation-preview-mode", handlePreviewMode)

    return () => {
      window.removeEventListener("nuptia:invitation-preview-mode", handlePreviewMode)
    }
  }, [setCollapsed])

  return (
    <div className="flex min-h-screen bg-background">
      <PrivateNav
        userName={userName}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-4 border-b border-border bg-background/85 px-5 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground lg:hidden"
              aria-label="Abrir menú"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Nuptia Studio
              </p>
              <p className="font-serif text-xl text-foreground">Panel privado</p>
            </div>
          </div>
          <div className="hidden rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground sm:block">
            {userEmail}
          </div>
        </header>
        <main
          className={cn(
            "mx-auto w-full flex-1 px-5 py-7 sm:px-8",
            isInvitationRoute ? "max-w-[1720px]" : "max-w-6xl",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
