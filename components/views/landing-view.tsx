"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Heart,
  Users,
  Globe,
  LayoutDashboard,
  Mail,
  ChevronDown,
  ChevronRight,
  MapPin,
  Music,
  Camera,
  Gift,
  Clock,
  UtensilsCrossed,
  Check,
  ArrowRight,
  Sparkles,
  CalendarDays,
  Star,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { GUESTS } from "@/lib/wedding-data"

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const confirmed = GUESTS.filter((g) => g.rsvp === "Confirmado").length
const pending = GUESTS.filter((g) => g.rsvp === "Sin respuesta").length
const declined = GUESTS.filter((g) => g.rsvp === "Declinado").length
const total = GUESTS.length

const CIRCUMFERENCE = 2 * Math.PI * 38

function rsvpArc(value: number, offset: number) {
  const pct = value / total
  return {
    strokeDasharray: `${pct * CIRCUMFERENCE} ${CIRCUMFERENCE}`,
    strokeDashoffset: -offset,
  }
}

const confirmedOffset = 0
const pendingOffset = (confirmed / total) * CIRCUMFERENCE
const declinedOffset = pendingOffset + (pending / total) * CIRCUMFERENCE

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

export function LandingView() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const heroRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const scrollTo = (id: string) => {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      {/* ── NAVBAR ───────────────────────────────────────── */}
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-card/90 backdrop-blur-md border-b border-border shadow-sm"
            : "bg-transparent"
        )}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8 h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20">
              <Heart className="h-4 w-4 fill-accent text-accent" />
            </div>
            <div className="leading-none">
              <span
                className={cn(
                  "font-serif text-lg leading-none transition-colors",
                  scrolled ? "text-foreground" : "text-primary-foreground"
                )}
              >
                Velvet
              </span>
              <span
                className={cn(
                  "block text-[10px] uppercase tracking-widest transition-colors",
                  scrolled ? "text-muted-foreground" : "text-primary-foreground/60"
                )}
              >
                Estudio de Bodas
              </span>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            {[
              { label: "Funciones", id: "features" },
              { label: "Invitación", id: "invitation" },
              { label: "Web", id: "website" },
              { label: "Invitados", id: "guests" },
            ].map(({ label, id }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={cn(
                  "text-sm transition-colors",
                  scrolled
                    ? "text-muted-foreground hover:text-foreground"
                    : "text-primary-foreground/70 hover:text-primary-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-2">
            <Link
              href="/app"
              className={cn(
                "hidden sm:inline-flex text-sm px-4 py-1.5 rounded-full border transition-all",
                scrolled
                  ? "border-border text-foreground hover:bg-secondary"
                  : "border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              )}
            >
              Acceder
            </Link>
            <Link
              href="/app"
              className="inline-flex text-sm px-4 py-1.5 rounded-full bg-accent text-accent-foreground hover:opacity-90 transition-opacity font-medium"
            >
              Empezar gratis
            </Link>
            {/* Mobile hamburger */}
            <button
              className={cn(
                "md:hidden ml-1 flex flex-col gap-1 p-1",
                scrolled ? "text-foreground" : "text-primary-foreground"
              )}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menú"
            >
              <span className={cn("block w-5 h-0.5 bg-current transition-all", menuOpen && "rotate-45 translate-y-1.5")} />
              <span className={cn("block w-5 h-0.5 bg-current transition-all", menuOpen && "opacity-0")} />
              <span className={cn("block w-5 h-0.5 bg-current transition-all", menuOpen && "-rotate-45 -translate-y-1.5")} />
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-card border-b border-border px-5 pb-4 pt-2 flex flex-col gap-3">
            {[
              { label: "Funciones", id: "features" },
              { label: "Invitación Digital", id: "invitation" },
              { label: "Web de Bodas", id: "website" },
              { label: "Gestión de Invitados", id: "guests" },
            ].map(({ label, id }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="text-sm text-left text-foreground py-1.5 border-b border-border last:border-0"
              >
                {label}
              </button>
            ))}
            <Link href="/app" className="mt-1 text-sm text-center py-2 rounded-xl bg-primary text-primary-foreground">
              Acceder a la app
            </Link>
          </div>
        )}
      </header>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden"
      >
        <Image
          src="/images/couple-hero.png"
          alt="Pareja en su boda"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/60 to-primary/85" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-5 max-w-3xl mx-auto gap-6">
          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/20 px-3.5 py-1 text-xs text-accent-foreground font-medium backdrop-blur-sm">
            <Sparkles className="h-3 w-3 fill-accent text-accent" />
            Nuevo · Galería colaborativa en tiempo real
          </span>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-primary-foreground leading-tight">
            La manera más elegante<br className="hidden sm:block" /> de organizar vuestra boda
          </h1>

          <p className="text-primary-foreground/70 text-base sm:text-lg max-w-xl leading-relaxed">
            Invitaciones digitales, web personalizada, gestión de invitados y mucho más. Todo en un único estudio diseñado para parejas exigentes.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 rounded-2xl bg-accent px-7 py-3.5 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity shadow-lg shadow-accent/20"
            >
              Ver la demo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              onClick={() => scrollTo("features")}
              className="inline-flex items-center gap-2 rounded-2xl border border-primary-foreground/25 bg-primary-foreground/10 px-7 py-3.5 text-sm font-medium text-primary-foreground backdrop-blur-sm hover:bg-primary-foreground/20 transition-colors"
            >
              Explorar funciones
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scroll cue */}
        <button
          onClick={() => scrollTo("features")}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-primary-foreground/50 hover:text-primary-foreground transition-colors"
          aria-label="Desplazarse hacia abajo"
        >
          <ChevronDown className="h-6 w-6" />
        </button>
      </section>

      {/* ── STATS BAR ────────────────────────────────────── */}
      <section className="bg-card border-y border-border">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x divide-border">
          {[
            { value: "4", label: "Módulos principales" },
            { value: "∞", label: "Invitados sin límite" },
            { value: "Web", label: "Personalizada incluida" },
            { value: "0€", label: "Sin comisiones" },
          ].map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center gap-1 px-6">
              <span className="font-serif text-3xl text-foreground">{value}</span>
              <span className="text-xs text-muted-foreground text-center">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES GRID ────────────────────────────────── */}
      <section id="features" className="mx-auto max-w-7xl px-5 sm:px-8 py-20">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-widest text-accent mb-2">Todo en uno</p>
          <h2 className="font-serif text-3xl sm:text-4xl text-foreground">
            Un estudio completo para vuestra boda
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Desde el primer "sí" hasta el último vals. Velvet reúne todo lo que necesitáis en un único lugar.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              icon: LayoutDashboard,
              title: "Dashboard",
              desc: "Cuenta atrás en vivo, estadísticas de RSVP, tareas pendientes y accesos rápidos a todo.",
              badge: "Vista general",
            },
            {
              icon: Mail,
              title: "Invitación Digital",
              desc: "Diseña una invitación única con fondos, tipografías, colores, música y efectos de apertura.",
              badge: "Personalizable",
            },
            {
              icon: Globe,
              title: "Web de Bodas",
              desc: "Tu propio microsite con mapa, menú del banquete, itinerario, lista de regalos y galería.",
              badge: "URL propia",
            },
            {
              icon: Users,
              title: "Gestión de Invitados",
              desc: "Lista completa, estados de RSVP, menús especiales y distribución de mesas con drag & drop.",
              badge: "Control total",
            },
          ].map(({ icon: Icon, title, desc, badge }) => (
            <div
              key={title}
              className="group rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] uppercase tracking-wider text-accent bg-accent/10 rounded-full px-2.5 py-0.5">
                  {badge}
                </span>
              </div>
              <div>
                <h3 className="font-serif text-lg text-foreground mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
              <div className="mt-auto pt-2">
                <Link
                  href="/app"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:gap-2 transition-all"
                >
                  Ver en la demo <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SPOTLIGHT: INVITACIÓN DIGITAL ────────────────── */}
      <section id="invitation" className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Text */}
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-accent mb-2">Invitación Digital</p>
                <h2 className="font-serif text-3xl sm:text-4xl text-foreground leading-tight">
                  Una invitación tan especial<br className="hidden sm:block" /> como vuestra historia
                </h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Olvidad el papel. Diseñad una invitación digital única que vuestros invitados recordarán. Con editor en tiempo real y previsualización en móvil.
              </p>
              <ul className="flex flex-col gap-3">
                {[
                  { icon: Camera, text: "3 fondos fotográficos incluidos + foto propia" },
                  { icon: Star, text: "Tipografías clásica o moderna a elegir" },
                  { icon: Sparkles, text: "3 paletas de color: Salvia, Terracota, Pizarra" },
                  { icon: Music, text: "Música de fondo personalizada" },
                  { icon: Mail, text: "Efectos de apertura: sobre virtual, pétalos, suave" },
                  { icon: Check, text: "Confirmación de asistencia integrada (RSVP)" },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-3 text-sm text-foreground">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    {text}
                  </li>
                ))}
              </ul>
              <Link
                href="/app"
                className="self-start inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity mt-2"
              >
                Diseñar mi invitación
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Phone mockup */}
            <div className="flex justify-center">
              <div className="relative w-[260px] sm:w-[280px]">
                {/* Glow */}
                <div className="absolute -inset-6 rounded-[3rem] bg-accent/10 blur-2xl" />
                {/* Phone */}
                <div className="relative rounded-[2.5rem] border-[10px] border-foreground/90 shadow-2xl overflow-hidden bg-foreground aspect-[9/19]">
                  {/* Background image */}
                  <Image
                    src="/images/invite-floral.png"
                    alt="Vista previa de invitación"
                    fill
                    className="object-cover"
                    sizes="280px"
                  />
                  {/* Color overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/50 via-transparent to-primary/70" />
                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                    <Heart className="h-5 w-5 fill-accent text-accent" />
                    <p className="font-serif text-2xl text-white leading-tight">
                      Ana<br />
                      <span className="text-accent text-xl">&amp;</span><br />
                      Carlos
                    </p>
                    <div className="w-8 h-px bg-accent/60 my-1" />
                    <p className="text-white/80 text-[11px] uppercase tracking-widest">
                      12 · IX · 2026
                    </p>
                    <p className="text-white/60 text-[10px]">Toledo, España</p>
                    <div className="mt-4 w-full rounded-full py-2 text-center text-[11px] font-medium text-accent-foreground"
                      style={{ background: "oklch(0.7 0.045 20)" }}>
                      Confirmar asistencia
                    </div>
                    <p className="text-[9px] text-white/40 flex items-center gap-1 mt-1">
                      <Music className="h-2.5 w-2.5" /> Reproduciendo música
                    </p>
                  </div>
                  {/* Notch */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-1.5 rounded-full bg-foreground/90" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SPOTLIGHT: WEB DE BODAS ───────────────────────── */}
      <section id="website" className="py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Mini-site preview */}
            <div className="order-2 lg:order-1 flex justify-center">
              <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
                {/* Browser bar */}
                <div className="flex items-center gap-2 bg-secondary px-4 py-2.5 border-b border-border">
                  <div className="flex gap-1.5">
                    {["bg-red-300", "bg-yellow-300", "bg-green-300"].map((c) => (
                      <div key={c} className={cn("h-2.5 w-2.5 rounded-full", c)} />
                    ))}
                  </div>
                  <div className="flex-1 mx-2 rounded-md bg-background px-3 py-1 text-[10px] text-muted-foreground font-mono truncate">
                    velvet.com/ana-y-carlos
                  </div>
                </div>
                {/* Site header */}
                <div className="relative h-24 overflow-hidden">
                  <Image src="/images/venue.png" alt="Lugar de la boda" fill className="object-cover" sizes="400px" />
                  <div className="absolute inset-0 bg-primary/60" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                    <Heart className="h-3.5 w-3.5 fill-accent text-accent mb-1" />
                    <p className="font-serif text-sm text-white">Ana &amp; Carlos</p>
                    <p className="text-[10px] text-white/60">12 de septiembre de 2026</p>
                  </div>
                </div>
                {/* Modules list */}
                <div className="p-4 grid grid-cols-2 gap-2">
                  {[
                    { icon: MapPin, label: "Localización", on: true },
                    { icon: UtensilsCrossed, label: "Menú", on: true },
                    { icon: Clock, label: "Itinerario", on: true },
                    { icon: Gift, label: "Mesa de Regalos", on: false },
                    { icon: Music, label: "Spotify", on: false },
                    { icon: Camera, label: "Live Gallery", on: true },
                  ].map(({ icon: Icon, label, on }) => (
                    <div
                      key={label}
                      className={cn(
                        "flex items-center gap-2 rounded-xl p-2.5 text-xs border transition-colors",
                        on
                          ? "border-accent/40 bg-accent/10 text-foreground"
                          : "border-border bg-secondary/50 text-muted-foreground"
                      )}
                    >
                      <Icon className={cn("h-3.5 w-3.5 shrink-0", on ? "text-accent" : "text-muted-foreground")} />
                      <span>{label}</span>
                      {on && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="order-1 lg:order-2 flex flex-col gap-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-accent mb-2">Web de Bodas</p>
                <h2 className="font-serif text-3xl sm:text-4xl text-foreground leading-tight">
                  Vuestra web propia,<br className="hidden sm:block" /> lista en minutos
                </h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Un microsite elegante con URL personalizada. Activad solo los módulos que necesitéis y vuestros invitados siempre tendrán la información actualizada.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: MapPin, title: "Mapa y localización", desc: "Ceremonia y celebración con Google Maps" },
                  { icon: UtensilsCrossed, title: "Menú del banquete", desc: "Platos con fotos y avisos de alergias" },
                  { icon: Clock, title: "Itinerario del día", desc: "Timeline visual del evento completo" },
                  { icon: Gift, title: "Mesa de regalos", desc: "IBAN o enlace a lista de regalos" },
                  { icon: Music, title: "Lista Spotify", desc: "Playlist colaborativa con los invitados" },
                  { icon: Camera, title: "Galería en vivo", desc: "Los invitados suben fotos en tiempo real" },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex gap-3 items-start">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary mt-0.5">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{title}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/app"
                className="self-start inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity mt-2"
              >
                Crear mi web de bodas
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SPOTLIGHT: GESTIÓN DE INVITADOS ──────────────── */}
      <section id="guests" className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Text */}
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-accent mb-2">Gestión de Invitados</p>
                <h2 className="font-serif text-3xl sm:text-4xl text-foreground leading-tight">
                  El control total de<br className="hidden sm:block" /> cada invitado
                </h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Desde el envío de la invitación hasta la asignación de mesa. Gestionad grupos, menús especiales y RSVP sin perder el hilo.
              </p>
              <ul className="flex flex-col gap-3">
                {[
                  "Lista completa con búsqueda y filtros por estado",
                  "Seguimiento de RSVP: confirmados, pendientes y declinados",
                  "Menús especiales: carne, pescado, vegetariano, infantil",
                  "Distribución de mesas con drag & drop interactivo",
                  "Envío y reenvío de invitaciones en un clic",
                  "Notas y alergias por invitado",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-0.5">
                      <Check className="h-3 w-3" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/app"
                className="self-start inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity mt-2"
              >
                Gestionar invitados
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Guest table + donut */}
            <div className="flex flex-col gap-4">
              {/* Mini table */}
              <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Lista de invitados</span>
                  <span className="ml-auto text-xs text-muted-foreground">{total} invitados</span>
                </div>
                <div className="divide-y divide-border">
                  {GUESTS.slice(0, 5).map((g) => (
                    <div key={g.id} className="flex items-center gap-3 px-5 py-2.5">
                      {/* Avatar */}
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-foreground">
                        {g.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{g.name}</p>
                        <p className="text-[10px] text-muted-foreground">{g.group}</p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium",
                          g.rsvp === "Confirmado"
                            ? "bg-primary/10 text-primary"
                            : g.rsvp === "Declinado"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {g.rsvp}
                      </span>
                    </div>
                  ))}
                  <div className="px-5 py-2 text-center text-xs text-muted-foreground">
                    + {total - 5} invitados más…
                  </div>
                </div>
              </div>

              {/* RSVP donut */}
              <div className="rounded-2xl border border-border bg-card shadow-sm p-5">
                <p className="text-sm font-medium text-foreground mb-4">Resumen de RSVP</p>
                <div className="flex items-center gap-6">
                  <div className="relative shrink-0">
                    <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
                      <circle cx="48" cy="48" r="38" fill="none" stroke="var(--color-muted)" strokeWidth="10" />
                      <circle
                        cx="48" cy="48" r="38" fill="none"
                        stroke="var(--color-primary)"
                        strokeWidth="10" strokeLinecap="round"
                        style={rsvpArc(confirmed, confirmedOffset)}
                      />
                      <circle
                        cx="48" cy="48" r="38" fill="none"
                        stroke="var(--color-accent)"
                        strokeWidth="10" strokeLinecap="round"
                        style={rsvpArc(pending, pendingOffset)}
                      />
                      <circle
                        cx="48" cy="48" r="38" fill="none"
                        stroke="var(--color-destructive)"
                        strokeWidth="10" strokeLinecap="round"
                        style={rsvpArc(declined, declinedOffset)}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-serif text-xl text-foreground">{confirmed}</span>
                      <span className="text-[9px] text-muted-foreground">confirm.</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2.5 flex-1">
                    {[
                      { label: "Confirmados", count: confirmed, color: "bg-primary" },
                      { label: "Sin respuesta", count: pending, color: "bg-accent" },
                      { label: "Declinados", count: declined, color: "bg-destructive" },
                    ].map(({ label, count, color }) => (
                      <div key={label} className="flex items-center gap-2.5">
                        <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", color)} />
                        <span className="text-xs text-muted-foreground flex-1">{label}</span>
                        <span className="text-xs font-medium text-foreground">{count}</span>
                        <span className="text-[10px] text-muted-foreground w-8 text-right">
                          {Math.round((count / total) * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── GALLERY MOSAIC ───────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-widest text-accent mb-2">Galería</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-foreground">
              Recuerdos que duran para siempre
            </h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              Con la Galería en vivo, vuestros invitados comparten sus fotos del gran día al instante.
            </p>
          </div>

          {/* Mosaic grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-3 h-[360px] md:h-[440px]">
            {/* Large left */}
            <div className="relative col-span-2 row-span-2 rounded-3xl overflow-hidden">
              <Image src="/images/couple-hero.png" alt="Pareja" fill className="object-cover hover:scale-105 transition-transform duration-700" sizes="50vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/50 to-transparent" />
              <div className="absolute bottom-4 left-4 text-primary-foreground">
                <p className="font-serif text-lg leading-tight">Ana &amp; Carlos</p>
                <p className="text-xs text-primary-foreground/70">12 · IX · 2026</p>
              </div>
            </div>
            {/* Top right */}
            <div className="relative rounded-2xl overflow-hidden">
              <Image src="/images/gallery-1.png" alt="Galería 1" fill className="object-cover hover:scale-105 transition-transform duration-700" sizes="25vw" />
            </div>
            {/* Top far right */}
            <div className="relative rounded-2xl overflow-hidden">
              <Image src="/images/invite-floral.png" alt="Floral" fill className="object-cover hover:scale-105 transition-transform duration-700" sizes="25vw" />
            </div>
            {/* Bottom right */}
            <div className="relative rounded-2xl overflow-hidden">
              <Image src="/images/gallery-2.png" alt="Galería 2" fill className="object-cover hover:scale-105 transition-transform duration-700" sizes="25vw" />
            </div>
            {/* Bottom far right */}
            <div className="relative rounded-2xl overflow-hidden">
              <Image src="/images/venue.png" alt="Lugar" fill className="object-cover hover:scale-105 transition-transform duration-700" sizes="25vw" />
            </div>
          </div>
        </div>
      </section>

      {/* ── MENÚ PREVIEW ─────────────────────────────────── */}
      <section className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-widest text-accent mb-2">Menú del banquete</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-foreground">
              Despierta el apetito de tus invitados
            </h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              Muestra el menú con fotos y alertas de alérgenos en tu web de bodas. Tus invitados llegarán sabiendo lo que les espera.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { img: "/images/dish-starter.png", course: "Entrante", name: "Burrata con tomate", allergens: "Lácteos" },
              { img: "/images/dish-main.png", course: "Principal", name: "Lubina a la sal", allergens: "Pescado" },
              { img: "/images/dish-dessert.png", course: "Postre", name: "Tarta de limón", allergens: "Gluten · Huevo" },
            ].map(({ img, course, name, allergens }) => (
              <div key={name} className="group rounded-2xl border border-border bg-card shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="relative h-40 overflow-hidden">
                  <Image src={img} alt={name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(min-width: 640px) 33vw, 100vw" />
                </div>
                <div className="p-4">
                  <p className="text-[10px] uppercase tracking-widest text-accent mb-1">{course}</p>
                  <p className="font-serif text-lg text-foreground">{name}</p>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5">
                      ⚠ {allergens}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DASHBOARD PREVIEW ────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-widest text-accent mb-2">Dashboard</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-foreground">
              Todo de un vistazo
            </h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              Vuestro panel de control: cuenta atrás en vivo, tareas pendientes, estado de invitaciones y acceso rápido a cada módulo.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Countdown widget */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Cuenta atrás</span>
              </div>
              <div className="flex gap-2 justify-center mt-1">
                {[
                  { val: "87", lbl: "días" },
                  { val: "14", lbl: "horas" },
                  { val: "32", lbl: "min" },
                  { val: "08", lbl: "seg" },
                ].map(({ val, lbl }) => (
                  <div key={lbl} className="flex flex-col items-center gap-1 flex-1">
                    <div className="h-12 w-full flex items-center justify-center rounded-xl bg-secondary">
                      <span className="font-serif text-xl text-foreground">{val}</span>
                    </div>
                    <span className="text-[9px] text-muted-foreground">{lbl}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RSVP widget */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <Users className="h-4 w-4" />
                </div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">RSVP</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-3xl text-foreground">{Math.round((confirmed / total) * 100)}%</span>
                  <span className="text-xs text-muted-foreground">confirmados</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${(confirmed / total) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{confirmed} de {total} invitados</p>
              </div>
            </div>

            {/* Tasks widget */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Check className="h-4 w-4" />
                </div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Tareas</span>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { done: true, text: "Contratar catering" },
                  { done: true, text: "Reservar fotógrafo" },
                  { done: false, text: "Elegir DJ" },
                  { done: false, text: "Confirmar floristería" },
                ].map(({ done, text }) => (
                  <div key={text} className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full shrink-0", done ? "bg-primary" : "bg-accent")} />
                    <span className={cn("text-xs", done ? "text-muted-foreground line-through" : "text-foreground")}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick access */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <ArrowRight className="h-4 w-4" />
                </div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Accesos rápidos</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {[
                  { icon: Mail, label: "Invitación Digital" },
                  { icon: Globe, label: "Web de Bodas" },
                  { icon: Users, label: "Invitados" },
                ].map(({ icon: Icon, label }) => (
                  <Link
                    key={label}
                    href="/app"
                    className="group flex items-center gap-2.5 rounded-xl p-2 text-xs text-foreground hover:bg-secondary transition-colors"
                  >
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    {label}
                    <ChevronRight className="ml-auto h-3 w-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24">
        <Image
          src="/images/couple-hero.png"
          alt=""
          fill
          aria-hidden
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/80 to-primary/90" />
        <div className="relative z-10 mx-auto max-w-2xl px-5 text-center flex flex-col items-center gap-6">
          <Heart className="h-8 w-8 fill-accent text-accent" />
          <h2 className="font-serif text-4xl sm:text-5xl text-primary-foreground leading-tight">
            ¿Listos para empezar?
          </h2>
          <p className="text-primary-foreground/70 text-lg max-w-md leading-relaxed">
            Cread vuestra boda en Velvet hoy. Sin suscripciones complicadas, sin comisiones ocultas.
          </p>
          <Link
            href="/app"
            className="inline-flex items-center gap-2 rounded-2xl bg-accent px-8 py-4 text-base font-medium text-accent-foreground hover:opacity-90 transition-opacity shadow-xl shadow-accent/25 mt-2"
          >
            Crear vuestra boda gratis
            <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="text-xs text-primary-foreground/40 mt-2">
            Sin tarjeta de crédito · Listo en 5 minutos
          </p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20">
                  <Heart className="h-4 w-4 fill-accent text-accent" />
                </div>
                <span className="font-serif text-lg">Velvet</span>
              </div>
              <p className="text-sm text-primary-foreground/60 leading-relaxed max-w-[200px]">
                El estudio digital para organizar la boda de vuestros sueños.
              </p>
            </div>

            {/* Links */}
            {[
              {
                title: "Producto",
                links: ["Dashboard", "Invitación Digital", "Web de Bodas", "Invitados"],
              },
              {
                title: "Empresa",
                links: ["Sobre Velvet", "Blog", "Prensa", "Contacto"],
              },
              {
                title: "Legal",
                links: ["Privacidad", "Términos de uso", "Cookies"],
              },
            ].map(({ title, links }) => (
              <div key={title}>
                <p className="text-xs uppercase tracking-widest text-primary-foreground/40 mb-3">{title}</p>
                <ul className="flex flex-col gap-2">
                  {links.map((link) => (
                    <li key={link}>
                      <span className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors cursor-default">
                        {link}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-primary-foreground/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-primary-foreground/40">
              © 2026 Velvet · Estudio de Bodas Digital. Todos los derechos reservados.
            </p>
            <p className="text-xs text-primary-foreground/30">
              Hecho con <Heart className="inline h-3 w-3 fill-accent text-accent" /> en España
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
