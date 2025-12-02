/**
 * Escapa caracteres especiais HTML para prevenir XSS
 * @param {any} value - Valor a ser escapado
 * @returns {string} String com caracteres HTML escapados
 */
export default function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
