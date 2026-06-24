"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import {
  Leaf, Users, MessageSquare, FileText, AlertCircle,
  Loader2, RefreshCw, ExternalLink, Download, X, ChevronLeft,
  ChevronRight, TrendingUp, TrendingDown, Minus, ArrowRight,
  BarChart3, Activity, MapPin, TreePine, FlaskConical
} from "lucide-react"
import { apiService } from "@/lib/api"
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ReferenceLine
} from "recharts"

// ── Traducciones ────────────────────────────────────────────────────────────
const T_SUGG_STATUS: Record<string, string> = {
  pending: "Pendiente", in_review: "En revisión",
  approved: "Aprobado", rejected: "Rechazado", implemented: "Implementado",
}
const T_PQRS_STATUS: Record<string, string> = {
  pendiente: "Pendiente", en_revision: "En revisión", respondido: "Respondido",
}
const T_PQRS_TIPO: Record<string, string> = {
  peticion: "Petición", queja: "Queja", reclamo: "Reclamo",
  sugerencia: "Sugerencia", denuncia: "Denuncia", felicitacion: "Felicitación",
}
const T_PLANT_STATUS: Record<string, string> = {
  active: "Activa", draft: "Borrador", archived: "Archivada", rejected: "Rechazada",
}

// ── Colores ────────────────────────────────────────────────────────────────
const C_GREEN  = ["#16a34a", "#22c55e", "#4ade80", "#86efac", "#bbf7d0"]
const C_BLUE   = ["#1d4ed8", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"]
const C_SUGG: Record<string, string> = {
  pending: "#f59e0b", in_review: "#3b82f6", approved: "#16a34a",
  rejected: "#ef4444", implemented: "#8b5cf6",
}
const C_PQRS: Record<string, string> = {
  pendiente: "#f59e0b", en_revision: "#3b82f6", respondido: "#16a34a",
}
const C_TIPO: Record<string, string> = {
  peticion: "#3b82f6", queja: "#ef4444", reclamo: "#f97316",
  sugerencia: "#8b5cf6", denuncia: "#dc2626", felicitacion: "#16a34a",
}

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]

// ── Tipos ──────────────────────────────────────────────────────────────────
interface ActiveFilter {
  type: "family" | "department" | "collector" | "status" | "month"
  value: string
  label: string
  urlParam?: string
  navUrl?: string // si se debe navegar directo en vez de abrir panel
}

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n: number | undefined) => (n ?? 0).toLocaleString("es-CO")

function exportCsv(rows: any[], filename: string) {
  if (!rows.length) return
  const cols = ["id", "scientific_name", "family", "state_province", "recorded_by", "status", "created_at"]
  const header = ["ID", "Nombre científico", "Familia", "Departamento", "Colector", "Estado", "Fecha"]
  const lines = [
    header.join(","),
    ...rows.map(r => cols.map(c => `"${(r[c] ?? "").toString().replace(/"/g, '""')}"`).join(","))
  ]
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ── Subcomponentes ─────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center justify-center h-full min-h-[160px]">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
}

function Empty({ text = "Sin datos" }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[140px] gap-2 text-muted-foreground">
      <BarChart3 className="h-8 w-8 opacity-30" />
      <span className="text-sm">{text}</span>
    </div>
  )
}

function KpiCard({
  icon, label, value, sub, trend, color, href, loading
}: {
  icon: React.ReactNode; label: string; value: string | number
  sub?: string; trend?: "up" | "down" | "neutral"; color: string
  href?: string; loading?: boolean
}) {
  const bgMap: Record<string, string> = {
    green: "bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900/40",
    blue:  "bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40",
    amber: "bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40",
    red:   "bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900/40",
  }
  const iconMap: Record<string, string> = {
    green: "text-green-600", blue: "text-blue-600", amber: "text-amber-500", red: "text-red-500",
  }
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus
  const trendColor = trend === "up" ? "text-green-600" : trend === "down" ? "text-red-500" : "text-muted-foreground"

  const inner = (
    <Card className={`${bgMap[color]} shadow-sm transition-all hover:shadow-md ${href ? "cursor-pointer hover:-translate-y-0.5" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className={`p-2 rounded-lg bg-white/60 dark:bg-black/20 ${iconMap[color]}`}>{icon}</div>
          {trend && <TrendIcon className={`h-4 w-4 mt-1 ${trendColor}`} />}
        </div>
        <div className="mt-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
          {loading
            ? <div className="h-8 w-24 bg-muted animate-pulse rounded mt-1" />
            : <p className="text-3xl font-bold mt-0.5 tabular-nums">{typeof value === "number" ? fmt(value) : value}</p>
          }
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        {href && (
          <div className="mt-2 flex items-center gap-1 text-xs font-medium opacity-60 hover:opacity-100">
            Ver detalle <ArrowRight className="h-3 w-3" />
          </div>
        )}
      </CardContent>
    </Card>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}

// ── Tooltip personalizado para gráficas ───────────────────────────────────
function CustomTooltip({ active, payload, label, suffix = "especímenes" }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color ?? p.fill }}>
          {p.name ?? p.dataKey}: <span className="font-bold">{fmt(p.value)}</span> {suffix}
        </p>
      ))}
      <p className="text-xs text-muted-foreground mt-1 italic">Clic para ver detalle</p>
    </div>
  )
}

// ── Panel lateral de detalle ───────────────────────────────────────────────
function DetailPanel({
  open, filter, onClose
}: {
  open: boolean
  filter: ActiveFilter | null
  onClose: () => void
}) {
  const router = useRouter()
  const [plants, setPlants] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const LIMIT = 8

  useEffect(() => {
    if (!open || !filter) return
    setPage(1)
    fetchPlants(1)
  }, [open, filter])

  useEffect(() => {
    if (!open || !filter) return
    fetchPlants(page)
  }, [page])

  const fetchPlants = async (p: number) => {
    if (!filter) return
    setLoading(true)
    const params: any = { page: p, limit: LIMIT }
    if (filter.type === "family")     params.family     = f