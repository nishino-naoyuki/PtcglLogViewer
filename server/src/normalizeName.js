const fullWidthRegex = /[！-～]/g;
const quotesRegex = /[’'“”「」『』]/g;

function normalizeFullWidth(char) {
  return String.fromCharCode(char.charCodeAt(0) - 0xfee0);
}

export default function normalizeName(raw) {
  if (!raw) return '';
  return raw
    .replace(fullWidthRegex, normalizeFullWidth)
    .replace(quotesRegex, '')
    .replace(/\s+/g, ' ')
    .trim();
}