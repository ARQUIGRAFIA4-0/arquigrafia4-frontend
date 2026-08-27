<template>
  <div v-if="modelValue" class="modal-backdrop" @click.self="close">
    <div
      class="modal-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="advanced-search-title"
    >
      <div class="modal-header text-center">
        <h5 id="advanced-search-title" class="m-0 w-100 h2">Busca avançada</h5>
      </div>

      <div class="modal-body">

        <!-- Termos -->
        <div class="mb-3">
          <h3 class="h3 pt-2">Termos</h3>
          <div class="input-group">
            <button
              class="btn btn-primary dropdown-toggle bg-cinza-m border-preto fw-normal"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              {{ selectedFieldLabel }}
            </button>
            <ul class="dropdown-menu menu-light dropdown-menu-scroll">
              <li v-for="opt in fieldOptions" :key="opt.value">
                <button
                  class="dropdown-item"
                  @click.prevent="setSelectedField(opt.value)"
                >
                  {{ opt.label }}
                </button>
              </li>
            </ul>
            <input
              v-model="textQueryInput"
              type="text"
              class="form-control border-preto border-end-0"
              :placeholder="textQueryPlaceholder"
              @keydown.enter="onTermInputEnter"
              @focus="ensureVocabLoaded"
            />
            <button
              v-if="!activeVocabField"
              class="btn btn-light border-preto border-start-0 bg-transparent btn-enlarge-40"
              type="button"
              aria-label="Adicionar termo"
              @click="addSearchTerm"
            >
              <i class="bi bi-plus-square-fill"></i>
            </button>
          </div>

          <!-- Sugestões do vocabulário ativo (materiais/técnicas/período de estilo/
               contexto cultural/tipo de obra) — mesmo padrão do autocomplete de
               "Tags da imagem" na edição de metadados: digitar filtra, clicar seleciona. -->
          <ul v-if="activeVocabField && textQueryInput.trim()" class="list-group vocab-suggestions">
            <li v-if="isVocabListLoading" class="list-group-item text-muted">
              <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
              Carregando...
            </li>
            <li v-else-if="vocabSuggestions.length === 0" class="list-group-item text-muted">
              Nenhum resultado para "{{ textQueryInput }}".
            </li>
            <li v-for="opt in vocabSuggestions" :key="opt.id" class="list-group-item p-0">
              <button type="button" class="dropdown-item" @click="selectVocabItem(opt.id)">
                {{ opt.label }}
              </button>
            </li>
          </ul>


          <!-- Listagem de termos adicionados e tags/vocabulários selecionados (vindas do ViewGrid, etc.) -->
          <div class="list-group-item">
            <span
              v-if="searchTerms.length === 0 && extraSelectedTags.length === 0 && vocabChips.length === 0"
              class="text-muted"
              >Nenhum termo adicionado.</span
            >
            <button
              v-for="(term, idx) in searchTerms"
              :key="idx"
              type="button"
              class="btn btn-primary btn-sm btn-tag"
            >
              {{ term.label }}
              <button
                type="button"
                class="btn-close ms-2"
                aria-label="Remover termo"
                @click.stop="removeSearchTerm(idx)"
              ></button>
            </button>
            <button
              v-for="id in extraSelectedTags"
              :key="id"
              type="button"
              class="btn btn-primary btn-sm btn-tag"
            >
              <span v-if="!isTermLoaded(id)" class="spinner-border spinner-border-sm" role="status" aria-label="Carregando..." />
              <template v-else>{{ getTermById(id) }}</template>
              <button
                type="button"
                class="btn-close ms-1"
                aria-label="Remover tag"
                @click.stop="toggleTag(id)"
              ></button>
            </button>
            <button
              v-for="chip in vocabChips"
              :key="chip.key"
              type="button"
              class="btn btn-primary btn-sm btn-tag"
            >
              <span v-if="!chip.isLoaded" class="spinner-border spinner-border-sm" role="status" aria-label="Carregando..." />
              <template v-else>{{ chip.label }}</template>
              <button
                type="button"
                class="btn-close ms-1"
                :aria-label="`Remover ${chip.label || 'filtro'}`"
                @click.stop="removeVocabItem(chip.fieldKey, chip.id)"
              ></button>
            </button>
          </div>
        </div>

        <!-- Período e Características -->
        <div class="filter-panel">
          <div class="filter-panel__column">
            
            <section class="period-filter">
              <h3 class="period-filter__title">Período da imagem</h3>
              <div class="period-filter__inputs">
                <span class="period-filter__label">Entre</span>
                
                <input
                  v-model.number="imageStartYear"
                  type="number"
                  class="year-field__input"
                  min="0"
                  :max="currentYear"
                  placeholder="Ano"
                  aria-label="Ano inicial do período da imagem"
                  @keydown="onYearKeydown"
                  @change="validateYearRange(imageStartYear, imageEndYear, 'start', v => imageStartYear = v, v => imageEndYear = v)"
                />
                <span class="period-filter__label">e</span>
                <input
                  v-model.number="imageEndYear"
                  type="number"
                  class="year-field__input"
                  min="0"
                  :max="currentYear"
                  placeholder="Ano"
                  aria-label="Ano final do período da imagem"
                  @keydown="onYearKeydown"
                  @change="validateYearRange(imageStartYear, imageEndYear, 'end', v => imageStartYear = v, v => imageEndYear = v)"
                />
              </div>
            </section>

            <section class="period-filter">
              <h3 class="period-filter__title">Período da obra</h3>
              <div class="period-filter__inputs">
                <span class="period-filter__label">Entre</span>
                <input
                  v-model.number="workStartYear"
                  type="number"
                  class="year-field__input"
                  min="0"
                  :max="currentYear"
                  placeholder="Ano"
                  aria-label="Ano inicial do período da obra"
                  @keydown="onYearKeydown"
                  @change="validateYearRange(workStartYear, workEndYear, 'start', v => workStartYear = v, v => workEndYear = v)"
                />

                <span class="period-filter__label">e</span>
                
                <input
                  v-model.number="workEndYear"
                  type="number"
                  class="year-field__input"
                  min="0"
                  :max="currentYear"
                  placeholder="Ano"
                  aria-label="Ano final do período da obra"
                  @keydown="onYearKeydown"
                  @change="validateYearRange(workStartYear, workEndYear, 'end', v => workStartYear = v, v => workEndYear = v)"
                />
              </div>
            </section>

            <!-- <section class="color-picker">
              <h3 class="color-picker__title">Cor predominante</h3>
              <div class="color-picker__wrapper">
                <input
                  type="range"
                  min="0"
                  max="359"
                  step="1"
                  class="color-picker__slider"
                  v-model.number="predominantHue"
                  aria-label="Cor predominante"
                />
              </div>
            </section> -->
          </div>

          <div class="filter-panel__column">
            <section class="characteristics">
              <h3 class="characteristics__title">Características da imagem</h3>
              <p class="characteristics__subtitle">Interpretação da comunidade</p>
              
              <div class="characteristics__grid">
                <div
                  v-for="pair in CHARACTERISTIC_PAIRS"
                  :key="pair.left.key"
                  class="characteristics__row"
                >
                  <div class="checkbox-option">
                    <input
                      :id="`char${pair.left.key}left`"
                      class="checkbox-option__input"
                      type="checkbox"
                      :checked="selectedCharacteristics[pair.left.key] === 'left'"
                      @change="toggleCharacteristic(pair.left.key, 'left')"
                    />
                    <label class="checkbox-option__label" :for="`char${pair.left.key}left`">
                      {{ pair.left.label }}
                    </label>
                  </div>
  
                  <div class="checkbox-option">
                    <input
                      :id="`char${pair.left.key}right`"
                      class="checkbox-option__input"
                      type="checkbox"
                      :checked="selectedCharacteristics[pair.left.key] === 'right'"
                      @change="toggleCharacteristic(pair.left.key, 'right')"
                    />
                    <label class="checkbox-option__label" :for="`char${pair.left.key}right`">
                      {{ pair.right.label }}
                    </label>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        
        <!-- Sugestões -->
        <div class="tags-Suggestions">
          <div class="tags-Suggestions__title">Sugestões</div>
          <div class="tags-Suggestions__subtitle">
            Termos mais utilizados em nosso acervo
          </div>
          <div class="tags-Suggestions__tags">
            <button
              v-for="tag in tagSuggestions"
              :key="tag.id"
              type="button"
              :class="[
                'btn btn-sm',
                selectedTags.includes(tag.id)
                  ? 'btn-primary'
                  : 'btn-outline-secondary',
              ]"
              @click="toggleTag(tag.id)"
            >
              {{ tag.label }}
            </button>
          </div>
        </div>

        <!-- Direitos de uso -->
        <div class="rights">
          <div class="rights__header">
            <div class="rights__title">Direitos de uso</div>
            <a
              class="cc-link"
              href="https://creativecommons.org/licenses/"
              target="_blank"
              rel="noopener"
            >
              <i class="bi bi-book"></i>
              Sobre os Creative Commons
            </a>
          </div>

          <div class="rights__licenses">
            <div
              v-for="license in CC_LICENSES"
              :key="license.label"
              class="rights__license"
            >
              <label class="rights__label">
                <input
                  class="rights__checkbox"
                  type="checkbox"
                  :checked="selectedLicenses.includes(license.label)"
                  @change="toggleLicense(license.label)"
                />
                {{ license.label }}
              </label>
            </div>
          </div>
        </div>
        
      </div>

      <div class="modal-footer footer-grid">
        <button
          type="button"
          class="btn btn-outline-secondary btn-sm w-100"
          @click="cancel"
        >
          Limpar
        </button>
        <button
          type="button"
          class="btn btn-secondary btn-sm w-100"
          @click="confirm"
        >
          Buscar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onUnmounted, ref, watch } from "vue";
