/** Quantidade máxima de tags (palavras) exibidas. */
const MAX_TAGS = 5;

const STOP = new Set([
  "de", "da", "do", "das", "dos", "e", "o", "a", "os", "as",
  "em", "no", "na", "nos", "nas", "para", "por", "com", "sem",
  "um", "uma", "uns", "umas", "que", "se", "ao", "aos", "à", "às",
  "esse"
]);

/**
 * Gera tags a partir da descrição da coleção: só palavras soltas (nunca frases inteiras).
 * Vírgula, ponto-e-vírgula, quebras de linha e espaços funcionam só como separadores.
 */
export function collectionTagsFromDescription(raw) {
  if (raw == null || typeof raw !== "string") return [];

  const trimmed = raw.trim();
  if (!trimmed) return [];

  const tokens = trimmed
    .split(/[,;\s]+/)
    .map((w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
    .filter((w) => w.length >= 4 && !STOP.has(w.toLowerCase()));

  const seen = new Set();
  const picked = [];

  for (const w of tokens) {
    const key = w.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(w);
    if (picked.length >= MAX_TAGS) break;
  }

  return picked.map((w) => w.charAt(0).toUpperCase() + w.slice(1));
}
