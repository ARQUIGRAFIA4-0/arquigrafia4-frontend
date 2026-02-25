/**
 * Adiciona zeros à esquerda de um número
 * @param {number} n - Número a ser formatado
 * @param {number} [length=2] - Tamanho final da string
 * @returns {string} Número formatado com zeros à esquerda
 */
export function padNumber(n, length = 2) {
  return String(n).padStart(length, "0");
}

/**
 * Formata uma data no formato ISO (YYYY-MM-DD)
 * @param {number} year - Ano
 * @param {number} [month=1] - Mês (1-12)
 * @param {number} [day=1] - Dia (1-31)
 * @returns {string} Data formatada no padrão ISO
 */
export function formatDate(year, month = 1, day = 1) {
  return `${year}-${padNumber(month)}-${padNumber(day)}`;
}

/**
 * Extrai o ano de uma string de data no formato ISO
 * @param {string} dateStr - String de data (YYYY, YYYY-MM ou YYYY-MM-DD)
 * @returns {number|null} Ano extraído ou null se inválido
 */
export function parseYearFromDateString(dateStr) {
  if (!dateStr) return null;
  const match = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/.exec(dateStr);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  if (Number.isNaN(year)) return null;
  return year;
}

/**
 * Limita um ano dentro de um intervalo válido
 * @param {number|string} year - Ano a ser limitado
 * @param {number} [min=1800] - Ano mínimo permitido
 * @param {number} [max=new Date().getFullYear()] - Ano máximo permitido
 * @returns {number} Ano limitado ao intervalo
 */
export function clampYear(year, min = 1800, max = new Date().getFullYear()) {
  const parsed = parseInt(year, 10) || min;
  return Math.min(Math.max(parsed, min), max);
}

/**
 * Atualiza o ano de uma string de data mantendo mês e dia
 * @param {string} dateStr - String de data original (YYYY-MM-DD)
 * @param {number} newYear - Novo ano a ser definido
 * @param {boolean} [isStart=true] - Se é data inicial (usa 01-01) ou final (usa 12-31)
 * @returns {string} Nova data formatada
 */
export function setDateYear(dateStr, newYear, isStart = true) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr || "");
  const defaultMonth = isStart ? 1 : 12;
  const defaultDay = isStart ? 1 : 31;
  const month = match ? parseInt(match[2], 10) : defaultMonth;
  const day = match ? parseInt(match[3], 10) : defaultDay;
  const safeMonth = Math.min(Math.max(month, 1), 12);
  const safeDay = Math.min(Math.max(day, 1), 31);
  return formatDate(newYear, safeMonth, safeDay);
}

/**
 * Sanitiza um parâmetro de data vindo da URL (ex: "32138109823-01-01" → "2026-01-01").
 * Extrai o ano (que pode ter qualquer quantidade de dígitos), limita a [1, anoAtual],
 * e reconstrói a data com mês/dia válidos.
 * @param {string} dateStr - Valor bruto da query string (ex: "32138109823-01-01")
 * @param {boolean} [isStart=true] - Se é data inicial (default 01-01) ou final (default 12-31)
 * @returns {string|null} Data sanitizada no formato YYYY-MM-DD, ou null se inválido
 */
export function sanitizeDateParam(dateStr, isStart = true) {
  if (!dateStr || typeof dateStr !== "string") return null;
  const parts = dateStr.split("-");
  const rawYear = parseInt(parts[0], 10);
  if (!Number.isFinite(rawYear) || rawYear < 1) return null;
  const currentYear = new Date().getFullYear();
  const year = Math.min(Math.max(rawYear, 1), currentYear);
  const defaultMonth = isStart ? 1 : 12;
  const defaultDay = isStart ? 1 : 31;
  const month = parts[1] ? Math.min(Math.max(parseInt(parts[1], 10) || defaultMonth, 1), 12) : defaultMonth;
  const day = parts[2] ? Math.min(Math.max(parseInt(parts[2], 10) || defaultDay, 1), 31) : defaultDay;
  return formatDate(year, month, day);
}
