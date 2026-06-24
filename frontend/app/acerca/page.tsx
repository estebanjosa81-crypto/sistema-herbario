"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowRight,
  BookOpen,
  Microscope,
  MapPin,
  Mail,
  Phone,
  Code2,
  Github,
  Leaf,
  Search,
  Users,
  Globe,
} from "lucide-react"
import { usePublicSettings } from "@/lib/use-public-settings"
import { useState, useEffect, useRef } from "react"
import { apiService } from "@/lib/api"

/** Anima un número de 0 hasta `target` en `duration` ms */
function useCountUp(target: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!start || target === 0) return
    const startTime = performance.now()
    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, duration, start])

  return count
}

const s = (v: any, fallback = "") => (v === null || v === undefined ? fallback : String(v))
const b = (v: any, fallback = true) => (v === null || v === undefined || v === "" ? fallback : v === true || v === "true")

interface RealStats {
  totalPlants: number
  totalFamilies: number
  totalGenera: number
  totalSpecies: number
}

export default function AcercaPage() {
  const cfg = usePublicSettings()

  // ── Estadísticas reales desde la BD ──────────────────────────────────────
  const [realStats, setRealStats] = useState<RealStats | null>(null)
  const [statsVisible, setStatsVisible] = useState(false)
  const statsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    apiService.getPublicStats().then(res => {
      if (res.success && res.data) {
        setRealStats({
          totalPlants:   Number(res.data.totalPlants   ?? 0),
          totalFamilies: Number(res.data.totalFamilies ?? 0),
          totalGenera:   Number(res.data.totalGenera   ?? 0),
          totalSpecies:  Number(res.data.totalSpecies  ?? 0),
        })
      }
    }).catch(() => { /* usa fallback del admin config */ })
  }, [])

  // Disparar animación cuando la sección entra al viewport
  useEffect(() => {
    if (!statsRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true) },
      { threshold: 0.3 }
    )
    observer.observe(statsRef.current)
    return () => observer.disconnect()
  }, [])

  const countPlants   = useCountUp(realStats?.totalPlants   ?? 0, 1800, statsVisible && !!realStats)
  const countFamilies = useCountUp(realStats?.totalFamilies ?? 0, 1600, statsVisible && !!realStats)
  const countGenera   = useCountUp(realStats?.totalGenera   ?? 0, 1700, statsVisible && !!realStats)
  const countSpecies  = useCountUp(realStats?.totalSpecies  ?? 0, 1900, statsVisible && !!realStats)

  const title        = s(cfg.aboutTitle,   "Herbario HEAA")
  const subtitle     = s(cfg.aboutSubtitle, "Institución Universitaria del Putumayo — Mocoa")
  const headerLogo   = s(cfg.aboutHeaderLogo, "/images/logo-uniputumayo.png")

  const historyImage = s(cfg.aboutHistoryImage)
  const historyTitle = s(cfg.aboutHistoryTitle, "Nuestra Historia")
  const historyP1    = s(cfg.aboutHistoryP1, "El Herbario HEAA nació como un proyecto académico para preservar y documentar la extraordinaria biodiversidad vegetal del departamento del Putumayo.")
  const historyP2    = s(cfg.aboutHistoryP2, "A través de décadas de investigación de campo, hemos construido una de las colecciones botánicas más representativas de la región amazónica colombiana.")
  const historyP3    = s(cfg.aboutHistoryP3)

  const missionTitle = s(cfg.aboutMissionTitle, "Misión")
  const visionTitle  = s(cfg.aboutVisionTitle,  "Visión")
  const missionText  = s(cfg.aboutMissionText, "Preservar, documentar y difundir el conocimiento sobre la diversidad vegetal del Putumayo mediante la gestión científica de colecciones botánicas de referencia.")
  const visionText   = s(cfg.aboutVisionText, "Ser el referente regional en investigación botánica, contribuyendo activamente a la conservación del patrimonio natural de la Amazonia colombiana.")

  const leaderEnabled = b(cfg.aboutLeaderEnabled)
  const leaderLabel   = s(cfg.aboutLeaderLabel, "Líder del proyecto")
  const leaderImage   = s(cfg.aboutLeaderImage)
  const leaderName    = s(cfg.aboutLeaderName,  "MSc. Jhon Henry Cuellar Portilla")
  const leaderRole    = s(cfg.aboutLeaderRole,  "Director de Programa Ingeniería de Sistemas")
  const leaderEmail   = s(cfg.aboutLeaderEmail, "jcuellar@itp.edu.co")
  const leaderPhone   = s(cfg.aboutLeaderPhone, "+57 314 335 1747")

  const creditsEnabled = b(cfg.aboutCreditsEnabled)
  const creditsTitle   = s(cfg.aboutCreditsTitle, "Equipo de desarrollo")
  const creditsText    = s(cfg.aboutCreditsText, "Estudiantes de Ingeniería de Sistemas de Uniputumayo responsables del diseño y construcción de esta plataforma digital.")
  const creditsSupport = s(cfg.aboutCreditsSupportText, "¿Necesitas soporte técnico? Contacta a los desarrolladores por correo o GitHub.")
  const devs = [1, 2].map(n => ({
    image: s(cfg[`aboutDev${n}Image`], [
      "https://avatars.githubusercontent.com/u/115267707?v=4",
      "https://avatars.githubusercontent.com/u/134365120?v=4",
    ][n - 1]),
    badge: s(cfg[`aboutDev${n}Badge`], "Desarrollador Full Stack"),
    name:  s(cfg[`aboutDev${n}Name`],  ["Jhon Esteban Josa Quinchoa", "Maycol Sebastián Francisco Guerrero López"][n - 1]),
    role:  s(cfg[`aboutDev${n}Role`],  "Estudiante de Ingeniería de Sistemas — Uniputumayo"),
    bio:   s(cfg[`aboutDev${n}Bio`], [
      "Backend y frontend con Node.js, Express, Next.js, React, MySQL y Docker.",
      "Desarrollo web y móvil con Python, JavaScript, Laravel, Flutter, MySQL y Firebase.",
    ][n - 1]),
    email: s(cfg[`aboutDev${n}Email`], ["jhonjosa2021@itp.edu.co", "maycolguerrero2021@itp.edu.co"][n - 1]),
    github: s(cfg[`aboutDev${n}Github`], ["https://github.com/esteban2oo1", "https://github.com/mclguerrero"][n - 1]),
  }))

  const statsTitle = s(cfg.aboutStatsTitle, "La colección en cifras")

  // Solo labels vienen del admin config; valores siempre de la BD con count-up
  const statLabels = [
    { label: s(cfg.aboutStat1Label, "Especímenes catalogados"), icon: Leaf     },
    { label: s(cfg.aboutStat2Label, "Familias botánicas"),      icon: BookOpen },
    { label: s(cfg.aboutStat3Label, "Géneros representados"),   icon: Search   },
    { label: s(cfg.aboutStat4Label, "Especies documentadas"),   icon: Globe    },
  ]
  const statCounts = [countPlants, countFamilies, countGenera, countSpecies]

  const tab1Label    = s(cfg.aboutTab1Label, "Colecciones")
  const tab2Label    = s(cfg.aboutTab2Label, "Investigación")
  const tab3Label    = s(cfg.aboutTab3Label, "Equipo")

  const collections = [1,2,3,4].map(n => ({
    title: s(cfg[`aboutCol${n}Title`]),
    text:  s(cfg[`aboutCol${n}Text`]),
  }))

  const research = [1,2,3,4].map(n => ({
    title: s(cfg[`aboutRes${n}Title`]),
    text:  s(cfg[`aboutRes${n}Text`]),
  }))

  const members = [1,2,3].map(n => ({
    image: s(cfg[`aboutMember${n}Image`]),
    name:  s(cfg[`aboutMember${n}Name`]),
    role:  s(cfg[`aboutMember${n}Role`]),
    bio:   s(cfg[`aboutMember${n}Bio`]),
  }))

  const locTitle       = s(cfg.aboutLocationTitle,   "Visítanos")
  const contactBtnText = s(cfg.aboutContactButtonText, "Contactar al Herbario")
  const contactBtnUrl  = s(cfg.aboutContactButtonUrl,  "/contacto")
  const locAddress     = s(cfg.aboutLocationAddress)
  const locSchedule    = s(cfg.aboutLocationSchedule)
  const locImage       = s(cfg.aboutLocationImage)

  const partnersTitle = s(cfg.aboutPartnersTitle, "Colaboraciones y alianzas")
  const partners = [1,2,3,4].map(n => ({
    name:  s(cfg[`aboutPartner${n}Name`],  `Institución ${n}`),
    image: s(cfg[`aboutPartner${n}Image`]),
    url:   s(cfg[`aboutPartner${n}Url`]),
  }))

  const ctaTitle   = s(cfg.aboutCtaTitle,      "Contribuye a nuestra colección")
  const ctaText    = s(cfg.aboutCtaText,        "Investigadores, estudiantes y aficionados a la botánica pueden colaborar en la ampliación y enriquecimiento del herbario.")
  const ctaBtnText = s(cfg.aboutCtaButtonText,  "Conoce cómo colaborar")
  const ctaBtnUrl  = s(cfg.aboutCtaButtonUrl,   "/contacto")

  /* ─── datos del proceso científico (hardcoded, sin configuración) ─── */
  const proceso = [
    { step: "01", title: "Colecta en campo",     desc: "Recolección de especímenes en zonas de muestreo del Putumayo con registro de coordenadas GPS y datos de hábitat." },
    { step: "02", title: "Prensado y secado",    desc: "Montaje en prensa botánica y secado controlado para preservar morfología, color y estructuras diagnósticas." },
    { step: "03", title: "Identificación taxonómica", desc: "Determinación científica mediante claves dicotómicas, literatura especializada y consulta con expertos." },
    { step: "04", title: "Digitalización",       desc: "Fotografía de alta resolución del espécimen y etiqueta. Registro en el sistema con estándar Darwin Core." },
    { step: "05", title: "Publicación abierta",  desc: "Disponibilidad del registro en el catálogo digital para investigadores, estudiantes y público general." },
  ]

  return (
    <div className="min-h-screen bg-background">

      {/* ── Animaciones y micro-interacciones (Emil Kowalski principles) ── */}
      <style>{`
        :root {
          --ease-out-strong:    cubic-bezier(0.23, 1, 0.32, 1);
          --ease-in-out-strong: cubic-bezier(0.77, 0, 0.175, 1);
        }

        /* Entrada suave con translateY — nada emerge de la nada */
        @keyframes heaa-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .heaa-up {
          animation: heaa-up 380ms var(--ease-out-strong) both;
        }

        /* Stagger — cada ítem con delay incremental */
        .heaa-stagger > *:nth-child(1) { animation-delay:   0ms; }
        .heaa-stagger > *:nth-child(2) { animation-delay:  55ms; }
        .heaa-stagger > *:nth-child(3) { animation-delay: 110ms; }
        .heaa-stagger > *:nth-child(4) { animation-delay: 165ms; }
        .heaa-stagger > *:nth-child(5) { animation-delay: 210ms; }

        /* Cards: hover elevate solo en pointer-fine (no touch) */
        @media (hover: hover) and (pointer: fine) {
          .heaa-card:hover {
            border-color: rgb(134 239 172 / 0.55);
            box-shadow: 0 6px 24px -6px rgb(0 0 0 / 0.10);
            transform: translateY(-2px);
          }
          .heaa-card-dark:hover {
            background-color: rgb(255 255 255 / 0.10);
            border-color: rgb(74 222 128 / 0.40);
          }
          .heaa-img-zoom img { transition: transform 420ms var(--ease-out-strong); }
          .heaa-img-zoom:hover img { transform: scale(1.04); }
          .heaa-link-press:hover { color: rgb(22 101 52); }
        }

        /* Transiciones precisas en cards — nunca "all" */
        .heaa-card {
          transition:
            border-color  180ms var(--ease-out-strong),
            box-shadow    180ms var(--ease-out-strong),
            transform     180ms var(--ease-out-strong);
        }
        .heaa-card-dark {
          transition:
            background-color 200ms var(--ease-out-strong),
            border-color     200ms var(--ease-out-strong);
        }

        /* Press feedback — los botones/links sienten el toque */
        .heaa-pressable {
          transition: transform 150ms var(--ease-out-strong);
        }
        .heaa-pressable:active { transform: scale(0.97); }

        .heaa-link-press {
          transition: color 140ms var(--ease-out-strong), transform 150ms var(--ease-out-strong);
        }
        .heaa-link-press:active { transform: scale(0.96); }

        /* Logos: grayscale → color con opacity — filter es GPU */
        @media (hover: hover) and (pointer: fine) {
          .heaa-logo { transition: opacity 200ms var(--ease-out-strong), filter 200ms var(--ease-out-strong); }
          .heaa-logo:hover { opacity: 1; filter: grayscale(0); }
        }
        .heaa-logo { opacity: 0.5; filter: grayscale(1); }

        /* Reduced motion — movimiento cero, solo fade si es necesario */
        @media (prefers-reduced-motion: reduce) {
          .heaa-up          { animation: none; opacity: 1; transform: none; }
          .heaa-card        { transition: border-color 100ms, opacity 100ms; }
          .heaa-card:hover  { transform: none; box-shadow: none; }
          .heaa-pressable:active { transform: none; }
          .heaa-img-zoom:hover img { transform: none; }
        }
      `}</style>

      {/* ═══════════════════════════════════════════
          ENCABEZADO DE PÁGINA — sobrio e institucional
      ══════════════════════════════════════════════ */}
      <section className="border-b border-border/60 py-10 md:py-14">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 max-w-6xl mx-auto">
            {/* Logo */}
            <div className="relative h-14 w-44 shrink-0">
              <Image
                src={headerLogo || "/images/logo-uniputumayo.png"}
                alt="Uniputumayo"
                fill
                className="object-contain object-left"
                priority
              />
            </div>

            {/* Divisor vertical visible solo en sm+ */}
            <div className="hidden sm:block h-12 w-px bg-border" />

            {/* Títulos */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-green-600 shrink-0" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Colección botánica científica
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">
                {title}
              </h1>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          ESTADÍSTICAS — impacto numérico
      ══════════════════════════════════════════════ */}
      <section className="py-16 md:py-20 border-b border-border/50">
        <div className="container mx-auto px-4">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground mb-10">
            {statsTitle}
          </p>
          <div ref={statsRef} className="heaa-stagger grid grid-cols-2 lg:grid-cols-4 gap-0 divide-x divide-y lg:divide-y-0 divide-border/50 border border-border/50 rounded-2xl overflow-hidden">
            {statLabels.map((stat, i) => {
              const Icon = stat.icon
              return (
                <div key={i} className="heaa-up flex flex-col items-center justify-center gap-3 py-10 px-6 text-center bg-background hover:bg-green-50/50 dark:hover:bg-green-950/20 transition-colors duration-150">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/40">
                    <Icon className="h-5 w-5 text-green-700 dark:text-green-400" />
                  </div>
                  {realStats ? (
                    <p className="text-3xl md:text-4xl font-bold text-green-700 dark:text-green-400 tabular-nums">
                      {statCounts[i].toLocaleString("es-CO")}
                    </p>
                  ) : (
                    <div className="h-10 w-24 rounded-lg bg-green-100 dark:bg-green-900/30 animate-pulse" />
                  )}
                  <p className="text-sm text-muted-foreground leading-snug max-w-[140px]">{stat.label}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          HISTORIA — narrativa editorial
      ══════════════════════════════════════════════ */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center max-w-6xl mx-auto">
            {/* Imagen con marco decorativo */}
            <div className="relative order-2 md:order-1">
              <div className="absolute -inset-3 rounded-2xl border-2 border-green-200 dark:border-green-800 -rotate-1" />
              <div className="heaa-img-zoom relative rounded-xl overflow-hidden aspect-[4/3] shadow-2xl">
                <Image
                  src={historyImage || "/placeholder.svg?height=500&width=700&text=Herbario+ITP"}
                  alt={historyTitle}
                  fill
                  className="object-cover"
                />
                {/* overlay sutil */}
                <div className="absolute inset-0 bg-gradient-to-t from-green-950/30 to-transparent" />
              </div>
              {/* Badge flotante */}
              <div className="absolute -bottom-4 -right-4 bg-green-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg shadow-lg">
                Desde Mocoa, Putumayo
              </div>
            </div>

            {/* Texto */}
            <div className="order-1 md:order-2 space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-green-600">
                  01 — Historia
                </span>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
                  {historyTitle}
                </h2>
              </div>

              <div className="space-y-4 text-muted-foreground leading-relaxed">
                {historyP1 && (
                  <p className="text-base md:text-lg font-medium text-foreground/80 leading-relaxed border-l-2 border-green-500 pl-4">
                    {historyP1}
                  </p>
                )}
                {historyP2 && <p>{historyP2}</p>}
                {historyP3 && <p>{historyP3}</p>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          MISIÓN Y VISIÓN — propósito institucional
      ══════════════════════════════════════════════ */}
      <section className="py-20 md:py-24 bg-green-950 text-white relative overflow-hidden">
        {/* Patrón decorativo */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-72 h-72 border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 border-2 border-white rounded-full translate-x-1/3 translate-y-1/3" />
        </div>

        <div className="relative container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-green-400">
              02 — Propósito
            </span>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold">Nuestra razón de ser</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Misión */}
            <div className="heaa-card-dark group relative bg-white/5 border border-white/10 rounded-2xl p-8 md:p-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/20">
                  <BookOpen className="h-5 w-5 text-green-400" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest text-green-400">
                  {missionTitle}
                </span>
              </div>
              <p className="text-white/80 leading-relaxed text-base md:text-lg">{missionText}</p>
            </div>

            {/* Visión */}
            <div className="heaa-card-dark group relative bg-white/5 border border-white/10 rounded-2xl p-8 md:p-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/20">
                  <Microscope className="h-5 w-5 text-green-400" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest text-green-400">
                  {visionTitle}
                </span>
              </div>
              <p className="text-white/80 leading-relaxed text-base md:text-lg">{visionText}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          PROCESO CIENTÍFICO — pipeline de catalogación
      ══════════════════════════════════════════════ */}
      <section className="py-20 md:py-24 bg-stone-50 dark:bg-stone-950/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-green-600">
              03 — Metodología
            </span>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold">Cómo catalogamos un espécimen</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto text-sm">
              Cada planta en nuestra colección sigue un protocolo científico riguroso antes de ser publicada.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="relative">
              {/* línea conectora horizontal — solo md+ */}
              <div className="hidden md:block absolute top-[2.25rem] left-[calc(10%+1.25rem)] right-[calc(10%+1.25rem)] h-px bg-green-200 dark:bg-green-800 z-0" />

              <div className="heaa-stagger grid grid-cols-1 md:grid-cols-5 gap-6 relative z-10">
                {proceso.map((p) => (
                  <div key={p.step} className="heaa-up flex flex-col items-center text-center gap-3">
                    {/* Círculo numerado */}
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-600 text-white text-xs font-bold shadow-md ring-4 ring-background">
                      {p.step}
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-sm font-semibold leading-tight">{p.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          ÁREAS — colecciones e investigación
      ══════════════════════════════════════════════ */}
      {(collections.some(c => c.title) || research.some(r => r.title)) && (
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-green-600">
                04 — Áreas
              </span>
              <h2 className="mt-2 text-3xl md:text-4xl font-bold">Lo que nos define</h2>
            </div>

            <div className="max-w-6xl mx-auto space-y-14">
              {collections.some(c => c.title) && (
                <div>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-white shrink-0">
                      <Leaf className="h-5 w-5" />
                    </div>
                    <h3 className="text-2xl font-bold">{tab1Label}</h3>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="grid md:grid-cols-2 gap-5">
                    {collections.map((c, i) => c.title ? (
                      <div key={i} className="heaa-card bg-card border border-border/60 rounded-xl p-6">
                        <div className="flex items-start gap-3">
                          <span className="text-xs font-bold text-green-600 mt-0.5 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                          <div className="space-y-1.5">
                            <h4 className="text-base font-semibold leading-tight">{c.title}</h4>
                            {c.text && <p className="text-sm text-muted-foreground leading-relaxed">{c.text}</p>}
                          </div>
                        </div>
                      </div>
                    ) : null)}
                  </div>
                </div>
              )}

              {research.some(r => r.title) && (
                <div>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-white shrink-0">
                      <Search className="h-5 w-5" />
                    </div>
                    <h3 className="text-2xl font-bold">{tab2Label}</h3>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="grid md:grid-cols-2 gap-5">
                    {research.map((r, i) => r.title ? (
                      <div key={i} className="heaa-card bg-card border border-border/60 rounded-xl p-6">
                        <div className="flex items-start gap-3">
                          <span className="text-xs font-bold text-green-600 mt-0.5 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                          <div className="space-y-1.5">
                            <h4 className="text-base font-semibold leading-tight">{r.title}</h4>
                            {r.text && <p className="text-sm text-muted-foreground leading-relaxed">{r.text}</p>}
                          </div>
                        </div>
                      </div>
                    ) : null)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════
          EQUIPO — director + científicos + devs (unificado)
      ══════════════════════════════════════════════ */}
      {(leaderEnabled && leaderName || members.some(m => m.name) || creditsEnabled) && (
        <section className="py-20 md:py-28 bg-stone-50 dark:bg-stone-950/40">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-green-600">
                05 — Equipo
              </span>
              <h2 className="mt-2 text-3xl md:text-4xl font-bold">Las personas detrás del herbario</h2>
            </div>

            <div className="max-w-6xl mx-auto space-y-14">

              {/* ── Director del proyecto (carta destacada) ── */}
              {leaderEnabled && leaderName && (
                <div>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-white shrink-0">
                      <Users className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-bold">Dirección académica</h3>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-7 bg-white dark:bg-card border border-border/60 rounded-2xl p-7 md:p-9 shadow-sm max-w-3xl">
                    <div className="shrink-0">
                      <div className="relative h-24 w-24 rounded-2xl overflow-hidden ring-4 ring-green-600/20 shadow">
                        <Image
                          src={leaderImage || `/placeholder.svg?height=96&width=96&text=${encodeURIComponent(leaderLabel)}`}
                          alt={leaderName}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                    <div className="flex-1 text-center sm:text-left space-y-2">
                      <Badge className="text-[10px] font-bold uppercase tracking-widest bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-0">
                        {leaderLabel}
                      </Badge>
                      <h4 className="text-xl md:text-2xl font-bold leading-tight">{leaderName}</h4>
                      {leaderRole && <p className="text-muted-foreground text-sm">{leaderRole}</p>}
                      <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-2 text-sm text-muted-foreground">
                        {leaderEmail && (
                          <a href={`mailto:${leaderEmail}`} className="heaa-link-press inline-flex items-center gap-2 group">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/40 group-hover:bg-green-200 transition-colors">
                              <Mail className="h-3.5 w-3.5 text-green-700 dark:text-green-400" />
                            </span>
                            {leaderEmail}
                          </a>
                        )}
                        {leaderPhone && (
                          <a href={`tel:${leaderPhone.replace(/\s/g, "")}`} className="heaa-link-press inline-flex items-center gap-2 group">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/40 group-hover:bg-green-200 transition-colors">
                              <Phone className="h-3.5 w-3.5 text-green-700 dark:text-green-400" />
                            </span>
                            {leaderPhone}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Equipo científico / Miembros ── */}
              {members.some(m => m.name) && (
                <div>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-white shrink-0">
                      <Microscope className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-bold">{tab3Label}</h3>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
                    {members.map((m, i) => m.name ? (
                      <div key={i} className="heaa-card bg-white dark:bg-card border border-border/60 rounded-xl p-6 text-center">
                        <div className="relative h-16 w-16 mx-auto rounded-full overflow-hidden mb-4 ring-2 ring-green-600/20 group-hover:ring-green-600/40 transition-[box-shadow] duration-200">
                          <Image
                            src={m.image || `/placeholder.svg?height=64&width=64&text=${encodeURIComponent(m.role || "Miembro")}`}
                            alt={m.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <h4 className="font-bold text-sm leading-tight">{m.name}</h4>
                        {m.role && <p className="text-[11px] text-green-600 font-semibold mt-1 uppercase tracking-wide">{m.role}</p>}
                        {m.bio && <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{m.bio}</p>}
                      </div>
                    ) : null)}
                  </div>
                </div>
              )}

              {/* ── Equipo de desarrollo digital ── */}
              {creditsEnabled && (
                <div>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-white shrink-0">
                      <Code2 className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="text-xl font-bold">{creditsTitle}</h3>
                      {creditsText && <p className="text-xs text-muted-foreground">{creditsText}</p>}
                    </div>
                    <div className="h-px flex-1 bg-border hidden sm:block" />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5 max-w-3xl">
                    {devs.map((d, i) => d.name ? (
                      <div key={i} className="heaa-card bg-white dark:bg-card border border-border/60 rounded-xl overflow-hidden">
                        <div className="h-1 bg-gradient-to-r from-green-600 via-emerald-400 to-teal-500" />
                        <div className="p-6 flex flex-col items-center text-center gap-3">
                          <div className="relative h-16 w-16 rounded-full overflow-hidden ring-4 ring-green-600/10 group-hover:ring-green-600/25 transition-[box-shadow] duration-200 shadow">
                            <Image
                              src={d.image || "/placeholder.svg?height=64&width=64&text=Dev"}
                              alt={d.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          {d.badge && (
                            <Badge className="text-[10px] font-bold uppercase tracking-widest bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-0">
                              {d.badge}
                            </Badge>
                          )}
                          <div>
                            <h4 className="text-base font-bold leading-tight">{d.name}</h4>
                            {d.role && <p className="text-xs text-muted-foreground mt-0.5">{d.role}</p>}
                          </div>
                          {d.bio && <p className="text-xs text-muted-foreground leading-relaxed">{d.bio}</p>}
                          <div className="flex gap-2 w-full">
                            {d.email && (
                              <Button asChild variant="outline" size="sm" className="rounded-lg flex-1 text-xs h-8">
                                <a href={`mailto:${d.email}`}><Mail className="h-3 w-3 mr-1" /> Correo</a>
                              </Button>
                            )}
                            {d.github && (
                              <Button asChild variant="outline" size="sm" className="rounded-lg flex-1 text-xs h-8">
                                <a href={d.github} target="_blank" rel="noreferrer"><Github className="h-3 w-3 mr-1" /> GitHub</a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : null)}
                  </div>

                  {creditsSupport && (
                    <p className="text-xs text-muted-foreground mt-6 max-w-lg">{creditsSupport}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════
          ESTÁNDARES — franja de credibilidad científica
      ══════════════════════════════════════════════ */}
      <section className="py-10 border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 max-w-5xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground shrink-0">
              Estándares y protocolos
            </p>
            <div className="flex flex-wrap justify-center sm:justify-end items-center gap-3">
              {[
                { label: "Darwin Core",      desc: "Estándar de datos biodiversidad" },
                { label: "Acceso Abierto",   desc: "Datos disponibles públicamente" },
                { label: "GBIF compatible",  desc: "Global Biodiversity Information" },
                { label: "ISO 11799",        desc: "Preservación de colecciones" },
              ].map((s) => (
                <div key={s.label} title={s.desc} className="inline-flex items-center gap-1.5 border border-border/70 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-green-400 hover:text-green-700 dark:hover:text-green-400 transition-colors cursor-default">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                  {s.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          UBICACIÓN — dónde encontrarnos
      ══════════════════════════════════════════════ */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-green-600">
              06 — Ubicación
            </span>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold">{locTitle}</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-10 items-stretch max-w-6xl mx-auto">
            <div className="flex flex-col justify-center space-y-6 bg-card border border-border/60 rounded-2xl p-8 md:p-10">
              {locAddress && (
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/40 shrink-0 mt-0.5">
                    <MapPin className="h-5 w-5 text-green-700 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Dirección</p>
                    <p className="text-base whitespace-pre-line leading-relaxed">{locAddress}</p>
                  </div>
                </div>
              )}
              {locSchedule && (
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/40 shrink-0 mt-0.5">
                    <BookOpen className="h-5 w-5 text-green-700 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Horario de atención</p>
                    <p className="text-base leading-relaxed">{locSchedule}</p>
                  </div>
                </div>
              )}
              <div className="pt-2">
                <Button asChild className="heaa-pressable bg-green-600 hover:bg-green-700 rounded-xl h-11 px-6">
                  <Link href={contactBtnUrl}>
                    {contactBtnText} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden min-h-[300px] md:min-h-[380px] shadow-md border border-border/60">
              <Image
                src={locImage || "/placeholder.svg?height=400&width=600&text=Mocoa+Putumayo"}
                alt="Mapa de ubicación del Herbario HEAA"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-green-950/30 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          COLABORACIONES — alianzas institucionales
      ══════════════════════════════════════════════ */}
      {partners.some(p => p.name !== "Institución 1" && p.name !== "Institución 2" && p.name !== "Institución 3" && p.name !== "Institución 4") && (
        <section className="py-14 border-t border-border/50">
          <div className="container mx-auto px-4">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground mb-10">
              {partnersTitle}
            </p>
            <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16 max-w-5xl mx-auto">
              {partners.map((p, i) => {
                const logo = (
                  <div className="heaa-logo relative h-10 w-32">
                    <Image
                      src={p.image || `/placeholder.svg?height=40&width=128&text=${encodeURIComponent(p.name)}`}
                      alt={p.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                )
                return (
                  <div key={i}>
                    {p.url ? <Link href={p.url} target="_blank" rel="noreferrer" title={p.name}>{logo}</Link> : logo}
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════
          CTA FINAL — llamado a la acción
      ══════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-green-950 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-400/40 to-transparent" />
        <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-green-800/30 blur-3xl" />
        <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-emerald-800/30 blur-3xl" />

        <div className="relative container mx-auto px-4 text-center max-w-3xl">
          <Leaf className="h-9 w-9 text-green-400 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">{ctaTitle}</h2>
          {ctaText && (
            <p className="text-green-200/70 text-base md:text-lg mb-8 max-w-xl mx-auto leading-relaxed">{ctaText}</p>
          )}
          <Button asChild size="lg" className="heaa-pressable bg-green-400 hover:bg-green-300 text-green-950 font-semibold rounded-xl h-12 px-8 text-base">
            <Link href={ctaBtnUrl}>
              {ctaBtnText}
              <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-150 group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>
      </section>

    </div>
  )
}
