"use client"

import { useCallback, useEffect, useState } from "react"
import { DataTable, ColDef, FilterDef } from "@/components/ui/data-table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Users, UserCheck, UserX, Shield } from "lucide-react"
import { apiService } from "@/lib/api"

interface User {
  id: number; name: string; email: string
  role: "admin" | "user" | "collector"
  status: "active" | "inactive" | "pending"
  created_at: string
}

const ROLE_CFG: Record<string, { label: string; cls: string }> = {
  admin:     { label: "Admin",    cls: "bg-purple-100 text-purple-700 border-purple-200" },
  collector: { label: "Colector", cls: "bg-blue-100 text-blue-700 border-blue-200" },
  user:      { label: "Usuario",  cls: "bg-gray-100 text-gray-700 border-gray-200" },
}
const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  active:   { label: "Activo",    cls: "bg-green-100 text-green-700 border-green-200" },
  inactive: { label: "Inactivo",  cls: "bg-amber-100 text-amber-700 border-amber-200" },
  pending:  { label: "Pendiente", cls: "bg-sky-100 text-sky-700 border-sky-200" },
}
const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : "—"

const COLUMNS: ColDef<User>[] = [
  {
    id: "name", header: "Nombre", sortable: true,
    cell: u => (
      <div>
        <p className="text-sm font-medium">{u.name}</p>
        <p className="text-xs text-muted-foreground">{u.email}</p>
      </div>
    ),
  },
  {
    id: "role", header: "Rol", sortable: true, hideBelow: "sm",
    cell: u => {
      const cfg = ROLE_CFG[u.role] ?? ROLE_CFG.user
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${cfg.cls}`}>
          <Shield className="h-2.5 w-2.5" />{cfg.label}
        </span>
      )
    },
  },
  {
    id: "status", header: "Estado", sortable: true, hideBelow: "sm",
    cell: u => {
      const cfg = STATUS_CFG[u.status] ?? STATUS_CFG.inactive
      return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${cfg.cls}`}>{cfg.label}</span>
    },
  },
  {
    id: "created_at", header: "Registro", sortable: true, hideBelow: "md",
    cell: u => <span className="text-xs text-muted-foreground">{fmtDate(u.created_at)}</span>,
  },
]

const FILTERS: FilterDef[] = [
  {
    id: "role", label: "Rol", type: "select",
    options: [{ value: "admin", label: "Admin" }, { value: "collector", label: "Colector" }, { value: "user", label: "Usuario" }],
  },
  {
    id: "status", label: "Estado", type: "select",
    options: [{ value: "active", label: "Activo" }, { value: "inactive", label: "Inactivo" }, { value: "pending", label: "Pendiente" }],
  },
]

export default function UsuariosPage() {
  const [data, setData]           = useState<User[]>([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [page, setPage]           = useState(1)
  const [limit, setLimit]         = useState(25)
  const [search, setSearch]       = useState("")
  const [sort, setSort]           = useState<{ id: string; dir: "asc" | "desc" } | null>(null)
  const [activeFilters, setAF]    = useState<Record<string, string>>({})
  const [detail, setDetail]       = useState<User | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}/api/service`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        bo