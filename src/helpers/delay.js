/**
 * Cria uma Promise que resolve após um tempo especificado
 * @param {number} ms - Tempo de espera em milissegundos
 * @returns {Promise<void>} Promise que resolve após o delay
 */
export default function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
