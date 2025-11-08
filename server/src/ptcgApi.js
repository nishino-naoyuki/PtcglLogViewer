const API_BASE = 'https://api.pokemontcg.io/v2/cards';

export async function fetchCardImageUrl(name, { apiKey } = {}) {
  const query = `name:"${name.replace(/"/g, '')}"`;
  const params = new URLSearchParams({
    q: query,
    orderBy: '-set.releaseDate',
    pageSize: '5'
  });

  const headers = {};
  if (apiKey) {
    headers['X-Api-Key'] = apiKey;
  }

  const response = await fetch(`${API_BASE}?${params}`, { headers });

  if (!response.ok) {
    throw new Error(`Pokémon TCG API error: ${response.status}`);
  }

  const payload = await response.json();
  const cards = payload?.data;
  if (!Array.isArray(cards) || cards.length === 0) {
    return null;
  }

  const [first] = cards;
  return (
    first?.images?.large ||
    first?.images?.small ||
    first?.imageUrl ||
    null
  );
}