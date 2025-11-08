import { promises as fs } from 'node:fs';
import path from 'node:path';

async function ensureDirectory(dir) {
  await fs.mkdir(dir, { recursive: true });
}

export async function loadCache(filePath) {
  const dir = path.dirname(filePath);
  await ensureDirectory(dir);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {};
    }
    throw error;
  }
}

export async function saveCache(filePath, cache) {
  const dir = path.dirname(filePath);
  await ensureDirectory(dir);
  await fs.writeFile(filePath, JSON.stringify(cache, null, 2), 'utf8');
}