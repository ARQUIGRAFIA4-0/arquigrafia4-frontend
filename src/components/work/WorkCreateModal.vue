<script setup>
import { ref, computed, watch, onUnmounted, markRaw } from "vue";
import MapLibreMap from "@/components/map/MapLibreMap.vue";
import MapControls from "@/components/map/MapControls.vue";
import UiField from "@/components/ui/UiField.vue";
import axios from "@/axios";
import { useWorkForm } from "@/composables/useWorkForm";
import { Marker } from "maplibre-gl";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // Texto para pré-preencher o input de título ao abrir (ex.: vindo da busca que
  // sugeriu criar a obra). Fica só no input; não é adicionado como título.
  initialTitle: { type: String, default: "" },
});

const emit = defineEmits(["update:modelValue", "created", "select-existing"]);

// Campos de metadados (passos 2 e 3) — compartilhados com o formulário de sugestão
// de edição da obra. Aqui ficam só o passo 1 (mapa) e a orquestração do wizard.
const {
  locationLabel,
  TITLE_TYPES, titleTypeInput, titleLabelInput, titles, hasPreferredTitle,
  addTitle, removeTitle, titleTypeLabel,
  AGENT_ROLE_LABELS, agentRoleInput, agentNameInput, agents,
  filteredNameSuggestions, showNameSuggestions, loadContributorNames,
  onAgentNameInput, hideNameSuggestions, addAgent, removeAgent,
  DATE_TYPES, dateTypeInput, dateYearInput, dateYearEndInput, dateIntervalMode,
  dateCirca, dates, dateError, isDateTypeDisabled, addDate, removeDate, dateTypeLabel,
  formatDateChip,
  descriptionInput,
  VOCAB_FIELDS, onVocabInput, addVocabItem, canCreateVocab, createAndAddVocabItem,
  onVocabEnter, onVocabPlusClick, removeVocabItem, hideVocabSuggestions,
  canSubmit, commitPendingInputs, buildDraft, reset: resetForm,
} = useWorkForm();

// ── Step management ─────────────────────────────────────────────────────────
const step = ref(1);

// ── Step 1: map ──────────────────────────────────────────────────────────────
const mapStyleUrl = "https://tiles.openfreemap.org/styles/positron";
const INITIAL_MAP_CENTER = [-46.6388, -23.5489]; // São Paulo
const INITIAL_MAP_ZOOM = 12;
// Reativos para preservar a posição da câmera ao navegar entre passos do modal:
// o mapa é destruído/recriado a cada troca (v-if), então remonta lendo daqui.
const mapCenter = ref([...INITIAL_MAP_CENTER]);
const mapZoom = ref(INITIAL_MAP_ZOOM);
const mapInstance = ref(null);
const pickedCoords = ref(null);   // { lng, lat }
const pickedAddress = ref("");
const isReverseGeocoding = ref(false);

// Obras já existentes no viewport atual — para o usuário perceber uma possível
// duplicata antes de criar. Carregadas por bbox a cada movimento do mapa.
const existingWorks = ref([]);
const selectedExistingWork = ref(null); // obra clicada, aguardando confirmação
// Instâncias de Marker do MapLibre — mantidas fora da reatividade do Vue (mesmo
// motivo de mapInstance usar markRaw); recriadas a cada fetch.
let existingMarkers = [];
let worksDebounce = null;

const primaryTitle = (work) => {
  const ts = work?.titles || [];
  return (ts.find((t) => t.pref) || ts[0])?.label || "(sem título)";
};

const clearWorkMarkers = () => {
  for (const marker of existingMarkers) marker.remove();
  existingMarkers = [];
};

const createExistingWorkMarkerElement = () => {
  const element = document.createElement("div");
  // Estilo inline: markers ficam fora da árvore atingida pelo CSS scoped daqui.
  // Círculo cheio terracota — distinto do pin escuro da localização escolhida.
  element.style.cssText =
    "width:18px;height:18px;border-radius:50%;background:#c0563b;" +
    "border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.4);" +
    "cursor:pointer;box-sizing:border-box;";
  return element;
};

