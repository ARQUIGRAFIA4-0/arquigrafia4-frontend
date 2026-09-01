import { ref, computed, watch, onMounted } from "vue";
import Fuse from "fuse.js";
import axios from "@/axios";
import { useAuthStore } from "@/store/auth";
import { useVracStore } from "@/store/vrac";
import { api } from "@/services/api";

/**
 * Autocomplete de obras (VRACWork) compartilhado entre o envio de imagem e a
 * edição de metadados. O valor selecionado é sempre um objeto
 * `{ id, label, address }` (obra existente) ou `{ draft, label, address }`
 * (rascunho vindo do WorkCreateModal, ainda não criado no backend).
 */

const FUSE_OPTIONS = {
  keys: [
    { name: "titles.label", weight: 0.7 },
    { name: "location.label", weight: 0.3 },
  ],
  threshold: 0.3,
  includeScore: true,
};

export const workPrimaryTitle = (work) => {
  const titles = work?.titles || [];
  const preferred = titles.find((t) => t.pref);
  return (preferred || titles[0])?.label || "(sem título)";
};

export const workMatchedAlternate = (work, query) => {
  if (!query?.trim()) return null;
  const q = query.trim().toLowerCase();
  const preferred = workPrimaryTitle(work).toLowerCase();
  if (preferred.includes(q)) return null;
  const alt = (work?.titles || []).find(
    (t) => !t.pref && t.label.toLowerCase().includes(q),
  );
  return alt?.label || null;
};

/**
 * Cria no backend as partes de um rascunho de obra — títulos, agentes, datas e
 * termos de vocabulário — devolvendo as listas de IDs prontas para o `sync`.
 *
 * Itens que já trazem `id` são reaproveitados sem POST: é o que permite o
 * formulário de sugestão de edição materializar só o que o usuário acrescentou.
 * No fluxo de criação nenhum item tem `id`, então tudo é criado, como antes.
 */
export const materializeWorkParts = async (authHeader, draft) => {
  const vracStore = useVracStore();

  const titleIds = [];
  for (const t of draft.titles || []) {
    if (t.id) {
      titleIds.push(t.id);
      continue;
    }
    titleIds.push(await api.createVracTitle(authHeader, t));
  }

  // Resolve labels de papel do agente → IDs (busca existente ou cria com label em minúsculas)
  let roles = null;
  const roleIdCache = {};
  const resolveRoleId = async (label) => {
    if (roleIdCache[label]) return roleIdCache[label];
    if (!roles) roles = (await vracStore.getVRACAgentRoles()) || [];
    const match = roles.find((r) => r.label?.toLowerCase() === label.toLowerCase());
    if (match) {
      roleIdCache[label] = match.id;
      return match.id;
    }
    const created = await api.createVracAgentRole(authHeader, label);
    roles.push(created);
    roleIdCache[label] = created.id;
    return created.id;
  };

  const agentIds = [];
  for (const a of draft.agents || []) {
    if (a.id) {
      agentIds.push(a.id);
      continue;
    }
    const contributorNameId =
      a.contributorNameId || (await api.createVracContributorName(authHeader, a.contributorName));
    const roleId = await resolveRoleId(a.roleLabel);
    agentIds.push(await api.createVracAgent(authHeader, { contributorNameId, roleId }));
  }

  const dateIds = [];
  for (const d of draft.dates || []) {
    if (d.id) {
      dateIds.push(d.id);
      continue;
    }
    // `id` é campo só do cliente; o backend recebe apenas as colunas da data.
    const date = { ...d };
    delete date.id;
    dateIds.push(await api.createVracDate(authHeader, date));
  }

  // Vocabulários: IDs existentes são usados diretamente; termos novos são criados
  // em minúsculas, sempre no vocab "Arquigrafia" (VCAA é reservado ao importado).
  // O mapa de endpoints e envelopes vive em api.js, compartilhado com a resolução
  // de labels do diff de sugestões.
  const vocabIds = {};
  for (const payloadKey of api.VRAC_VOCAB_KEYS) {
    const draftKey = api.VRAC_ENTITIES[payloadKey].draftKey;
    vocabIds[draftKey] = await api.resolveVocabIds(authHeader, payloadKey, draft[draftKey]);
  }

  return { titleIds, agentIds, dateIds, vocabIds };
};

/**
 * Materializa um rascunho do WorkCreateModal em uma VRACWork real. Chamado
 * apenas quando o usuário confirma o envio/salvamento, para que cancelamentos
 * não deixem registros órfãos.
 */
