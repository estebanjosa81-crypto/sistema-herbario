// src/controllers/gbif/gbifController.js
// Proxy para la API pública de GBIF — evita llamadas directas desde el frontend
const logger = require('../../utils/logger');

const GBIF_BASE = 'https://api.gbif.org/v1';
// Dataset del Backbone Taxonómico de GBIF (el más completo para plantas)
const BACKBONE_DATASET = 'd7dddbf4-2cf0-4f39-9b2a-bb099caae36c';

/**
 * Sugerencias mientras el usuario escribe
 * Parámetros: { q: string, limit?: number }
 * GET /v1/species/suggest?q=...&datasetKey=backbone&limit=8
 */
const suggest = async (data) => {
  const { q, limit = 8 } = data || {};
  if (!q || q.trim().length < 2) {
    return { suggestions: [] };
  }

  const url = `${GBIF_BASE}/species/suggest?q=${encodeURIComponent(q.trim())}&datasetKey=${BACKBONE_DATASET}&limit=${limit}`;

  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`GBIF suggest respondió ${res.status}`);

  const raw = await res.json();

  // Filtrar Plantae con canonicalName y mapear a campos relevantes
  const suggestions = raw
    .filter(s => s.kingdom === 'Plantae' && s.canonicalName)
    .map(s => ({
      key:           s.key,
      canonicalName: s.canonicalName,
      scientificName: s.scientificName,
      rank:          s.rank,
      family:        s.family,
      genus:         s.genus,
      status:        s.status,
    }));

  logger.info(`GBIF suggest "${q}" → ${suggestions.length} resultados`);
  return { suggestions };
};

/**
 * Match completo de un nombre → clasificación taxonómica completa
 * Parámetros: { name: string }
 * GET /v1/species/match?name=...&kingdom=Plantae
 */
const match = async (data) => {
  const { name } = data || {};
  if (!name || !name.trim()) throw new Error('Se requiere el parámetro name');

  const url = `${GBIF_BASE}/species/match?name=${encodeURIComponent(name.trim())}&kingdom=Plantae`;

  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`GBIF match respondió ${res.status}`);

  const d = await res.json();

  if (d.matchType === 'NONE') {
    return { found: false, matchType: 'NONE' };
  }

  // Extraer autoría: scientificName sin el canonicalName
  let authorship = d.authorship
    || ((d.scientificName && d.canonicalName)
        ? d.scientificName.replace(d.canonicalName, '').trim()
        : '');

  // El endpoint /species/match no siempre incluye la autoría dentro de
  // scientificName. Si quedó vacía, la consultamos en el detalle de la especie
  // (/species/{usageKey}), que sí devuelve el campo `authorship` de forma fiable.
  if (!authorship && d.usageKey) {
    try {
      const detRes = await fetch(`${GBIF_BASE}/species/${d.usageKey}`, { headers: { Accept: 'application/json' } });
      if (detRes.ok) {
        const det = await detRes.json();
        authorship = det.authorship
          || ((det.scientificName && det.canonicalName)
              ? det.scientificName.replace(det.canonicalName, '').trim()
              : '');
      }
    } catch { /* si falla, dejamos la autoría vacía */ }
  }

  // Epíteto específico: segunda palabra del canonicalName
  const epithet = d.canonicalName?.split(' ')[1] || d.species?.split(' ')[1] || '';

  logger.info(`GBIF match "${name}" → ${d.scientificName} (confianza: ${d.confidence}%)`);

  return {
    found:      true,
    matchType:  d.matchType,
    confidence: d.confidence,
    usageKey:   d.usageKey,
    // Campos para el formulario
    scientificName:           d.canonicalName      || '',
    scientificNameAuthorship: authorship,
    specificEpithet:          epithet,
    taxonRank:                d.rank?.toLowerCase() || '',
    kingdom:                  d.kingdom  || '',
    phylum:                   d.phylum   || '',
    class:                    d.class    || '',
    orderName:                d.order    || '',
    family:                   d.family   || '',
    genus:                    d.genus    || '',
  };
};

module.exports = { suggest, match };
