#!/bin/sh
set -e

# Crear directorio de uploads y corregir permisos antes de iniciar Node
# Necesario porque el volumen Docker se monta con permisos de root
mkdir -p /app/uploads/plants
chown -R nodejs:nodejs /app/uploads 2>/dev/null || true

exec su-exec nodejs node server.js
