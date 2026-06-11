"use client"

import { useEffect } from "react"
import { usePublicSettings } from "@/lib/use-public-settings"

/**
 * Lee los colores institucionales configurados en /admin/pagina y los aplica
 * como variables CSS en :root. Los componentes (navbar, footer, home, etc.)
 * consumen var(--gov-green), var(--gov-dark) y var(--gov-yellow), por lo que
 * el cambio se refleja en todo el sitio sin recargar.
 *
 * Si una variable no está configurada, se conserva el valor por defecto
 * definido en globals.css.
 */
export default function ThemeColors() {
  const s = usePublicSettings()

  useEffect(() => {
    const root = document.documentElement
    const apply = (varName: string, value?: string) => {
      const v = (value ?? "").trim()
      if (v) root.style.setProperty(varName, v)
    }
    apply("--gov-green", s.themePrimary)
    apply("--gov-dark", s.themePrimaryDark)
    apply("--gov-yellow", s.themeAccent)
  }, [s.themePrimary, s.themePrimaryDark, s.themeAccent])

  return null
}
