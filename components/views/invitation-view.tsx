"use client"

import { useState } from "react"
import { WEDDING } from "@/lib/wedding-data"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import {
  ChevronLeft,
  ChevronRight,
  Type,
  Palette,
  Music,
  Sparkles,
  ImageIcon,
  Upload,
  Play,
} from "lucide-react"

const BACKGROUNDS = [
  { id: "photo", label: "Foto", src: "/images/couple-hero.png" },
  { id: "floral", label: "Floral", src: "/images/invite-floral.png" },
  { id: "venue", label: "Lugar", src: "/images/venue.png" },
]

const TITLE_FONTS = [
  { id: "serif", label: "Clásica", className: "font-serif" },
  { id: "sans", label: "Moderna", className: "font-sans" },
]

const PALETTES = [
  { id: "sage", label: "Salvia", colors: ["#3a4a3f", "#c9a86a", "#f4f1ea"] },
  { id: "terracotta", label: "Terracota", colors: ["#9c5b43", "#d8a47f", "#f6efe9"] },
  { id: "slate", label: "Pizarra", colors: ["#3f4a5a", "#a9b3c1", "#eef1f5"] },
]

const ANIMATIONS = [
  { id: "envelope", label: "Sobre virtual" },
  { id: "fade", label: "Desplazamiento suave" },
  { id: "petals", label: "Lluvia de pétalos" },
]

export function InvitationView() {
  const [bgIndex, setBgIndex] = useState(0)
  const [titleFont, setTitleFont] = useState("serif")
  const [palette, setPalette] = useState(PALETTES[0])
  const [music, setMusic] = useState(false)
  const [animation, setAnimation] = useState("envelope")

  const bg = BACKGROUNDS[bgIndex]
  const titleClass = TITLE_FONTS.find((f) => f.id === titleFont)?.className ?? "font-serif"

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_minmax(320px,420px)]">
      {/* Controls */}
      <div className="space-y-5">
        <Section icon={ImageIcon} title="Cabecera">
          <div className="relative overflow-hidden rounded-xl border border-border">
            <img src={bg.src} alt={bg.label} className="h-36 w-full object-cover" />
            <button
              onClick={() => setBgIndex((i) => (i - 1 + BACKGROUNDS.length) % BACKGROUNDS.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 shadow hover:bg-background"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setBgIndex((i) => (i + 1) % BACKGROUNDS.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 shadow hover:bg-background"
              aria-label="Siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <span className="absolute bottom-2 left-2 rounded-full bg-background/85 px-2.5 py-0.5 text-xs font-medium">
              {bg.label}
            </span>
          </div>
          <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-secondary/40 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary">
            <Upload className="h-4 w-4" />
            Subir mi propia foto
          </button>
        </Section>

        <Section icon={Type} title="Tipografía">
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Estilo de títulos</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {TITLE_FONTS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setTitleFont(f.id)}
                    className={cn(
                      "rounded-lg border px-3 py-3 text-center transition-colors",
                      titleFont === f.id
                        ? "border-accent bg-accent/10"
                        : "border-border hover:bg-secondary/50",
                    )}
                  >
                    <span className={cn("text-lg", f.className)}>Ana &amp; Carlos</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Section icon={Palette} title="Colores">
          <div className="grid grid-cols-3 gap-2">
            {PALETTES.map((p) => (
              <button
                key={p.id}
                onClick={() => setPalette(p)}
                className={cn(
                  "rounded-lg border p-3 transition-colors",
                  palette.id === p.id ? "border-accent bg-accent/10" : "border-border hover:bg-secondary/50",
                )}
              >
                <div className="flex justify-center gap-1">
                  {p.colors.map((c) => (
                    <span
                      key={c}
                      className="h-5 w-5 rounded-full border border-border/50"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <span className="mt-2 block text-xs text-muted-foreground">{p.label}</span>
              </button>
            ))}
          </div>
        </Section>

        <Section icon={Music} title="Música de fondo">
          <button
            onClick={() => setMusic((m) => !m)}
            className="flex w-full items-center justify-between rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:bg-secondary/50"
          >
            <span className="flex items-center gap-2 text-foreground">
              <Play className="h-4 w-4 text-accent" />
              {music ? "cancion-boda.mp3" : "Añadir archivo MP3"}
            </span>
            <span
              className={cn(
                "relative h-5 w-9 rounded-full transition-colors",
                music ? "bg-primary" : "bg-border",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-background transition-transform",
                  music ? "translate-x-4" : "translate-x-0.5",
                )}
              />
            </span>
          </button>
        </Section>

        <Section icon={Sparkles} title="Efecto de apertura">
          <div className="grid gap-2 sm:grid-cols-3">
            {ANIMATIONS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAnimation(a.id)}
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-sm transition-colors",
                  animation === a.id
                    ? "border-accent bg-accent/10 text-foreground"
                    : "border-border text-muted-foreground hover:bg-secondary/50",
                )}
              >
                {a.label}
              </button>
            ))}
          </div>
        </Section>
      </div>

      {/* Live preview */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-3 text-center text-xs uppercase tracking-widest text-muted-foreground">
          Vista previa en vivo
        </p>
        <div className="mx-auto w-[300px] rounded-[2.5rem] border-[10px] border-foreground/90 bg-foreground/90 shadow-xl">
          <div className="overflow-hidden rounded-[1.8rem] bg-background">
            <div className="relative">
              <img src={bg.src} alt="" className="h-56 w-full object-cover" />
              <div
                className="absolute inset-0"
                style={{ backgroundColor: palette.colors[0], opacity: 0.45 }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center text-white">
                <span className="text-xs uppercase tracking-[0.3em]">Nos casamos</span>
                <h3 className={cn("mt-2 text-3xl leading-tight", titleClass)}>
                  {WEDDING.brideName}
                  <span className="mx-1 italic" style={{ color: palette.colors[1] }}>
                    &amp;
                  </span>
                  {WEDDING.groomName}
                </h3>
              </div>
            </div>
            <div className="space-y-4 px-6 py-6 text-center">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Cuándo</p>
                <p className="font-serif text-lg text-foreground">12 · Septiembre · 2026</p>
              </div>
              <div className="mx-auto h-px w-16" style={{ backgroundColor: palette.colors[1] }} />
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Dónde</p>
                <p className="font-serif text-lg text-foreground">{WEDDING.venueCity}</p>
              </div>
              <button
                className="mt-2 w-full rounded-full py-2.5 text-sm font-medium text-white"
                style={{ backgroundColor: palette.colors[1] }}
              >
                Confirmar asistencia
              </button>
              {music && (
                <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <Music className="h-3 w-3" /> Reproduciendo música
                </p>
              )}
            </div>
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Apertura: {ANIMATIONS.find((a) => a.id === animation)?.label}
        </p>
      </div>
    </div>
  )
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Type
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-accent" strokeWidth={1.75} />
        <h3 className="font-serif text-lg text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  )
}
