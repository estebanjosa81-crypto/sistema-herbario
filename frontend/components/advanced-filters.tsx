"use client"

import { useState, useEffect, useCallback } from "react"
import { Filter, X, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { apiService } from "@/lib/api"

interface FilterOption { value: string; label: string }

interface FilterOptions {
  genera:        FilterOption[]
  departments:   FilterOption[]
  municipalities:FilterOption[]
  collectors:    FilterOption[]
}

interface AdvancedFiltersProps {
  onFiltersChange: (filters: { field: string; value: string }[]) => void
}

// Campos disponibles para filtrar — "familia" se gestiona con el selector dedicado en la página
const FIELD_OPTIONS = [
  { value: "genero",          label: "Género" },
  { value: "especie",         label: "Epíteto específico" },
  { value: "departamento",    label: "Departamento" },
  { value: "municipio",       label: "Municipio" },
  { value: "nombreComun",     label: "Nombre común / vernáculo" },
  { value: "colector",        label: "Colector" },
  { value: "numeroCatalogo",  label: "Nº catálogo (herbario)" },
  { value: "numeroRegistro",  label: "Nº registro (colector)" },
  { value: "habitat",         label: "Hábitat" },
]

const FIELD_LABELS: Record<string, string> = Object.fromEntries(
  FIELD_OPTIONS.map(f => [f.value, f.label])
)

// Campos que tienen opciones dinámicas desde la API
const DROPDOWN_FIELDS = new Set(["departamento", "municipio", "colector", "genero"])

export default function AdvancedFilters({ onFiltersChange }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen]         = useState(false)
  const [filters, setFilters]       = useState<{ field: string; value: string }[]>([])
  const [currentField, setCurrentField] = useState("")
  const [currentValue, setCurrentValue] = useState("")
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    genera: [], departments: [], municipalities: [], collectors: [],
  })
  const [loadingOptions, setLoadingOptions] = useState(false)

  // Cargar opciones reales desde la API al abrir el panel
  const loadOptions = useCallback(async () => {
    if (filterOptions.departments.length > 0) return
    setLoadingOptions(true)
    try {
      const res = await apiService.getFilterOptions()
      if (res.success && res.data) {
        setFilterOptions({
          genera:        res.data.genera        ?? [],
          departments:   res.data.departments   ?? [],
          municipalities:res.data.municipalities ?? [],
          collectors:    res.data.collectors    ?? [],
        })
      }
    } catch {
      // silently fail — user can still type free text
    } finally {
      setLoadingOptions(false)
    }
  }, [filterOptions.departments.length])

  useEffect(() => {
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

  const getDropdownOptions = (field: string): FilterOption[] => {
    switch (field) {
      case "departamento":  return filterOptions.departments
      case "municipio":     return filterOptions.municipalities
      case "colector":      return filterOptions.collectors
      case "genero":        return filterOptions.genera
      default:              return []
    }
  }

  const addFilter = () => {
    if (!currentField || !currentValue.trim()) return
    setFilters(prev => [...prev, { field: currentField, value: currentValue.trim() }])
    setCurrentValue("")
  }

  const removeFilter = (index: number) => {
    setFilters(prev => prev.filter((_, i) => i !== index))
  }

  const clearFilters = () => setFilters([])

  return (
    <Sheet open={isOpen} onOpenChange={open => { setIsOpen(open); if (open) loadOptions() }}>
      <SheetTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Más filtros
          {filters.length > 0 && (
            <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center bg-green-600 text-white text-xs">
              {filters.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Filtros avanzados</SheetTitle>
          <SheetDescription>Refina la búsqueda usando múltiples criterios combinados</SheetDescription>
        </SheetHeader>

        <div className="grid gap-4 py-4">
          {/* Selector de campo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="filter-field">Campo</Label>
              <Select
                value={currentField}
                onValueChange={v => { setCurrentField(v); setCurrentValue("") }}
              >
                <SelectTrigger id="filter-field">
                  <SelectValue placeholder="Seleccionar…" />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="filter-value">Valor</Label>
              {currentField && DROPDOWN_FIELDS.has(currentField) && getDropdownOptions(currentField).length > 0 ? (
                <Select value={currentValue} onValueChange={setCurrentValue}>
                  <SelectTrigger id="filter-value">
                    <SelectValue placeholder={loadingOptions ? "Cargando…" : "Seleccionar…"} />
                  </SelectTrigger>
                  <SelectContent>
                    {getDropdownOptions(currentField).map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="filter-value"
                    value={currentValue}
                    onChange={e => setCurrentValue(e.target.value)}
                    placeholder={currentField ? "Escribe y presiona Enter" : "Selecciona un campo"}
                    className="pl-8"
                    disabled={!currentField}
                    onKeyDown={e => {
                      if (e.key === "Enter" && currentField && currentValue.trim()) {
                        e.preventDefault()
                        addFilter()
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <Button
            onClick={addFilter}
            disabled={!currentField || !currentValue.trim()}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Añadir filtro
          </Button>

          {filters.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>Filtros activos ({filters.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {filters.map((filter, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1 pr-1">
                      <span className="font-medium">{FIELD_LABELS[filter.field] ?? filter.field}:</span>
                      <span className="max-w-[120px] truncate">{filter.value}</span>
                      <button
                        onClick={() => removeFilter(index)}
                        className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              <Button variant="outline" onClick={clearFilters} className="w-full">
                Limpiar todos
              </Button>
            </>
          )}
        </div>

        <SheetFooter>
          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={() => setIsOpen(false)}
          >
            Aplicar y cerrar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
