"use client"

import { useState } from "react"

const LABELS = {
  idle: "Copiar IBAN",
  copied: "IBAN copiado",
  // Sin portapapeles (contexto no seguro o permiso denegado) el invitado
  // todavía puede seleccionarlo a mano: se lo decimos en vez de fallar en silencio.
  failed: "Cópialo a mano",
} as const

export function CopyIbanButton({ iban, className }: { iban: string; className?: string }) {
  const [state, setState] = useState<keyof typeof LABELS>("idle")

  async function copyIban() {
    try {
      await navigator.clipboard.writeText(iban)
      setState("copied")
    } catch {
      setState("failed")
    }

    window.setTimeout(() => setState("idle"), 2_500)
  }

  return (
    <button type="button" onClick={copyIban} aria-live="polite" className={className}>
      {LABELS[state]}
    </button>
  )
}
