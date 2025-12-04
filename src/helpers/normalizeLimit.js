/**
 * Normaliza um valor de limite para um número inteiro positivo válido
 * @param {any} value - Valor a ser normalizado
 * @param {number} fallback - Valor padrão caso o value seja inválido
 * @returns {number} Valor normalizado ou fallback se inválido
 */
export default function normalizeLimit(value, fallback) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}
