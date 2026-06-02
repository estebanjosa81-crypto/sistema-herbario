# posts — compressed

- **Qué hace:** Blog/publicaciones del herbario. Tabla creada 2026-06-02. CRUD completo. 5 servicios.
- **Tablas:** `posts` ✅ (id, title, content, excerpt, image_url, category, tags, status ENUM(draft/published/archived), views, author_id FK→users, created_at, updated_at)
- **Endpoints:** `posts.getAll` · `posts.getById` · `posts.create` · `posts.update` · `posts.delete`
- **Archivos:** `controllers/posts/postsController.js` (barrel) · `controllers/posts/getAll.js` · `controllers/posts/create.js` · `controllers/posts/update.js` · `controllers/posts/delete.js` · `controllers/posts/getById.js`
- **⚠️ Tabla en BD:** La tabla `posts` fue agregada a `herbario_heaa_actualizado.sql` el 2026-06-02. Si la BD fue inicializada antes de esa fecha, ejecutar: `CREATE TABLE IF NOT EXISTS posts (...)` desde `migrate-all.sql` PASO 1.
- **Status:** Funcional si la BD tiene la tabla. El frontend tiene página de publicaciones en `/publicaciones`.

---

## Red de conexiones

- Migración: [[darwin-core-migration]]
- migrate-all.sql: ver context/db-access-guide
- Índice: [[modules-index]] · [[DAIMUZ]]
