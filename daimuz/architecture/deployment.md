# Arquitectura de Despliegue

## Stack de deploy
- **VPS**: 2.24.195.20
- **Orquestador**: Dokploy (dashboard en VPS:3000 — http://2.24.195.20:3000)
- **Reverse Proxy**: Traefik (SSL automático via Let's Encrypt, puertos 80/443)
- **Contenedores**: Docker Compose
- **Redes**: `herbario-internal` (privada) + `dokploy-network` (Traefik pública)

## Servicios en docker-compose.yml

| Servicio | Container | Puerto interno | Acceso externo | Imagen |
|----------|-----------|---------------|----------------|--------|
| `db` | `herbario-db` | 3306 | solo interno | mysql:8.0 |
| `redis` | `herbario-redis` | 6379 | solo interno | redis:7-alpine |
| `backend` | `herbario-backend` | 5001 | Traefik → `API_DOMAIN` (HTTPS) | ./backend/Dockerfile |
| `frontend` | `herbario-frontend` | 3000 | Traefik → `APP_DOMAIN` (HTTPS) | ./frontend/Dockerfile |

**Nota**: la BD y Redis NO tienen puertos expuestos al host. Solo se acceden via `docker exec`.

## Flujo de red

```
Internet
  │
  ├─ :80/:443 → Traefik → herbario-frontend (3000) por APP_DOMAIN
  ├─ :80/:443 → Traefik → herbario-backend  (5001) por API_DOMAIN
  │
  └─ VPS:3000 → Dokploy Dashboard (NO tiene relación con el frontend)

Contenedores internos:
  herbario-backend ──► herbario-db    (MySQL  3306)
  herbario-backend ──► herbario-redis (Redis  6379)
  herbario-frontend ──► [api via NEXT_PUBLIC_API_URL, sale por internet]
```

## Volúmenes persistentes

| Volumen | Contenido | Cómo ver nombre real |
|---------|-----------|---------------------|
| `mysql_data` | Base de datos MySQL | `docker volume ls \| grep mysql` |
| `redis_data` | Cache Redis | `docker volume ls \| grep redis` |
| `uploads_data` | Archivos subidos localmente | `docker volume ls \| grep uploads` |
| `logs_data` | Logs de Winston | `docker volume ls \| grep logs` |

## Dependencias de inicio

```
MySQL (healthy) ─┐
                  ├─► Backend (healthy) ─► Frontend (started)
Redis (healthy) ─┘
```

## Variables de entorno requeridas en Dokploy

```
APP_DOMAIN            → herbario.2.24.195.20.nip.io (staging) | dominio real en prod
API_DOMAIN            → api.2.24.195.20.nip.io (staging)      | idem
FRONTEND_URL          → https://APP_DOMAIN
NEXT_PUBLIC_API_URL   → https://API_DOMAIN
DB_ROOT_PASSWORD      → root123 (cambiar en prod)
DB_NAME               → herbario_heaa
DB_USER               → herbario_user
DB_PASSWORD           → admin123 (cambiar en prod)
JWT_SECRET            → secreto largo y aleatorio
CLOUDINARY_CLOUD_NAME → djhhtzcwu
CLOUDINARY_API_KEY    → (pendiente configurar)
CLOUDINARY_API_SECRET → (pendiente configurar)
CLOUDINARY_FOLDER     → herbario
RATE_LIMIT_MAX_REQUESTS → 500
RATE_LIMIT_WINDOW_MS    → 300000
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME → djhhtzcwu
```

**Nota nip.io**: `*.2.24.195.20.nip.io` resuelve automáticamente a `2.24.195.20`.
Funciona con Traefik + Let's Encrypt sin configurar DNS. Cambiar a dominio real cuando esté disponible.

## Inicialización de BD

El script `backend/herbario_heaa_actualizado.sql` se monta como init script de MySQL:
```yaml
- ./backend/herbario_heaa_actualizado.sql:/docker-entrypoint-initdb.d/01-schema.sql:ro
```
**Solo se ejecuta cuando el volumen `mysql_data` está vacío (primer arranque).**
Si la BD ya estaba inicializada, hay que correr la migración manualmente.
Ver [decisions/darwin-core-migration.md](../decisions/darwin-core-migration.md)

## Health checks

- Backend: `GET /health` y `GET /info` — verifica conexión MySQL y Redis
- MySQL: `mysqladmin ping`
- Redis: `redis-cli ping`

## Acceso a la BD en producción

Ver guía completa en [context/db-access-guide.md](../context/db-access-guide.md)

---

## Red de conexiones

- Backend: [[backend]]
- Overview: [[overview]]
- Integraciones: [[integrations]]
- Acceso BD: [[db-access-guide]]
- Identidad: [[DAIMUZ]]
