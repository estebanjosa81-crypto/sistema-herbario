// src/controllers/plants/exportData.js
const db     = require('../../config/database');
const logger = require('../../utils/logger');

// ── Columnas del CSV ──────────────────────────────────────────────────────────
const CSV_HEADERS = [
  'N° Catálogo',        'N° Registro',       'OccurrenceID',
  'Nombre Científico',  'Epíteto Específico', 'Autoría',
  'Nombre Común',       'Nombre Vernáculo',   'Familia',
  'Género',             'Estado taxonómico',
  'Colector',           'Colectores adicionales',
  'Fecha de Colección', 'Identificado por',   'Fecha identificación',
  'País',               'Departamento',        'Municipio',
  'Localidad',          'Altitud (msnm)',      'Latitud',   'Longitud',
  'Hábitat',            'Hábito',             'Descripción',
  'Usos',               'Observaciones',       'Notas adicionales',
  'Estado Conservación','Preparaciones',       'Disposición',
  'Proyecto',           'Base del registro',
];

// ── Mapeo header → campo BD ───────────────────────────────────────────────────
const ROW_FIELDS = [
  'catalog_number',     'record_number',      'occurrence_id',
  'scientific_name',    'specific_epithet',   'scientific_name_authorship',
  'common_name',        'vernacular_name',     'family',
  'genus',              'taxonomic_status',
  'recorded_by',        'additional_collectors',
  'event_date',         'identified_by',       'date_identified',
  'country',            'state_province',      'municipality',
  'locality',           'minimum_elevation_in_meters', 'decimal_latitude', 'decimal_longitude',
  'habitat',            'plant_habit',         'description',
  'uses',               'observations',        'additional_remarks',
  'conservation_status','preparations',        'disposition',
  'project',            'basis_of_record',
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const esc = v => {
  if (v === null || v === undefined) return '';
  const s = String(v).trim();
  return (s.includes(',') || s.includes('"') || s.includes('\n'))
    ? `"${s.replace(/"/g, '""')}"`
    : s;
};

const buildRow = plant => ROW_FIELDS.map(f => esc(plant[f])).join(',');

// ── Controller ────────────────────────────────────────────────────────────────
const exportData = async (data, user) => {
  const {
    search          = '',
    family          = '',
    genus           = '',
    species         = '',
    department      = '',
    municipality    = '',
    collector       = '',
    vernacular_name = '',
    catalog_number  = '',
    record_number   = '',
    habitat         = '',
    limit           = 5000,
  } = data || {};

  const where = ["status = 'published'"];
  const params = [];

  if (search) {
    where.push('(scientific_name LIKE ? OR vernacular_name LIKE ? OR family LIKE ? OR genus LIKE ?)');
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }
  if (family)          { where.push('family LIKE ?');                params.push(`%${family}%`); }
  if (genus)           { where.push('genus LIKE ?');                 params.push(`%${genus}%`); }
  if (species)         { where.push('specific_epithet LIKE ?');      params.push(`%${species}%`); }
  if (department)      { where.push('state_province LIKE ?');        params.push(`%${department}%`); }
  if (municipality)    { where.push('municipality LIKE ?');          params.push(`%${municipality}%`); }
  if (collector)       { where.push('recorded_by LIKE ?');           params.push(`%${collector}%`); }
  if (vernacular_name) { where.push('(vernacular_name LIKE ? OR common_name LIKE ?)'); params.push(`%${vernacular_name}%`, `%${vernacular_name}%`); }
  if (catalog_number)  { where.push('catalog_number LIKE ?');        params.push(`%${catalog_number}%`); }
  if (record_number)   { where.push('record_number LIKE ?');         params.push(`%${record_number}%`); }
  if (habitat)         { where.push('habitat LIKE ?');               params.push(`%${habitat}%`); }

  const whereClause = `WHERE ${where.join(' AND ')}`;

  const [plants] = await db.query(
    `SELECT
       catalog_number, record_number, occurrence_id,
       scientific_name, specific_epithet, scientific_name_authorship,
       common_name, vernacular_name, family, genus, taxonomic_status,
       recorded_by, additional_collectors,
       DATE_FORMAT(event_date, '%Y-%m-%d') AS event_date,
       identified_by, DATE_FORMAT(date_identified, '%Y-%m-%d') AS date_identified,
       country, state_province, municipality, locality,
       minimum_elevation_in_meters, decimal_latitude, decimal_longitude,
       habitat, plant_habit, description,
       uses, observations, additional_remarks,
       conservation_status, preparations, disposition,
       project, basis_of_record
     FROM plants
     ${whereClause}
     ORDER BY catalog_number ASC
     LIMIT ?`,
    [...params, Math.min(parseInt(limit) || 5000, 5000)]
  );

  const bom  = '﻿';
  const head = CSV_HEADERS.join(',');
  const body = plants.map(buildRow).join('\n');
  const csv  = bom + head + '\n' + body;

  const date = new Date().toISOString().slice(0, 10);
  logger.info(`Exportación CSV: ${plants.length} registros por ${user?.email ?? 'anónimo'}`);

  return {
    csv,
    filename: `herbario_HEAA_${date}.csv`,
    count: plants.length,
    format: 'csv',
  };
};

const getExportFormats = async () => ({
  formats: [
    { value: 'csv', label: 'CSV (compatible con Excel)', extension: '.csv', mimeType: 'text/csv' },
  ],
  default: 'csv',
  maxRows: 5000,
  note: 'Incluye los campos Darwin Core principales más campos locales HEAA.',
});

module.exports = { exportData, getExportFormats };
