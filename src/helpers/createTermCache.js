import { ref } from 'vue';

/**
 * Fábrica de composables de cache de termos por ID — mesmo padrão de
 * useSubjectTerms.js, generalizado para não precisar copiar ~140 linhas a
 * cada vocabulário VRAC novo (materiais, técnicas, períodos de estilo,
 * contextos culturais, tipos de obra).
 *
 * O estado (cache, loadingIds, allItems) fica no closure desta chamada, então
 * cada `createTermCache(...)` produz um composable com cache PRÓPRIO — chame
 * uma vez por domínio (ver useVocabTerms.js) e exporte o resultado, do mesmo
 * jeito que useSubjectTerms.js mantém seu cache a nível de módulo.
 *
 * @param {Object} config
 * @param {(id: string) => Promise<{id: string, [key: string]: string}|null>} config.getById
 * @param {() => Promise<Array<{id: string, [key: string]: string}>>} config.getAll
 * @param {string} [config.labelField] - Nome do campo de rótulo no objeto retornado pela API (default: 'label'; subjects usa 'term').
 */
export function createTermCache({ getById, getAll, labelField = 'label' }) {
  /** @type {import('vue').Ref<Record<string, string>>} */
  const cache = ref({});
  /** @type {import('vue').Ref<Array<{id: string, label: string}>>} lista completa, para UI de busca/autocomplete */
  const allItems = ref([]);
  /** @type {Set<string>} */
  const loadingIds = new Set();
  let allLoaded = false;
  /** @type {Promise<void>|null} */
  let allLoadingPromise = null;

  async function loadTerms(ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
      return;
    }

    const idsToLoad = ids.filter(
      (id) => !cache.value[id] && !loadingIds.has(id)
    );

    if (idsToLoad.length === 0) {
      return;
    }

    idsToLoad.forEach((id) => loadingIds.add(id));

    const promises = idsToLoad.map(async (id) => {
      try {
        const result = await getById(id);
        const label = result?.[labelField];
        if (label) {
          cache.value[id] = label;
        }
      } catch (error) {
        console.error(`Erro ao carregar termo ${id}:`, error);
      } finally {
        loadingIds.delete(id);
      }
    });

    await Promise.all(promises);
  }

  function getTermById(id) {
    return cache.value[id] || id;
  }

  function isTermLoaded(id) {
    return Boolean(cache.value[id]);
  }

  function isTermLoading(id) {
    return loadingIds.has(id);
  }

  function isLoading() {
    return loadingIds.size > 0;
  }

  /**
   * Carrega a lista completa do vocabulário de uma vez (per_page=-1) e
   * popula tanto o cache de labels quanto `allItems` (para UI de
   * busca/autocomplete). Executa uma vez por sessão; chamadas concorrentes
   * esperam a mesma Promise em vez de disparar requisições duplicadas.
   */
  function loadAll() {
    if (allLoaded) return Promise.resolve();
    if (allLoadingPromise) return allLoadingPromise;

    allLoadingPromise = (async () => {
      try {
        const items = await getAll();
        const mapped = [];
        for (const item of items) {
          const label = item?.[labelField];
          if (item?.id && label) {
            cache.value[item.id] = label;
            mapped.push({ id: item.id, label });
          }
        }
        allItems.value = mapped;
        allLoaded = true;
      } catch (error) {
        console.error('Erro ao carregar lista completa do vocabulário:', error);
      } finally {
        allLoadingPromise = null;
      }
    })();

    return allLoadingPromise;
  }

  function clearCache() {
    cache.value = {};
    allItems.value = [];
    loadingIds.clear();
    allLoaded = false;
    allLoadingPromise = null;
  }

  return function useTermCache() {
    return {
      loadTerms,
      loadAll,
      getTermById,
      isTermLoaded,
      isTermLoading,
      isLoading,
      allItems,
      clearCache,
    };
  };
}