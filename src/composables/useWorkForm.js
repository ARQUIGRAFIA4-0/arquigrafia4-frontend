import { ref, computed, watch, onUnmounted } from "vue";
import Fuse from "fuse.js";
import { useVracStore } from "@/store/vrac";
import { api } from "@/services/api";

/**
 * Estado e regras do formulário de obra — títulos, autoria, datas, descrição e os
 * seis vocabulários VRAC.
 *
 * Extraído do `WorkCreateModal` para ser compartilhado com o formulário de sugestão
 * de edição (`WorkSuggestionEdit`), que precisa exatamente dos mesmos campos. O
 * modal continua dono do passo 1 (mapa, reverse geocoding, obras próximas), que só
 * existe na criação.
 *
 * Os itens carregam um `id` opcional: ausente significa "ainda não existe no
 * backend" e portanto precisa ser materializado no envio. Na criação nada tem `id`;
 * na edição, só o que o usuário acrescentou.
 */
export function useWorkForm() {
  const vracStore = useVracStore();

  // ── Localização (rótulo textual; as coordenadas vivem no passo 1 do modal) ────
  const locationLabel = ref("");

  // ── Títulos ──────────────────────────────────────────────────────────────────
  const TITLE_TYPES = [
    { value: "other", label: "Principal" },
    { value: "alternate", label: "Alternativo" },
  ];
  const titleTypeInput = ref("other");
  const titleLabelInput = ref("");
  const titles = ref([]); // [{ id?, type, label, pref }]

  const hasPreferredTitle = computed(() => titles.value.some((t) => t.type === "other"));

  const addTitle = () => {
    const label = titleLabelInput.value.trim();
    if (!label) return;
    const isPrincipal = titleTypeInput.value === "other";
    // Só pode existir UM título principal; um segundo é bloqueado (o dropdown já
    // impede selecioná-lo quando um existe — isto é a rede de segurança).
    if (isPrincipal && hasPreferredTitle.value) return;
    titles.value.push({ type: titleTypeInput.value, label, pref: isPrincipal });
    titleLabelInput.value = "";
    // Definido o principal, o padrão passa a ser "Alternativo".
    if (isPrincipal) titleTypeInput.value = "alternate";
  };

  const removeTitle = (index) => titles.value.splice(index, 1);

  const titleTypeLabel = (type) => TITLE_TYPES.find((t) => t.value === type)?.label || type;

  // ── Autoria ──────────────────────────────────────────────────────────────────
  const AGENT_ROLE_LABELS = ["Engenharia", "Arquitetura", "Paisagismo", "Construção"];
  const agentRoleInput = ref(AGENT_ROLE_LABELS[0]);
  const agentNameInput = ref("");
  const agents = ref([]); // [{ id?, roleLabel, contributorNameId, contributorName }]

  const allContributorNames = ref([]);
  let nameFuse = null;
  const filteredNameSuggestions = ref([]);
  const showNameSuggestions = ref(false);
  let nameDebounce = null;

  // Catálogo de nomes para o autocomplete. Chamado ao abrir o modal (criação) ou
  // ao montar o formulário (edição); falha em silêncio porque o campo segue
  // utilizável digitando um nome novo.
  const loadContributorNames = async () => {
    try {
      const contributors = await vracStore.getVRACContributorNames();
      if (!Array.isArray(contributors)) return;
      allContributorNames.value = contributors;
      nameFuse = new Fuse(contributors, { keys: ["name"], threshold: 0.3, includeScore: true });
    } catch {
      // non-fatal
    }
  };

  const onAgentNameInput = () => {
    if (nameDebounce) clearTimeout(nameDebounce);
    nameDebounce = setTimeout(() => {
      if (!agentNameInput.value.trim()) {
        filteredNameSuggestions.value = [];
        return;
      }
      if (nameFuse) {
        filteredNameSuggestions.value = nameFuse
          .search(agentNameInput.value)
          .map((r) => r.item)
          .slice(0, 8);
      }
    }, 250);
  };

  const hideNameSuggestions = () => {
    setTimeout(() => {
      showNameSuggestions.value = false;
    }, 200);
  };

  const addAgent = (contributorName = null) => {
    const name = contributorName?.name || agentNameInput.value.trim();
    if (!name || !agentRoleInput.value) return;
    agents.value.push({
      roleLabel: agentRoleInput.value,
      contributorNameId: contributorName?.id || null,
      contributorName: name,
    });
    agentNameInput.value = "";
    filteredNameSuggestions.value = [];
  };

  const removeAgent = (index) => agents.value.splice(index, 1);

  // ── Datas ────────────────────────────────────────────────────────────────────
  const DATE_TYPES = [
    { value: "creation", label: "Criação" },
    { value: "renovation", label: "Reforma" },
    { value: "demolition", label: "Demolição" },
  ];
  const dateTypeInput = ref("creation");
  const dateYearInput = ref("");
  const dateYearEndInput = ref("");
  const dateIntervalMode = ref("single"); // "single" | "interval"
  const dateCirca = ref(false);
  const dates = ref([]); // [{ id?, type, earliest, latest, circa }]

  // Teto no ano corrente: a obra fotografada já existe, ano futuro não faz sentido.
  const MIN_YEAR = 1;
  const MAX_YEAR = new Date().getFullYear();

  // Mantém no input apenas dígitos e no máximo 4 (ano).
  const clampYearDigits = (v) => String(v ?? "").replace(/\D/g, "").slice(0, 4);
  watch(dateYearInput, (v) => {
    const clean = clampYearDigits(v);
    if (clean !== v) dateYearInput.value = clean;
  });
  watch(dateYearEndInput, (v) => {
    const clean = clampYearDigits(v);
    if (clean !== v) dateYearEndInput.value = clean;
  });

  // Converte o input em um ano ISO de 4 dígitos (com zero à esquerda)
  // ou null se inválido.
  const normalizeYear = (raw) => {
    const digits = String(raw ?? "").replace(/\D/g, "");
    if (!digits) return null;
    const n = parseInt(digits, 10);
    if (!Number.isInteger(n) || n < MIN_YEAR || n > MAX_YEAR) return null;
    return String(n).padStart(4, "0");
  };

  // O backend não limita datas por tipo. A regra é imposta aqui:
  // Criação e Demolição são únicas por obra; Reforma pode repetir.
  const SINGULAR_DATE_TYPES = ["creation", "demolition"];
  const hasDateOfType = (type) => dates.value.some((d) => d.type === type);
  const isDateTypeDisabled = (type) => SINGULAR_DATE_TYPES.includes(type) && hasDateOfType(type);

  const addDate = () => {
    if (isDateTypeDisabled(dateTypeInput.value)) return;
    const year = normalizeYear(dateYearInput.value);
    if (!year) return;
    const earliest = `${year}-01-01`;
    // No modo intervalo, só usa o ano final se for válido e não anterior ao inicial.
    const yearEnd = dateIntervalMode.value === "interval" ? normalizeYear(dateYearEndInput.value) : null;
    const latest = yearEnd && yearEnd >= year ? `${yearEnd}-12-31` : `${year}-12-31`;
    dates.value.push({
      type: dateTypeInput.value,
      earliest,
      latest,
      circa: dateCirca.value,
    });
    dateYearInput.value = "";
    dateYearEndInput.value = "";
    dateCirca.value = false;
    // Se o tipo recém-adicionado esgotou (único), pula o seletor para o primeiro
    // tipo ainda disponível. Evita ficar parado em tipo bloqueado.
    if (isDateTypeDisabled(dateTypeInput.value)) {
      const next = DATE_TYPES.find((d) => !isDateTypeDisabled(d.value));
      if (next) dateTypeInput.value = next.value;
    }
  };

  const removeDate = (index) => dates.value.splice(index, 1);

  const dateTypeLabel = (type) => DATE_TYPES.find((d) => d.value === type)?.label || type;

  const formatDateChip = (d) => {
    // parseInt remove o zero à esquerda da normalização (ex.: "0222" → 222).
    const year = parseInt(d.earliest?.slice(0, 4), 10) || "";
    const yearEnd = parseInt(d.latest?.slice(0, 4), 10) || "";
    const label = year === yearEnd ? `${year}` : `${year}–${yearEnd}`;
    return `${dateTypeLabel(d.type)}: ${d.circa ? "c. " : ""}${label}`;
  };

  // ── Descrição ────────────────────────────────────────────────────────────────
  const descriptionInput = ref("");

  // ── Vocabulários ─────────────────────────────────────────────────────────────
  const makeVocabField = () => ({
    input: ref(""),
    selected: ref([]), // [{ id, label }]
    suggestions: ref([]),
    showSuggestions: ref(false),
    loading: ref(false),
    reqId: 0, // sequência p/ descartar respostas fora de ordem
    cache: new Map(), // query → resultado (evita requisições repetidas)
    debounce: null,
  });

  const stylePeriods = makeVocabField();
  const culturalCtxs = makeVocabField();
  const workTypes = makeVocabField();
  const techniques = makeVocabField();
  const materials = makeVocabField();
  const subjects3 = makeVocabField(); // "subjects" já usado no escopo de ImageMetadataUpload

  const VOCAB_FIELDS = [
    { field: stylePeriods, label: "Aspectos estéticos",     explain: "Estilos e períodos históricos relacionados à obra", endpoint: "vrac-style-periods",     labelKey: "label", workKey: "stylePeriods" },
    { field: culturalCtxs, label: "Contexto cultural",      explain: "Contextos culturais relacionados à obra",           endpoint: "vrac-cultural-contexts", labelKey: "label", workKey: "culturalContexts" },
    { field: workTypes,    label: "Tipologia",              explain: "Tipo de obra arquitetônica",                        endpoint: "vrac-work-types",        labelKey: "label", workKey: "workTypes" },
    { field: techniques,   label: "Técnicas de construção", explain: "Técnicas construtivas utilizadas na obra",          endpoint: "vrac-techniques",        labelKey: "label", workKey: "techniques" },
    { field: materials,    label: "Materiais",              explain: "Materiais utilizados na obra",                      endpoint: "vrac-materials",         labelKey: "label", workKey: "materials" },
    { field: subjects3,    label: "Assuntos",               explain: "Assuntos e temas relacionados à obra",              endpoint: "vrac-subjects",          labelKey: "term",  workKey: "subjects" },
  ];

  // Campo de texto de cada vocabulário (`term` em Assuntos, `label` nos demais),
  // usado por addVocabItem ao resolver { id, label } do item selecionado.
  for (const { field, labelKey } of VOCAB_FIELDS) field._labelKey = labelKey;

  // A busca dos vocabulários é feita no backend (?search=), não baixando o
  // catálogo inteiro na abertura.
  const VOCAB_MIN_CHARS = 2;

  const onVocabInput = (vfMeta) => {
    const vf = vfMeta.field;
    if (vf.debounce) clearTimeout(vf.debounce);
    vf.debounce = setTimeout(async () => {
      const q = vf.input.value.trim();
      if (q.length < VOCAB_MIN_CHARS) {
        vf.suggestions.value = [];
        return;
      }

      // Cache: query já buscada não gera nova requisição
      if (vf.cache.has(q)) {
        vf.suggestions.value = vf.cache.get(q);
        return;
      }

      // Guarda de sequência: respostas fora de ordem são descartadas.
      const myReq = ++vf.reqId;
      vf.loading.value = true;
      try {
        const items = await api.searchVocab(vfMeta.endpoint, q);
        if (myReq !== vf.reqId) return; // resposta velha
        vf.cache.set(q, items);
        vf.suggestions.value = items;
      } catch {
        if (myReq === vf.reqId) vf.suggestions.value = [];
      } finally {
        if (myReq === vf.reqId) vf.loading.value = false;
      }
    }, 300);
  };

  const addVocabItem = (vf, item) => {
    if (!item) return;
    if (vf.selected.value.some((s) => s.id === item.id)) return;
    const labelKey = vf._labelKey ?? "label";
    vf.selected.value.push({ id: item.id, label: item[labelKey] });
    vf.input.value = "";
    vf.suggestions.value = [];
  };

  const canCreateVocab = (vfMeta) => {
    const term = vfMeta.field.input.value.trim();
    if (!term) return false;
    const labelKey = vfMeta.labelKey;
    // Resultado atual da busca no servidor (a busca é substring, então um
    // termo idêntico aparece nos resultados quando existe). Se escapar ao limite
    // da página e um duplicado for criado, a materialização deduplica no envio.
    const items = vfMeta.field.suggestions.value ?? [];
    if (items.some((i) => (i[labelKey] || "").toLowerCase() === term.toLowerCase())) return false;
    if (vfMeta.field.selected.value.some((s) => s.label.toLowerCase() === term.toLowerCase())) return false;
    return true;
  };

  // Termo novo fica só no cliente — o POST acontece quando o consumidor materializa.
  const createAndAddVocabItem = (vfMeta) => {
    const term = vfMeta.field.input.value.trim().toLowerCase();
    if (!term) return;
    if (vfMeta.field.selected.value.some((s) => s.label.toLowerCase() === term)) return;
    vfMeta.field.selected.value.push({ id: null, label: term, isNew: true });
    vfMeta.field.input.value = "";
    vfMeta.field.suggestions.value = [];
  };

  const findExactVocabMatch = (vfMeta) => {
    const term = vfMeta.field.input.value.trim().toLowerCase();
    if (!term) return null;
    const labelKey = vfMeta.labelKey;
    const items = vfMeta.field.suggestions.value ?? [];
    return items.find((i) => (i[labelKey] || "").toLowerCase() === term) || null;
  };

  const commitVocabInput = (vfMeta) => {
    const exact = findExactVocabMatch(vfMeta);
    if (exact) {
      addVocabItem(vfMeta.field, exact);
      return;
    }
    const first = vfMeta.field.suggestions.value[0];
    if (first) {
      addVocabItem(vfMeta.field, first);
    } else if (canCreateVocab(vfMeta)) {
      createAndAddVocabItem(vfMeta);
    }
  };

  // Enter no input e clique no "+" resolvem do mesmo jeito.
  const onVocabEnter = commitVocabInput;
  const onVocabPlusClick = commitVocabInput;

  const removeVocabItem = (vf, index) => vf.selected.value.splice(index, 1);

  const hideVocabSuggestions = (vf) => {
    setTimeout(() => {
      vf.showSuggestions.value = false;
    }, 200);
  };

  // ── Draft ────────────────────────────────────────────────────────────────────
  const canSubmit = computed(() => hasPreferredTitle.value);

  const vocabDraftBuckets = (vf) => {
    const existing = [];
    const newTerms = [];
    for (const item of vf.selected.value) {
      if (item.id) existing.push(item.id);
      else newTerms.push(item.label);
    }
    return { existing, newTerms };
  };

  /**
   * Monta o rascunho consumido por `materializeWork`. `coords` vem do passo 1 do
   * modal na criação; na edição a localização não é sugerível (o backend ainda não
   * aceita lat/lng no payload de sugestão), então o parâmetro é omitido.
   */
  const buildDraft = (coords = null) => {
    const preferredTitle = titles.value.find((t) => t.pref)?.label || titles.value[0]?.label || "";

    return {
      coords: coords
        ? {
            lat: parseFloat(coords.lat.toFixed(8)),
            lng: parseFloat(coords.lng.toFixed(8)),
          }
        : null,
      locationLabel: locationLabel.value || "",
      titles: titles.value.map((t) => ({ id: t.id, label: t.label, type: t.type, pref: t.pref })),
      agents: agents.value.map((a) => ({
        id: a.id,
        roleLabel: a.roleLabel,
        contributorNameId: a.contributorNameId,
        contributorName: a.contributorName,
      })),
      dates: dates.value.map((d) => ({
        id: d.id,
        type: d.type,
        earliest_date: d.earliest,
        latest_date: d.latest,
        circa_earliest_date: d.circa,
        circa_latest_date: d.circa,
      })),
      description: descriptionInput.value.trim() || null,
      stylePeriods: vocabDraftBuckets(stylePeriods),
      culturalCtxs: vocabDraftBuckets(culturalCtxs),
      workTypes: vocabDraftBuckets(workTypes),
      techniques: vocabDraftBuckets(techniques),
      materials: vocabDraftBuckets(materials),
      subjects: vocabDraftBuckets(subjects3),
      // Dicas de exibição para o chip de obra do componente pai
      label: preferredTitle,
      address: locationLabel.value || "",
    };
  };

  /**
   * Preenche o formulário a partir do objeto normalizado de `api.getWorkDetails`.
   *
   * Os itens vindos da obra guardam o `id`, então não são recriados no envio. Note
   * que promover um título a principal não é editar o registro existente: `pref` é
   * coluna do próprio `vrac_title` e títulos são compartilháveis entre obras, então
   * a UI força remover e re-adicionar — o novo item nasce sem `id` e é materializado
   * como um registro novo com `pref: true`.
   */
  const populateFromWork = (work) => {
    if (!work) return;

    locationLabel.value = work.location?.label || "";
    descriptionInput.value = work.description || "";

    titles.value = (work.titles || [])
      .filter((t) => t.label)
      .map((t) => ({
        id: t.id,
        label: t.label,
        type: t.type || (t.pref ? "other" : "alternate"),
        pref: Boolean(t.pref),
      }));
    // Um principal já existente desabilita a opção no dropdown; começar em
    // "Alternativo" evita abrir o formulário num estado bloqueado.
    titleTypeInput.value = hasPreferredTitle.value ? "alternate" : "other";

    agents.value = (work.agents || [])
      .filter((a) => a.name)
      .map((a) => ({
        id: a.id,
        roleLabel: a.role || AGENT_ROLE_LABELS[0],
        contributorNameId: a.contributorNameId ?? null,
        contributorName: a.name,
      }));

    dates.value = (work.dates || [])
      .filter((d) => d.earliestYear || d.latestYear)
      .map((d) => {
        const earliestYear = d.earliestYear || d.latestYear;
        const latestYear = d.latestYear || d.earliestYear;
        return {
          id: d.id,
          type: d.type || "creation",
          earliest: `${String(earliestYear).padStart(4, "0")}-01-01`,
          latest: `${String(latestYear).padStart(4, "0")}-12-31`,
          circa: Boolean(d.circa),
        };
      });
    const nextType = DATE_TYPES.find((d) => !isDateTypeDisabled(d.value));
    if (nextType) dateTypeInput.value = nextType.value;

    for (const { field, workKey } of VOCAB_FIELDS) {
      field.selected.value = (work[workKey] || [])
        .filter((item) => item.label)
        .map((item) => ({ id: item.id, label: item.label }));
    }
  };

  // ── Ciclo de vida ────────────────────────────────────────────────────────────
  const reset = () => {
    locationLabel.value = "";
    titles.value = [];
    titleLabelInput.value = "";
    titleTypeInput.value = "other";
    agents.value = [];
    agentRoleInput.value = AGENT_ROLE_LABELS[0];
    agentNameInput.value = "";
    filteredNameSuggestions.value = [];
    dates.value = [];
    dateTypeInput.value = "creation";
    dateYearInput.value = "";
    dateYearEndInput.value = "";
    dateIntervalMode.value = "single";
    dateCirca.value = false;
    descriptionInput.value = "";
    for (const { field } of VOCAB_FIELDS) {
      if (field.debounce) clearTimeout(field.debounce);
      field.input.value = "";
      field.selected.value = [];
      field.suggestions.value = [];
      field.showSuggestions.value = false;
      field.loading.value = false;
      field.reqId++; // invalida qualquer resposta em voo
      field.cache.clear();
    }
  };

  const clearTimers = () => {
    if (nameDebounce) clearTimeout(nameDebounce);
    for (const { field } of VOCAB_FIELDS) {
      if (field.debounce) clearTimeout(field.debounce);
    }
  };

  onUnmounted(clearTimers);

  return {
    // localização
    locationLabel,
    // títulos
    TITLE_TYPES,
    titleTypeInput,
    titleLabelInput,
    titles,
    hasPreferredTitle,
    addTitle,
    removeTitle,
    titleTypeLabel,
    // autoria
    AGENT_ROLE_LABELS,
    agentRoleInput,
    agentNameInput,
    agents,
    allContributorNames,
    filteredNameSuggestions,
    showNameSuggestions,
    loadContributorNames,
    onAgentNameInput,
    hideNameSuggestions,
    addAgent,
    removeAgent,
    // datas
    DATE_TYPES,
    dateTypeInput,
    dateYearInput,
    dateYearEndInput,
    dateIntervalMode,
    dateCirca,
    dates,
    MIN_YEAR,
    MAX_YEAR,
    normalizeYear,
    isDateTypeDisabled,
    addDate,
    removeDate,
    dateTypeLabel,
    formatDateChip,
    // descrição
    descriptionInput,
    // vocabulários
    VOCAB_FIELDS,
    VOCAB_MIN_CHARS,
    onVocabInput,
    addVocabItem,
    canCreateVocab,
    createAndAddVocabItem,
    onVocabEnter,
    onVocabPlusClick,
    removeVocabItem,
    hideVocabSuggestions,
    // draft / ciclo de vida
    canSubmit,
    buildDraft,
    populateFromWork,
    reset,
    clearTimers,
  };
}
