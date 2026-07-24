<script setup>
import { ref, computed, watch, onUnmounted, markRaw } from "vue";
import { useVracStore } from "@/store/vrac";
import MapLibreMap from "@/components/map/MapLibreMap.vue";
import MapControls from "@/components/map/MapControls.vue";
import UiField from "@/components/ui/UiField.vue";
import Fuse from "fuse.js";
import axios from "@/axios";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // Texto para pré-preencher o input de título ao abrir (ex.: vindo da busca que
  // sugeriu criar a obra). Fica só no input; não é adicionado como título.
  initialTitle: { type: String, default: "" },
});

const emit = defineEmits(["update:modelValue", "created"]);

const vracStore = useVracStore();

// ── Step management ─────────────────────────────────────────────────────────
const step = ref(1);

// ── Step 1: map ──────────────────────────────────────────────────────────────
const mapStyleUrl = "https://tiles.openfreemap.org/styles/positron";
const mapCenter = [-46.6388, -23.5489]; // São Paulo
const mapZoom = 12;
const mapInstance = ref(null);
const pickedCoords = ref(null);   // { lng, lat }
const pickedAddress = ref("");
const isReverseGeocoding = ref(false);

const handleMapReady = (map) => {
  mapInstance.value = markRaw(map);
};

const handleMapClick = async ({ lng, lat }) => {
  pickedCoords.value = { lng, lat };
  isReverseGeocoding.value = true;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { "Accept-Language": "pt-BR,pt" } }
    );
    const data = await res.json();
    pickedAddress.value = data.display_name || "";
  } catch {
    pickedAddress.value = "";
  } finally {
    isReverseGeocoding.value = false;
  }
};

const canAdvance = computed(() => pickedCoords.value !== null && !isReverseGeocoding.value);

const showSearch = ref(true); // Começa visível;
const searchQuery = ref("");
const searchSuggestions = ref([]);
const isForwardGeocoding = ref(false);

