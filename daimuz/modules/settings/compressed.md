# settings — compressed

- **Qué hace:** Configuración clave-valor del sistema. Públicas (nombre del herbario, descripción, colores) y privadas (credenciales Cloudinary). 8 servicios.
- **Tablas:** `settings` — columnas: `key_name` VARCHAR UNIQUE · `value` TEXT · `category` · `is_public` BOOLEAN ⚠️ NO son `setting_key`/`setting_value`
- **Endpoints:** `settings.getPublic` (sin auth) · `settings.getAll` · `settings.get` · `settings.update` · `settings.updateMultiple` · `settings.backup` · `settings.restore` · `settings.testCloudinary` · `settings.getSystemInfo`
- **Archivos:** `controllers/settings/settingsController.js` · `controllers/settings/getPublic.js` · `frontend/app/admin/configuracion/page.tsx`
- **⚠️ Regla crítica:** `settings.getPublic` es el ÚNICO servicio de settings sin token. Nunca exponer settings con `is_public=false` sin auth admin. Categorías de settings: general, uploads, auth, display, search, pagina, cloudinary, contact.
- **⚠️ Formato de `getPublic`:** Devuelve `{ ...flat_camelCase, _sections: {...} }`. Keys planas son camelCase con tipos casteados (`hero_stats_enabled` → `heroStatsEnabled: false`). `_sections` es objeto anidado — NUNCA renderizar en React → crash. Admin usa `settings.getAll` (array plano).
- **⚠️ PITFALL CRÍTICO — type en updateMultiple:** `settings.updateMultiple` hace UPSERT con `type='string'` hardcodeado. Si el setting NO existía antes, se crea con type='string'. Luego `castValue('false', 'string')` devuelve STRING 'false', no boolean. En el frontend SIEMPRE usar `String(cfg.miSetting) !== 'false'` para checks de boolean settings (NO `cfg.miSetting !== false` → falla si type='string').
- **⚠️ PAGINA_SETTINGS auto-migración:** `settingsController.js` ejecuta un IIFE al startup que inserta/actualiza entries de `PAGINA_SETTINGS`. Si agregas un nuevo setting de página, DEBES añadirlo a esa lista para que se cree automáticamente en BD al desplegar.
- **`admin/configuracion/page.tsx`** usa `getAllSettings()`, agrupa por `category`. El módulo `pagina` se gestiona en `/admin/pagina`.

---

## Red de conexiones

- Cloudinary: [[integrations]] · [[universal-constraints]] (#5, #8)
- Mapa de roles: [[roles-map]] → solo admin puede modificar
- Tablas: [[db-tables-index]]
- Capa: [[backend]]
- Índice: [[modules-index]] · [[DAIMUZ]]
