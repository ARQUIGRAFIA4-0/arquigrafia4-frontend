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
   * Verifica se há IDs sendo carregados
   * @returns {boolean}
   */
  function isLoading() {
    return loadingIds.size > 0;
  }

  /**
   * Limpa o cache (útil para testes ou refresh)
   */
  function clearCache() {
    subjectTermsCache.value = {};
    loadingIds.clear();
  }

  return {
    loadSubjectTerms,
    getTermById,
    isLoading,
    clearCache,
  };
}
