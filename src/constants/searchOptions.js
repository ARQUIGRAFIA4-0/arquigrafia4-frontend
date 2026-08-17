export const SEARCH_OPTIONS = [
  { mode: "avancada", label: "Busca avançada", icon: "bi-sliders" },
  { mode: "textual", label: "Busca textual", icon: "bi-search" },
  { mode: "data", label: "Busca por data", icon: "bi-calendar2-week" },
  // { mode: "cor", label: "Busca por cor", icon: "bi-palette" },
];

export const DEFAULT_SEARCH_MODE = "textual";

const searchModeMap = new Map(
  SEARCH_OPTIONS.map((option) => [option.mode, { ...option }])
);

/**
 * Retorna o ícone correspondente ao modo de busca
 * @param {string} mode - Modo de busca ('avancada', 'textual', 'data', 'cor')
 * @returns {string} Classe do ícone Bootstrap Icons
 */
export function getSearchIcon(mode) {
  const option = searchModeMap.get(mode);
  return option?.icon || "bi-search";
}

/**
 * Verifica se um modo de busca é válido
 * @param {string} mode - Modo de busca a ser verificado
 * @returns {boolean} True se o modo é válido
 */
export function isValidSearchMode(mode) {
  return searchModeMap.has(mode);
}

/**
 * Retorna a lista de opções de busca
 * @returns {Array<{mode: string, label: string, icon: string}>} Array com as opções de busca
 */
export function searchOptions() {
  return SEARCH_OPTIONS.map((option) => ({ ...option }));
}
