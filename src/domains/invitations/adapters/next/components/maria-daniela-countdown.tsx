"use client"

import Image from "next/image"
import { Fragment, useSyncExternalStore } from "react"

import { mariaDanielaAssets } from "@/domains/wedding-sites/adapters/next/components/maria-daniela-assets"
import { cn } from "@/shared/lib/utils"

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

/**
 * `section` es la cuenta atrás completa, con su kicker y su título manuscrito.
 * `bare` conserva la mancha de acuarela pero quita los títulos: la usa la
 * portada previa a la boda, donde los nombres ya hacen de encabezado.
 */
type CountdownVariant = "section" | "bare"

export function MariaDanielaCountdown({
  weddingDate,
  variant = "section",
}: {
  weddingDate: string
  variant?: CountdownVariant
}) {
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
  const isBare = variant === "bare"
  // Sin los títulos hay sitio para dígitos más grandes, pero en la portada el
  // bloque comparte los 100dvh con los nombres: el tope también es de altura.
  const digitSize = isBare
    ? "text-[min(8vw,10vh,4.6rem)]"
    : "text-[clamp(2.2rem,6vw,4rem)]"

  return (
    <section
      className={cn(
        "relative isolate overflow-hidden text-center px-[max(4vw,1.25rem)]",
        isBare ? "py-[min(5vh,3rem)]" : "py-[clamp(4rem,7vw,4rem)]",
      )}
    >
      {/* Con `fill` + `object-cover` en una caja baja la acuarela se recortaría
          en una franja de bordes rectos: en `bare` va centrada y a su propia
          proporción, como la mancha del IBAN en la invitación. */}
      {isBare ? (
        <Image
          draggable="false"
          src={mariaDanielaAssets.terracottaBrush}
          alt=""
          width={620}
          height={150}
          sizes="(max-width: 720px) 92vw, 38rem"
          className="absolute top-1/2 left-1/2 -z-10 h-auto w-[min(38rem,92vw)] -translate-x-1/2 -translate-y-1/2 opacity-40"
        />
      ) : (
        <Image draggable="false" src={mariaDanielaAssets.terracottaBrush} alt="" fill sizes="100vw" className="-z-10 object-cover opacity-25" />
      )}
      {!isBare && (
        <>
          <p className={kickerBase} data-reveal>Ya queda menos</p>
          <h2 className={scriptHeading} data-script-reveal>Cuenta atrás</h2>
        </>
      )}
      {/* Sin `data-reveal` en `bare`: la portada bloqueada no tiene scroll, así
          que un ScrollTrigger que no llegue a disparar dejaría los dígitos
          invisibles para siempre. */}
      <div
        className="flex justify-center items-start gap-[clamp(0.4rem,1.6vw,1rem)]"
        data-reveal={isBare ? undefined : true}
      >
        {UNITS.map((unit, index) => (
          <Fragment key={unit.key}>
            <div className="flex flex-col items-center w-[clamp(3.4rem,9vw,5.5rem)]">
              <span
                className={cn(
                  "[font-family:var(--font-cormorant),serif] font-medium leading-none tabular-nums",
                  digitSize,
                )}
              >
                {(timeLeft?.[unit.key] ?? 0).toString().padStart(2, "0")}
              </span>
              <span className="mt-2 text-[0.6rem] font-extrabold tracking-[0.18em] uppercase">
                {unit.label}
              </span>
            </div>
            {index < UNITS.length - 1 && (
              <span
                className={cn(
                  "[font-family:var(--font-cormorant),serif] font-medium leading-none text-[#d5764d] mt-0",
                  digitSize,
                )}
              >
                :
              </span>
            )}
          </Fragment>
        ))}
      </div>
    </section>
  )
}
