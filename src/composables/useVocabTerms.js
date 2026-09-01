import { api } from '@/services/api';
import { createTermCache } from '@/helpers/createTermCache';

/**
 * Um composable por domínio de vocabulário VRAC, mesmo padrão de
 * useSubjectTerms.js (cache a nível de módulo, compartilhado por toda a
 * sessão). `subjects` continua em useSubjectTerms.js — não migrado pra cá
 * porque usa `term` como campo de rótulo (não `label`) e já funciona.
 */

export const useMaterialTerms = createTermCache({
  getById: api.getMaterialById,
  getAll: api.getAllMaterials,
});

export const useTechniqueTerms = createTermCache({
  getById: api.getTechniqueById,
  getAll: api.getAllTechniques,
});

export const useStylePeriodTerms = createTermCache({
  getById: api.getStylePeriodById,
  getAll: api.getAllStylePeriods,
});

export const useCulturalContextTerms = createTermCache({
  getById: api.getCulturalContextById,
  getAll: api.getAllCulturalContexts,
});

export const useWorkTypeTerms = createTermCache({
  getById: api.getWorkTypeById,
  getAll: api.getAllWorkTypes,
});