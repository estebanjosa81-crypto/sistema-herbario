"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Upload, Plus, X, Save, Loader2, CheckCircle2, MapPin, Sparkles, ChevronDown, LayoutTemplate, Pencil, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"

// ── Tipos helpers ────────────────────────────────────────────────────────────
type AutocompleteItem = { id: number; value: string; type: string; label: string }
type TipoPlantilla = 'institucion' | 'ubicacion'
type Plantilla = {
  id: string
  nombre: string
  tipo: TipoPlantilla
  campos: Record<string, string>
}

// Tipos para imágenes
interface PlantImage {
  id?: number
  file?: File
  url: string
  serverUrl?: string
  thumbnailUrl?: string
  originalName: string
  isUploading?: boolean
  uploadFailed?: boolean
  isExisting?: boolean
  markedForDeletion?: boolean
}

// ── Plantillas ────────────────────────────────────────────────────────────────
const PLANTILLAS_DEFAULT: Plantilla[] = [
  {
    id: 'default-inst-mocoa',
    nombre: 'UNIP - Mocoa',
    tipo: 'institucion',
    campos: {
      institutionCode: 'Institución Universitaria del Putumayo (UNIP)',
      institutionID: '800247940',
      collectionCode: 'HEAA',
      collectionID: '',
      basisOfRecord: 'preservedSpecimen',
      type: 'physicalObject',
    },
  },
  {
    id: 'default-inst-sibundoy',
    nombre: 'UNIP - Sibundoy',
    tipo: 'institucion',
    campos: {
      institutionCode: 'Institución Universitaria del Putumayo (UNIP)',
      institutionID: '800247940',
      collectionCode: 'HEAA',
      collectionID: '',
      basisOfRecord: 'preservedSpecimen',
      type: 'physicalObject',
    },
  },
  {
    id: 'default-ubic-mocoa',
    nombre: 'Putumayo - Mocoa',
    tipo: 'ubicacion',
    campos: { country: 'Colombia', stateProvince: 'Putumayo', county: 'Mocoa' },
  },
  {
    id: 'default-ubic-sibundoy',
    nombre: 'Putumayo - Sibundoy',
    tipo: 'ubicacion',
    campos: { country: 'Colombia', stateProvince: 'Putumayo', county: 'Sibundoy' },
  },
]

const LS_KEY = 'heaa_plantillas_v1'
const loadPlantillas = (): Plantilla[] => {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : PLANTILLAS_DEFAULT
  } catch { return PLANTILLAS_DEFAULT }
}
const savePlantillas = (list: Plantilla[]) => {
  localStorage.setItem(LS_KEY, JSON.stringify(list))
}

