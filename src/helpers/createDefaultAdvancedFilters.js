/**
 * Cria um objeto de filtros avançados com valores padrão
 * @returns {{terms: Array, tags: Array, licenses: Array, materials: Array, techniques: Array, stylePeriods: Array, culturalContexts: Array, workTypes: Array, imageStartYear: null, imageEndYear: null, workStartYear: null, workEndYear: null, characteristics: Object}} Objeto de filtros vazio
 */
export default function createDefaultAdvancedFilters() {
  return {
    terms: [],
    tags: [],
    licenses: [],
    materials: [],
    techniques: [],
    stylePeriods: [],
    culturalContexts: [],
    workTypes: [],
    imageStartYear: null,
    imageEndYear: null,
    workStartYear: null,
    workEndYear: null,
    characteristics: {},
  };
}