import toggleArrayItem from "@/helpers/toggleArrayItem";
import createDefaultAdvancedFilters from "@/helpers/createDefaultAdvancedFilters";
import { useSubjectTerms } from "@/composables/useSubjectTerms";
import {
  useMaterialTerms,
  useTechniqueTerms,
  useStylePeriodTerms,
  useCulturalContextTerms,
  useWorkTypeTerms,
} from "@/composables/useVocabTerms";
import { CC_LICENSES } from "@/constants/creativeCommonsLicenses";
import { CHARACTERISTIC_PAIRS } from "@/constants/characteristicPairs";

defineOptions({
  name: "AdvancedSearchModal",
});

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  filters: {
    type: Object,
    default: () => createDefaultAdvancedFilters(),
  },
  hasActiveFilters: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "confirm", "clear"]);

const { getTermById, isTermLoaded, loadSubjectTerms } = useSubjectTerms();

const fieldOptions = [
  { value: "all", label: "Todos os campos", placeholder: "Texto exemplo" },
  { value: "author", label: "Autoria", placeholder: "Ex: Le Corbusier" },
  { value: "tag", label: "Tag", placeholder: "Ex: fachada" },
  { value: "title", label: "Título", placeholder: "Ex: Edifício Copan" },
  { value: "location", label: "Localização", placeholder: "Ex: São Paulo" },
  { value: "materials", label: "Materiais", placeholder: "Ex: concreto" },
  { value: "techniques", label: "Técnicas de construção", placeholder: "Ex: alvenaria" },
  { value: "stylePeriod", label: "Período de estilo", placeholder: "Ex: moderno" },
  { value: "culturalContext", label: "Contexto cultural", placeholder: "Ex: modernismo brasileiro" },
  { value: "workType", label: "Tipo de obra", placeholder: "Ex: residencial" },
];
// const fieldOptions = [
//   { value: "all", label: "Todos os campos" },
//   { value: "author", label: "Autoria" },
//   { value: "tag", label: "Tag" },
//   { value: "title", label: "Título" },
// ];
const selectedField = ref("all");
const textQueryInput = ref("");
const searchTerms = ref([]);
const tagSuggestions = [
  { id: "f5c68f66-549f-43db-96b2-ac34ebbd9f9b", label: "alvenaria" },
  { id: "019adaf3-b4f0-7139-be65-66b693091ff5", label: "concreto" },
  { id: "7084a2b8-0145-4ac7-8795-8d12c415f999", label: "edifício" },
  { id: "3de8e1d7-afb9-4fd8-b43f-5c25dabe7cc7", label: "fachada" },
  { id: "019adaf2-9fd6-71dc-b6bb-e6eb55a8c718", label: "ferro" },
  { id: "b466374c-314b-4be7-88fb-9397d44d7c1b", label: "pilar" },
  { id: "7c509819-bafb-4b12-972e-75fb966c3dbd", label: "público" },
  { id: "862f85cb-3443-45cf-bc75-fe76f16c63ef", label: "prédio" },
  { id: "019adaf5-95cd-7271-a1e1-c765025d2fb5", label: "vegetação" },
  { id: "019adaf2-9303-7336-84e3-f5706bc684bb", label: "vidro" },
];
const knownTagIds = new Set(tagSuggestions.map((t) => t.id));
const selectedTags = ref([]);
const selectedLicenses = ref([]);
const selectedMaterials = ref([]);
const selectedTechniques = ref([]);
const selectedStylePeriods = ref([]);
const selectedCulturalContexts = ref([]);
const selectedWorkTypes = ref([]);
const currentYear = new Date().getFullYear();
const imageStartYear = ref(null);
const imageEndYear = ref(null);
const workStartYear = ref(null);
const workEndYear = ref(null);
const selectedCharacteristics = ref({});
const textQueryPlaceholder = computed(
  () => fieldOptions.find((f) => f.value === selectedField.value)?.placeholder || "Texto exemplo"
);

