"use client"

import { useState } from "react"

export function CopyIbanButton({ iban }: { iban: string }) {
  const [copied, setCopied] = useState(false)

  async function copyIban() {
    await navigator.clipboard.writeText(iban)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2_000)
  }

  return (
    <button type="button" onClick={copyIban} aria-live="polite">
      {copied ? "IBAN copiado" : "Copiar IBAN"}
    </button>
  )
}
