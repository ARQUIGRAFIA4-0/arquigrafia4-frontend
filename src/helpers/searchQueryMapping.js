import { sanitizeDateParam } from "@/helpers/dateUtils";
import createDefaultAdvancedFilters from "@/helpers/createDefaultAdvancedFilters";

/**
 * Módulo puro (sem useRoute/useRouter) de mapeamento entre o shape canônico de
 * filtros avançados (ver createDefaultAdvancedFilters) e o vocabulário B de
 * query-string/params que a API /api/images e a maioria dos componentes já
 * falam (contributor, location, subject[], subject_term[], license[],
 * material[], technique[], style_period[], cultural_context[], work_type[],
 * date_from/to, work_date_from/to, binomial[chave]).
 *
 * Fonte única de verdade para essa conversão — extraído de
 * buildAdvancedFiltersFromUrl (HomePage.vue) e buildSearchParamsFromAdvancedFilters
 * (helpers/buildSearchParams.js), não reescrito do zero.
 *
 * material[]/technique[]/style_period[]/cultural_context[]/work_type[] são
 * arrays de UUID (mesmo padrão de subject[]) — substituem os antigos
 * material_term[]/technique_term[]/aesthetics_term[]/cultural_context_term[]/
 * typology_term[], que nunca bateram com SearchImageRequest::rules() no
 * backend e eram descartados silenciosamente (ver
 * BUSCA-MAPA-DE-PARAMETROS.md, seção 7).
 */

const readArrayParam = (query, key) => {
  const raw = query[key];
  return raw ? (Array.isArray(raw) ? raw : [raw]) : [];
};

// Chaves estáticas do vocabulário B (advançada). binomial[chave] tem nome
// dinâmico e é tratado à parte via regex em clearAdvancedFilterKeys.
export const ADVANCED_QUERY_KEYS = [
  "q",
  "title",
  "contributor",
  "location",
  "subject_term[]",
  "subject[]",
  "license[]",
  "date_from",
  "date_to",
  "work_date_from",
  "work_date_to",
  "material[]",
  "technique[]",
  "style_period[]",
  "cultural_context[]",
  "work_type[]",
];

/**
 * Remove do query todas as chaves do vocabulário B (estáticas + binomial[*]),
 * sem mutar o objeto original. Útil antes de reaplicar filtersToQuery(), para
 * não deixar para trás uma chave que o novo payload não usa mais.
 */
export function clearAdvancedFilterKeys(query = {}) {
  const clone = { ...query };
  ADVANCED_QUERY_KEYS.forEach((key) => {
    delete clone[key];
  });
  Object.keys(clone).forEach((key) => {
    if (/^binomial\[.+\]$/.test(key)) {
      delete clone[key];
    }
  });
  return clone;
}

/**
 * route.query (vocabulário B) -> shape canônico de filtros avançados.
 * Extraído de buildAdvancedFiltersFromUrl (HomePage.vue), com uma correção
 * deliberada: datas passam por sanitizeDateParam antes de virar ano, o que
 * ViewGrid/ViewMosaic já faziam e ViewMap não (Fase 2, risco conhecido).
 */
export function queryToFilters(query = {}) {
  const terms = [];

  if (query.q) {
    terms.push({ field: "all", value: query.q, label: `Todos os campos: ${query.q}` });
  }
  if (query.title) {
    terms.push({ field: "title", value: query.title, label: `Título: ${query.title}` });
  }
  if (query.contributor) {
    terms.push({ field: "author", value: query.contributor, label: `Autoria: ${query.contributor}` });
  }
  if (query.location) {
    terms.push({ field: "location", value: query.location, label: `Localização: ${query.location}` });
  }
  readArrayParam(query, "subject_term[]").forEach((term) => {
    terms.push({ field: "tag", value: term, label: `Tag: ${term}` });
  });

  // IDs de subject (checkboxes/sugestões) vindos de subject[] na URL.
  const tags = readArrayParam(query, "subject[]");

  const licenses = readArrayParam(query, "license[]");

  // Materiais/técnicas/períodos de estilo/contextos culturais/tipos de obra:
  // arrays de UUID, mesmo padrão de tags/licenses (não são mais 'termo' de
  // texto livre — os nomes *_term[] antigos nunca foram validados pelo
  // backend, ver SearchImageRequest::rules()).
  const materials = readArrayParam(query, "material[]");
  const techniques = readArrayParam(query, "technique[]");
  const stylePeriods = readArrayParam(query, "style_period[]");
  const culturalContexts = readArrayParam(query, "cultural_context[]");
  const workTypes = readArrayParam(query, "work_type[]");

  // Período da imagem — sanitiza antes de extrair o ano (correção da Fase 2:
  // ViewMap não fazia isso, ViewGrid/ViewMosaic já faziam via sanitizeDateParam
  // aplicado só na leitura para filtragem, não no shape canônico).
  const sanitizedDateFrom = query.date_from ? sanitizeDateParam(query.date_from, true) : null;
  const sanitizedDateTo = query.date_to ? sanitizeDateParam(query.date_to, false) : null;
  const imageStartYear = sanitizedDateFrom ? parseInt(sanitizedDateFrom.substring(0, 4), 10) : null;
  const imageEndYear = sanitizedDateTo ? parseInt(sanitizedDateTo.substring(0, 4), 10) : null;

  // Período da obra
  const sanitizedWorkDateFrom = query.work_date_from ? sanitizeDateParam(query.work_date_from, true) : null;
  const sanitizedWorkDateTo = query.work_date_to ? sanitizeDateParam(query.work_date_to, false) : null;
  const workStartYear = sanitizedWorkDateFrom ? parseInt(sanitizedWorkDateFrom.substring(0, 4), 10) : null;
  const workEndYear = sanitizedWorkDateTo ? parseInt(sanitizedWorkDateTo.substring(0, 4), 10) : null;

  // Características (binomial[chave] = left|right)
  const characteristics = {};
  Object.keys(query).forEach((key) => {
    const match = key.match(/^binomial\[(.+)\]$/);
    if (match) {
      const side = query[key];
      if (side === "left" || side === "right") {
        characteristics[match[1]] = side;
      }
    }
  });

  return {
    ...createDefaultAdvancedFilters(),
    terms,
    tags,
    licenses,
    materials,
    techniques,
    stylePeriods,
    culturalContexts,
    workTypes,
    imageStartYear,
    imageEndYear,
    workStartYear,
    workEndYear,
    characteristics,
  };
}