// Integração dos 5 vocabulários VRAC (materiais, técnicas, período de estilo,
// contexto cultural, tipo de obra) dentro do MESMO input de "Termos" — em vez
// de seções separadas, ao selecionar um desses campos no dropdown, o input
// vira um autocomplete (mesmo padrão de "Tags da imagem" na edição de
// metadados): digitar filtra allItems (carregado uma vez), clicar seleciona.
const materialTermsApi = useMaterialTerms();
const techniqueTermsApi = useTechniqueTerms();
const stylePeriodTermsApi = useStylePeriodTerms();
const culturalContextTermsApi = useCulturalContextTerms();
const workTypeTermsApi = useWorkTypeTerms();

const VOCAB_FIELD_CONFIG = {
  materials: { selected: selectedMaterials, api: materialTermsApi, chipLabel: "Material" },
  techniques: { selected: selectedTechniques, api: techniqueTermsApi, chipLabel: "Técnica" },
  stylePeriod: { selected: selectedStylePeriods, api: stylePeriodTermsApi, chipLabel: "Período de estilo" },
  culturalContext: { selected: selectedCulturalContexts, api: culturalContextTermsApi, chipLabel: "Contexto cultural" },
  workType: { selected: selectedWorkTypes, api: workTypeTermsApi, chipLabel: "Tipo de obra" },
};

