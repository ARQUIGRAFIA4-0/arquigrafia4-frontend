import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useRouteQuery } from "@vueuse/router";
import { queryToFilters, filtersToQuery, clearAdvancedFilterKeys } from "@/helpers/searchQueryMapping";

const SEARCH_MODE_KEY = "searchMode";

const SEARCH_KEYS = [
  "q",
  "title",
  "dateStart",
  "dateEnd",
  "color",
  "subject",
  "subject_term",
  "author",
  "location",
  "use",
  SEARCH_MODE_KEY,
];

function toArray(value) {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === "string" && item.length > 0);
  }
  if (typeof value === "string" && value.length > 0) {
    return [value];
  }
  return [];
}

function assignQueryValue(target, key, value) {
  if (value == null || value === "") {
    delete target[key];
    return;
  }

  if (Array.isArray(value)) {
    const filtered = value.filter((entry) => typeof entry === "string" && entry.length > 0);
    if (filtered.length === 0) {
      delete target[key];
      return;
    }
    target[key] = filtered.length === 1 ? filtered[0] : filtered;
    return;
  }

  target[key] = value;
}

function buildAdvancedFiltersFromQuery(query) {
  const qValues = toArray(query.q);
  const titleValues = toArray(query.title);
  const authorValues = toArray(query.author);
  const subjects = toArray(query.subject);
  const locations = toArray(query.location);
  const useValue = typeof query.use === "string" && query.use.length > 0 ? query.use : null;
  const subjectTermRaw = typeof query.subject_term === "string" ? query.subject_term : null;

  const terms = [];

  qValues.forEach((value) => {
    terms.push({ field: "all", value, label: `Todos os campos: ${value}` });
  });

  titleValues.forEach((value) => {
    terms.push({ field: "title", value, label: `Título: ${value}` });
  });

  authorValues.forEach((value) => {
    terms.push({ field: "author", value, label: `Autoria: ${value}` });
  });

  if (subjectTermRaw) {
    terms.push({ field: "tag", value: subjectTermRaw, label: `Tag: ${subjectTermRaw}` });
  }

  return {
    terms,
    locations,
    subjects,
    use: useValue,
  };
}

function queryWithoutSearchKeys(query) {
  const clone = { ...query };
  SEARCH_KEYS.forEach((key) => {
    delete clone[key];
  });
  return clone;
}

const DEFAULT_MODE = "textual";
const ALLOWED_MODES = new Set(["textual", "avancada", "data", "cor"]);

function normalizeMode(mode) {
  if (typeof mode !== "string") {
    return DEFAULT_MODE;
  }
  return ALLOWED_MODES.has(mode) ? mode : DEFAULT_MODE;
}

export function useSearchQuery() {
  const route = useRoute();
  const router = useRouter();

  const dateStartRef = useRouteQuery("dateStart");
  const dateEndRef = useRouteQuery("dateEnd");
  const colorRef = useRouteQuery("color");
  const modeRef = useRouteQuery(SEARCH_MODE_KEY, DEFAULT_MODE);

  const searchMode = computed(() => normalizeMode(modeRef.value));

  function commitQuery(nextQuery, { replace = false } = {}) {
    const location = {
      name: route.name,
      params: route.params,
      query: nextQuery,
      hash: route.hash,
    };

    if (replace) {
      return router.replace(location);
    }
    return router.push(location);
  }

  function setSearchMode(mode, options = {}) {
    const resolvedMode = normalizeMode(mode);
    if (resolvedMode === searchMode.value) {
      return Promise.resolve();
    }
    const nextQuery = {
      ...route.query,
      [SEARCH_MODE_KEY]: resolvedMode,
    };
    return commitQuery(nextQuery, options);
  }

  function loadSnapshot(mode = searchMode.value) {
    const resolvedMode = normalizeMode(mode);
    switch (resolvedMode) {
      case "cor":
        return { mode: resolvedMode, value: colorRef.value || "" };
      case "data":
        return {
          mode: resolvedMode,
          value: {
            start: dateStartRef.value || "",
            end: dateEndRef.value || "",
          },
        };
      case "avancada":
        // Fase 2: delega ao módulo consolidado (vocabulário B), em vez de
        // buildAdvancedFiltersFromQuery (vocabulário A, legado/com o bug de autoria).
        return { mode: resolvedMode, value: queryToFilters(route.query) };
      case "textual":
      default: {
        const values = toArray(route.query.q);
        return { mode: "textual", value: values[0] || "" };
      }
    }
  }

  function buildQueryPayload(mode, value) {
    const resolvedMode = normalizeMode(mode);
    let base = queryWithoutSearchKeys(route.query);
    base[SEARCH_MODE_KEY] = resolvedMode;

    switch (resolvedMode) {
      case "cor": {
        const color = typeof value === "string" ? value.trim() : "";
        if (color) {
          assignQueryValue(base, "color", color);
        }
        break;
      }
      case "data": {
        const start = value?.start ? String(value.start).trim() : "";
        const end = value?.end ? String(value.end).trim() : "";
        if (start) {
          assignQueryValue(base, "dateStart", start);
        }
        if (end) {
          assignQueryValue(base, "dateEnd", end);
        }
        break;
      }
      case "avancada": {
        // Fase 2: limpa as chaves do vocabulário B que já estavam na URL (senão
        // um campo removido do payload ficaria "grudado" na query) e reaplica
        // via filtersToQuery — mesma função usada por HomePage.vue/api.js.
        // clearAdvancedFilterKeys devolve um clone (não muta), por isso reatribuímos base.
        base = { ...clearAdvancedFilterKeys(base), ...filtersToQuery(value) };
        break;
      }
      case "textual":
      default: {
        const queryValue = typeof value === "string" ? value.trim() : "";
        if (queryValue) {
          assignQueryValue(base, "q", queryValue);
        }
        break;
      }
    }

    return base;
  }

  function submitSearch({ mode = searchMode.value, value } = {}, options = {}) {
    const nextQuery = buildQueryPayload(mode, value);
    return commitQuery(nextQuery, options);
  }


  return {
    searchMode,
    currentSearchMode: searchMode,
    setSearchMode,
    loadSnapshot,
    submitSearch,
  };
}

export function getSearchQuerySnapshot(route) {
  return buildAdvancedFiltersFromQuery(route.query);
}

/**
 * Extrai filtros ativos da URL independente do searchMode
 * @param {Object} query - Route query object
 * @returns {Object} Objeto com filtros ativos extraídos da URL
 */
export function extractActiveFilters(query) {
  const subjects = toArray(query.subject);
  const subjectTerm = query.subject_term && typeof query.subject_term === 'string' 
    ? query.subject_term 
    : null;

  return {
    subjects: subjects.length > 0 ? subjects : [],
    subjectTerm: subjectTerm,
    hasAny: subjects.length > 0 || Boolean(subjectTerm)
  };
}

export const SEARCH_QUERY_KEYS = SEARCH_KEYS.slice();
export const SEARCH_QUERY_MODE_KEY = SEARCH_MODE_KEY;

