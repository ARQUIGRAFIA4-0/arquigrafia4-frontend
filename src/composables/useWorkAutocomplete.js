import { ref, computed, watch, onMounted } from "vue";
import Fuse from "fuse.js";
import axios from "@/axios";
import { useAuthStore } from "@/store/auth";
import { useVracStore } from "@/store/vrac";

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
 * Materializa um rascunho do WorkCreateModal em uma VRACWork real. Chamado
 * apenas quando o usuário confirma o envio/salvamento, para que cancelamentos
 * não deixem registros órfãos.
 */
export const materializeWork = async (draft) => {
  const authStore = useAuthStore();
  const vracStore = useVracStore();
  const authHeader = { Authorization: authStore.authHeader };

  const titleIds = [];
  for (const t of draft.titles) {
    const res = await axios.post(
      "/api/vrac-titles",
      { label: t.label, type: t.type, pref: t.pref },
      { headers: authHeader },
    );
    titleIds.push(res.data.title.id);
  }

  // Resolve labels de papel do agente → IDs (busca existente ou cria com label em minúsculas)
  let roles = null;
  const roleIdCache = {};
  const resolveRoleId = async (label) => {
    if (roleIdCache[label]) return roleIdCache[label];
    if (!roles) roles = (await vracStore.getVRACAgentRoles()) || [];
    const match = roles.find(
      (r) => r.label?.toLowerCase() === label.toLowerCase(),
    );
    if (match) {
      roleIdCache[label] = match.id;
      return match.id;
    }
    const res = await axios.post(
      "/api/vrac-agent-roles",
      { label: label.toLowerCase() },
      { headers: authHeader },
    );
    const id = res.data.role.id;
    roles.push(res.data.role);
    roleIdCache[label] = id;
    return id;
  };

  const agentIds = [];
  for (const a of draft.agents) {
    let contribId = a.contributorNameId;
    if (!contribId) {
      const res = await axios.post(
        "/api/vrac-contributor-names",
        { name: a.contributorName, type: "personal" },
        { headers: authHeader },
      );
      contribId = res.data.name.id;
    }
    const roleId = await resolveRoleId(a.roleLabel);
    const res = await axios.post(
      "/api/vrac-agents",
      { contributor_name_id: contribId, role_id: roleId },
      { headers: authHeader },
    );
    agentIds.push(res.data.agent.id);
  }

  const dateIds = [];
  for (const d of draft.dates) {
    const res = await axios.post("/api/vrac-dates", d, { headers: authHeader });
    dateIds.push(res.data.date.id);
  }

  // Vocabulários: IDs existentes são usados diretamente; novos termos são criados via POST (em minúsculas).
  const VOCAB_CREATE = {
    stylePeriods: {
      endpoint: "vrac-style-periods",
      payload: (v) => ({ label: v }),
      responseKey: "period",
    },
    culturalCtxs: {
      endpoint: "vrac-cultural-contexts",
      payload: (v) => ({ label: v, vocab: "ARQUIGRAFIA" }),
      responseKey: "context",
    },
    workTypes: {
      endpoint: "vrac-work-types",
      payload: (v) => ({ label: v, vocab: "ARQUIGRAFIA" }),
      responseKey: "work_type",
    },
    techniques: {
      endpoint: "vrac-techniques",
      payload: (v) => ({ label: v, vocab: "ARQUIGRAFIA" }),
      responseKey: "technique",
    },
    materials: {
      endpoint: "vrac-materials",
      payload: (v) => ({ label: v, type: "other", vocab: "ARQUIGRAFIA" }),
      responseKey: "material",
    },
    subjects: {
      endpoint: "vrac-subjects",
      payload: (v) => ({ term: v, type: "otherTopic", vocab: "ARQUIGRAFIA" }),
      responseKey: "data",
    },
  };

  const resolvedVocab = {};
  for (const key of Object.keys(VOCAB_CREATE)) {
    const bucket = draft[key] || { existing: [], newTerms: [] };
    const ids = [...bucket.existing];
    const cfg = VOCAB_CREATE[key];
    for (const term of bucket.newTerms) {
      const lower = term.toLowerCase();
      const res = await axios.post(`/api/${cfg.endpoint}`, cfg.payload(lower), {
        headers: authHeader,
      });
      const created = res.data[cfg.responseKey];
      if (created?.id) ids.push(created.id);
    }
    resolvedVocab[key] = ids;
  }

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
    headers: authHeader,
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
