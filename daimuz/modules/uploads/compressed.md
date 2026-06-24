# uploads — compressed

- **Qué hace:** Gestión de archivos multimedia. Subida a Cloudinary (prod) o local (dev), resize con sharp, validación MIME/tamaño, detección de duplicados via hash MD5. 8 servicios.
- **Tablas:** `uploads` (filename, file_hash MD5, is_temporary, expires_at) · `plant_images`
- **Endpoints:** `POST /api/plantas/upload` (multipart, ruta directa) · `GET /api/media/plantas/:file` (servir local) · `uploads.uploadFile` · `uploads.uploadMultiple` · `uploads.deleteFile` · `uploads.validateFile` · `uploads.resizeImage` · `uploads.getStorageStats`
- **Archivos:** `middleware/upload.js` (Multer: 10MB, MIME check) · `routes/plants.js` · `routes/media.js` · `config/cloudinary.js` · `controllers/uploads/uploadsController.js`
- **⚠️ Regla crítica:** Cloudinary se activa cuando `isConfigured()` = true (cloud_name + api_key + api_secret). Si falta alguna credencial → fallback a almacenamiento local `/app/uploads/plants/`. Límite 10MB. `uploads` no tiene `deleted_at` — limpiar con `CALL cleanup_expired_uploads()`.
- **⚠️ Docker permisos:** Node corre como `nodejs` (UID 1001). El volumen `uploads_data` se monta con permisos root por defecto. El `docker-entrypoint.sh` hace `chown -R nodejs:nodejs /app/uploads` al arrancar via `su-exec`. Sin esto, `fs.writeFileSync` lanza `EACCES` → 500.
- **⚠️ DB insert no-crítico:** El INSERT en tabla `uploads` está en try-catch — si falla (FK violation, tabla inexistente) la respuesta de éxito igual se devuelve con la URL de la imagen.
- **⚠️ Formato de imágenes al actualizar planta:** `plantsController.update` espera `data.images = [{url, thumbnailUrl}]` (array de objetos). Si el frontend envía `image_urls` (string JSON) o cualquier otro formato, las imágenes NO se guardan en `plant_images`.

---

## Red de conexiones

- Flujo completo de imagen: [[plant-upload-flow]]
- Regla Cloudinary: [[universal-constraints]] (#5) · [[integrations]]
- Módulo que lo usa: [[plants/compressed|plants]]
- Tablas: [[db-tables-index]]
- Capa: [[backend]]
- Índice: [[modules-index]] · [[DAIMUZ]]