export const materializeWork = async (draft) => {
  const authStore = useAuthStore();
  const authHeader = authStore.authHeader;

  const { titleIds, agentIds, dateIds, vocabIds: resolvedVocab } = await materializeWorkParts(
    authHeader,
    draft,
  );

  const workPayload = {
    latitude: draft.coords.lat,
    longitude: draft.coords.lng,
    location_label: draft.locationLabel || undefined,
    titles: titleIds,
  };
  if (agentIds.length) workPayload.agents = agentIds;
  if (dateIds.length) workPayload.dates = dateIds;
  if (draft.description) workPayload.description = draft.description;
  if (resolvedVocab.stylePeriods.length)
    workPayload.style_periods = resolvedVocab.stylePeriods;
  if (resolvedVocab.culturalCtxs.length)
    workPayload.cultural_contexts = resolvedVocab.culturalCtxs;
  if (resolvedVocab.workTypes.length)
    workPayload.work_types = resolvedVocab.workTypes;
  if (resolvedVocab.techniques.length)
    workPayload.techniques = resolvedVocab.techniques;
  if (resolvedVocab.materials.length)
    workPayload.materials = resolvedVocab.materials;
  if (resolvedVocab.subjects.length)
    workPayload.subjects = resolvedVocab.subjects;

  const workRes = await axios.post("/api/vrac-works", workPayload, {
    headers: { Authorization: authHeader },
  });
  return workRes.data.data;
};

/**
 * Garante que a obra selecionada tenha um ID no backend, materializando o
 * rascunho se necessário. Devolve `{ id, work }` — `work` só vem preenchido
 * quando a obra acabou de ser criada. O ID resolvido é gravado de volta na
 * seleção para que uma nova tentativa de envio não recrie a obra.
 */
export const resolveWorkId = async (selected) => {
  if (!selected) return { id: null, work: null };
  if (selected.id) return { id: selected.id, work: null };
  if (!selected.draft) return { id: null, work: null };

  const created = await materializeWork(selected.draft);
  const id = created?.id || null;
  if (id) {
    selected.id = id;
    selected.draft = null;
  }
  return { id, work: created };
};

/**
 * @param {import("vue").Ref} selected Ref do valor selecionado (v-model do campo).
 * @param {{ autoLoad?: boolean }} options
 */
export function useWorkAutocomplete(selected, { autoLoad = true } = {}) {
  const vracStore = useVracStore();

  const allWorks = ref([]);
  const workInput = ref("");
  const filteredWorkSuggestions = ref([]);
  const showWorkSuggestions = ref(false);
  const showWorkCreateModal = ref(false);
  let workFuse = null;
  let workDebounceTimer = null;

  const buildFuse = () => {
    workFuse = new Fuse(allWorks.value, FUSE_OPTIONS);
  };

  const loadWorks = async () => {
    try {
      const works = await vracStore.getVRACWorks();
      if (Array.isArray(works)) {
        allWorks.value = works;
        buildFuse();
      }
    } catch (error) {
      console.error("Erro ao carregar obras:", error);
    }
  };

  // Torna uma obra recém-criada buscável sem refazer a requisição da lista.
  const registerWork = (work) => {
    if (!work?.id) return;
    allWorks.value.push(work);
    buildFuse();
  };

  const canShowCreateWork = computed(() => workInput.value.trim().length > 0);

  watch(selected, (value) => {
    if (!value) workInput.value = "";
  });

  const onWorkInputChange = () => {
    if (selected.value && workInput.value !== selected.value.label) {
      selected.value = null;
    }

    if (workDebounceTimer) clearTimeout(workDebounceTimer);

    workDebounceTimer = setTimeout(() => {
      if (!workInput.value.trim()) {
        filteredWorkSuggestions.value = [];
        return;
      }

      if (workFuse) {
        const results = workFuse.search(workInput.value);
        filteredWorkSuggestions.value = results
          .map((result) => result.item)
          .slice(0, 10);
      }
    }, 300);
  };

  const hideWorkSuggestions = () => {
    setTimeout(() => {
      showWorkSuggestions.value = false;
    }, 200);
  };

  const selectWork = (work) => {
    selected.value = {
      id: work.id,
      label: workPrimaryTitle(work),
      address: work.location?.label || null,
    };
    filteredWorkSuggestions.value = [];
    showWorkSuggestions.value = false;
  };

  const clearWork = () => {
    selected.value = null;
    workInput.value = "";
  };

  // O modal emite um rascunho independente. Nenhum registro é criado no backend
  // aqui — veja `materializeWork` para os POSTs reais, adiados até o envio.
  const onWorkCreated = (draft) => {
    selected.value = {
      draft,
      label: draft.label || "(sem título)",
      address: draft.address || null,
    };
    filteredWorkSuggestions.value = [];
    showWorkSuggestions.value = false;
  };

  if (autoLoad) onMounted(loadWorks);

  return {
    allWorks,
    workInput,
    filteredWorkSuggestions,
    showWorkSuggestions,
    showWorkCreateModal,
    canShowCreateWork,
    loadWorks,
    registerWork,
    workPrimaryTitle,
    workMatchedAlternate,
    onWorkInputChange,
    hideWorkSuggestions,
    selectWork,
    clearWork,
    onWorkCreated,
  };
}
