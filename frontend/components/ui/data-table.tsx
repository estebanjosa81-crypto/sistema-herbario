"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Search, X, ArrowUpDown, ArrowUp, ArrowDown,
  SlidersHorizontal, AlertCircle, Inbox, ShieldOff, Loader2,
} from "lucide-react"

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

export interface ColDef<T> {
  id: string
  header: string
  cell: (row: T) => React.ReactNode
  sortable?: boolean
  /** Ocultar en viewports menores a este breakpoint */
  hideBelow?: "sm" | "md" | "lg" | "xl"
  width?: string
  align?: "left" | "right" | "center"
  /** Si true, esta columna no se muestra en la vista de tarjetas móviles */
  mobileHide?: boolean
}

export interface FilterDef {
  id: string
  label: string
  type: "select" | "text"
  options?: { value: string; label: string }[]
}

export interface BulkAction {
  id: string
  label: string
  icon?: React.ReactNode
  variant?: "default" | "destructive" | "outline" | "secondary"
  onClick: (ids: Set<string | number>) => void
}

export interface DataTablePagination {
  page: number
  limit: number
  total: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

export interface DataTableSort {
  id: string
  dir: "asc" | "desc"
}

export interface DataTableProps<T> {
  // Datos
  data: T[]
  columns: ColDef<T>[]
  getRowId: (row: T) => string | number

  // Estado
  loading?: boolean
  error?: string

  // Paginación (server-side)
  pagination: DataTablePagination

  // Búsqueda (server-side con debounce)
  search?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string

  // Ordenamiento (server-side)
  sort?: DataTableSort | null
  onSortChange?: (sort: DataTableSort | null) => void

  // Filtros
  filters?: FilterDef[]
  activeFilters?: Record<string, string>
  onFilterChange?: (id: string, value: string) => void

  // Selección y acciones masivas
  selectable?: boolean
  selectedIds?: Set<string | number>
  onSelectionChange?: (ids: Set<string | number>) => void
  bulkActions?: BulkAction[]

  // Interacción
  onRowClick?: (row: T) => void

  // Tarjetas móviles (opcional, si no se pasa se auto-genera)
  renderCard?: (row: T, ctx: { selected: boolean; onSelect: () => void }) => React.ReactNode

  // Estados vacíos
  emptyIcon?: React.ReactNode
  emptyTitle?: string
  emptyDescription?: string
  errorTitle?: string

  // Acciones en toolbar
  toolbarRight?: React.ReactNode
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────────────────────

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="h-3.5 bg-muted rounded"
            style={{ width: i === 0 ? "70%" : i === 1 ? "50%" : "60%", maxWidth: 160 }}
          />
          {i === 1 && <div className="h-2.5 bg-muted/60 rounded mt-1.5" style={{ width: "40%" }} />}
        </td>
      ))}
    </tr>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FILTROS ACTIVOS (chips)
// ─────────────────────────────────────────────────────────────────────────────

