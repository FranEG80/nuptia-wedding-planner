"use client"

import { useEffect, useState } from "react"

function remainingUntil(dateIso: string) {
  const difference = Math.max(0, new Date(dateIso).getTime() - Date.now())

  return {
    days: Math.floor(difference / 86_400_000),
    hours: Math.floor((difference / 3_600_000) % 24),
    minutes: Math.floor((difference / 60_000) % 60),
    seconds: Math.floor((difference / 1_000) % 60),
  }
}

export function WeddingCountdown({ dateIso }: { dateIso: string }) {
  // El servidor y el navegador no comparten reloj: se pinta a cero en ambos y
  // el valor real llega en el primer efecto, evitando un error de hidratación.
  const [remaining, setRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const update = () => setRemaining(remainingUntil(dateIso))
    update()
    const interval = window.setInterval(update, 1_000)

    return () => window.clearInterval(interval)
  }, [dateIso])

  return (
    <div aria-label="Cuenta atrás para la boda">
      {[
        [remaining.days, "días"],
        [remaining.hours, "horas"],
        [remaining.minutes, "min"],
        [remaining.seconds, "seg"],
      ].map(([value, label]) => (
        <span key={label}>
          <strong>{String(value).padStart(2, "0")}</strong>
          <small>{label}</small>
        </span>
      ))}
    </div>
  )
}
