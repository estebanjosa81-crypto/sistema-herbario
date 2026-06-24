// src/controllers/backup/backupController.js
// Genera un dump SQL completo de la BD sin depender de mysqldump.
// Usa queries nativas de MySQL para ser portable en Docker / Dokploy.

const db     = require('../../config/database');
const logger = require('../../utils/logger');

// ── helpers ───────────────────────────────────────────────────────────────────

/** Escapa un valor para incluirlo en SQL VALUES */
function sqlValue(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? '1' : '0';
  if (v instanceof Date) return `'${v.toISOString().slice(0, 19).replace('T', ' ')}'`;
  // String: escapar comillas simples y backslashes
  return `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

/** Divide un array en chunks */
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ── controller ────────────────────────────────────────────────────────────────

/**
 * Genera un dump SQL completo de la base de datos.
 * Parámetros: { tables?: string[] }  — si se omite, vuelca todas las tablas.
 * Requiere rol admin.
 */
const generate = async (data, user) => {
  const requestedTables = data?.tables ?? null; // null = todas

  const dbName = process.env.DB_NAME || 'herbario_heaa';
  const lines  = [];
  const now    = new Date();
  const dateStr = now.toISOString().slice(0, 19).replace('T', ' ');

  // ── Encabezado ──────────────────────────────────────────────────────────────
  lines.push(`-- ============================================================`);
  lines.push(`-- Herbario Digital HEAA — Backup completo`);
  lines.push(`-- Base de datos : ${dbName}`);
  lines.push(`-- Generado      : ${dateStr} UTC`);
  lines.push(`-- Generado por  : ${user?.email ?? 'sistema'}`);
  lines.push(`-- ============================================================`);
  lines.push('');
  lines.push('SET FOREIGN_KEY_CHECKS=0;');
  lines.push('SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";');
  lines.push('SET time_zone="+00:00";');
  lines.push('');

  // ── Listar tablas ───────────────────────────────────────────────────────────
  const [tableRows] = await db.query('SHOW TABLES');
  const colName     = `Tables_in_${dbName}`;
  let   tables      = tableRows.map(r => r[colName] ?? Object.values(r)[0]);

  if (requestedTables?.length) {
    tables = tables.filter(t => requestedTables.includes(t));
  }

  logger.info(`Backup: volcando ${tables.length} tabla(s): ${tables.join(', ')}`);

  // ── Por cada tabla: CREATE TABLE + INSERT ───────────────────────────────────
  for (const table of tables) {
    lines.push(`-- ------------------------------------------------------------`);
    lines.push(`-- Tabla: \`${table}\``);
    lines.push(`-- ------------------------------------------------------------`);

    // CREATE TABLE
    const [[createRow]] = await db.query(`SHOW CREATE TABLE \`${table}\``);
    const createSql = createRow['Create Table'] || createRow[`Create View`] || '';
    lines.push(`DROP TABLE IF EXISTS \`${table}\`;`);
    lines.push(createSql + ';');
    lines.push('');

    // Datos
    const [rows] = await db.query(`SELECT * FROM \`${table}\``);
    if (rows.length === 0) {
      lines.push(`-- (sin registros)`);
      lines.push('');
      continue;
    }

    const columns = Object.keys(rows[0]).map(c => `\`${c}\``).join(', ');
    // Insertar en lotes de 500 filas para no generar líneas enormes
    for (const batch of chunk(rows, 500)) {
      const values = batch.map(row =>
        '(' + Object.values(row).map(sqlValue).join(', ') + ')'
      ).join(',\n  ');
      lines.push(`INSERT INTO \`${table}\` (${columns}) VALUES`);
      lines.push(`  ${values};`);
    }
    lines.push('');
  }

  // ── Pie ─────────────────────────────────────────────────────────────────────
  lines.push('SET FOREIGN_KEY_CHECKS=1;');
  lines.push(`-- Fin del backup — ${tables.length} tabla(s) volcadas`);

  const sql      = lines.join('\n');
  const datePart = now.toISOString().slice(0, 10);
  const filename = `herbario_HEAA_backup_${datePart}.sql`;
  const sizeKb   = Math.round(Buffer.byteLength(sql, 'utf8') / 1024);

  logger.info(`Backup generado: ${filename} (${sizeKb} KB) por ${user?.email}`);

  return { sql, filename, sizeKb, tables: tables.length, rows: tables.length };
};

module.exports = { generate };