// ── PlantillaDropdown ─────────────────────────────────────────────────────────
function PlantillaDropdown({
  tipo, plantillas: list, open, onToggle, onApply, onNew, onEdit, onDelete
}: {
  tipo: TipoPlantilla
  plantillas: Plantilla[]
  open: boolean
  onToggle: () => void
  onApply: (p: Plantilla) => void
  onNew: () => void
  onEdit: (p: Plantilla) => void
  onDelete: (id: string) => void
}) {
  const items = list.filter(p => p.tipo === tipo)
  return (
    <div className="relative">
      <Button type="button" variant="outline" size="sm" onClick={onToggle}>
        <LayoutTemplate className="mr-2 h-4 w-4" />Plantillas<ChevronDown className="ml-1 h-3 w-3" />
      </Button>
      {open && (
        <div className="absolute right-0 top-9 z-50 w-64 rounded-md border bg-background shadow-lg">
          <div className="flex items-center justify-between px-3 pt-2 pb-1 border-b">
            <span className="text-xs font-medium text-muted-foreground">Plantillas guardadas</span>
            <button type="button" onClick={onNew}
              className="flex items-center gap-1 text-xs text-primary hover:underline">
              <Plus className="h-3 w-3" />Nueva
            </button>
          </div>
          {items.length === 0 && (
            <p className="px-3 py-3 text-xs text-muted-foreground text-center">Sin plantillas. Crea una con "+ Nueva".</p>
          )}
          {items.map(p => (
            <div key={p.id} className="flex items-center gap-1 px-2 py-1.5 hover:bg-muted group">
              <button type="button" className="flex-1 text-left text-sm px-1 truncate" onClick={() => onApply(p)}>
                {p.nombre}
              </button>
              <button type="button" onClick={() => onEdit(p)} title="Editar"
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-primary transition-opacity">
                <Pencil className="h-3 w-3" />
              </button>
              <button type="button" onClick={() => onDelete(p.id)} title="Eliminar"
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-opacity">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── PlantillaModal ────────────────────────────────────────────────────────────
function PlantillaModal({
  plantillaModal, plantillaForm, setPlantillaForm, setPlantillaModal, onSave,
  camposInstitucion, camposUbicacion,
}: {
  plantillaModal: { tipo: TipoPlantilla; editing: Plantilla | null } | null
  plantillaForm: { nombre: string; campos: Record<string, string> }
  setPlantillaForm: React.Dispatch<React.SetStateAction<{ nombre: string; campos: Record<string, string> }>>
  setPlantillaModal: (v: null) => void
  onSave: () => void
  camposInstitucion: { key: string; label: string; placeholder: string }[]
  camposUbicacion:   { key: string; label: string; placeholder: string }[]
}) {
  if (!plantillaModal) return null
  const campos = plantillaModal.tipo === 'institucion' ? camposInstitucion : camposUbicacion
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {plantillaModal.editing ? 'Editar plantilla' : 'Nueva plantilla'}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({plantillaModal.tipo === 'institucion' ? 'Institución' : 'Ubicación'})
            </span>
          </h2>
          <Button type="button" variant="ghost" size="icon" onClick={() => setPlantillaModal(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          <div className="space-y-1">
            <Label className="text-xs font-medium">Nombre de la plantilla *</Label>
            <Input
              placeholder="Ej. UNIP - Mocoa"
              value={plantillaForm.nombre}
              onChange={e => setPlantillaForm(p => ({ ...p, nombre: e.target.value }))}
            />
          </div>
          {campos.map(c => (
            <div key={c.key} className="space-y-1">
              <Label className="text-xs font-medium">{c.label}</Label>
              <Input
                placeholder={c.placeholder}
                value={plantillaForm.campos[c.key] || ''}
                onChange={e => setPlantillaForm(p => ({ ...p, campos: { ...p.campos, [c.key]: e.target.value } }))}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => setPlantillaModal(null)}>Cancelar</Button>
          <Button type="button" onClick={onSave} disabled={!plantillaForm.nombre.trim()}>
            <Save className="mr-2 h-4 w-4" />{plantillaModal.editing ? 'Guardar cambios' : 'Crear plantilla'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function EditarPlantaPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const plantId = Number(params.id)

  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [currentTab, setCurrentTab] = useState("registro")
  const [uploadedImages, setUploadedImages] = useState<PlantImage[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [currentStatus, setCurrentStatus] = useState('draft')

  // ── Features de asistencia ────────────────────────────────────────────────
  const [gbifLoading, setGbifLoading] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)

  // ── Plantillas ────────────────────────────────────────────────────────────
  const [plantillas, setPlantillas] = useState<Plantilla[]>([])
  const [plantillaMenu, setPlantillaMenu] = useState<TipoPlantilla | null>(null)
  const [plantillaModal, setPlantillaModal] = useState<{ tipo: TipoPlantilla; editing: Plantilla | null } | null>(null)
  const [plantillaForm, setPlantillaForm] = useState<{ nombre: string; campos: Record<string, string> }>({ nombre: '', campos: {} })

  useEffect(() => { setPlantillas(loadPlantillas()) }, [])

  const CAMPOS_INSTITUCION = [
    { key: 'institutionCode', label: 'Nombre de la institución', placeholder: 'Institución Universitaria del Putumayo (UNIP)' },
    { key: 'institutionID',   label: 'NIT / ID institución',     placeholder: '800247940' },
    { key: 'collectionCode',  label: 'Código de la colección',   placeholder: 'HEAA' },
    { key: 'collectionID',    label: 'ID colección (GRSciColl)', placeholder: 'Opcional' },
  ]
  const CAMPOS_UBICACION = [
    { key: 'country',       label: 'País',         placeholder: 'Colombia' },
    { key: 'stateProvince', label: 'Departamento', placeholder: 'Putumayo' },
    { key: 'county',        label: 'Municipio',    placeholder: 'Mocoa' },
  ]

  const openNewPlantilla = (tipo: TipoPlantilla) => {
    const camposDefault: Record<string, string> = {}
    const lista = tipo === 'institucion' ? CAMPOS_INSTITUCION : CAMPOS_UBICACION
    lista.forEach(c => { camposDefault[c.key] = '' })
    setPlantillaForm({ nombre: '', campos: camposDefault })
    setPlantillaModal({ tipo, editing: null })
    setPlantillaMenu(null)
  }
  const openEditPlantilla = (p: Plantilla) => {
    setPlantillaForm({ nombre: p.nombre, campos: { ...p.campos } })
    setPlantillaModal({ tipo: p.tipo, editing: p })
    setPlantillaMenu(null)
  }
  const savePlantillaForm = () => {
    if (!plantillaModal || !plantillaForm.nombre.trim()) return
    const updated = plantillaModal.editing
      ? plantillas.map(p => p.id === plantillaModal.editing!.id
          ? { ...p, nombre: plantillaForm.nombre, campos: plantillaForm.campos }
          : p)
      : [...plantillas, { id: crypto.randomUUID(), nombre: plantillaForm.nombre, tipo: plantillaModal.tipo, campos: plantillaForm.campos }]
    setPlantillas(updated)
    savePlantillas(updated)
    setPlantillaModal(null)
    toast({ title: plantillaModal.editing ? 'Plantilla actualizada' : 'Plantilla creada' })
  }
  const deletePlantilla = (id: string) => {
    const updated = plantillas.filter(p => p.id !== id)
    setPlantillas(updated)
    savePlantillas(updated)
    toast({ title: 'Plantilla eliminada' })
  }
  const applyPlantilla = (p: Plantilla) => {
    setFormData(prev => ({ ...prev, ...p.campos }))
    setPlantillaMenu(null)
    toast({ title: `Plantilla "${p.nombre}" aplicada`, description: 'Revisa y ajusta los campos pre-llenados.' })
  }

  // ── Autocompletado ────────────────────────────────────────────────────────
  const [acSuggestions, setAcSuggestions] = useState<Record<string, AutocompleteItem[]>>({})
  const [acOpen, setAcOpen] = useState<Record<string, boolean>>({})
  const acTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const handleAutocomplete = (field: string, value: string, acType: 'all' | 'scientific' | 'common' | 'family') => {
    handleInputChange(field, value)
    clearTimeout(acTimers.current[field])
    if (value.length < 2) { setAcSuggestions(p => ({ ...p, [field]: [] })); return }
    acTimers.current[field] = setTimeout(async () => {
      try {
        const res = await apiService.getAutocomplete(value, acType)
        if (res.success && res.data) {
          setAcSuggestions(p => ({ ...p, [field]: res.data! }))
          setAcOpen(p => ({ ...p, [field]: true }))
        }
      } catch {}
    }, 300)
  }
  const pickSuggestion = (field: string, value: string) => {
    handleInputChange(field, value)
    setAcOpen(p => ({ ...p, [field]: false }))
    setAcSuggestions(p => ({ ...p, [field]: [] }))
  }

  // ── GBIF ──────────────────────────────────────────────────────────────────
  const fetchGbifTaxonomy = async () => {
    const name = formData.scientificName.trim()
    if (!name) return
    setGbifLoading(true)
    try {
      const res = await fetch(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(name)}&kingdom=Plantae`, {
        headers: { 'Accept': 'application/json' }
      })
      if (!res.ok) throw new Error(`GBIF respondió ${res.status}`)
      const data = await res.json()
      if (data.matchType === 'NONE') {
        toast({ title: 'No encontrado en GBIF', description: `"${name}" no arrojó resultados. Verifica el nombre.`, variant: 'destructive' })
        return
      }
      const authorship = (data.scientificName && data.canonicalName)
        ? data.scientificName.replace(data.canonicalName, '').trim()
        : ''
      const epithet = data.canonicalName?.split(' ')[1] || data.species?.split(' ')[1] || ''
      const rank = data.rank?.toLowerCase() || ''
      setFormData(prev => ({
        ...prev,
        family:                   data.family   || prev.family,
        orderName:                data.order    || prev.orderName,
        class:                    data.class    || prev.class,
        phylum:                   data.phylum   || prev.phylum,
        kingdom:                  data.kingdom  || prev.kingdom,
        genus:                    data.genus    || prev.genus,
        specificEpithet:          epithet       || prev.specificEpithet,
        scientificNameAuthorship: authorship    || prev.scientificNameAuthorship,
        taxonRank:                rank          || prev.taxonRank,
      }))
      toast({ title: '✅ Taxonomía completada desde GBIF', description: `Familia: ${data.family} · Confianza: ${data.confidence}%` })
    } catch (err: any) {
      toast({ title: 'Error al consultar GBIF', description: err.message || 'Verifica tu conexión a internet.', variant: 'destructive' })
    } finally {
      setGbifLoading(false)
    }
  }

  // ── GPS ───────────────────────────────────────────────────────────────────
  const fetchGPS = () => {
    if (!navigator.geolocation) {
      toast({ title: 'GPS no disponible', description: 'Tu dispositivo no soporta geolocalización.', variant: 'destructive' })
      return
    }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({
          ...prev,
          decimalLatitude:  pos.coords.latitude.toFixed(6),
          decimalLongitude: pos.coords.longitude.toFixed(6),
        }))
        toast({ title: '📍 Coordenadas obtenidas', description: `Lat: ${pos.coords.latitude.toFixed(6)} · Lon: ${pos.coords.longitude.toFixed(6)}` })
        setGpsLoading(false)
      },
      () => {
        toast({ title: 'No se pudo obtener ubicación', description: 'Permite el acceso a la ubicación en tu navegador.', variant: 'destructive' })
        setGpsLoading(false)
      }
    )
  }

  // ── Estado del formulario (camelCase — igual que nueva/page.tsx) ───────────
  const [formData, setFormData] = useState({
    // Cols 1-3: Registro básico
    occurrenceID: '',
    basisOfRecord: '',
    type: '',
    // Cols 4-7: Institución
    institutionCode: 'Institución Universitaria del Putumayo (UNIP)',
    institutionID: '800.247.940',
    collectionCode: 'HEAA',
    collectionID: '',
    // Cols 8-10: Espécimen
    catalogNumber: '',
    recordNumber: '',
    recordedBy: '',
    // Cols 11-20: Colección
    organismQuantity: '',
    organismQuantityType: '',
    lifeStage: '',
    preparation: '',
    disposition: '',
    samplingProtocol: '',
    eventDate: '',
    habitat: '',
    fieldNumber: '',
    fieldNotes: '',
    // Cols 21-31: Ubicación
    country: 'Colombia',
    stateProvince: '',
    county: '',
    municipality: '',
    locality: '',
    minimumElevationInMeters: '',
    decimalLatitudeSexagesimal: '',
    decimalLatitude: '',
    decimalLongitudeSexagesimal: '',
    decimalLongitude: '',
    geodetic: 'WGS84',
    // Cols 32-35: Determinación
    identifiedBy: '',
    dateIdentified: '',
    updatedBy: '',
    dateUpdated: '',
    // Extra: Proyecto
    project: '',
    // Cols 36-50: Taxonomía
    scientificName: '',
    scientificNameAuthorship: '',
    kingdom: 'Plantae',
    phylum: 'Magnoliophyta',
    class: 'Equisetopsida',
    orderName: '',
    family: '',
    subfamily: '',
    genus: '',
    subgenus: '',
    specificEpithet: '',
    infraspecificEpithet: '',
    taxonRank: 'species',
    vernacularName: '',
    taxonRemarks: '',
    // Características morfológicas
    description: '',
    plantHeight: '',
    plantHabit: '',
    flowerColor: '',
    fruitColor: '',
    leafCharacteristics: '',
    uses: '',
    additionalRemarks: '',
    // Col 51: Imágenes
    photoRecord: '',
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // ── Normalización de fechas ───────────────────────────────────────────────
  const toDateStr = (v: any): string => {
    if (!v) return ''
    const s = String(v)
    const dateOnly = s.includes('T') ? s.split('T')[0] : s
    return /^\d{4}-\d{2}-\d{2}$/.test(dateOnly) ? dateOnly : ''
  }

  // ── Cargar datos de la planta ─────────────────────────────────────────────
  useEffect(() => {
    if (!plantId) return

    const loadPlantData = async () => {
      setIsLoadingData(true)
      try {
        const response = await apiService.getPlantById(plantId)
        if (response.success && response.data) {
          const plant = response.data

          setCurrentStatus(plant.status || 'draft')

          // Mapear snake_case DB → camelCase formData (igual que nueva/page.tsx)
          const toStr = (v: any) => (v != null ? String(v) : '')

          setFormData({
            occurrenceID:               toStr(plant.occurrence_id),
            basisOfRecord:              toStr(plant.basis_of_record),
            type:                       toStr(plant.record_type),
            institutionCode:            toStr(plant.institution_code)  || 'Institución Universitaria del Putumayo (UNIP)',
            institutionID:              toStr(plant.institution_id)    || '800.247.940',
            collectionCode:             toStr(plant.collection_code)   || 'HEAA',
            collectionID:               toStr(plant.collection_id),
            catalogNumber:              toStr(plant.catalog_number),
            recordNumber:               toStr(plant.record_number),
            recordedBy:                 toStr(plant.recorded_by),
            organismQuantity:           toStr(plant.organism_quantity),
            organismQuantityType:       toStr(plant.organism_quantity_type),
            lifeStage:                  toStr(plant.life_stage),
            preparation:                toStr(plant.preparations),
            disposition:                toStr(plant.disposition),
            samplingProtocol:           toStr(plant.sampling_protocol),
            eventDate:                  toDateStr(plant.event_date),
            habitat:                    toStr(plant.habitat),
            fieldNumber:                toStr(plant.field_number),
            fieldNotes:                 toStr(plant.field_notes),
            country:                    toStr(plant.country)           || 'Colombia',
            stateProvince:              toStr(plant.state_province),
            county:                     toStr(plant.county),
            municipality:               toStr(plant.municipality),
            locality:                   toStr(plant.locality),
            minimumElevationInMeters:   plant.minimum_elevation_in_meters != null ? String(plant.minimum_elevation_in_meters) : '',
            decimalLatitudeSexagesimal: toStr(plant.decimal_latitude_sexagesimal),
            decimalLatitude:            plant.decimal_latitude  != null ? String(plant.decimal_latitude)  : '',
            decimalLongitudeSexagesimal:toStr(plant.decimal_longitude_sexagesimal),
            decimalLongitude:           plant.decimal_longitude != null ? String(plant.decimal_longitude) : '',
            geodetic:                   toStr(plant.geodetic)          || 'WGS84',
            identifiedBy:               toStr(plant.identified_by),
            dateIdentified:             toDateStr(plant.date_identified),
            updatedBy:                  toStr(plant.updated_by),
            dateUpdated:                toDateStr(plant.date_updated),
            project:                    toStr(plant.project),
            scientificName:             toStr(plant.scientific_name),
            scientificNameAuthorship:   toStr(plant.scientific_name_authorship),
            kingdom:                    toStr(plant.kingdom)           || 'Plantae',
            phylum:                     toStr(plant.phylum)            || 'Magnoliophyta',
            class:                      toStr(plant.class_name)        || 'Equisetopsida',
            orderName:                  toStr(plant.order_name),
            family:                     toStr(plant.family),
            subfamily:                  toStr(plant.subfamily),
            genus:                      toStr(plant.genus),
            subgenus:                   toStr(plant.subgenus),
            specificEpithet:            toStr(plant.specific_epithet),
            infraspecificEpithet:       toStr(plant.infraspecific_epithet),
            taxonRank:                  toStr(plant.taxon_rank)        || 'species',
            vernacularName:             toStr(plant.vernacular_name),
            taxonRemarks:               toStr(plant.taxon_remarks),
            description:                toStr(plant.description),
            plantHeight:                plant.height_min != null ? String(plant.height_min) : '',
            plantHabit:                 toStr(plant.plant_habit),
            flowerColor:                toStr(plant.flower_color),
            fruitColor:                 toStr(plant.fruit_color),
            leafCharacteristics:        toStr(plant.leaf_characteristics),
            uses:                       toStr(plant.uses),
            additionalRemarks:          toStr(plant.observations),
            photoRecord:                toStr(plant.photo_record),
          })

          // Cargar imágenes existentes
          if (plant.images && plant.images.length > 0) {
            const existingImages: PlantImage[] = plant.images.map((img: any) => ({
              id: img.id,
              url: img.thumbnailUrl || img.url,
              serverUrl: img.url,
              thumbnailUrl: img.thumbnailUrl,
              originalName: img.caption || `Imagen ${img.id}`,
              isExisting: true,
              markedForDeletion: false,
            }))
            setUploadedImages(existingImages)
          }
        } else {
          toast({ title: 'Error', description: 'No se pudo cargar la planta', variant: 'destructive' })
          router.push('/admin/plantas')
        }
      } catch (error: any) {
        toast({ title: 'Error al cargar planta', description: error.message, variant: 'destructive' })
        router.push('/admin/plantas')
      } finally {
        setIsLoadingData(false)
      }
    }

    loadPlantData()
  }, [plantId])

  // Cleanup URLs blob al desmontar
  useEffect(() => {
    return () => {
      uploadedImages.forEach(image => {
        if (image.file && image.url.startsWith('blob:')) URL.revokeObjectURL(image.url)
      })
    }
  }, [])

  // ── Manejo de imágenes ────────────────────────────────────────────────────
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) handleFiles(Array.from(files))
    if (event.target) event.target.value = ''
  }

  const handleFiles = async (files: File[]) => {
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      const maxSize = 10 * 1024 * 1024
      if (!validTypes.includes(file.type)) {
        toast({ title: "Tipo de archivo no válido", description: `${file.name} no es una imagen válida`, variant: "destructive" })
        return false
      }
      if (file.size > maxSize) {
        toast({ title: "Archivo muy grande", description: `${file.name} supera los 10MB`, variant: "destructive" })
        return false
      }
      return true
    })
    if (validFiles.length === 0) return

    const newImages: PlantImage[] = validFiles.map(file => ({
      file,
      url: URL.createObjectURL(file),
      originalName: file.name,
      isUploading: false,
      isExisting: false,
    }))
    setUploadedImages(prev => [...prev, ...newImages])

    for (const file of validFiles) {
      setUploadedImages(prev => prev.map(img => img.file === file ? { ...img, isUploading: true } : img))
      try {
        const response = await apiService.uploadImage(file, { entityType: 'plant', entityId: plantId, isTemporary: false })
        if (response.success && response.data) {
          setUploadedImages(prev => prev.map(img =>
            img.file === file ? { ...img, id: response.data!.id, serverUrl: response.data!.url, thumbnailUrl: response.data!.thumbnailUrl, isUploading: false } : img
          ))
          toast({ title: "Imagen subida", description: `${file.name} se subió correctamente` })
        } else {
          setUploadedImages(prev => prev.map(img =>
            img.file === file ? { ...img, isUploading: false, uploadFailed: true } : img
          ))
          toast({ title: "Error al subir imagen", description: response.error || "No se pudo subir la imagen", variant: "destructive" })
        }
      } catch (error) {
        setUploadedImages(prev => prev.map(img =>
          img.file === file ? { ...img, isUploading: false, uploadFailed: true } : img
        ))
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true) }
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false) }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false)
    handleFiles(Array.from(e.dataTransfer.files))
  }

  const removeImage = (index: number) => {
    setUploadedImages(prev => {
      const image = prev[index]
      if (image.isExisting) {
        return prev.map((img, i) => i === index ? { ...img, markedForDeletion: true } : img)
      }
      if (image.file) URL.revokeObjectURL(image.url)
      return prev.filter((_, i) => i !== index)
    })
  }

  const restoreImage = (index: number) => {
    setUploadedImages(prev => prev.map((img, i) => i === index ? { ...img, markedForDeletion: false } : img))
  }

  // ── Preparar datos para enviar (camelCase → snake_case) ───────────────────
  const prepareCommonData = () => {
    const dateToNull = (dateStr: string) => {
      if (!dateStr || dateStr.trim() === '') return null
      return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr
    }
    const numToNull = (numStr: string) => (numStr && numStr.trim() !== '' ? numStr : null)

    return {
      scientific_name: formData.scientificName || null,
      scientific_name_authorship: formData.scientificNameAuthorship || null,
      common_name: formData.vernacularName || null,
      vernacular_name: formData.vernacularName || null,
      family: formData.family || null,
      genus: formData.genus || null,
      specific_epithet: formData.specificEpithet || null,
      infraspecific_epithet: formData.infraspecificEpithet || null,
      taxon_rank: formData.taxonRank || 'species',
      taxon_remarks: formData.taxonRemarks || null,
      taxonomic_status: 'accepted',
      kingdom: formData.kingdom || 'Plantae',
      phylum: formData.phylum || 'Magnoliophyta',
      class_name: formData.class || 'Equisetopsida',
      order_name: formData.orderName || null,
      subfamily: formData.subfamily || null,
      subgenus: formData.subgenus || null,
      catalog_number: formData.catalogNumber || null,
      record_number: formData.recordNumber || null,
      identified_by: formData.identifiedBy || null,
      date_identified: dateToNull(formData.dateIdentified),
      determination_date: dateToNull(formData.dateIdentified),
      determined_by: formData.identifiedBy || null,
      updated_by: formData.updatedBy || null,
      date_updated: dateToNull(formData.dateUpdated),
      type_status: 'none',
      institution_code: formData.institutionCode || 'Institución Universitaria del Putumayo (UNIP)',
      institution_id: formData.institutionID || '800.247.940',
      collection_code: formData.collectionCode || 'HEAA',
      collection_id: formData.collectionID || 'HEAA-ITP',
      geodetic: formData.geodetic || 'WGS84',
      occurrence_id: formData.occurrenceID || null,
      basis_of_record: formData.basisOfRecord || null,
      record_type: formData.type || null,
      recorded_by: formData.recordedBy || null,
      additional_collectors: null,
      event_date: dateToNull(formData.eventDate),
      organism_quantity: formData.organismQuantity || null,
      organism_quantity_type: formData.organismQuantityType || null,
      life_stage: formData.lifeStage || null,
      preparations: formData.preparation || null,
      disposition: formData.disposition || null,
      sampling_protocol: formData.samplingProtocol || null,
      field_number: formData.fieldNumber || null,
      field_notes: formData.fieldNotes || null,
      country: formData.country || 'Colombia',
      state_province: formData.stateProvince || null,
      county: formData.county || null,
      municipality: formData.municipality || null,
      locality: formData.locality || null,
      decimal_latitude: numToNull(formData.decimalLatitude),
      decimal_longitude: numToNull(formData.decimalLongitude),
      decimal_latitude_sexagesimal: formData.decimalLatitudeSexagesimal || null,
      decimal_longitude_sexagesimal: formData.decimalLongitudeSexagesimal || null,
      minimum_elevation_in_meters: numToNull(formData.minimumElevationInMeters),
      coordinate_uncertainty: null,
      georeferenced_by: null,
      habitat: formData.habitat || null,
      plant_habit: formData.plantHabit || null,
      height_min: numToNull(formData.plantHeight),
      height_max: null,
      description: formData.description || null,
      distinguishing_features: formData.leafCharacteristics || null,
      flower_color: formData.flowerColor || null,
      fruit_color: formData.fruitColor || null,
      leaf_characteristics: formData.leafCharacteristics || null,
      uses: formData.uses || null,
      observations: formData.additionalRemarks || null,
      notes: formData.fieldNotes || null,
      project: formData.project || null,
      photo_record: formData.photoRecord || null,
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent, newStatus?: string) => {
    e.preventDefault()
    if (isLoading) return
    setIsLoading(true)

    try {
      if (!apiService.isAuthenticated()) {
        toast({ title: "Sesión requerida", description: "Debes iniciar sesión como administrador.", variant: "destructive" })
        router.push('/login')
        return
      }

      if (uploadedImages.some(img => img.isUploading)) {
        toast({ title: "Espera un momento", description: "Hay imágenes subiendo a Cloudinary. Por favor espera.", variant: "destructive" })
        return
      }

      const plantData: any = prepareCommonData()
      plantData.status = newStatus || currentStatus

      // Incluir imágenes nuevas ya subidas
      const newImages = uploadedImages.filter(img => !img.isExisting && img.id && !img.isUploading)
      if (newImages.length > 0) {
        plantData.localImages = newImages.map(img => ({
          id: img.id,
          url: img.serverUrl || img.url,
          thumbnailUrl: img.thumbnailUrl,
          filename: img.originalName,
          originalName: img.originalName,
        }))
      }

      // Imágenes existentes marcadas para eliminar
      const toDelete = uploadedImages.filter(img => img.isExisting && img.markedForDeletion && img.id)
      if (toDelete.length > 0) {
        plantData.deleteImageIds = toDelete.map(img => img.id)
      }

      const response = await apiService.updatePlant(plantId, plantData)

      if (response.success) {
        toast({ title: "¡Espécimen actualizado!", description: "La información fue guardada correctamente." })
        router.push('/admin/plantas')
      } else {
        throw new Error(response.error || 'Error al actualizar el espécimen')
      }
    } catch (error: any) {
      toast({ title: "Error al guardar", description: error.message || "Hubo un error al guardar la información", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  // ── Render de carga ───────────────────────────────────────────────────────
  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Cargando datos del espécimen...</p>
        </div>
      </div>
    )
  }

  // ── Render principal ──────────────────────────────────────────────────────
  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Espécimen</h1>
          <p className="text-muted-foreground">
            {formData.scientificName
              ? <><em>{formData.scientificName}</em> · ID {plantId}</>
              : `Espécimen ID ${plantId}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/plantas"><ArrowLeft className="mr-2 h-4 w-4" />Volver</Link>
          </Button>
        </div>
      </div>

      {/* Modal gestión plantillas */}
      <PlantillaModal
        plantillaModal={plantillaModal}
        plantillaForm={plantillaForm}
        setPlantillaForm={setPlantillaForm}
        setPlantillaModal={setPlantillaModal}
        onSave={savePlantillaForm}
        camposInstitucion={CAMPOS_INSTITUCION}
        camposUbicacion={CAMPOS_UBICACION}
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">

          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 w-full">
            {[
              { value: 'registro',        label: 'Registro' },
              { value: 'coleccion',       label: 'Colección' },
              { value: 'ubicacion',       label: 'Ubicación' },
              { value: 'taxonomia',       label: 'Taxonomía' },
              { value: 'caracteristicas', label: 'Características' },
              { value: 'imagenes',        label: 'Imágenes' },
            ].map(({ value, label }) => (
              <TabsTrigger key={value} value={value}>{label}</TabsTrigger>
            ))}
          </TabsList>

          {/* ── TAB 1: REGISTRO ─────────────────────────────────────────── */}
          <TabsContent value="registro" className="space-y-6 mt-6">

            {/* cols 1-3: DwC básico */}
            <Card>
              <CardHeader>
                <CardTitle>Información de Registro</CardTitle>
                <CardDescription>Datos básicos del registro biológico (Darwin Core)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="occurrenceID">ID del registro biológico</Label>
                    <Input id="occurrenceID" placeholder="Ej. AO4604"
                      value={formData.occurrenceID} onChange={e => handleInputChange('occurrenceID', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="basisOfRecord">Base del registro</Label>
                    <Select value={formData.basisOfRecord} onValueChange={v => handleInputChange('basisOfRecord', v)}>
                      <SelectTrigger id="basisOfRecord"><SelectValue placeholder="Selecciona una opción" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="preservedSpecimen">Espécimen preservado</SelectItem>
                        <SelectItem value="livingSpecimen">Espécimen vivo</SelectItem>
                        <SelectItem value="fossilSpecimen">Espécimen fósil</SelectItem>
                        <SelectItem value="humanObservation">Observación humana</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select value={formData.type} onValueChange={v => handleInputChange('type', v)}>
                      <SelectTrigger id="type"><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="physicalObject">Objeto físico</SelectItem>
                        <SelectItem value="event">Evento</SelectItem>
                        <SelectItem value="location">Localidad</SelectItem>
                        <SelectItem value="identification">Identificación</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* cols 4-7: Institución */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>Información Institucional</CardTitle>
                    <CardDescription>Datos de la institución y la colección</CardDescription>
                  </div>
                  <PlantillaDropdown
                    tipo="institucion"
                    plantillas={plantillas}
                    open={plantillaMenu === 'institucion'}
                    onToggle={() => setPlantillaMenu(p => p === 'institucion' ? null : 'institucion')}
                    onApply={applyPlantilla}
                    onNew={() => openNewPlantilla('institucion')}
                    onEdit={openEditPlantilla}
                    onDelete={deletePlantilla}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="institutionCode">Código de la institución</Label>
                    <Input id="institutionCode" value={formData.institutionCode}
                      onChange={e => handleInputChange('institutionCode', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="institutionID">ID de la institución</Label>
                    <Input id="institutionID" value={formData.institutionID}
                      onChange={e => handleInputChange('institutionID', e.target.value)} />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="collectionCode">Código de la colección</Label>
                    <Input id="collectionCode" value={formData.collectionCode}
                      onChange={e => handleInputChange('collectionCode', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="collectionID">ID de la colección</Label>
                    <Input id="collectionID" placeholder="Ej. HEAA-ITP"
                      value={formData.collectionID} onChange={e => handleInputChange('collectionID', e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* cols 8-10: Espécimen */}
            <Card>
              <CardHeader>
                <CardTitle>Datos del Espécimen</CardTitle>
                <CardDescription>Número de catálogo, registro y colector</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="catalogNumber">Número de catálogo *</Label>
                    <Input id="catalogNumber" placeholder="Ej. 000233" required
                      value={formData.catalogNumber} onChange={e => handleInputChange('catalogNumber', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recordNumber">Número de registro</Label>
                    <Input id="recordNumber" placeholder="Ej. AO4604"
                      value={formData.recordNumber} onChange={e => handleInputChange('recordNumber', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recordedBy">Registrado por *</Label>
                    <Input id="recordedBy" placeholder="Ej. Andrés Orejuela / Guerly León" required
                      value={formData.recordedBy} onChange={e => handleInputChange('recordedBy', e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estado actual */}
            <Card>
              <CardHeader>
                <CardTitle>Estado del Espécimen</CardTitle>
                <CardDescription>Visibilidad del registro en el catálogo público</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="status">Estado</Label>
                    <Select value={currentStatus} onValueChange={setCurrentStatus}>
                      <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Borrador</SelectItem>
                        <SelectItem value="review">En revisión</SelectItem>
                        <SelectItem value="published">Publicado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

          </TabsContent>

          {/* ── TAB 2: COLECCIÓN ─────────────────────────────────────────── */}
          <TabsContent value="coleccion" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Información de Colección</CardTitle>
                <CardDescription>Datos sobre la recolección y preparación del espécimen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="organismQuantity">Cantidad del organismo</Label>
                    <Input id="organismQuantity" placeholder="Cantidad"
                      value={formData.organismQuantity} onChange={e => handleInputChange('organismQuantity', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="organismQuantityType">Tipo de cantidad</Label>
                    <Input id="organismQuantityType" placeholder="Ej. Individuos, muestras"
                      value={formData.organismQuantityType} onChange={e => handleInputChange('organismQuantityType', e.target.value)} />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="lifeStage">Etapa de vida</Label>
                    <Select value={formData.lifeStage} onValueChange={v => handleInputChange('lifeStage', v)}>
                      <SelectTrigger id="lifeStage"><SelectValue placeholder="Selecciona una etapa" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="floracion">Floración</SelectItem>
                        <SelectItem value="fructificacion">Fructificación</SelectItem>
                        <SelectItem value="vegetativo">Vegetativo</SelectItem>
                        <SelectItem value="semilla">Semilla</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preparation">Preparaciones</Label>
                    <Input id="preparation" placeholder="Ej. Exsicado botánico"
                      value={formData.preparation} onChange={e => handleInputChange('preparation', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="disposition">Disposición</Label>
                    <Select value={formData.disposition} onValueChange={v => handleInputChange('disposition', v)}>
                      <SelectTrigger id="disposition"><SelectValue placeholder="Selecciona disposición" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enColeccion">En colección</SelectItem>
                        <SelectItem value="prestamo">En préstamo</SelectItem>
                        <SelectItem value="perdido">Perdido</SelectItem>
                        <SelectItem value="destruido">Destruido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="samplingProtocol">Protocolo de muestreo</Label>
                    <Input id="samplingProtocol" placeholder="Ej. Colección general"
                      value={formData.samplingProtocol} onChange={e => handleInputChange('samplingProtocol', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="eventDate">Fecha del evento</Label>
                    <Input id="eventDate" type="date"
                      value={formData.eventDate} onChange={e => handleInputChange('eventDate', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fieldNumber">Número de campo</Label>
                    <Input id="fieldNumber" placeholder="Ej. AO4604"
                      value={formData.fieldNumber} onChange={e => handleInputChange('fieldNumber', e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="habitat">Hábitat</Label>
                  <Input id="habitat" placeholder="Descripción del hábitat donde se colectó el espécimen"
                    value={formData.habitat} onChange={e => handleInputChange('habitat', e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fieldNotes">Notas de campo</Label>
                  <Textarea id="fieldNotes" rows={3}
                    placeholder="Ej. Árbol 5 m. Cáliz verde, corola blanca, anteras amarillas."
                    value={formData.fieldNotes} onChange={e => handleInputChange('fieldNotes', e.target.value)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── TAB 3: UBICACIÓN ─────────────────────────────────────────── */}
          <TabsContent value="ubicacion" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>Ubicación Geográfica</CardTitle>
                    <CardDescription>Información sobre la localidad donde se recolectó el espécimen</CardDescription>
                  </div>
                  <PlantillaDropdown
                    tipo="ubicacion"
                    plantillas={plantillas}
                    open={plantillaMenu === 'ubicacion'}
                    onToggle={() => setPlantillaMenu(p => p === 'ubicacion' ? null : 'ubicacion')}
                    onApply={applyPlantilla}
                    onNew={() => openNewPlantilla('ubicacion')}
                    onEdit={openEditPlantilla}
                    onDelete={deletePlantilla}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="country">País</Label>
                    <Input id="country" placeholder="Ej. Colombia"
                      value={formData.country} onChange={e => handleInputChange('country', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stateProvince">Departamento</Label>
                    <Input id="stateProvince" placeholder="Ej. Putumayo"
                      value={formData.stateProvince} onChange={e => handleInputChange('stateProvince', e.target.value)} />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="county">Municipio</Label>
                    <Input id="county" placeholder="Ej. Mocoa"
                      value={formData.county} onChange={e => handleInputChange('county', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="municipality">Centro poblado / Cabecera municipal</Label>
                    <Input id="municipality" placeholder="Ej. Las Mesas"
                      value={formData.municipality} onChange={e => handleInputChange('municipality', e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="locality">Localidad *</Label>
                  <Textarea id="locality" rows={2} required
                    placeholder="Ej. Vía Mocoa - San Francisco, arriba de la vereda Las Mesas"
                    value={formData.locality} onChange={e => handleInputChange('locality', e.target.value)} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="minimumElevationInMeters">Elevación mínima (m.s.n.m.)</Label>
                    <Input id="minimumElevationInMeters" type="number" placeholder="Ej. 1300"
                      value={formData.minimumElevationInMeters} onChange={e => handleInputChange('minimumElevationInMeters', e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Coordenadas (decimal)</Label>
                    <Button type="button" variant="outline" size="sm" onClick={fetchGPS} disabled={gpsLoading}
                      title="Obtener coordenadas automáticamente desde tu dispositivo">
                      {gpsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                      {gpsLoading ? 'Obteniendo...' : 'Usar mi ubicación'}
                    </Button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="decimalLatitude" className="text-xs text-muted-foreground">Latitud decimal</Label>
   