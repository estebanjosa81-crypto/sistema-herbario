# plants — compressed

- **Qué hace:** CRUD completo del catálogo botánico con 53 campos Darwin Core. Búsqueda FULLTEXT, visualización en mapa Leaflet, gestión de imágenes via Cloudinary. El módulo más grande del sistema: 26 servicios.
- **Tablas:** `plants` (53 campos DwC) · `plant_images` · vistas SQL: `plants_with_main_image`, `featured_plants`
- **Endpoints:** `plants.getAll` · `plants.getById` · `plants.create` · `plants.update` · `plants.delete` · `plants.search` · `plants.advancedSearch` · `plants.getForMap` · `plants.export` · `plants.import` · `plants.uploadImage` · `plants.setMainImage` · (+12 más)
- **Archivos:** `controllers/plants/plantsController.js` (coordinador activo) · `controllers/plants/getAll.js` · `controllers/plants/getForMap.js` · `controllers/plants/exportData.js` (**exportación CSV**) · `routes/plants.js` (upload multipart) · `frontend/app/plantas/page.tsx` (catálogo público)
- **⚠️ Exportación CSV (`plants.export`):** `exportData.js` acepta los mismos filtros que `getAll.js`. Límite: 5000 filas. Devuelve `{csv, filename, count}` — el frontend crea un Blob y descarga. Sin auth requerida (datos públicos). 34 columnas DwC.
- **⚠️ Regla crítica:** `scientific_name` NOT NULL. `catalog_number` ÚNICO — verificar antes de INSERT. SIEMPRE nombres DwC: `specific_epithet` (≠ `species`), `recorded_by` (≠ `collector_name`), `event_date` (≠ `collection_date`), `state_province` (≠ `department`). Ver [[darwin-core-fields]].
- **⚠️ Update imágenes:** `plantsController.update` procesa imágenes SOLO si recibe `data.images = [{url, thumbnailUrl}]`. Cualquier otro formato (image_urls string, imageUrls string array) es ignorado. El frontend `editar/page.tsx` ya lo envía correctamente.
- **⚠️ getById retorna imágenes como `images[]`** (no `imagenes`, no `imageUrls`): `[{id, url, thumbnailUrl, caption, isMain}]`. El modal admin y el form de edición leen `plant.images`.
- **⚠️ Formulario editar (`editar/page.tsx`):** Estado interno usa snake_case DwC (`specific_epithet`, `catalog_number`, `state_province`, `locality`, `decimal_latitude`, `decimal_longitude`, `minimum_elevation_in_meters`, `event_date`, `plant_habit`). Los JSX inputs ya están corregidos. Tab `value="ubicacion"` tiene el contenido geográfico (anteriormente tenía `value="coleccion"` incorrecto).
- **⚠️ DwC — auditoría CERRADA (2026-06-02):** Todos los archivos del codebase usan nombres DwC correctos. Ver `current-state.md` para lista detallada.
- **Paginación inteligente en `app/plantas/page.tsx`** (implementado 2026-06-01): ≤100 → sin paginar. >100 → paginación automática `limit: 24`.

---

## Red de conexiones

- Flujo de creación + imagen: [[plant-upload-flow]]
- Impacto de cambios: [[plants-chain]]
- Reglas DwC: [[universal-constraints]] (#2, #3, #7, #9) · [[darwin-core-fields]]
- Roles que escriben: [[roles-map]] → admin + collector
- Tablas: [[db-tables-index]]
- Capa: [[backend]] · [[frontend]]
- Índice: [[modules-index]] · [[DAIMUZ]]
