import { ref } from 'vue';
import { api } from '@/services/api';

/**
 * Cache de termos de subjects mapeados por ID
 * @type {import('vue').Ref<Record<string, string>>}
 */
const subjectTermsCache = ref({});

/**
 * IDs sendo carregados atualmente (evita requisições duplicadas)
 * @type {Set<string>}
 */
const loadingIds = new Set();

/** Controle de carregamento completo da lista */
let allSubjectsLoaded = false;
let allSubjectsLoading = false;

/**
 * Composable para gerenciar cache de termos de subjects
 * Busca termos de subjects por ID e mantém cache local
 */
export function useSubjectTerms() {
  /**
   * Carrega termos para os IDs fornecidos (apenas os que ainda não estão no cache)
   * @param {string[]} ids - Array de IDs de subjects
   * @returns {Promise<void>}
   */
  async function loadSubjectTerms(ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
      return;
    }

    // Filtra IDs que não estão no cache e não estão sendo carregados
    const idsToLoad = ids.filter(
      (id) => !subjectTermsCache.value[id] && !loadingIds.has(id)
    );

    if (idsToLoad.length === 0) {
      return;
    }

    // Marca IDs como sendo carregados
    idsToLoad.forEach((id) => loadingIds.add(id));

    // Busca termos em paralelo
    const promises = idsToLoad.map(async (id) => {
      try {
        const result = await api.getSubjectById(id);
        if (result && result.term) {
          subjectTermsCache.value[id] = result.term;
        }
      } catch (error) {
        console.error(`Erro ao carregar subject ${id}:`, error);
      } finally {
        loadingIds.delete(id);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Retorna o termo para um ID de subject
   * Se o termo não estiver no cache, retorna o próprio ID como fallback
   * @param {string} id - ID do subject
   * @returns {string} Termo do subject ou ID se não encontrado
   */
  function getTermById(id) {
    return subjectTermsCache.value[id] || id;
  }

  /**
   * Verifica se o termo para um ID específico já foi carregado
   * @param {string} id - ID do subject
   * @returns {boolean} true se o termo está no cache
   */
  function isTermLoaded(id) {
    return Boolean(subjectTermsCache.value[id]);
  }

  /**
   * Verifica se um ID específico está sendo carregado no momento
   * @param {string} id - ID do subject
   * @returns {boolean} true se o ID está sendo carregado
   */
  function isTermLoading(id) {
    return loadingIds.has(id);
  }

  /**
   * Verifica se há IDs sendo carregados
   * @returns {boolean}
   */
  function isLoading() {
    return loadingIds.size > 0;
  }

  /**
   * Carrega todos os subjects de uma vez via GET /api/vrac-subjects e popula o cache.
   * Executa apenas uma vez (resultado fica em cache para toda a sessão).
   * @returns {Promise<void>}
   */
  async function loadAllSubjects() {
    if (allSubjectsLoaded || allSubjectsLoading) return;
    allSubjectsLoading = true;
    try {
      const subjects = await api.getAllSubjects();
      for (const subject of subjects) {
        if (subject?.id && subject?.term) {
          subjectTermsCache.value[subject.id] = subject.term;
        }
      }
      allSubjectsLoaded = true;
    } catch (error) {
      console.error('Erro ao carregar lista completa de subjects:', error);
    } finally {
      allSubjectsLoading = false;
    }
  }

  /**
   * Limpa o cache (útil para testes ou refresh)
   */
  function clearCache() {
    subjectTermsCache.value = {};
    loadingIds.clear();
    allSubjectsLoaded = false;
  }

  return {
    loadSubjectTerms,
    loadAllSubjects,
    getTermById,
    isTermLoaded,
    isTermLoading,
    isLoading,
    clearCache,
  };
}
