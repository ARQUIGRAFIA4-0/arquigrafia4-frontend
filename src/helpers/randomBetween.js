/**
 * Gera um número aleatório entre dois valores
 * @param {number} min - Valor mínimo
 * @param {number} max - Valor máximo
 * @returns {number} Número aleatório entre min e max
 */
export default function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}
