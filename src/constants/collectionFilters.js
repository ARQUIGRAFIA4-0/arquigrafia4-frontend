export const COLLECTION_PERCURSO_FILTERS = [
  { value: "todas", label: "todas", icon: "bi-globe", hasPercursos: null },
  { value: "com-percurso", label: "só percurso", icon: "bi-signpost-split-fill", hasPercursos: true },
  { value: "sem-percurso", label: "sem percurso", icon: "bi-grid-1x2", hasPercursos: false },
];

export const DEFAULT_COLLECTION_PERCURSO_FILTER = "todas";

export const resolveCollectionPercursoFilter = (value) =>
  COLLECTION_PERCURSO_FILTERS.find((option) => option.value === value) ??
  COLLECTION_PERCURSO_FILTERS[0];