// Campo de vocabulário atualmente selecionado no dropdown (null se for um
// campo de texto livre comum, como "all"/"title"/"author"/"tag"/"location").
const activeVocabField = computed(() => VOCAB_FIELD_CONFIG[selectedField.value] || null);

const isVocabListLoading = ref(false);

async function ensureVocabLoaded() {
  const field = activeVocabField.value;
  if (!field || field.api.allItems.value.length > 0) return;
  isVocabListLoading.value = true;
  try {
    await field.api.loadAll();
  } finally {
    isVocabListLoading.value = false;
  }
}

// Carrega a lista assim que o campo muda pra um vocabulário — não espera o
// foco no input, pra já ter as sugestões prontas na primeira letra digitada.
watch(activeVocabField, (field) => {
  if (field) ensureVocabLoaded();
});

const vocabSuggestions = computed(() => {
  const field = activeVocabField.value;
  const q = textQueryInput.value.trim().toLowerCase();
  if (!field || !q) return [];
  return field.api.allItems.value
    .filter((item) => !field.selected.value.includes(item.id))
    .filter((item) => item.label.toLowerCase().includes(q))
    .slice(0, 20);
});

function selectVocabItem(id) {
  const field = activeVocabField.value;
  if (!field) return;
  if (!field.selected.value.includes(id)) {
    field.selected.value = [...field.selected.value, id];
  }
  textQueryInput.value = "";
}