const renderWorkMarkers = () => {
  const map = mapInstance.value;
  if (!map) return;
  clearWorkMarkers();
  for (const work of existingWorks.value) {
    const lat = parseFloat(work.location?.latitude);
    const lng = parseFloat(work.location?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const element = createExistingWorkMarkerElement();
    element.addEventListener("click", (event) => {
      event.stopPropagation();
      // Escolher uma obra existente descarta a localização avulsa que estivesse
      // marcada no mapa — evita duas seleções competindo (pop-up + endereço).
      pickedCoords.value = null;
      pickedAddress.value = "";
      selectedExistingWork.value = work;
    });
    const marker = new Marker({ element, anchor: "center" })
      .setLngLat([lng, lat])
      .addTo(map);
    existingMarkers.push(marker);
  }
};

const fetchWorksInView = async () => {
  const map = mapInstance.value;
  if (!map) return;
  const bounds = map.getBounds();
  // Ordem exigida pelo backend: west,south,east,north — exatamente 4 valores.
  // Menos que isso e o backend ignora o filtro e devolve a lista inteira.
  const bbox = [
    bounds.getWest(),
    bounds.getSouth(),
    bounds.getEast(),
    bounds.getNorth(),
  ].join(",");
  try {
    const res = await axios.get("/api/vrac-works", {
      params: { bbox, per_page: -1 },
    });
    existingWorks.value = res.data?.data ?? [];
    renderWorkMarkers();
  } catch {
    // Não-fatal: o mapa de seleção segue funcionando sem as obras existentes.
  }
};

const fetchWorksInViewDebounced = () => {
  if (worksDebounce) clearTimeout(worksDebounce);
  worksDebounce = setTimeout(fetchWorksInView, 300);
};

const confirmExistingWork = () => {
  const work = selectedExistingWork.value;
  if (!work) return;
  emit("select-existing", work);
  close();
};

const handleMapReady = (map) => {
  mapInstance.value = markRaw(map);
  // A cada abertura o mapa nasce do zero (v-if no template), então religar o
  // listener e disparar o fetch inicial aqui é seguro e auto-limpante.
  map.on("moveend", fetchWorksInViewDebounced);
  fetchWorksInView();
};

const handleMapClick = async ({ lng, lat }) => {
  // Escolher outra localização (clicando no mapa ou vindo de um resultado da
  // busca) descarta a confirmação de obra existente que estivesse aberta.
  selectedExistingWork.value = null;
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
  // Guarda a posição atual da câmera antes de destruir o mapa, para que voltar
  // ao passo 1 reabra na mesma vista (e não recentralize em São Paulo).
  const map = mapInstance.value;
  if (map) {
    const center = map.getCenter();
    mapCenter.value = [center.lng, center.lat];
    mapZoom.value = map.getZoom();
  }
  locationLabel.value = pickedAddress.value;
  step.value = 2;
};

// --- Submit ---
const errorMessage = ref("");

const handleSubmit = () => {
  // Aproveita o que ficou digitado sem virar chip, em vez de descartar em silêncio.
  commitPendingInputs();
  if (!canSubmit.value) return;
  // As coordenadas vêm do passo 1, que é exclusivo deste modal.
  const draft = buildDraft(pickedCoords.value);
  close();
  emit("created", draft);
};

// ── Lifecycle ─────────────────────────────────────────────────────────────────
const reset = () => {
  step.value = 1;
  mapCenter.value = [...INITIAL_MAP_CENTER];
  mapZoom.value = INITIAL_MAP_ZOOM;
  pickedCoords.value = null;
  pickedAddress.value = "";
  errorMessage.value = "";
  searchQuery.value = "";
  searchSuggestions.value = [];
  existingWorks.value = [];
  selectedExistingWork.value = null;
  clearWorkMarkers();
  if (worksDebounce) clearTimeout(worksDebounce);
  resetForm();
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

    await loadContributorNames();
  }
);

