import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useRouteQuery } from "@vueuse/router";

const SEARCH_MODE_KEY = "searchMode";

const SEARCH_KEYS = [
  "q",
  "dateStart",
  "dateEnd",
  "color",
  "subject",
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

function dedupe(values) {
  return [...new Set(values.filter((item) => typeof item === "string" && item.length > 0))];
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
  const authorValues = toArray(query.author);
  const subjects = toArray(query.subject);
  const locations = toArray(query.location);
  const useValue = typeof query.use === "string" && query.use.length > 0 ? query.use : null;

  const terms = [];

  qValues.forEach((value) => {
    terms.push({ field: "all", value, label: `Todos os campos: ${value}` });
  });

  authorValues.forEach((value) => {
    terms.push({ field: "author", value, label: `Autoria: ${value}` });
  });

  return {
    terms,
    locations,
    subjects,
    use: useValue,
  };
}

function normalizeAdvancedFilters(filters) {
  const safe = filters || {};
  const terms = Array.isArray(safe.terms) ? safe.terms : [];
  const locations = Array.isArray(safe.locations) ? safe.locations : [];
  const subjects = Array.isArray(safe.subjects) ? safe.subjects : [];
  const use = typeof safe.use === "string" && safe.use.length > 0 ? safe.use : null;

  const qValues = [];
  const authorValues = [];
  const subjectValues = [...subjects];
  const locationValues = [...locations];

  terms.forEach((term) => {
    if (!term || typeof term.value !== "string" || term.value.length === 0) {
      return;
    }

    const value = term.value;
    switch (term.field) {
      case "author":
        authorValues.push(value);
        break;
      case "subject":
        subjectValues.push(value);
        break;
      case "location":
        locationValues.push(value);
        break;
      case "title":
      case "all":
      default:
        qValues.push(value);
        break;
    }
  });

  return {
    qValues: dedupe(qValues),
    authorValues: dedupe(authorValues),
    subjectValues: dedupe(subjectValues),
    locationValues: dedupe(locationValues),
    use,
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
        return { mode: resolvedMode, value: buildAdvancedFiltersFromQuery(route.query) };
      case "textual":
      default: {
        const values = toArray(route.query.q);
        return { mode: "textual", value: values[0] || "" };
      }
    }
  }

  function buildQueryPayload(mode, value) {
    const resolvedMode = normalizeMode(mode);
    const base = queryWithoutSearchKeys(route.query);
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
        const normalized = normalizeAdvancedFilters(value);
        if (normalized.qValues.length > 0) {
          assignQueryValue(base, "q", normalized.qValues);
        }
        if (normalized.authorValues.length > 0) {
          assignQueryValue(base, "author", normalized.authorValues);
        }
        if (normalized.subjectValues.length > 0) {
          assignQueryValue(base, "subject", normalized.subjectValues);
        }
        if (normalized.locationValues.length > 0) {
          assignQueryValue(base, "location", normalized.locationValues);
        }
        if (normalized.use) {
          assignQueryValue(base, "use", normalized.use);
        }
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