function ActiveFilterChips({
  filters,
  activeFilters,
  onFilterChange,
  search,
  onSearchChange,
}: {
  filters?: FilterDef[]
  activeFilters?: Record<string, string>
  onFilterChange?: (id: string, value: string) => void
  search?: string
  onSearchChange?: (v: string) => void
}) {
  const chips: { label: string; onRemove: () => void }[] = []

  if (search) {
    chips.push({ label: `Búsqueda: "${search}"`, onRemove: () => onSearchChange?.("") })
  }
  for (const f of filters ?? []) {
    const val = activeFilters?.[f.id]
    if (val && val !== "all" && val !== "") {
      const opt = f.options?.find(o => o.value === val)
      chips.push({
        label: `${f.label}: ${opt?.label ?? val}`,
        onRemove: () => onFilterChange?.(f.id, ""),
      })
    }
  }

  if (!chips.length) return null

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-xs text-muted-foreground">Filtros:</span>
      {chips.map((c, i) => (
        <button
          key={i}
          onClick={c.onRemove}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
        >
          {c.label}
          <X className="h-2.5 w-2.5" />
        </button>
      ))}
      <button
        onClick={() => {
          onSearchChange?.("")
          for (const f of filters ?? []) onFilterChange?.(f.id, "")
        }}
        className="text-xs text-muted-foreground hover:text-foreground underline ml-1"
      >
        Limpiar todo
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGINACIÓN
// ─────────────────────────────────────────────────────────────────────────────

function Pagination({ pagination }: { pagination: DataTablePagination }) {
  const { page, limit, total, onPageChange, onLimitChange } = pagination
  const totalPages = Math.ceil(total / limit)
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to   = Math.min(page * limit, total)

  const pages = useMemo(() => {
    const delta = 2
    const range: (number | "…")[] = []
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) range.push(i)
    if ((range[0] as number) > 1) { if ((range[0] as number) > 2) range.unshift("…"); range.unshift(1) }
    if ((range[range.length - 1] as number) < totalPages) {
      if ((range[range.length - 1] as number) < totalPages - 1) range.push("…")
      range.push(totalPages)
    }
    return range
  }, [page, totalPages])

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-2 text-sm">
      {/* Registros por página */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="hidden sm:inline">Filas por página:</span>
        <Select value={String(limit)} onValueChange={v => { onLimitChange(Number(v)); onPageChange(1) }}>
          <SelectTrigger className="h-7 w-16 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 25, 50, 100].map(n => (
              <SelectItem key={n} value={String(n)} className="text-xs">{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="hidden sm:inline">
          {from}–{to} de <strong>{total.toLocaleString("es-CO")}</strong>
        </span>
      </div>

      {/* Navegación */}
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-7 w-7" disabled={page === 1} onClick={() => onPageChange(1)} aria-label="Primera página">
          <ChevronsLeft className="h-3.5 w-3.5" />
        </Button>
        <Button variant="outline" size="icon" className="h-7 w-7" disabled={page === 1} onClick={() => onPageChange(page - 1)} aria-label="Página anterior">
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`e${i}`} className="px-1 text-muted-foreground text-xs">…</span>
          ) : (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="icon"
              className="h-7 w-7 text-xs"
              onClick={() => onPageChange(p as number)}
            >
              {p}
            </Button>
          )
        )}
        <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Página siguiente">
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
        <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => onPageChange(totalPages)} aria-label="Última página">
          <ChevronsRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Total móvil */}
      <span className="text-xs text-muted-foreground sm:hidden">
        {from}–{to} / {total.toLocaleString("es-CO")}
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HIDE BELOW BREAKPOINT — clases Tailwind
// ─────────────────────────────────────────────────────────────────────────────

