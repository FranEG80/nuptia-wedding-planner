"use client"

import { useState } from "react"
import { Drawer } from "@base-ui/react/drawer"
import { Menu, X } from "lucide-react"

import type { InvitationContentDto } from "@/domains/invitations/application/dtos/invitation-design.dto"

const navItems = [
  { id: "schedule", href: "#schedule", label: "Itinerario" },
  { id: "venue", href: "#venue", label: "Ubicación" },
  { id: "travel", href: "#travel", label: "Alojamiento" },
  { id: "registry", href: "#registry", label: "Regalos" },
  { id: "questions", href: "#questions", label: "Contacto" },
] as const

export function InvitationMenuDrawer({
  visibleSections,
}: {
  visibleSections: InvitationContentDto["visibleSections"]
}) {
  const [open, setOpen] = useState(false)
  const items = navItems.filter((item) => visibleSections[item.id])

  if (!items.length) {
    return null
  }

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(nextOpen) => setOpen(nextOpen)}
      swipeDirection="left"
    >
      <Drawer.Trigger
        aria-label="Abrir navegación"
        className="fixed left-6 top-6 z-40 flex h-12 w-12 items-center justify-center rounded-[6px] border border-[var(--invite-accent-dark)] bg-[var(--invite-accent)] text-[var(--invite-accent-text)] shadow-[0_12px_24px_rgba(72,54,32,0.24)] transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--invite-accent-dark)]"
      >
        <Menu className="h-7 w-7" aria-hidden="true" strokeWidth={2.4} />
      </Drawer.Trigger>

      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 z-50 min-h-dvh bg-black opacity-[calc(0.30*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[420ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-ending-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*360ms)] data-starting-style:opacity-0 data-swiping:duration-0 motion-reduce:transition-none supports-[-webkit-touch-callout:none]:absolute" />
        <Drawer.Viewport className="fixed inset-0 z-50 flex items-stretch justify-start">
          <Drawer.Popup className="h-full w-[min(28rem,82dvw)] overflow-y-auto overscroll-contain bg-white px-6 py-7 text-[var(--invite-accent-dark)] shadow-[20px_0_60px_rgba(53,40,24,0.18)] outline-none [transform:translateX(var(--drawer-swipe-movement-x))] transition-transform duration-[520ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-ending-style:[transform:translateX(-100%)] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*420ms)] data-starting-style:[transform:translateX(-100%)] data-swiping:select-none motion-reduce:transition-none">
            <Drawer.Content className="flex min-h-full flex-col">
              <div className="flex items-center justify-between">
                <Drawer.Title className="text-sm uppercase tracking-[0.24em] text-[var(--invite-muted)]">
                  Navegación
                </Drawer.Title>
                <Drawer.Close
                  aria-label="Cerrar navegación"
                  className="grid h-14 w-14 place-items-center rounded-[8px] bg-[var(--invite-accent)] text-[var(--invite-accent-text)] shadow-[0_10px_18px_rgba(82,56,30,0.28)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--invite-accent-dark)]"
                >
                  <X className="h-10 w-10" aria-hidden="true" strokeWidth={1.8} />
                </Drawer.Close>
              </div>

              <nav className="mt-12 grid gap-8">
                {items.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="text-[clamp(1.85rem,5vw,2.85rem)] font-bold leading-none text-[var(--invite-accent)] transition-colors hover:text-[var(--invite-heading)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--invite-accent-dark)] [font-family:var(--invite-body-font)]"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