const onSearchInput = async () => {
  const q = searchQuery.value.trim();
  if (!q) { searchSuggestions.value = []; return; }
  isForwardGeocoding.value = true;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`,
      { headers: { "Accept-Language": "pt-BR,pt" } }
    );
    searchSuggestions.value = await res.json();
  } catch {
    searchSuggestions.value = [];
  } finally {
    isForwardGeocoding.value = false;
  }
};

let searchDebounce = null;
const onSearchInputDebounced = () => {
  if (searchDebounce) clearTimeout(searchDebounce);
  searchDebounce = setTimeout(onSearchInput, 350);
};

const selectSearchResult = async (result) => {
  const lng = parseFloat(result.lon);
  const lat = parseFloat(result.lat);
  searchQuery.value = "";
  searchSuggestions.value = [];
  mapInstance.value?.flyTo({ center: [lng, lat], zoom: 16 });
  await handleMapClick({ lng, lat });
};

const goToStep2 = () => {
  if (!canAdvance.value) return;
  locationLabel.value = pickedAddress.value;
  step.value = 2;
};

// ── Step 2: metadata ─────────────────────────────────────────────────────────

// --- Location label (editable) ---
const locationLabel = ref("");

// --- Titles ---
const TITLE_TYPES = [
  { value: "other", label: "Principal" },
  { value: "alternate", label: "Alternativo" },
];
const titleTypeInput = ref("other");
const titleLabelInput = ref("");
const titles = ref([]);  // [{ type, label, pref }]

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

const titleTypeLabel = (type) =>
  TITLE_TYPES.find((t) => t.value === type)?.label || type;

// --- Agents (authors) ---
const AGENT_ROLE_LABELS = ["Engenharia", "Arquitetura", "Paisagismo", "Construção"];
const agentRoleInput = ref(AGENT_ROLE_LABELS[0]);
const agentNameInput = ref("");
const agents = ref([]);  // [{ roleLabel, contributorNameId, contributorName }]

const allContributorNames = ref([]);
let nameFuse = null;
const filteredNameSuggestions = ref([]);
const showNameSuggestions = ref(false);
let nameDebounce = null;

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
  setTimeout(() => { showNameSuggestions.value = false; }, 200);
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

// --- Dates ---
const DATE_TYPES = [
  { value: "creation", label: "Criação" },
  { value: "renovation", label: "Reforma" },
  { value: "demolition", label: "Demolição" },
];
const dateTypeInput = ref("creation");
const dateYearInput = ref("");
const dateYearEndInput = ref("");
const dateIntervalMode = ref("single");  // "single" | "interval"
const dateCirca = ref(false);
const dates = ref([]);  // [{ type, earliest, latest, circa }]

const addDate = () => {
  const year = String(dateYearInput.value ?? "").trim();
  if (!year) return;
  const earliest = `${year}-01-01`;
  const yearEnd = String(dateYearEndInput.value ?? "").trim();
  const latest = dateIntervalMode.value === "interval" && yearEnd
    ? `${yearEnd}-12-31`
    : `${year}-12-31`;
  dates.value.push({
    type: dateTypeInput.value,
    earliest,
    latest,
    circa: dateCirca.value,
  });
  dateYearInput.value = "";
  dateYearEndInput.value = "";
  dateCirca.value = false;
};

const removeDate = (index) => dates.value.splice(index, 1);

const dateTypeLabel = (type) =>
  DATE_TYPES.find((d) => d.value === type)?.label || type;

const formatDateChip = (d) => {
  const year = d.earliest?.slice(0, 4) || "";
  const yearEnd = d.latest?.slice(0, 4) || "";
  const label = year === yearEnd ? year : `${year}–${yearEnd}`;
  return `${dateTypeLabel(d.type)}: ${d.circa ? "c. " : ""}${label}`;
};

// --- Description ---
const descriptionInput = ref("");

// ── Step 3: complementary data ────────────────────────────────────────────────

// Shared autocomplete helper factory
const makeVocabField = () => ({
  input: ref(""),
  selected: ref([]),   // [{ id, label }]
  suggestions: ref([]),
  showSuggestions: ref(false),
  fuse: null,
  debounce: null,
});

const stylePeriods   = makeVocabField();
const culturalCtxs   = makeVocabField();
const workTypes      = makeVocabField();
const techniques     = makeVocabField();
const materials      = makeVocabField();
const subjects3      = makeVocabField(); // "subjects" already used in ImageMetadataUpload scope

const VOCAB_FIELDS = [
  { field: stylePeriods,  label: "Aspectos estéticos",      explain: "Estilos e períodos históricos relacionados à obra",     endpoint: "vrac-style-periods",     labelKey: "label", createPayload: (v) => ({ label: v }),                              responseKey: "period"    },
  { field: culturalCtxs,  label: "Contexto cultural",       explain: "Contextos culturais relacionados à obra",               endpoint: "vrac-cultural-contexts", labelKey: "label", createPayload: (v) => ({ label: v, vocab: "ARQUIGRAFIA" }),         responseKey: "context"   },
  { field: workTypes,     label: "Tipologia",               explain: "Tipo de obra arquitetônica",                            endpoint: "vrac-work-types",        labelKey: "label", createPayload: (v) => ({ label: v, vocab: "ARQUIGRAFIA" }),         responseKey: "work_type" },
  { field: techniques,    label: "Técnicas de construção",  explain: "Técnicas construtivas utilizadas na obra",              endpoint: "vrac-techniques",        labelKey: "label", createPayload: (v) => ({ label: v, vocab: "ARQUIGRAFIA" }),         responseKey: "technique" },
  { field: materials,     label: "Materiais",               explain: "Materiais utilizados na obra",                          endpoint: "vrac-materials",         labelKey: "label", createPayload: (v) => ({ label: v, type: "other", vocab: "ARQUIGRAFIA" }), responseKey: "material"  },
  { field: subjects3,     label: "Assuntos",                explain: "Assuntos e temas relacionados à obra",                  endpoint: "vrac-subjects",          labelKey: "term",  createPayload: (v) => ({ term: v, type: "otherTopic", vocab: "ARQUIGRAFIA" }), responseKey: "data"     },
];

const onVocabInput = (vf) => {
  if (vf.debounce) clearTimeout(vf.debounce);
  vf.debounce = setTimeout(() => {
    const q = vf.input.value.trim();
    if (!q) { vf.suggestions.value = []; return; }
    if (vf.fuse) {
      vf.suggestions.value = vf.fuse.search(q).map((r) => r.item).slice(0, 8);
    }
  }, 200);
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
  const items = vfMeta.field._items ?? [];
  if (items.some((i) => (i[labelKey] || "").toLowerCase() === term.toLowerCase())) return false;
  if (vfMeta.field.selected.value.some((s) => s.label.toLowerCase() === term.toLowerCase())) return false;
  return true;
};

// Stage a new term locally — it is only POSTed when the parent materializes the work draft.
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
  const items = vfMeta.field._items ?? [];
  return items.find((i) => (i[labelKey] || "").toLowerCase() === term) || null;
};

const onVocabEnter = (vfMeta) => {
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

const onVocabPlusClick = (vfMeta) => {
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

const removeVocabItem = (vf, index) => vf.selected.value.splice(index, 1);

const hideVocabSuggestions = (vf) => {
  setTimeout(() => { vf.showSuggestions.value = false; }, 200);
};

// --- Validation ---
const hasPreferredTitle = computed(() =>
  titles.value.some((t) => t.type === "other")
);

const canSubmit = computed(() => hasPreferredTitle.value);

// --- Submit ---
const errorMessage = ref("");

const vocabDraftBuckets = (vf) => {
  const existing = [];
  const newTerms = [];
  for (const item of vf.selected.value) {
    if (item.id) existing.push(item.id);
    else newTerms.push(item.label);
  }
  return { existing, newTerms };
};

const buildDraft = () => {
  const preferredTitle =
    titles.value.find((t) => t.pref)?.label || titles.value[0]?.label || "";

  return {
    coords: {
      lat: parseFloat(pickedCoords.value.lat.toFixed(8)),
      lng: parseFloat(pickedCoords.value.lng.toFixed(8)),
    },
    locationLabel: locationLabel.value || "",
    titles: titles.value.map((t) => ({ label: t.label, type: t.type, pref: t.pref })),
    agents: agents.value.map((a) => ({
      roleLabel: a.roleLabel,
      contributorNameId: a.contributorNameId,
      contributorName: a.contributorName,
    })),
    dates: dates.value.map((d) => ({
      type: d.type,
      earliest_date: d.earliest,
      latest_date: d.latest,
      circa_earliest_date: d.circa,
      circa_latest_date: d.circa,
    })),
    description: descriptionInput.value.trim() || null,
    stylePeriods:   vocabDraftBuckets(stylePeriods),
    culturalCtxs:   vocabDraftBuckets(culturalCtxs),
    workTypes:      vocabDraftBuckets(workTypes),
    techniques:     vocabDraftBuckets(techniques),
    materials:      vocabDraftBuckets(materials),
    subjects:       vocabDraftBuckets(subjects3),
    // Display hints for the parent's work chip
    label: preferredTitle,
    address: locationLabel.value || "",
  };
};

const handleSubmit = () => {
  if (!canSubmit.value) return;
  const draft = buildDraft();
  close();
  emit("created", draft);
};

// ── Lifecycle ─────────────────────────────────────────────────────────────────
const reset = () => {
  step.value = 1;
  pickedCoords.value = null;
  pickedAddress.value = "";
  locationLabel.value = "";
  titles.value = [];
  titleLabelInput.value = "";
  titleTypeInput.value = "other";
  agents.value = [];
  agentRoleInput.value = AGENT_ROLE_LABELS[0];
  agentNameInput.value = "";
  dates.value = [];
  dateYearInput.value = "";
  dateYearEndInput.value = "";
  descriptionInput.value = "";
  errorMessage.value = "";
  showSearch.value = true;
  searchQuery.value = "";
  searchSuggestions.value = [];
  for (const { field } of VOCAB_FIELDS) {
    field.input.value = "";
    field.selected.value = [];
    field.suggestions.value = [];
    field.showSuggestions.value = false;
  }
};

const close = () => {
  emit("update:modelValue", false);
};

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) { reset(); return; }

    // Pré-preenche o input de título com o texto que originou a sugestão de criar.
    if (props.initialTitle) {
      titleLabelInput.value = props.initialTitle;
    }

    try {
      const contributors = await vracStore.getVRACContributorNames();
      if (Array.isArray(contributors)) {
        allContributorNames.value = contributors;
        nameFuse = new Fuse(contributors, {
          keys: ["name"],
          threshold: 0.3,
          includeScore: true,
        });
      }
    } catch {
      // non-fatal
    }

    // Fetch step 3 vocabularies in parallel
    await Promise.allSettled(
      VOCAB_FIELDS.map(async ({ field, endpoint, labelKey }) => {
        try {
          const res = await axios.get(`/api/${endpoint}?per_page=-1`);
          const items = res.data.data ?? [];
          field.fuse = new Fuse(items, { keys: [labelKey], threshold: 0.35, includeScore: true });
          // Store raw items so we can resolve { id, label } on selection
          field._items = items;
          field._labelKey = labelKey;
        } catch {
          // non-fatal
        }
      })
    );
  }
);

onUnmounted(() => {
  if (nameDebounce) clearTimeout(nameDebounce);
  if (searchDebounce) clearTimeout(searchDebounce);
  for (const { field } of VOCAB_FIELDS) {
    if (field.debounce) clearTimeout(field.debounce);
  }
});
</script>

<template>
  <transition name="fade-modal">
    <div
      v-if="modelValue"
      class="work-modal__backdrop"
      @click.self="close"
    >
      <div class="work-modal__panel" role="dialog" aria-modal="true">

        <!-- ── Step 1: map ───────────────────────────────────────────────── -->
        <template v-if="step === 1">
          <div class="work-modal__header">
            <p class="work-modal__title">Localização da obra</p>
          </div>

          <div class="work-modal__map-wrapper">
            <div class="work-modal__map-container">
              <MapLibreMap
                :style-url="mapStyleUrl"
                :center="mapCenter"
                :zoom="mapZoom"
                :clickable="true"
                :marker-position="pickedCoords"
                marker-variant="building"
                @map-ready="handleMapReady"
                @click="handleMapClick"
              />
              <MapControls
                class="work-modal__map-controls"
                @zoom-in="mapInstance?.zoomIn()"
                @zoom-out="mapInstance?.zoomOut()"
                @search="showSearch = !showSearch"
              />
              <div v-if="showSearch" class="work-modal__search-box">
                <div class="input-group">
                  <input
                    v-model="searchQuery"
                    type="text"
                    class="form-control form-control-sm"
                    placeholder="Buscar endereço..."
                    autocomplete="off"
                    @input="onSearchInputDebounced"
                    @keydown.escape="showSearch = false"
                  />
                  <button type="button" class="btn btn-sm btn-secondary" @click="showSearch = false">
                    <i class="bi bi-x" />
                  </button>
                </div>
                <ul v-if="searchSuggestions.length" class="work-modal__search-results">
                  <li v-if="isForwardGeocoding" class="work-modal__search-result text-muted fst-italic">
                    Buscando...
                  </li>
                  <li
                    v-for="r in searchSuggestions"
                    :key="r.place_id"
                    class="work-modal__search-result"
                    @click="selectSearchResult(r)"
                  >
                    {{ r.display_name }}
                  </li>
                </ul>
              </div>
            </div>
            <p v-if="isReverseGeocoding" class="work-modal__geocode-hint text-muted">
              Buscando endereço...
            </p>
            <p v-else-if="pickedAddress" class="work-modal__geocode-hint text-muted">
              {{ pickedAddress }}
            </p>
            <p v-else class="work-modal__geocode-hint text-muted fst-italic">
              Clique no mapa para selecionar a localização da obra
            </p>
          </div>

          <div class="work-modal__footer">
            <button type="button" class="work-modal__btn work-modal__btn--secondary" @click="close">
              Cancelar
            </button>
            <button
              type="button"
              class="work-modal__btn work-modal__btn--primary"
              :disabled="!canAdvance"
              @click="goToStep2"
            >
              Próximo
            </button>
          </div>
        </template>

        <!-- ── Step 2: metadata ─────────────────────────────────────────── -->
        <template v-else-if="step === 2">
          <div class="work-modal__header">
            <p class="work-modal__title">Dados gerais</p>
          </div>

          <div class="work-modal__body">

            <!-- Location label -->
            <div class="mb-3">
              <UiField label="Localização" explain="Endereço ou nome do local da obra">
                <template #default="{ id }">
                  <input
                    :id="id"
                    v-model="locationLabel"
                    type="text"
                    class="form-control"
                    placeholder="Endereço da obra"
                  />
                </template>
              </UiField>
            </div>

            <!-- Titles -->
            <div class="mb-3">
              <UiField label="Título da obra" explain="Adicione ao menos um título principal">
                <div class="input-group">
                  <button
                    class="btn btn-primary dropdown-toggle bg-cinza-m border-preto fw-normal"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    {{ titleTypeLabel(titleTypeInput) }}
                  </button>
                  <ul class="dropdown-menu menu-light">
                    <li v-for="t in TITLE_TYPES" :key="t.value">
                      <button
                        class="dropdown-item"
                        :disabled="t.value === 'other' && hasPreferredTitle"
                        @click.prevent="titleTypeInput = t.value"
                      >
                        {{ t.label }}
                        <span
                          v-if="t.value === 'other' && hasPreferredTitle"
                          class="text-muted small ms-1"
                        >(já definido)</span>
                      </button>
                    </li>
                  </ul>
                  <input
                    v-model="titleLabelInput"
                    type="text"
                    class="form-control border-preto border-end-0"
                    placeholder="Título"
                    @keydown.enter.prevent="addTitle"
                  />
                  <button
                    type="button"
                    class="btn btn-light border-preto border-start-0 bg-transparent btn-enlarge-40"
                    aria-label="Adicionar título"
                    @click="addTitle"
                  >
                    <i class="bi bi-plus-square-fill" />
                  </button>
                </div>
                <p v-if="titles.length === 0" class="text-muted small fst-italic mt-1 mb-0">
                  Adicione ao menos um título principal.
                </p>
                <div class="d-flex flex-wrap gap-2 mt-2">
                  <button
                    v-for="(t, i) in titles"
                    :key="i"
                    type="button"
                    class="btn btn-primary btn-sm btn-tag"
                  >
                    {{ titleTypeLabel(t.type) }}: {{ t.label }}
                    <button type="button" class="btn-close ms-2" aria-label="Remover" @click.stop="removeTitle(i)" />
                  </button>
                </div>
              </UiField>
            </div>

            <!-- Agents -->
            <div class="mb-3">
              <UiField label="Autor da obra" explain="Informe os responsáveis pela obra e seus papéis">
                <div class="input-group position-relative">
                  <button
                    class="btn btn-primary dropdown-toggle bg-cinza-m border-preto fw-normal"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    {{ agentRoleInput }}
                  </button>
                  <ul class="dropdown-menu menu-light">
                    <li v-for="r in AGENT_ROLE_LABELS" :key="r">
                      <button class="dropdown-item" @click.prevent="agentRoleInput = r">
                        {{ r }}
                      </button>
                    </li>
                  </ul>
                  <input
                    v-model="agentNameInput"
                    type="text"
                    class="form-control border-preto border-end-0"
                    placeholder="Nome do autor"
                    autocomplete="off"
                    @input="onAgentNameInput"
                    @focus="showNameSuggestions = true"
                    @blur="hideNameSuggestions"
                    @keydown.enter.prevent="addAgent()"
                  />
                  <div
                    v-if="showNameSuggestions && filteredNameSuggestions.length > 0"
                    class="dropdown-menu w-100 show position-absolute top-100 start-0 mt-1"
                    style="z-index: 1500; max-height: 220px; overflow-y: auto"
                  >
                    <button
                      v-for="c in filteredNameSuggestions"
                      :key="c.id"
                      type="button"
                      class="dropdown-item"
                      @click="addAgent(c)"
                    >
                      {{ c.name }}
                    </button>
                  </div>
                  <button
                    type="button"
                    class="btn btn-light border-preto border-start-0 bg-transparent btn-enlarge-40"
                    aria-label="Adicionar autor"
                    @click="addAgent()"
                  >
                    <i class="bi bi-plus-square-fill" />
                  </button>
                </div>
                <div class="d-flex flex-wrap gap-2 mt-2">
                  <button
                    v-for="(a, i) in agents"
                    :key="i"
                    type="button"
                    class="btn btn-primary btn-sm btn-tag"
                  >
                    {{ a.roleLabel }}: {{ a.contributorName }}
                    <button type="button" class="btn-close ms-2" aria-label="Remover" @click.stop="removeAgent(i)" />
                  </button>
                </div>
              </UiField>
            </div>

            <!-- Dates -->
            <div class="mb-3">
              <UiField label="Datas" explain="Informe as datas relevantes da obra (criação, reforma, etc.)">
                <div class="d-flex flex-column gap-2">
                  <div class="input-group">
                    <button
                      class="btn btn-primary dropdown-toggle bg-cinza-m border-preto fw-normal"
                      type="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      {{ dateTypeLabel(dateTypeInput) }}
                    </button>
                    <ul class="dropdown-menu menu-light">
                      <li v-for="d in DATE_TYPES" :key="d.value">
                        <button class="dropdown-item" @click.prevent="dateTypeInput = d.value">
                          {{ d.label }}
                        </button>
                      </li>
                    </ul>
                    <input
                      v-model="dateYearInput"
                      type="number"
                      class="form-control border-preto"
                      :class="{ 'border-end-0': dateIntervalMode === 'interval' }"
                      placeholder="Ano"
                      min="1"
                      max="2100"
                      style="max-width: 90px"
                      @keydown.enter.prevent="addDate"
                    />
                    <template v-if="dateIntervalMode === 'interval'">
                      <span class="input-group-text border-preto bg-transparent">até</span>
                      <input
                        v-model="dateYearEndInput"
                        type="number"
                        class="form-control border-preto border-end-0"
                        placeholder="Ano"
                        min="1"
                        max="2100"
                        style="max-width: 90px"
                        @keydown.enter.prevent="addDate"
                      />
                    </template>
                    <button
                      type="button"
                      class="btn btn-light border-preto border-start-0 bg-transparent btn-enlarge-40"
                      aria-label="Adicionar data"
                      @click="addDate"
                    >
                      <i class="bi bi-plus-square-fill" />
                    </button>
                  </div>

                  <div class="d-flex gap-4">
                    <div class="form-check">
                      <input class="form-check-input" type="radio" id="dateModeSingle" v-model="dateIntervalMode" value="single" />
                      <label class="form-check-label" for="dateModeSingle">Ano</label>
                    </div>
                    <div class="form-check">
                      <input class="form-check-input" type="radio" id="dateModeInterval" v-model="dateIntervalMode" value="interval" />
                      <label class="form-check-label" for="dateModeInterval">Intervalo</label>
                    </div>
                  </div>

                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="dateCirca" v-model="dateCirca" />
                    <label class="form-check-label" for="dateCirca">Data aproximada</label>
                  </div>
                </div>
                <div class="d-flex flex-wrap gap-2 mt-2">
                  <button
                    v-for="(d, i) in dates"
                    :key="i"
                    type="button"
                    class="btn btn-primary btn-sm btn-tag"
                  >
                    {{ formatDateChip(d) }}
                    <button type="button" class="btn-close ms-2" aria-label="Remover" @click.stop="removeDate(i)" />
                  </button>
                </div>
              </UiField>
            </div>

            <!-- Description -->
            <div class="mb-3">
              <UiField label="Descrição da obra" explain="Descreva brevemente a obra">
                <template #default="{ id }">
                  <textarea
                    :id="id"
                    v-model="descriptionInput"
                    class="form-control"
                    rows="4"
                    placeholder="Texto exemplo"
                    maxlength="500"
                  />
                </template>
              </UiField>
              <div class="text-end text-muted small mt-1">Máximo 500 caracteres.</div>
            </div>

            <!-- Error -->
            <p v-if="errorMessage" class="text-danger small">{{ errorMessage }}</p>

          </div>

          <div class="work-modal__footer">
            <button type="button" class="work-modal__btn work-modal__btn--secondary" @click="step = 1">
              Voltar
            </button>
            <button
              type="button"
              class="work-modal__btn work-modal__btn--primary"
              :disabled="!hasPreferredTitle"
              @click="step = 3"
            >
              Próximo
            </button>
          </div>
        </template>

        <!-- ── Step 3: complementary data ──────────────────────────────── -->
        <template v-else>
          <div class="work-modal__header">
            <p class="work-modal__title">Dados complementares</p>
          </div>

          <div class="work-modal__body">

            <div v-for="vf in VOCAB_FIELDS" :key="vf.label" class="mb-3">
              <UiField :label="vf.label" :explain="vf.explain">
                <div class="input-group position-relative">
                  <input
                    v-model="vf.field.input.value"
                    type="text"
                    class="form-control border-preto border-end-0"
                    :placeholder="`Adicione ${vf.label.toLowerCase()}`"
                    autocomplete="off"
                    @input="onVocabInput(vf.field)"
                    @focus="vf.field.showSuggestions.value = true"
                    @blur="hideVocabSuggestions(vf.field)"
                    @keydown.enter.prevent="onVocabEnter(vf)"
                  />
                  <div
                    v-if="vf.field.showSuggestions.value && (vf.field.suggestions.value.length > 0 || canCreateVocab(vf))"
                    class="dropdown-menu w-100 show position-absolute top-100 start-0 mt-1"
                    style="z-index: 1500; max-height: 220px; overflow-y: auto"
                  >
                    <button
                      v-for="item in vf.field.suggestions.value"
                      :key="item.id"
                      type="button"
                      class="dropdown-item"
                      @click="addVocabItem(vf.field, item)"
                    >
                      {{ item[vf.labelKey] }}
                    </button>
                    <button
                      v-if="canCreateVocab(vf)"
                      type="button"
                      class="dropdown-item text-primary d-flex align-items-center gap-1"
                      @click="createAndAddVocabItem(vf)"
                    >
                      <i class="bi bi-plus-circle" />
                      <span>Criar "{{ vf.field.input.value.trim() }}"</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    class="btn btn-light border-preto border-start-0 bg-transparent btn-enlarge-40"
                    :aria-label="`Adicionar ${vf.label.toLowerCase()}`"
                    @click="onVocabPlusClick(vf)"
                  >
                    <i class="bi bi-plus-square-fill" />
                  </button>
                </div>
                <div class="d-flex flex-wrap gap-2 mt-2">
                  <button
                    v-for="(item, i) in vf.field.selected.value"
                    :key="item.id"
                    type="button"
                    class="btn btn-primary btn-sm btn-tag"
                  >
                    {{ item.label }}
                    <button type="button" class="btn-close ms-2" aria-label="Remover" @click.stop="removeVocabItem(vf.field, i)" />
                  </button>
                </div>
              </UiField>
            </div>

            <!-- Error -->
            <p v-if="errorMessage" class="text-danger small">{{ errorMessage }}</p>

          </div>

          <div class="work-modal__footer">
            <button type="button" class="work-modal__btn work-modal__btn--secondary" @click="step = 2">
              Voltar
            </button>
            <button
              type="button"
              class="work-modal__btn work-modal__btn--primary"
              :disabled="!canSubmit"
              @click="handleSubmit"
            >
              Confirmar
            </button>
          </div>
        </template>

      </div>
    </div>
  </transition>
</template>

<style lang="scss" scoped>
.fade-modal-enter-active { transition: opacity 0.2s ease; }
.fade-modal-leave-active { transition: opacity 0.2s ease 0.1s; }
.fade-modal-enter-from,
.fade-modal-leave-to    { opacity: 0; }

.work-modal__backdrop {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  padding: 16px;
  box-sizing: border-box;
}

.work-modal__panel {
  display: grid;
  grid-template-rows: auto 1fr auto;
  width: 600px;
  max-width: calc(100vw - 32px);
  height: calc(100dvh - 32px);
  max-height: 760px;
  box-sizing: border-box;
  border-radius: 16px;
  background: var(--off_white, #faf9f9);
  box-shadow: 4px 4px 8px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.work-modal__header {
  padding: 24px 32px 8px;
}

.work-modal__title {
  margin: 0;
  font-family: "DM Sans", sans-serif;
  font-size: 20px;
  font-weight: 500;
  color: #2f2f2f;
}

.work-modal__map-wrapper {
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0 16px;
  gap: 0;
}

.work-modal__map-container {
  position: relative;
  flex: 1 1 0;
  min-height: 0;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #1f1f1f;
}

.work-modal__map-controls {
  position: absolute;
  bottom: 12px;
  left: 12px;
  z-index: 10;
}

.work-modal__search-box {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  z-index: 20;
}

.work-modal__search-results {
  list-style: none;
  margin: 2px 0 0;
  padding: 0;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.work-modal__search-result {
  padding: 6px 10px;
  font-size: 13px;
  cursor: pointer;
  line-height: 1.3;

  &:hover { background: #f5f5f5; }
}

.work-modal__geocode-hint {
  flex-shrink: 0;
  margin: 6px 16px 0;
  font-size: 13px;
}

.work-modal__body {
  min-height: 0;
  overflow-y: auto;
  padding: 8px 32px 16px;
  -webkit-overflow-scrolling: touch;
}

.btn-enlarge-40 {
  padding: calc(0.1rem) calc(0.75rem);
}
.btn-enlarge-40 > i.bi {
  font-size: 1.6rem;
  line-height: 1.4;
}

.work-modal__footer {
  flex-shrink: 0;
  display: flex;
  gap: 16px;
  padding: 16px 32px;
  background: var(--off_white, #faf9f9);
}

.work-modal__btn {
  flex: 1 0 0;
  padding: 4px 14px;
  border-radius: 5px;
  border-style: solid;
  border-width: 1px;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  cursor: pointer;
  text-align: center;
  box-sizing: border-box;

  &:disabled { opacity: 0.4; cursor: not-allowed; }

  &--secondary {
    background: var(--off_white, #faf9f9);
    border-color: #2f2f2f;
    color: #2f2f2f;
  }

  &--primary {
    background: #2f2f2f;
    border-color: #2f2f2f;
    color: #fff;
  }
}

@media (max-width: 767px) {
  .work-modal__backdrop {
    padding: 0;
    align-items: stretch;
  }

  .work-modal__panel {
    width: 100vw;
    max-width: 100vw;
    height: 100dvh;
    max-height: 100dvh;
    border-radius: 0;
  }

  .work-modal__header {
    padding: 20px 16px 8px;
  }

  .work-modal__body {
    padding: 8px 16px 0;
  }

  .work-modal__map-wrapper {
    padding: 0 8px;
  }

  .work-modal__footer {
    padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  }
}
</style>
