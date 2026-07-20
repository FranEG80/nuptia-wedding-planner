"use client"

import { Dialog } from "@base-ui/react/dialog"
import { X } from "lucide-react"
import { useState } from "react"

export function AddTableDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (input: { name?: string; capacity?: number | null }) => void
}) {
  const [name, setName] = useState("")
  const [capacity, setCapacity] = useState("8")

  function handleCreate() {
    onCreate({
      name: name.trim() || undefined,
      capacity: capacity.trim() ? Number(capacity) : null,
    })
    setName("")
    setCapacity("8")
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[2px] transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6">
          <Dialog.Popup className="relative my-auto w-full max-w-sm rounded-3xl border border-border bg-card p-5 text-foreground shadow-2xl outline-none transition-all data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 sm:p-7">
            <div className="pr-12">
              <Dialog.Title className="font-serif text-2xl">Añadir mesa</Dialog.Title>
            </div>
            <Dialog.Close
              aria-label="Cerrar"
              className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>

            <label className="mt-6 grid gap-2 text-sm font-medium">
              Nombre (opcional)
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Mesa 5"
                className="h-11 rounded-xl border border-border bg-background px-3 outline-none focus:border-accent"
              />
            </label>
            <label className="mt-4 grid gap-2 text-sm font-medium">
              Capacidad
              <input
                type="number"
                min={1}
                value={capacity}
                onChange={(event) => setCapacity(event.target.value)}
                className="h-11 rounded-xl border border-border bg-background px-3 outline-none focus:border-accent"
              />
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <Dialog.Close className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-secondary">
                Cancelar
              </Dialog.Close>
              <button
                type="button"
                onClick={handleCreate}
                className="rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
              >
                Añadir
              </button>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