const HIDE_BELOW: Record<string, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export function DataTable<T>({
  data,
  columns,
  getRowId,
  loading = false,
  error,
  pagination,
  search = "",
  onSearchChange,
  searchPlaceholder = "Buscar…",
  sort,
  onSortChange,
  filters = [],
  activeFilters = {},
  onFilterChange,
  selectable = false,
  selectedIds,
  onSelectionChange,
  bulkActions = [],
  onRowClick,
  renderCard,
  emptyIcon,
  emptyTitle = "Sin resultados",
  emptyDescription = "No hay registros que coincidan con los filtros.",
  errorTitle = "Error al cargar los datos",
  toolbarRight,
}: DataTableProps<T>) {

  // ── Búsqueda con debounce ───────────────────────────────────────────────
  const [localSearch, setLocalSearch] = useState(search)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setLocalSearch(search) }, [search])

  const handleSearchInput = (val: string) => {
    setLocalSearch(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onSearchChange?.(val)
      pagination.onPageChange(1)
    }, 350)
  }

  // ── Selección ───────────────────────────────────────────────────────────
  const internalSelected = useRef<Set<string | number>>(new Set())
  const selected: Set<string | number> = selectedIds ?? internalSelected.current

  const toggleRow = useCallback((id: string | number) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    onSelectionChange?.(next)
    if (!selectedIds) { internalSelected.current = next }
  }, [selected, selectedIds, onSelectionChange])

  const toggleAll = useCallback(() => {
    const allIds = data.map(r => getRowId(r))
    const allSelected = allIds.every(id => selected.has(id))
    const next = allSelected ? new Set<string | number>() : new Set<string | number>(allIds)
    onSelectionChange?.(next)
    if (!selectedIds) { internalSelected.current = next }
  }, [data, selected, selectedIds, getRowId, onSelectionChange])

  const clearSelection = () => {
    const empty = new Set<string | number>()
    onSelectionChange?.(empty)
    if (!selectedIds) internalSelected.current = empty
  }

  const allSelected = data.length > 0 && data.every(r => selected.has(getRowId(r)))
  const partialSelected = !allSelected && data.some(r => selected.has(getRowId(r)))

  // ── Ordenamiento ────────────────────────────────────────────────────────
  const handleSort = (colId: string) => {
    if (!onSortChange) return
    if (sort?.id === colId) {
      onSortChange(sort.dir === "asc" ? { id: colId, dir: "desc" } : null)
    } else {
      onSortChange({ id: colId, dir: "asc" })
    }
  }

  // ── Conteo de filtros activos ───────────────────────────────────────────
  const activeFilterCount = Object.values(activeFilters).filter(v => v && v !== "all").length
    + (search ? 1 : 0)

  // ── Columnas efectivas (incluye checkbox si selectable) ─────────────────
  const totalCols = columns.length + (selectable ? 1 : 0)

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">

      {/* ── TOOLBAR ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Búsqueda */}
        {onSearchChange && (
          <div className="relative flex-1 min-w-44 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={searchPlaceholder}
              value={localSearch}
              onChange={e => handleSearchInput(e.target.value)}
              className="pl-8 h-9 text-sm pr-8"
              aria-label="Buscar"
            />
            {localSearch && (
              <button
                onClick={() => handleSearchInput("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Filtros */}
        {filters.map(f => (
          <div key={f.id}>
            {f.type === "select" && (
              <Select
                value={activeFilters[f.id] || "all"}
                onValueChange={v => { onFilterChange?.(f.id, v); pagination.onPageChange(1) }}
              >
                <SelectTrigger className={cn(
                  "h-9 text-sm min-w-32",
                  activeFilters[f.id] && activeFilters[f.id] !== "all"
                    ? "border-primary text-primary"
                    : ""
                )}>
                  <SelectValue placeholder={f.label} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{f.label}: todos</SelectItem>
                  {f.options?.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {f.type === "text" && (
              <div className="relative">
                <Input
                  placeholder={f.label}
                  value={activeFilters[f.id] || ""}
                  onChange={e => onFilterChange?.(f.id, e.target.value)}
                  className="h-9 text-sm w-36"
                />
              </div>
            )}
          </div>
        ))}

        {/* Badge filtros activos */}
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="h-6 text-xs gap-1">
            <SlidersHorizontal className="h-3 w-3" />
            {activeFilterCount}
          </Badge>
        )}

        {/* Acciones del toolbar (derecha) */}
        {toolbarRight && <div className="ml-auto flex items-center gap-2">{toolbarRight}</div>}
      </div>

      {/* Chips filtros activos */}
      <ActiveFilterChips
        filters={filters}
        activeFilters={activeFilters}
        onFilterChange={onFilterChange}
        search={search}
        onSearchChange={onSearchChange}
      />

      {/* ── BULK ACTIONS ────────────────────────────────────────────────── */}
      {selectable && selected.size > 0 && (
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-sm">
          <span className="font-medium text-primary">{selected.size} seleccionado{selected.size > 1 ? "s" : ""}</span>
          <div className="flex gap-2 flex-wrap">
            {bulkActions.map(a => (
              <Button
                key={a.id}
                variant={a.variant ?? "outline"}
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => a.onClick(selected)}
              >
                {a.icon}
                {a.label}
              </Button>
            ))}
          </div>
          <button className="ml-auto text-muted-foreground hover:text-foreground" onClick={clearSelection} aria-label="Cancelar selección">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── TABLA (md+) ─────────────────────────────────────────────────── */}
      <div className="hidden md:block rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b sticky top-0 z-10">
                {selectable && (
                  <th className="w-10 pl-4 py-3">
                    <Checkbox
                      checked={allSelected}
                      ref={(el) => {
                        if (el) (el as any).indeterminate = partialSelected
                      }}
                      onCheckedChange={toggleAll}
                      aria-label="Seleccionar todos"
                    />
                  </th>
                )}
                {columns.map(col => (
                  <th
                    key={col.id}
                    className={cn(
                      "px-4 py-3 text-xs font-medium text-muted-foreground text-left whitespace-nowrap",
                      col.hideBelow ? HIDE_BELOW[col.hideBelow] : "",
                      col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "",
                      col.sortable && onSortChange ? "cursor-pointer hover:text-foreground select-none" : "",
                      col.width ? col.width : "",
                    )}
                    onClick={col.sortable && onSortChange ? () => handleSort(col.id) : undefined}
                    aria-sort={sort?.id === col.id ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.header}
                      {col.sortable && onSortChange && (
                        sort?.id === col.id
                          ? sort.dir === "asc"
                            ? <ArrowUp className="h-3 w-3 text-primary" />
                            : <ArrowDown className="h-3 w-3 text-primary" />
                          : <ArrowUpDown className="h-3 w-3 opacity-30" />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonRow key={i} cols={totalCols} />
                ))
              ) : error ? (
                <tr>
                  <td colSpan={totalCols} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-destructive/80">
                      <AlertCircle className="h-8 w-8 opacity-60" />
                      <p className="text-sm font-medium">{errorTitle}</p>
                      <p className="text-xs text-muted-foreground">{error}</p>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={totalCols} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      {emptyIcon ?? <Inbox className="h-8 w-8 opacity-40" />}
                      <p className="text-sm font-medium">{emptyTitle}</p>
                      <p className="text-xs opacity-70">{emptyDescription}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map(row => {
                  const id = getRowId(row)
                  const isSelected = selected.has(id)
                  return (
                    <tr
                      key={id}
                      className={cn(
                        "border-b last:border-0 transition-colors group",
                        onRowClick ? "cursor-pointer hover:bg-muted/30" : "hover:bg-muted/20",
                        isSelected ? "bg-primary/5" : "",
                      )}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                    >
                      {selectable && (
                        <td className="pl-4 py-3 w-10" onClick={e => { e.stopPropagation(); toggleRow(id) }}>
                          <Checkbox checked={isSelected} onCheckedChange={() => toggleRow(id)} aria-label="Seleccionar fila" />
                        </td>
                      )}
                      {columns.map(col => (
                        <td
                          key={col.id}
                          className={cn(
                            "px-4 py-3",
                            col.hideBelow ? HIDE_BELOW[col.hideBelow] : "",
                            col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "",
                          )}
                        >
                          {col.cell(row)}
                        </td>
                      ))}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── TARJETAS MÓVIL (<md) ─────────────────────────────────────────── */}
      <div className="md:hidden space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4 space-y-2 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted/60 rounded w-1/2" />
              <div className="h-3 bg-muted/40 rounded w-2/3" />
            </div>
          ))
        ) : error ? (
          <div className="flex flex-col items-center gap-2 py-12 text-destructive/80">
            <AlertCircle className="h-8 w-8 opacity-60" />
            <p className="text-sm">{error}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            {emptyIcon ?? <Inbox className="h-8 w-8 opacity-40" />}
            <p className="text-sm font-medium">{emptyTitle}</p>
          </div>
        ) : (
          data.map(row => {
            const id = getRowId(row)
            const isSelected = selected.has(id)
            if (renderCard) {
              return (
                <div key={id} className={cn(isSelected ? "ring-2 ring-primary rounded-lg" : "")}>
                  {renderCard(row, { selected: isSelected, onSelect: () => toggleRow(id) })}
                </div>
              )
            }
            // Auto-card: muestra columnas no ocultas en móvil
            const visibleCols = columns.filter(c => !c.mobileHide)
            return (
              <div
                key={id}
                className={cn(
                  "rounded-lg border p-4 space-y-2 transition-colors",
                  onRowClick ? "cursor-pointer hover:bg-muted/30 active:bg-muted/50" : "",
                  isSelected ? "bg-primary/5 ring-1 ring-primary" : "bg-card",
                )}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {selectable && (
                  <div className="flex items-center gap-2 mb-1" onClick={e => { e.stopPropagation(); toggleRow(id) }}>
                    <Checkbox checked={isSelected} onCheckedChange={() => toggleRow(id)} />
                    <span className="text-xs text-muted-foreground">Seleccionar</span>
                  </div>
                )}
                {visibleCols.map(col => (
                  <div key={col.id} className="flex items-start justify-between gap-2">
                    <span className="text-xs text-muted-foreground shrink-0 min-w-20">{col.header}</span>
                    <span className="text-xs text-right">{col.cell(row)}</span>
                  </div>
                ))}
              </div>
            )
          })
        )}
      </div>

      {/* ── PAGINACIÓN ──────────────────────────────────────────────────── */}
      {pagination.total > 0 && (
        <Pagination pagination={pagination} />
      )}
    </div>
  )
}