function removeVocabItem(fieldKey, id) {
  const field = VOCAB_FIELD_CONFIG[fieldKey];
  if (!field) return;
  field.selected.value = field.selected.value.filter((existingId) => existingId !== id);
}

// Chips únicos pros 5 vocabulários (em vez de 5 blocos de template quase
// idênticos) — cada item sabe se já resolveu o label (getTermById) ou ainda
// está carregando.
const vocabChips = computed(() =>
  Object.entries(VOCAB_FIELD_CONFIG).flatMap(([fieldKey, field]) =>
    field.selected.value.map((id) => ({
      key: `${fieldKey}-${id}`,
      fieldKey,
      id,
      isLoaded: field.api.isTermLoaded(id),
      label: field.api.isTermLoaded(id) ? `${field.chipLabel}: ${field.api.getTermById(id)}` : null,
    }))
  )
);

// Enter no input: se o campo ativo é um vocabulário, seleciona a 1ª sugestão
// (não existe "adicionar texto livre" pra esses campos); senão, comportamento
// de sempre (addSearchTerm).
function onTermInputEnter() {
  if (activeVocabField.value) {
    const first = vocabSuggestions.value[0];
    if (first) selectVocabItem(first.id);
  } else {
    addSearchTerm();
  }
}

function toggleCharacteristic(pairKey, side) {
  // Clicar no lado já selecionado desmarca (volta ao neutro, nenhum lado
  // marcado); clicar no outro lado troca. Mutuamente exclusivo por par.
  if (selectedCharacteristics.value[pairKey] === side) {
    delete selectedCharacteristics.value[pairKey];
  } else {
    selectedCharacteristics.value[pairKey] = side;
  }
}

function onYearKeydown(event) {
  const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
  if (allowedKeys.includes(event.key)) return;

  // Bloqueia qualquer coisa que não seja dígito: sinais (+/-), 'e'/'E', '.', ','
  if (!/^\d$/.test(event.key)) {
    event.preventDefault();
    return;
  }

  // Bloqueia um 5º dígito quando não há seleção pra substituir
  const input = event.target;
  const alreadyAtMax =
    input.value.length >= 4 &&
    input.selectionStart === input.selectionEnd;
  if (alreadyAtMax) {
    event.preventDefault();
  }
}

function normalizeYear(value) {
  if (value === null || value === "" || value === undefined) {
    return null;
  }

  let year = Number(value);

  if (Number.isNaN(year)) {
    return null;
  }

  year = Math.floor(year);

  return Math.min(Math.max(year, 0), currentYear);
}

function validateYearRange(start, end, changedField, setStart, setEnd) {
  let normalizedStart = normalizeYear(start);
  let normalizedEnd = normalizeYear(end);

  if (
    normalizedStart !== null &&
    normalizedEnd !== null &&
    normalizedStart > normalizedEnd
  ) {
    if (changedField === "start") {
      normalizedEnd = normalizedStart;
    } else {
      normalizedStart = normalizedEnd;
    }
  }

  setStart(normalizedStart);
  setEnd(normalizedEnd);
}

// Tags selecionadas que não estão nas sugestões hardcoded (vindas do ViewGrid, etc.)
const extraSelectedTags = computed(() =>
  selectedTags.value.filter((id) => !knownTagIds.has(id))
);

const selectedFieldLabel = computed(() => {
  const found = fieldOptions.find((f) => f.value === selectedField.value);
  return found ? found.label : "Todos os campos";
});

function setSelectedField(value) {
  selectedField.value = value;
  textQueryInput.value = "";
}

function close() {
  emit("update:modelValue", false);
}

