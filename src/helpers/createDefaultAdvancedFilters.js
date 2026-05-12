/**
 * Cria um objeto de filtros avançados com valores padrão
 * @returns {{terms: Array, locations: Array, tags: Array, use: null}} Objeto de filtros vazio
 */
export default function createDefaultAdvancedFilters() {
  return {
    terms: [],
    locations: [],
    tags: [],
    use: null,
    licenses: [],
  };
}
