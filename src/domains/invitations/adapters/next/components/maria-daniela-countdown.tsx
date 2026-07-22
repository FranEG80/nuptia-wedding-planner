"use client"

import Image from "next/image"
import { Fragment, useSyncExternalStore } from "react"

import { mariaDanielaAssets } from "@/domains/wedding-sites/adapters/next/components/maria-daniela-assets"

const scriptHeading = "my-0 [font-family:var(--font-parisienne),cursive] text-[clamp(3.8rem,8vw,7rem)] font-normal leading-[1.1] pb-[12px]"
const kickerBase = "my-0 mb-4! text-[0.65rem] font-extrabold tracking-[0.24em] uppercase"

const UNITS: { key: "days" | "hours" | "minutes" | "seconds"; label: string }[] = [
  { key: "days", label: "Días" },
  { key: "hours", label: "Horas" },
  { key: "minutes", label: "Minutos" },
  { key: "seconds", label: "Segundos" },
]

function getTimeLeft(target: number, now = Date.now()) {
  const diff = Math.max(0, target - now)
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor(diff / 3_600_000) % 24,
    minutes: Math.floor(diff / 60_000) % 60,
    seconds: Math.floor(diff / 1_000) % 60,
  }
}

export function MariaDanielaCountdown({ weddingDate }: { weddingDate: string }) {
  const target = new Date(weddingDate).getTime()
  const now = useSyncExternalStore(
    (onStoreChange) => {
      const id = setInterval(onStoreChange, 1000)
      return () => clearInterval(id)
    },
    () => Math.floor(Date.now() / 1000),
    () => null,
  )
  const timeLeft = now === null ? null : getTimeLeft(target, now * 1000)

  return (
    <section className="relative isolate overflow-hidden text-center py-[clamp(4rem,7vw,4rem)] px-[max(4vw,1.25rem)]">
      <Image draggable="false" src={mariaDanielaAssets.terracottaBrush} alt="" fill sizes="100vw" className="-z-10 object-cover opacity-25" />
      <p className={kickerBase} data-reveal>Ya queda menos</p>
      <h2 className={scriptHeading} data-script-reveal>Cuenta atrás</h2>
      <div className="flex justify-center items-start gap-[clamp(0.4rem,1.6vw,1rem)]" data-reveal>
        {UNITS.map((unit, index) => (
          <Fragment key={unit.key}>
            <div className="flex flex-col items-center w-[clamp(3.4rem,9vw,5.5rem)]">
              <span className="[font-family:var(--font-cormorant),serif] text-[clamp(2.2rem,6vw,4rem)] font-medium leading-none tabular-nums">
                {(timeLeft?.[unit.key] ?? 0).toString().padStart(2, "0")}
              </span>
              <span className="mt-2 text-[0.6rem] font-extrabold tracking-[0.18em] uppercase">{unit.label}</span>
            </div>
            {index < UNITS.length - 1 && (
              <span className="[font-family:var(--font-cormorant),serif] text-[clamp(2.2rem,6vw,4rem)] font-medium leading-none text-[#d5764d] mt-0">:</span>
            )}
          </Fragment>
        ))}
      </div>
    </section>
  )
}
