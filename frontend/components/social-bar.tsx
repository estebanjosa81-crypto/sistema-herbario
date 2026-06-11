"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { usePublicSettings } from "@/lib/use-public-settings"

/* Iconos de marca (SVG inline, heredan el color del texto blanco) */
const FacebookIcon = (p: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={p.className} aria-hidden="true">
    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.9 3.78-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.44 2.9h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z" />
  </svg>
)
const XIcon = (p: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={p.className} aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
  </svg>
)
const InstagramIcon = (p: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={p.className} aria-hidden="true">
    <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 1.62c-3.15 0-3.52.01-4.76.07-1.15.05-1.77.24-2.18.4-.55.22-.94.47-1.35.88-.41.41-.66.8-.88 1.35-.16.41-.35 1.03-.4 2.18-.06 1.24-.07 1.61-.07 4.76s.01 3.52.07 4.76c.05 1.15.24 1.77.4 2.18.22.55.47.94.88 1.35.41.41.8.66 1.35.88.41.16 1.03.35 2.18.4 1.24.06 1.61.07 4.76.07s3.52-.01 4.76-.07c1.15-.05 1.77-.24 2.18-.4.55-.22.94-.47 1.35-.88.41-.41.66-.8.88-1.35.16-.41.35-1.03.4-2.18.06-1.24.07-1.61.07-4.76s-.01-3.52-.07-4.76c-.05-1.15-.24-1.77-.4-2.18a3.6 3.6 0 0 0-.88-1.35 3.6 3.6 0 0 0-1.35-.88c-.41-.16-1.03-.35-2.18-.4-1.24-.06-1.61-.07-4.76-.07Zm0 2.76a5.46 5.46 0 1 1 0 10.92 5.46 5.46 0 0 1 0-10.92Zm0 9a3.54 3.54 0 1 0 0-7.08 3.54 3.54 0 0 0 0 7.08Zm6.95-9.22a1.27 1.27 0 1 1-2.55 0 1.27 1.27 0 0 1 2.55 0Z" />
  </svg>
)
const YoutubeIcon = (p: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={p.className} aria-hidden="true">
    <path d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.51A3.02 3.02 0 0 0 .5 6.2C0 8.08 0 12 0 12s0 3.92.5 5.8a3.02 3.02 0 0 0 2.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.02 3.02 0 0 0 2.12-2.14C24 15.92 24 12 24 12s0-3.92-.5-5.8ZM9.6 15.6V8.4l6.24 3.6L9.6 15.6Z" />
  </svg>
)
const WhatsappIcon = (p: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={p.className} aria-hidden="true">
    <path d="M.06 24l1.69-6.16a11.87 11.87 0 0 1-1.6-5.95C.15 5.34 5.5 0 12.06 0a11.8 11.8 0 0 1 8.41 3.49 11.8 11.8 0 0 1 3.48 8.41c0 6.56-5.34 11.9-11.9 11.9a11.9 11.9 0 0 1-5.68-1.45L.06 24Zm6.6-3.8c1.68.99 3.28 1.59 5.4 1.59 5.45 0 9.89-4.43 9.9-9.88a9.86 9.86 0 0 0-9.88-9.9c-5.46 0-9.9 4.43-9.9 9.89 0 2.23.65 3.9 1.74 5.65l-1 3.65 3.74-1Zm11.39-5.55c-.07-.12-.27-.2-.56-.34-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.76-1.65-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5l-.57-.02c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.47s1.07 2.86 1.22 3.06c.15.2 2.1 3.2 5.07 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41Z" />
  </svg>
)
const TiktokIcon = (p: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={p.className} aria-hidden="true">
    <path d="M16.6 5.82a4.28 4.28 0 0 1-1.05-2.82h-3.3v13.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 0 1 0-5.18c.27 0 .53.04.77.12V10.5a5.9 5.9 0 0 0-.77-.05 5.84 5.84 0 1 0 5.84 5.84V9.2a7.5 7.5 0 0 0 4.4 1.41V7.3a4.27 4.27 0 0 1-3.3-1.48Z" />
  </svg>
)
const LinkedinIcon = (p: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={p.className} aria-hidden="true">
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
  </svg>
)

type Net = {
  name: string
  url: string
  color: string
  Icon: React.ComponentType<{ className?: string }>
}

export default function SocialBar() {
  const pathname = usePathname()
  const s = usePublicSettings()

  // Oculta en el panel de administración y en el login (igual que el footer)
  if (pathname?.startsWith("/admin") || pathname === "/login") return null

  // Toggle maestro: si está explícitamente en false, no se muestra
  if (s.socialEnabled === false) return null

  const nets: Net[] = [
    { name: "Facebook",  url: s.socialFacebookUrl,  color: "#1877F2", Icon: FacebookIcon },
    { name: "X",         url: s.socialXUrl,         color: "#000000", Icon: XIcon },
    { name: "Instagram", url: s.socialInstagramUrl, color: "#C13584", Icon: InstagramIcon },
    { name: "YouTube",   url: s.socialYoutubeUrl,   color: "#FF0000", Icon: YoutubeIcon },
    { name: "WhatsApp",  url: s.socialWhatsappUrl,  color: "#25D366", Icon: WhatsappIcon },
    { name: "TikTok",    url: s.socialTiktokUrl,    color: "#000000", Icon: TiktokIcon },
    { name: "LinkedIn",  url: s.socialLinkedinUrl,  color: "#0A66C2", Icon: LinkedinIcon },
  ].filter((n) => n.url && n.url.trim() !== "")

  if (nets.length === 0) return null

  const onLeft = s.socialPosition === "left"
  const sideClass = onLeft ? "left-0" : "right-0"
  // En el lado izquierdo el ícono va a la derecha para que el label crezca hacia adentro
  const itemDir = onLeft ? "flex-row-reverse" : "flex-row"

  return (
    <aside
      className={`fixed ${sideClass} top-1/2 -translate-y-1/2 z-[999] flex flex-col shadow-lg`}
      aria-label="Redes sociales"
    >
      {nets.map(({ name, url, color, Icon }) => (
        <a
          key={name}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={name}
          title={name}
          style={{ backgroundColor: color }}
          className={`group flex items-center ${itemDir} h-11 w-11 overflow-hidden hover:w-[130px] transition-[width] duration-200 ease-out`}
        >
          <span className="w-11 h-11 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-white" />
          </span>
          <span className="text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity delay-75 px-1">
            {name}
          </span>
        </a>
      ))}
    </aside>
  )
}
