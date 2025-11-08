const cache = new Map<string, string | null>();

const DEFAULT_BASE = import.meta.env.VITE_CARD_PROXY ?? 'http://localhost:3001';

export async function getCardImageUrl(name: string): Promise<string | null> {
  if (!name) return null;
  const key = name.toLowerCase();
  if (cache.has(key)) {
    return cache.get(key) ?? null;
  }

  try {
    const response = await fetch(
      `${DEFAULT_BASE}/card-image?name=${encodeURIComponent(name)}`
    );
    if (!response.ok) {
      cache.set(key, null);
      return null;
    }
    const data = await response.json();
    const url = data?.url ?? null;
    cache.set(key, url);
    return url;
  } catch (error) {
    console.warn('カード画像取得失敗', error);
    cache.set(key, null);
    return null;
  }
}