function handleClear() {
  syncFromFilters(createDefaultAdvancedFilters());
  emit("clear");
}

// Cancelar: limpa os campos (local + emite pro pai limpar a URL/busca ativa)
// e fecha o modal — antes, o botão só fechava quando não havia filtro ativo,
// e quando havia, limpava mas deixava o modal aberto.
function cancel() {
  handleClear();
  close();
}

function addSearchTerm() {
  const value = textQueryInput.value.trim();
  if (!value) return;
  const fieldLabel =
    fieldOptions.find((f) => f.value === selectedField.value)?.label || "Termo";
  searchTerms.value.push({
    field: selectedField.value,
    value,
    label: `${fieldLabel}: ${value}`,
  });
  textQueryInput.value = "";
}

function removeSearchTerm(index) {
  searchTerms.value.splice(index, 1);
}

function toggleTag(tag) {
  toggleArrayItem(selectedTags.value, tag);
}

function toggleLicense(label) {
  toggleArrayItem(selectedLicenses.value, label);
}

function confirm() {
  const payload = {
    terms: searchTerms.value,
    tags: selectedTags.value,
    licenses: selectedLicenses.value,
    materials: selectedMaterials.value,
    techniques: selectedTechniques.value,
    stylePeriods: selectedStylePeriods.value,
    culturalContexts: selectedCulturalContexts.value,
    workTypes: selectedWorkTypes.value,

    imageStartYear: imageStartYear.value,
    imageEndYear: imageEndYear.value,

    workStartYear: workStartYear.value,
    workEndYear: workEndYear.value,

    characteristics: { ...selectedCharacteristics.value },
  };
  emit("confirm", payload);
  emit("update:modelValue", false);
}

function syncFromFilters(filters) {
  const safeFilters = filters || {};
  searchTerms.value = (safeFilters.terms || []).map((term) => ({
    field: term.field,
    value: term.value,
    label: term.label,
  }));
  selectedTags.value = [...(safeFilters.tags || [])];
  selectedLicenses.value = [...(safeFilters.licenses || [])];
  selectedMaterials.value = [...(safeFilters.materials || [])];
  selectedTechniques.value = [...(safeFilters.techniques || [])];
  selectedStylePeriods.value = [...(safeFilters.stylePeriods || [])];
  selectedCulturalContexts.value = [...(safeFilters.culturalContexts || [])];
  selectedWorkTypes.value = [...(safeFilters.workTypes || [])];
  materialTermsApi.loadTerms(selectedMaterials.value);
  techniqueTermsApi.loadTerms(selectedTechniques.value);
  stylePeriodTermsApi.loadTerms(selectedStylePeriods.value);
  culturalContextTermsApi.loadTerms(selectedCulturalContexts.value);
  workTypeTermsApi.loadTerms(selectedWorkTypes.value);
  imageStartYear.value = safeFilters.imageStartYear || null;
  imageEndYear.value = safeFilters.imageEndYear || null;
  workStartYear.value = safeFilters.workStartYear || null;
  workEndYear.value = safeFilters.workEndYear || null;
  selectedCharacteristics.value = { ...(safeFilters.characteristics || {}) };
}

syncFromFilters(props.filters);

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      document.body.style.overflow = "hidden";
      syncFromFilters(props.filters);
      // Carrega labels para tags extras (vindas do ViewGrid, não conhecidas pelo modal)
      const extras = selectedTags.value.filter((id) => !knownTagIds.has(id));
      if (extras.length > 0) {
        loadSubjectTerms(extras);
      }
    } else {
      document.body.style.overflow = "";
    }
  }
);

onUnmounted(() => {
  document.body.style.overflow = "";
});

watch(
  () => props.filters,
  (newVal) => {
    if (!props.modelValue) {
      syncFromFilters(newVal);
    }
  },
  { deep: true }
);
</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}

.modal-panel {
  width: 100%;
  // height: 100%;
  max-width: 750px;
  max-height: 90vh;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: var(--shadow-elevation-medium);
  padding: 0px 40px;

  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: none;
}

