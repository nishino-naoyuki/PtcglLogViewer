import cors from 'cors';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadCache, saveCache } from './cache.js';
import { fetchCardImageUrl } from './ptcgApi.js';
import normalizeName from './normalizeName.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.CARD_PROXY_PORT) || 3001;
const CACHE_PATH =
  process.env.CARD_CACHE_PATH ||
  path.join(__dirname, '../../.cache/card-img.json');
const CACHE_TTL_MS = Number(process.env.CARD_CACHE_TTL_MS) || 1000 * 60 * 60 * 24;

const app = express();
app.use(cors());

let cardCache = await loadCache(CACHE_PATH);

function getCachedUrl(key) {
  const entry = cardCache[key];
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    delete cardCache[key];
    return null;
  }
  return entry.url ?? null;
}

async function setCachedUrl(key, url) {
  cardCache[key] = { url, ts: Date.now() };
  await saveCache(CACHE_PATH, cardCache);
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, cacheEntries: Object.keys(cardCache).length });
});

app.get('/card-image', async (req, res) => {
  const rawName = req.query.name;
  if (!rawName || typeof rawName !== 'string') {
    res.status(400).json({ error: 'Missing name query parameter.' });
    return;
  }

  const normalizedName = normalizeName(rawName);
  const cacheKey = normalizedName.toLowerCase();

  const cachedUrl = getCachedUrl(cacheKey);
  if (cachedUrl) {
    res.json({
      name: rawName,
      normalizedName,
      url: cachedUrl,
      cached: true
    });
    return;
  }

  try {
    const url = await fetchCardImageUrl(normalizedName, {
      apiKey: process.env.PTCG_API_KEY
    });

    if (!url) {
      res.status(404).json({
        name: rawName,
        normalizedName,
        url: null,
        cached: false,
        message: 'Card image not found.'
      });
      return;
    }

    await setCachedUrl(cacheKey, url);
    res.json({
      name: rawName,
      normalizedName,
      url,
      cached: false
    });
  } catch (error) {
    console.error('[card-image]', error);
    res.status(502).json({
      error: 'Failed to fetch data from Pokémon TCG API.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Card image proxy listening on http://localhost:${PORT}`);
});