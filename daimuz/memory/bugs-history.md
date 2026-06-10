# Historial de Bugs

## Abiertos

### [2026-06-04] Auditoría de servicios del gateway — estado real vs. registrado
**Origen:** auditoría completa de `src/services/index.js` + `serviceController.js` + controladores para regenerar el OpenAPI 3.1 (`backend/docs/api-spec.yaml`).
**Hallazgo:** de los 126 servicios del registro, sólo ~97 son funcionales. El resto está roto, sin implementar o mal cableado. Detalle:

- **Rotos vía gateway (handlers estilo Express `(req,res)`):** `auth.refresh`, `auth.changePassword`, `auth.verifyEmail`, `users.changeRole`, `users.getProfile`, `users.getActivity`. El despachador los llama como `fn(data, user, context)` → fallan. El índice del cerebro los listaba como funcionales.
- **Bug "siempre 403":** `suggestions.update`, `suggestions.updateStatus`, `suggestions.getStats` y la entrada `users.toggleStatus` verifican `user.role==='admin'` internamente pero NO están en `SERVICES_REQUIRING_AUTH`, así que el despachador nunca inyecta `user` → siempre 403. (`users.toggleStatus` además ni siquiera está en el registro → 404.) **Fix:** añadirlos a `SERVICES_REQUIRING_AUTH`/registro.
- **Stubs ("Funcionalidad pendiente"):** `taxonomy.createFamily/createGenus/updateTaxonomy/deleteTaxonomy`, `locations.createLocation/updateLocation/deleteLocation`, `plants.uploadImage/deleteImage/getImages/setMainImage`, `uploads.resizeImage`, `validation.checkDuplicates/validatePlantData`. Devuelven `{success:false}`.
- **Registrados pero `undefined` → 404:** `users.uploadAvatar`, `users.getStats`, `users.deactivate`, `users.activate`, `autocomplete.collectors`.
- **`auth.resetPassword` simulado:** valida formato pero NO actualiza la contraseña en BD (TODO).
- **`auth.register`** ignora cualquier `role` enviado y fuerza `user`.
**Estado:** Documentado en `backend/docs/api-spec.yaml` (campo `x-service-status`) y `backend/docs/GUIA-DESARROLLADORES.md`. Sin corregir en código.

### [2026-06-04] Brechas de autorización en el despachador
**Síntoma:** operaciones sensibles accesibles sin token/rol.
**Causa:** la autorización vive en dos listas paralelas (`SERVICES_REQUIRING_AUTH`, `adminServices`) separadas del registro; varios servicios quedaron fuera.
- **Escrituras sin protección:** `plants.purgeDeleted` (borrado físico), `uploads.deleteFile`.
- **Lecturas sensibles públicas:** `dashboard.getSystemHealth`, `dashboard.getStorageInfo` y demás métricas del dashboard (salvo `getStats`/`getRecentActivity`); `settings.get`, `settings.getSystemInfo`.
**Recomendación de fondo:** mover los metadatos de auth/rol al propio registro (`services/index.js`), p. ej. `{ fn, auth:true, role:'admin' }`, para que un servicio nuevo no quede desprotegido por olvido.
**Estado:** Sin resolver.

### [2026-06-04] Rate limiter estricto de login no está conectado
**Síntoma:** el login no tiene límite reforzado; sólo aplica el general (500 req/5 min).
**Causa:** `rateLimiter.js` define `strictRateLimiter` (5/15min) y `loginRateLimiter` (10/15min), pero `module.exports = generalRateLimiter` sobrescribe el objeto y `app.js` sólo aplica el general globalmente. Los estrictos nunca se montan.
**Archivos:** `backend/src/middleware/rateLimiter.js`, `backend/src/app.js`
**Estado:** Sin resolver.

### [2026-05-30] posts — todas las operaciones fallan en runtime
**Síntoma:** Cualquier llamada a `posts.*` devuelve error "table doesn't exist"
**Causa:** El módulo tiene controladores en `backend/src/controllers/posts/` pero NO tiene tabla en `herbario_heaa_actualizado.sql`
**Estado:** Sin resolver. No iniciar trabajo en este módulo hasta crear la migración SQL primero.
**Archivos:** `services/index.js` (5 servicios registrados), `controllers/posts/`

### [2026-05-30] suggestions.addComment — probablemente roto
**Síntoma:** `suggestions.addComment` puede fallar en runtime
**Causa:** La tabla `suggestion_comments` fue eliminada en v3.0. El servicio podría usar `attachments JSON` en la tabla principal en lugar de una tabla separada.
**Estado:** Requiere verificación. Revisar si el servicio usa la columna JSON o si está hardcodeado a una tabla que ya no existe.

### [2026-05-30] dashboard.getVisitorsChart aparece vacío
**Síntoma:** El gráfico de visitantes en el dashboard no muestra datos
**Causa:** Lee de `activity_logs` donde `action='view_plant'`. Si ningún usuario ha navegado plantas, el array viene vacío.
**Estado:** Lógico, no es un bug técnico. Verificar que se registran los eventos `view_plant`.

---

## Cerrados

### [2026-05-30] NEXT_PUBLIC_API_URL apunta a puerto incorrecto en dev local
**Síntoma:** El frontend no conecta al backend en desarrollo local
**Causa:** `NEXT_PUBLIC_API_URL` por defecto apunta a `localhost:5001`. El backend sin Docker corre en `:5000`.
**Solución:** Ajustar `.env.local` del frontend: `NEXT_PUBLIC_API_URL=http://localhost:5000`
**Nota:** En Docker, `:5001` es correcto porque el compose lo mapea así.

---
*Formato:*
```
## [YYYY-MM-DD] Título del bug
**Síntoma:** qué fallaba
**Causa:** por qué fallaba
**Solución:** qué se cambió
**Archivos:** qué archivos se tocaron
```


---

## Red de conexiones

- Fixes: [[important-fixes]]
- Estado actual: [[current-state]]
- Prompts: [[bug-fix]]
- Índice: [[DAIMUZ]]