.modal-body {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--Branco);

  &::-webkit-scrollbar {
    width: 4px; /* Largura bem fina */
  }

  &::-webkit-scrollbar-track {
    background: transparent; /* Fundo do trilho transparente */
  }

  &::-webkit-scrollbar-thumb {
    background-color: #ccc; /* Cor da barra */
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: #999; /* Cor ao passar o mouse */
  }

  .dropdown-menu-scroll {
    max-height: 240px; /* ajuste o valor conforme o espaço do seu modal */
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: thin;
    scrollbar-color: #ccc;
  }

  .vocab-suggestions {
  position: relative;
  z-index: 5;
  max-height: 220px;
  overflow-y: auto;
  margin-top: 2px;
  border: 1px solid var(--Cinza_C, #a6a6a6);
  border-radius: 4px;
}

  .list-group-item {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .filter-panel {
    display: flex;
    gap: 1.5rem;

    &__column {
      flex: 1 1 300px;
    }
  }

  /* Block: Period Filter */
  .period-filter {
    margin-bottom: 1.5rem;

    &__title {
      font-size: 1rem;
      font-weight: 500;
    }

    &__inputs {
      display: flex;
      align-items: center;
      /* gap: 1.5rem; */
      gap: .5rem;
    }

    &__label {
      font-size: .75rem;
      font-weight: 400;
    }
  }

  /* Block: Year Field (Já existente com melhorias de modulação) */
  .year-field {
    position: relative;

    &__input {
      width: 5.875rem;
      height: 1.875rem;
      border-radius: .3125rem;
      border: 1px solid var(--Preto);
      padding: 1rem .5rem;
    }
  }

  /* Block: Color Picker */
  .color-picker {
    &__title {
      font-size: 1.25rem;
    }

    &__slider {
      width: 100%;
    }
  }

  /* Block: Characteristics */
  .characteristics {

    &__title {
      font-size: 1rem;
      font-weight: 500;
      margin-bottom: .25rem;
    }

    &__subtitle {
      font-size: .75rem;
      font-weight: 400;
      margin-bottom: .5rem;
    }

    &__grid {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    &__row {
      display: flex;
    }
  }

  /* Block: Checkbox Option */
  .checkbox-option {
    display: flex;
    align-items: center;
    gap: .5rem;
    width: 100%;
    max-width: 120px;
    min-width: 90px;

    &__input {
      cursor: pointer;
      accent-color: var(--Cinza_M);
    }

    &__label {
      cursor: pointer;
    }
  }

  .tags-Suggestions {
    margin-top: 32px;
    margin-bottom: 32px;

    &__title {
      font-size: 1rem;
      font-weight: 500;
      margin-bottom: .25rem;
    }

    &__subtitle {
      font-size: .75rem;
      font-weight: 400;
      margin-bottom: 1rem;
    }

    &__tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
  }

  .rights {
    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      margin-bottom: .5rem;
    }

    &__title {
      font-size: 1rem;
      font-weight: 500;
    }

    .cc-link {
      display: flex;
      align-items: center;
      gap: .4375rem;
      font-size: .75rem;
      color: var(--Cinza_E);
      cursor: pointer;

      i.bi {
        font-size: 14px;
      }
    }

    .rights__licenses {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      column-gap: 2rem;
      row-gap: 0.5rem;
    }

    .rights__license {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .rights__checkbox {
      accent-color: var(--Cinza_M);
    }

    @media (max-width: 768px) {
      .rights__licenses {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 576px) {
      .rights__licenses {
        grid-template-columns: 1fr;
      }
    }
  }
}

.modal-footer {
  padding: 12px 20px 20px 20px;

}

.footer-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* Enforce 2px radius within this modal (small buttons) */
.modal-body .btn.btn-sm {
  border-radius: 2px !important;
}

.modal-body .btn-enlarge-40 {
  padding: calc(0.1rem) calc(0.75rem);
}
.modal-body .btn-enlarge-40 > i.bi {
  font-size: 1.6rem;
  line-height: 1.4;
}
</style>
