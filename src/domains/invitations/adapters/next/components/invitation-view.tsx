"use client"

import Image from "next/image"
import { type ReactNode, useEffect, useMemo, useState, useTransition } from "react"
import {
  Check,
  Eye,
  ImageIcon,
  Layers,
  Monitor,
  Palette,
  Save,
  Smartphone,
  Type,
} from "lucide-react"

import { updateInvitationDesignAction } from "@/domains/invitations/adapters/next/actions"
import type {
  InvitationContentDto,
  InvitationDesignDto,
} from "@/domains/invitations/application/dtos/invitation-design.dto"
import {
  INVITATION_COLOR_PRESETS,
  INVITATION_FONT_PAIRS,
  INVITATION_PHOTO_ASSETS,
  INVITATION_SECTIONS,
  INVITATION_TEMPLATES,
  getInvitationPhotoAsset,
  normalizeInvitationColorPresetId,
  normalizeInvitationFontPairId,
  normalizeInvitationPhotoAssetId,
  normalizeInvitationTemplateId,
} from "@/domains/invitations/domain/invitation-template-options"
import { cn } from "@/shared/lib/utils"

type PreviewMode = "desktop" | "mobile"

export function InvitationView({
  initialDesign,
  bespoke = false,
}: {
  initialDesign: InvitationDesignDto
  bespoke?: boolean
}) {
  const [templateId, setTemplateId] = useState(() =>
    normalizeInvitationTemplateId(initialDesign.templateId),
  )
  const [content, setContent] = useState<InvitationContentDto>(() => ({
    ...initialDesign.content,
    fontPairId: normalizeInvitationFontPairId(initialDesign.titleFont),
    colorPresetId: normalizeInvitationColorPresetId(initialDesign.palette),
    photoAssetId: normalizeInvitationPhotoAssetId(initialDesign.content.photoAssetId),
  }))
  const [musicEnabled, setMusicEnabled] = useState(initialDesign.musicEnabled)
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop")
  const [desktopZoom, setDesktopZoom] = useState(0.58)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  const previewSrc = useMemo(() => {
    const params = new URLSearchParams()
    const hiddenSections = INVITATION_SECTIONS
      .filter((section) => !content.visibleSections[section.id])
      .map((section) => section.id)

    params.set("template", templateId)
    params.set("font", content.fontPairId)
    params.set("color", content.colorPresetId)
    params.set("photo", content.photoAssetId)
    params.set("draft", JSON.stringify(content))

    if (hiddenSections.length > 0) {
      params.set("hidden", hiddenSections.join(","))
    }

    return `/app/invitacion/preview?${params.toString()}`
  }, [content, templateId])

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("nuptia:invitation-preview-mode", {
        detail: { mode: previewMode },
      }),
    )
  }, [previewMode])

  function updateContent<Key extends keyof InvitationContentDto>(
    key: Key,
    value: InvitationContentDto[Key],
  ) {
    setSaved(false)
    setContent((current) => ({ ...current, [key]: value }))
  }

  function updateVisibility(sectionId: keyof InvitationContentDto["visibleSections"]) {
    setSaved(false)
    setContent((current) => ({
      ...current,
      visibleSections: {
        ...current.visibleSections,
        [sectionId]: !current.visibleSections[sectionId],
      },
    }))
  }

  function updateSchedule(
    index: number,
    key: keyof InvitationContentDto["schedule"][number],
    value: string,
  ) {
    setSaved(false)
    setContent((current) => ({
      ...current,
      schedule: current.schedule.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }))
  }

  function updateTravel(
    index: number,
    key: keyof InvitationContentDto["travel"][number],
    value: string,
  ) {
    setSaved(false)
    setContent((current) => ({
      ...current,
      travel: current.travel.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }))
  }

  function updateRegistry(
    index: number,
    key: keyof InvitationContentDto["registry"][number],
    value: string,
  ) {
    setSaved(false)
    setContent((current) => ({
      ...current,
      registry: current.registry.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }))
  }

  function saveDesign() {
    startTransition(async () => {
      const nextDesign = await updateInvitationDesignAction({
        templateId,
        titleFont: content.fontPairId,
        palette: content.colorPresetId,
        musicEnabled,
        openingEffect: "fade",
        content,
      })

      if (nextDesign) {
        setTemplateId(normalizeInvitationTemplateId(nextDesign.templateId))
        setContent({
          ...nextDesign.content,
          fontPairId: normalizeInvitationFontPairId(nextDesign.titleFont),
          colorPresetId: normalizeInvitationColorPresetId(nextDesign.palette),
          photoAssetId: normalizeInvitationPhotoAssetId(nextDesign.content.photoAssetId),
        })
        setMusicEnabled(nextDesign.musicEnabled)
        setSaved(true)
      }
    })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_2fr]">
      <div className="space-y-5">
        <header className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Template de invitación
              </h1>
              <h2 className="mt-1 font-serif text-3xl text-foreground">
                {bespoke ? "María Daniela" : "Invitación"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {bespoke
                  ? "Diseño editorial creado a medida para vuestra boda, con acuarelas y RSVP por pasos."
                  : "Elige una plantilla y personaliza su contenido para vuestra celebración."}
              </p>
            </div>
            <button
              type="button"
              onClick={saveDesign}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {isPending ? "Guardando..." : saved ? "Guardado" : "Guardar diseño"}
            </button>
          </div>
        </header>

        <Section icon={Layers} title="Selector de template">
          <div className="grid gap-3">
            {INVITATION_TEMPLATES.filter((template) => !bespoke || template.id === "maria-daniela").map((template) => {
              const isActive = templateId === template.id
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => { setSaved(false); setTemplateId(template.id) }}
                  className={cn(
                    "flex w-full items-center justify-between gap-4 rounded-lg border p-4 text-left transition-colors",
                    isActive
                      ? "border-accent bg-accent/10"
                      : "border-border hover:bg-secondary/50",
                  )}
                >
                  <span>
                    <span className="block font-serif text-xl text-foreground">{template.label}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">{template.description}</span>
                  </span>
                  {isActive && (
                    <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                      Activo
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </Section>

        <Section icon={Palette} title="Colores">
          <div className="grid gap-3 sm:grid-cols-2">
            {INVITATION_COLOR_PRESETS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => updateContent("colorPresetId", item.id)}
                className={cn(
                  "rounded-lg border p-3 text-left transition-colors",
                  content.colorPresetId === item.id
                    ? "border-accent bg-accent/10"
                    : "border-border hover:bg-secondary/50",
                )}
              >
                <span className="flex gap-1">
                  {item.swatches.map((color) => (
                    <span
                      key={color}
                      className="h-5 w-5 rounded-full border border-border"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </span>
                <span className="mt-2 block text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </Section>

        <Section icon={Type} title="Fuentes">
          <div className="grid gap-3 sm:grid-cols-2">
            {INVITATION_FONT_PAIRS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => updateContent("fontPairId", item.id)}
                className={cn(
                  "rounded-lg border p-3 text-left transition-colors",
                  content.fontPairId === item.id
                    ? "border-accent bg-accent/10"
                    : "border-border hover:bg-secondary/50",
                )}
              >
                <span
                  className="block text-xl text-foreground"
                  style={{ fontFamily: item.titleFamily }}
                >
                  Título
                </span>
                <span
                  className="mt-1 block text-sm text-muted-foreground"
                  style={{ fontFamily: item.bodyFamily }}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </Section>

        <Section icon={ImageIcon} title="Fotografía">
          <div className="grid gap-3 sm:grid-cols-2">
            {INVITATION_PHOTO_ASSETS.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => updateContent("photoAssetId", asset.id)}
                className={cn(
                  "overflow-hidden rounded-lg border bg-background text-left transition-colors",
                  content.photoAssetId === asset.id
                    ? "border-accent ring-2 ring-accent/20"
                    : "border-border hover:bg-secondary/50",
                )}
              >
                <span className="relative block aspect-[4/3] bg-secondary">
                  <Image draggable="false"
                    src={getInvitationPhotoAsset(asset.id).src}
                    alt=""
                    fill
                    sizes="220px"
                    className="object-cover"
                  />
                </span>
                <span className="block px-3 py-2 text-sm font-medium">{asset.label}</span>
              </button>
            ))}
          </div>
        </Section>

        <Section icon={Eye} title="Secciones visibles">
          <div className="grid gap-2 sm:grid-cols-2">
            {INVITATION_SECTIONS.map((section) => (
              <label
                key={section.id}
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={content.visibleSections[section.id]}
                  onChange={() => updateVisibility(section.id)}
                  className="h-4 w-4 accent-primary"
                />
                {section.label}
              </label>
            ))}
          </div>
        </Section>

        <Section icon={Eye} title="Textos principales">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Texto superior" value={content.eyebrow} onChange={(value) => updateContent("eyebrow", value)} />
            <TextField label="Palabra principal" value={content.heroWord} onChange={(value) => updateContent("heroWord", value)} />
            <TextField label="Título RSVP" value={content.rsvpTitle} onChange={(value) => updateContent("rsvpTitle", value)} />
            <TextField label="Email de contacto" value={content.contactEmail} onChange={(value) => updateContent("contactEmail", value)} />
          </div>
          <TextArea
            label="Historia (separa los párrafos con una línea en blanco)"
            value={content.story.join("\n\n")}
            onChange={(value) =>
              updateContent(
                "story",
                value
                  .split(/\n\s*\n/)
                  .map((paragraph) => paragraph.trim())
                  .filter(Boolean),
              )
            }
          />
          <TextArea label="Subtítulo RSVP" value={content.rsvpSubtitle} onChange={(value) => updateContent("rsvpSubtitle", value)} />
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Animación RSVP en desktop
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => updateContent("rsvpPanelMotion", "slide-up")}
                className={cn(
                  "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  content.rsvpPanelMotion === "slide-up"
                    ? "border-accent bg-accent/10"
                    : "border-border hover:bg-secondary/50",
                )}
              >
                Desplazar hacia arriba
              </button>
              <button
                type="button"
                onClick={() => updateContent("rsvpPanelMotion", "slide-left")}
                className={cn(
                  "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  content.rsvpPanelMotion === "slide-left"
                    ? "border-accent bg-accent/10"
                    : "border-border hover:bg-secondary/50",
                )}
              >
                Desplazar hacia un lado
              </button>
            </div>
          </div>
          <TextArea label="Mensaje WhatsApp" value={content.whatsappMessage} onChange={(value) => updateContent("whatsappMessage", value)} />
        </Section>

        <Section icon={Layers} title="Itinerario">
          <div className="space-y-4">
            {content.schedule.map((item, index) => (
              <div key={item.id} className="rounded-lg border border-border p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField label="Título" value={item.title} onChange={(value) => updateSchedule(index, "title", value)} />
                  <TextField label="Fecha" value={item.date} onChange={(value) => updateSchedule(index, "date", value)} />
                  <TextField label="Hora" value={item.time} onChange={(value) => updateSchedule(index, "time", value)} />
                  <TextField label="Lugar" value={item.location} onChange={(value) => updateSchedule(index, "location", value)} />
                </div>
                <TextArea label="Descripción" value={item.description} onChange={(value) => updateSchedule(index, "description", value)} />
              </div>
            ))}
          </div>
        </Section>

        <Section icon={Layers} title="Alojamiento y regalos">
          <div className="space-y-4">
            {content.travel.map((item, index) => (
              <div key={item.id} className="rounded-lg border border-border p-4">
                <TextField label="Título" value={item.title} onChange={(value) => updateTravel(index, "title", value)} />
                <TextArea label="Descripción" value={item.description} onChange={(value) => updateTravel(index, "description", value)} />
              </div>
            ))}

            {content.registry[0] ? (
              <div key={content.registry[0].id} className="rounded-lg border border-border p-3">
                <TextField
                  label="Número de cuenta IBAN"
                  value={content.registry[0].title}
                  onChange={(value) => updateRegistry(0, "title", value)}
                />
              </div>
            ) : null}
            
            {/* <div className="grid gap-3 sm:grid-cols-3">
              {content.registry.map((item, index) => (
                <div key={item.id} className="rounded-lg border border-border p-3">
                  <TextField label="Regalo" value={item.title} onChange={(value) => updateRegistry(index, "title", value)} />
                  <TextField label="URL" value={item.url} onChange={(value) => updateRegistry(index, "url", value)} />
                </div>
              ))}
            </div> */}
          </div>
        </Section>
      </div>

      <aside className="min-w-0 xl:sticky xl:top-24 xl:self-start">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Preview del template
          </p>
          <div className="flex items-center gap-2">
            <SegmentedButton
              active={previewMode === "desktop"}
              icon={Monitor}
              label="Desktop"
              onClick={() => setPreviewMode("desktop")}
            />
            <SegmentedButton
              active={previewMode === "mobile"}
              icon={Smartphone}
              label="Móvil"
              onClick={() => setPreviewMode("mobile")}
            />
          </div>
        </div>

        {previewMode === "desktop" ? (
          <DesktopPreviewFrame
            src={previewSrc}
            zoom={desktopZoom}
            onZoomChange={setDesktopZoom}
          />
        ) : (
          <MobilePreviewFrame src={previewSrc} />
        )}
      </aside>
    </div>
  )
}

function DesktopPreviewFrame({
  src,
  zoom,
  onZoomChange,
}: {
  src: string
  zoom: number
  onZoomChange: (zoom: number) => void
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ef6a5b]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#f5bf4f]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#61c554]" />
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          Zoom
          <input
            type="range"
            min="0.5"
            max="1"
            step="0.05"
            value={zoom}
            onChange={(event) => onZoomChange(Number(event.currentTarget.value))}
            className="w-28 accent-primary"
          />
          <span className="w-10 tabular-nums">{Math.round(zoom * 100)}%</span>
        </label>
      </div>
      <div className="overflow-auto rounded-lg bg-secondary p-4">
        <div
          className="origin-top-left overflow-hidden rounded-md border border-border bg-white shadow"
          style={{
            width: 1440 * zoom,
            height: 900 * zoom,
          }}
        >
          <iframe
            title="Preview desktop de la invitación"
            src={src}
            width={1440}
            height={900}
            className="block border-0 bg-white"
            style={{
              width: 1440,
              height: 900,
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
            }}
          />
        </div>
      </div>
    </div>
  )
}

function MobilePreviewFrame({ src }: { src: string }) {
  return (
    <div className="flex justify-center rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="rounded-[36px] border-[10px] border-primary bg-primary p-2 shadow-2xl">
        <div className="mx-auto mb-2 h-1.5 w-20 rounded-full bg-white/20" />
        <iframe
          title="Preview móvil de la invitación"
          src={src}
          width={390}
          height={844}
          className="block rounded-[24px] border-0 bg-white"
        />
      </div>
    </div>
  )
}

function SegmentedButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean
  icon: typeof Monitor
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Layers
  title: string
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-accent" strokeWidth={1.75} />
        <h2 className="font-serif text-lg text-foreground">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block text-sm">
      <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
      />
    </label>
  )
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block text-sm">
      <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        rows={4}
        className="mt-1 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm leading-6 outline-none transition-colors focus:border-accent"
      />
    </label>
  )
}