/**
 * Shape canônico de filtros avançados -> params de query-string/axios
 * (vocabulário B). Extraído verbatim de buildSearchParamsFromAdvancedFilters
 * (helpers/buildSearchParams.js) — mesmo comportamento, só realocado.
 */
export function filtersToQuery(filters = {}) {
  const terms = Array.isArray(filters.terms) ? filters.terms : [];
  const tags = Array.isArray(filters.tags) ? filters.tags : [];
  const licenses = Array.isArray(filters.licenses) ? filters.licenses : [];
  const materials = Array.isArray(filters.materials) ? filters.materials : [];
  const techniques = Array.isArray(filters.techniques) ? filters.techniques : [];
  const stylePeriods = Array.isArray(filters.stylePeriods) ? filters.stylePeriods : [];
  const culturalContexts = Array.isArray(filters.culturalContexts) ? filters.culturalContexts : [];
  const workTypes = Array.isArray(filters.workTypes) ? filters.workTypes : [];

  const qValues = [];
  const titleValues = [];
  const contributorValues = [];
  const locationValues = [];
  const subjectTermValues = [];

  terms.forEach((term) => {
    if (!term?.value?.trim?.()) return;
    const v = term.value.trim();
    switch (term.field) {
      case "title": titleValues.push(v); break;
      case "author": contributorValues.push(v); break;
      case "location": locationValues.push(v); break;
      case "tag": subjectTermValues.push(v); break;
      case "all": default: qValues.push(v); break;
    }
  });

  const params = {};

  if (qValues.length) params.q = qValues.join(" ");
  if (titleValues.length) params.title = titleValues.join(" ");
  if (contributorValues.length) params.contributor = contributorValues.join(" ");
  if (locationValues.length) params.location = locationValues.join(" ");

  const pushArrayParam = (key, values) => {
    if (values.length === 1) params[key] = values[0];
    else if (values.length > 1) params[key] = values;
  };

  pushArrayParam("subject_term[]", subjectTermValues);

  const subjectIds = tags.filter((id) => typeof id === "string" && id.length > 0);
  pushArrayParam("subject[]", subjectIds);

  const licenseValues = licenses.filter((l) => typeof l === "string" && l.length > 0);
  pushArrayParam("license[]", licenseValues);

  // Materiais/técnicas/períodos de estilo/contextos culturais/tipos de obra:
  // arrays de UUID, mesmo padrão de subject[]/license[] acima — bate com
  // SearchImageRequest::rules() (material/technique/style_period/
  // cultural_context/work_type, todos 'nullable|array' + '.*'=>'uuid').
  pushArrayParam("material[]", materials.filter((id) => typeof id === "string" && id.length > 0));
  pushArrayParam("technique[]", techniques.filter((id) => typeof id === "string" && id.length > 0));
  pushArrayParam("style_period[]", stylePeriods.filter((id) => typeof id === "string" && id.length > 0));
  pushArrayParam("cultural_context[]", culturalContexts.filter((id) => typeof id === "string" && id.length > 0));
  pushArrayParam("work_type[]", workTypes.filter((id) => typeof id === "string" && id.length > 0));

  if (typeof filters.imageStartYear === "number") params.date_from = `${filters.imageStartYear}-01-01`;
  if (typeof filters.imageEndYear === "number") params.date_to = `${filters.imageEndYear}-12-31`;
  if (typeof filters.workStartYear === "number") params.work_date_from = `${filters.workStartYear}-01-01`;
  if (typeof filters.workEndYear === "number") params.work_date_to = `${filters.workEndYear}-12-31`;

  Object.entries(filters.characteristics || {}).forEach(([key, side]) => {
    if (side === "left" || side === "right") params[`binomial[${key}]`] = side;
  });

  return params;
}

/**
 * Shape canônico -> params axios para GET /api/images (inclui page).
 * Usado por api.js:searchImages no lugar do switch local.
 */
export function filtersToApiParams(filters = {}, { page = 1 } = {}) {
  return { page, ...filtersToQuery(filters) };
}

/**
 * true se o shape canônico (já resolvido por queryToFilters) tem pelo menos
 * um filtro ativo. Usado por Toolbar.vue/ToolbarMobile.vue para o indicador
 * de "há filtro de busca ativo" (antes cada arquivo reparseava route.query
 * campo a campo, numa lista que precisava ser mantida em 2-3 lugares).
 */
export function hasAnyAdvancedFilter(filters = {}) {
  return Boolean(
    filters.terms?.length ||
    filters.tags?.length ||
    filters.licenses?.length ||
    filters.materials?.length ||
    filters.techniques?.length ||
    filters.stylePeriods?.length ||
    filters.culturalContexts?.length ||
    filters.workTypes?.length ||
    filters.imageStartYear != null ||
    filters.imageEndYear != null ||
    filters.workStartYear != null ||
    filters.workEndYear != null ||
    Object.keys(filters.characteristics || {}).length
  );
}