// Os timers do formulário (autoria e vocabulários) são limpos pelo próprio
// composable; aqui ficam só os do passo 1.
onUnmounted(() => {
  if (searchDebounce) clearTimeout(searchDebounce);
  if (worksDebounce) clearTimeout(worksDebounce);
  clearWorkMarkers();
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
            <p class="work-modal__subtitle">
              Busque o endereço ou clique no mapa para marcar onde a obra fica.
            </p>
          </div>

          <div class="work-modal__map-wrapper">
            <!-- Busca de endereço: fora do mapa, entre o título e ele. -->
            <div class="work-modal__search-box">
              <div class="input-group">
                <input
                  v-model="searchQuery"
                  type="text"
                  class="form-control form-control-sm"
                  placeholder="Buscar endereço..."
                  autocomplete="off"
                  @input="onSearchInputDebounced"
                  @keydown.escape="searchQuery = ''; searchSuggestions = []"
                />
                <button
                  v-if="searchQuery"
                  type="button"
                  class="btn btn-sm btn-secondary"
                  aria-label="Limpar busca"
                  @click="searchQuery = ''; searchSuggestions = []"
                >
                  <i class="bi bi-x" />
                </button>
              </div>
              <ul v-if="searchSuggestions.length || isForwardGeocoding" class="work-modal__search-results">
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
              <!-- O botão de busca some: o campo agora vive acima do mapa, sempre visível. -->
              <MapControls
                class="work-modal__map-controls"
                :show-search="false"
                @zoom-in="mapInstance?.zoomIn()"
                @zoom-out="mapInstance?.zoomOut()"
              />

              <!-- Endereço do ponto escolhido, sobreposto ao mapa: aparecer e sumir
                   não empurra mais o resto do modal. Mesmo tratamento do mapa da
                   submissão de imagem. -->
              <span v-if="isReverseGeocoding" class="work-modal__map-badge">
                Buscando o endereço deste ponto…
              </span>
              <span v-else-if="pickedAddress" class="work-modal__map-badge">
                {{ pickedAddress }}
              </span>

              <div
                v-if="selectedExistingWork"
                class="work-modal__existing-confirm"
                data-cy="existing-work-confirm"
              >
                <p class="work-modal__existing-confirm-title">Usar esta obra?</p>
                <p class="work-modal__existing-confirm-name">
                  {{ primaryTitle(selectedExistingWork) }}
                </p>
                <p
                  v-if="selectedExistingWork.location?.label"
                  class="work-modal__existing-confirm-address text-muted"
                >
                  {{ selectedExistingWork.location.label }}
                </p>
                <div class="work-modal__existing-confirm-actions">
                  <button
                    type="button"
                    class="work-modal__btn work-modal__btn--secondary"
                    @click="selectedExistingWork = null"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    class="work-modal__btn work-modal__btn--primary"
                    data-cy="existing-work-confirm-use"
                    @click="confirmExistingWork"
                  >
                    Usar esta obra
                  </button>
                </div>
              </div>
            </div>
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
                        ></span>
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
              <UiField label="Autoria da obra" explain="Informe os responsáveis pela obra e seus papéis">
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
                    placeholder="Nome"
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
                    aria-label="Adicionar autoria"
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
                        <button
                          class="dropdown-item"
                          :disabled="isDateTypeDisabled(d.value)"
                          @click.prevent="dateTypeInput = d.value"
                        >
                          {{ d.label }}
                          <span v-if="isDateTypeDisabled(d.value)" class="text-muted small ms-1">
                            (já adicionada)
                          </span>
                        </button>
                      </li>
                    </ul>
                    <input
                      v-model="dateYearInput"
                      type="text"
                      inputmode="numeric"
                      maxlength="4"
                      class="form-control border-preto"
                      :class="{ 'border-end-0': dateIntervalMode === 'interval' }"
                      placeholder="Ano"
                      style="max-width: 90px"
                      @keydown.enter.prevent="addDate"
                    />
                    <template v-if="dateIntervalMode === 'interval'">
                      <span class="input-group-text border-preto bg-transparent">até</span>
                      <input
                        v-model="dateYearEndInput"
                        type="text"
                        inputmode="numeric"
                        maxlength="4"
                        class="form-control border-preto border-end-0"
                        placeholder="Ano"
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
                <p v-if="dateError" class="text-danger small mt-1 mb-0">{{ dateError }}</p>
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
              @click="commitPendingInputs(); step = 3"
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
                    @input="onVocabInput(vf)"
                    @focus="vf.field.showSuggestions.value = true"
                    @blur="hideVocabSuggestions(vf.field)"
                    @keydown.enter.prevent="onVocabEnter(vf)"
                  />
                  <div
                    v-if="vf.field.showSuggestions.value && (vf.field.loading.value || vf.field.suggestions.value.length > 0 || canCreateVocab(vf))"
                    class="dropdown-menu w-100 show position-absolute top-100 start-0 mt-1"
                    style="z-index: 1500; max-height: 220px; overflow-y: auto"
                  >
                    <span
                      v-if="vf.field.loading.value"
                      class="dropdown-item-text text-muted fst-italic small"
                    >
                      Buscando...
                    </span>
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

.work-modal__subtitle {
  margin: 4px 0 0;
  font-size: 0.875rem;
  line-height: 1.4;
  color: var(--Cinza_M, #636262);
}

.work-modal__map-wrapper {
  min-height: 0;
  display: flex;
  flex-direction: column;
  /* Mesma margem lateral do header e do footer (32px). */
  padding: 0 32px;
  gap: 0;
}

.work-modal__map-container {
  position: relative;
  flex: 1 1 0;
  /* Piso de altura: com o teclado aberto no celular a viewport encolhe e, sem
     isso, o mapa era espremido a quase nada — restando um modal só de campos. */
  min-height: 220px;
  overflow: hidden;
  border: 1px solid #1f1f1f;
}

.work-modal__map-controls {
  position: absolute;
  bottom: 12px;
  left: 12px;
  z-index: 10;
}

/* Fora do mapa, entre o título e ele. `relative` para a lista de sugestões
   flutuar sobre o mapa sem alargar o modal. */
.work-modal__search-box {
  position: relative;
  flex-shrink: 0;
  /* Sem margem lateral: o padding do wrapper já alinha o campo à largura do mapa. */
  margin: 0 0 10px;
  z-index: 20;

  /* O input e o botão herdam paddings diferentes (form-control-sm vs btn-sm mais
     o estilo de botão do projeto), o que deixava o botão visivelmente mais alto.
     A altura é fixada nos dois para encostarem. */
  .input-group > .form-control,
  .input-group > .btn {
    height: 34px;
    min-height: 34px;
    padding-block: 0;
    font-size: 0.875rem;
    line-height: 1.2;
  }

  .input-group > .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
}

/* Endereço sobreposto ao mapa — mesmo tratamento do mapa de submissão de imagem:
   informa sem empurrar o restante do modal ao aparecer e sumir. */
.work-modal__map-badge {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
  /* A caixa acompanha o texto; o teto evita que um endereço longo do Nominatim
     atravesse o mapa inteiro. */
  max-width: calc(100% - 16px);
  margin: 8px;
  padding: 8px 12px;
  border: 1px solid var(--Cinza_C, #dcdcdc);
  border-radius: 4px;
  background-color: #fff;
  color: var(--Preto, #2f2f2f);
  font-size: 0.8125rem;
  line-height: 1.35;
  /* No máximo duas linhas, para não cobrir o mapa. */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.work-modal__search-results {
  /* Flutua sobre o mapa em vez de empurrá-lo. */
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 30;
  list-style: none;
  margin: 2px 0 0;
  padding: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
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

.work-modal__existing-confirm {
  position: absolute;
  bottom: 12px;
  left: 12px;
  right: 12px;
  z-index: 30;
  padding: 12px 16px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.work-modal__existing-confirm-title {
  margin: 0 0 2px;
  font-size: 13px;
  font-weight: 500;
  color: #2f2f2f;
}

.work-modal__existing-confirm-name {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #2f2f2f;
}

.work-modal__existing-confirm-address {
  margin: 2px 0 0;
  font-size: 12px;
}

.work-modal__existing-confirm-actions {
  display: flex;
  gap: 12px;
  margin-top: 10px;
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
  /* O 24px final espelha o respiro do topo do modal (header). */
  padding: 16px 32px 24px;
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
    padding: 0 16px;
  }

  .work-modal__footer {
    padding: 12px 16px calc(20px + env(safe-area-inset-bottom));
  }

  /* No celular o mapa rola junto com o dedo; o modal inteiro não deve rolar
     por baixo dele. */
  .work-modal__map-wrapper {
    overscroll-behavior: contain;
  }

  /* Alvos de toque: 44px é o mínimo confortável. O input tinha 34px e os botões
     do rodapé ~31px, altos demais para o dedo errar. */
  .work-modal__search-box {
    .input-group > .form-control,
    .input-group > .btn {
      height: 44px;
      min-height: 44px;
      /* 16px evita o zoom automático que o Safari do iOS aplica ao focar um
         campo com fonte menor — o modal inteiro saltava de escala. */
      font-size: 16px;
    }
  }

  .work-modal__btn {
    min-height: 44px;
  }

  /* A lista não pode passar do mapa: o painel tem overflow hidden e cortaria
     as últimas sugestões. */
  .work-modal__search-results {
    max-height: min(200px, 30vh);
  }
}
</style>
