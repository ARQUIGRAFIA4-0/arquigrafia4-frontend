<template>
  <ui-mobile-drawer
    id="drawer-search-text"
    v-model="open"
    title=""
  >
    <div class="p-3 drawer-content">
      
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div class="h2 m-0">Busca Avançada</div>
        <button
          type="button"
          class="drawer-close-btn"
          aria-label="Fechar"
          @click="open = false"
        >
          <i class="bi bi-x" />
        </button>
      </div>

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
          <ul class="dropdown-menu menu-light">
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
            aria-label="Buscar"
            @click="addSearchTerm"
          >
            <i class="bi bi-plus-square-fill"></i>
          </button>
        </div>

        <!-- Sugestões do vocabulário ativo (materiais/técnicas/período de estilo/
             contexto cultural/tipo de obra) — mesmo padrão do autocomplete de
             "Tags da imagem" na edição de metadados. -->
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
      </div>

      <div class="mb-4">
        <div class="d-flex flex-wrap gap-2">
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
            <template v-else>Tag [id]: {{ getTermById(id) }}</template>
            <button
              type="button"
              class="btn-close ms-1"
              aria-label="Remover tag"
              @click.stop="toggleTagId(id)"
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

      <!-- <div class="mb-3">
        <div class="p">Localização</div>
        <div class="text-muted small mb-2">
          (localizações mais recorrentes em nosso acervo)
        </div>
        <div class="d-flex flex-wrap gap-2">
          <button
            v-for="city in locationSuggestions"
            :key="city"
            type="button"
            :class="[
              'btn btn-sm',
              selectedLocations.includes(city)
                ? 'btn-dark'
                : 'btn-outline-secondary',
            ]"
            @click="toggleLocation(city)"
          >
            {{ city }}
          </button>
        </div>
      </div> -->

      <div class="mb-4 pt-2">
        <div class="h2">Período da imagem</div>
        <div class="d-flex align-items-center gap-2">
          <span class="period-filter__label">Entre</span>
          <input
            v-model.number="imageStartYear"
            type="number"
            class="form-control border-preto"
            min="0"
            :max="currentYear"
            placeholder="Ano inicial"
            aria-label="Ano inicial do período da imagem"
            @keydown="onYearKeydown"
            @change="validateYearRange(imageStartYear, imageEndYear, 'start', v => imageStartYear = v, v => imageEndYear = v)"
          />
          <span>e</span>
          <input
            v-model.number="imageEndYear"
            type="number"
            class="form-control border-preto"
            min="0"
            :max="currentYear"
            placeholder="Ano final"
            aria-label="Ano final do período da imagem"
            @keydown="onYearKeydown"
            @change="validateYearRange(imageStartYear, imageEndYear, 'end', v => imageStartYear = v, v => imageEndYear = v)"
          />
        </div>
      </div>

      <div class="mb-4 pt-2">
        <div class="h2">Período da obra</div>
        <div class="d-flex align-items-center gap-2">
          <span class="period-filter__label">Entre</span>
          <input
            v-model.number="workStartYear"
            type="number"
            class="form-control border-preto"
            min="0"
            :max="currentYear"
            placeholder="Ano inicial"
            aria-label="Ano inicial do período da obra"
            @keydown="onYearKeydown"
            @change="validateYearRange(workStartYear, workEndYear, 'start', v => workStartYear = v, v => workEndYear = v)"
          />
          <span>e</span>
          <input
            v-model.number="workEndYear"
            type="number"
            class="form-control border-preto"
            min="0"
            :max="currentYear"
            placeholder="Ano final"
            aria-label="Ano final do período da obra"
            @keydown="onYearKeydown"
            @change="validateYearRange(workStartYear, workEndYear, 'end', v => workStartYear = v, v => workEndYear = v)"
          />
        </div>
      </div>

      <div class="mb-4 pt-2">
        <div class="h2">Características da imagem</div>
        <div class="small mb-2">Interpretação da comunidade</div>
        <div class="d-flex flex-column gap-2">
          <div
            v-for="pair in CHARACTERISTIC_PAIRS"
            :key="pair.left.key"
            class="d-flex flex-wrap gap-2"
          >
            <div class="checkbox-option">
              <input
                :id="`char_${pair.left.key}_left`"
                class="checkbox-option__input"
                type="checkbox"
                :checked="selectedCharacteristics[pair.left.key] === 'left'"
                @change="toggleCharacteristic(pair.left.key, 'left')"
              />
              <label class="checkbox-option__label" :for="`char_${pair.left.key}_left`">
                {{ pair.left.label }}
              </label>
            </div>

            <div class="checkbox-option">
              <input
                :id="`char_${pair.right.key}_right`"
                class="checkbox-option__input"
                type="checkbox"
                :checked="selectedCharacteristics[pair.right.key] === 'right'"
                @change="toggleCharacteristic(pair.right.key, 'right')"
              />
              <label class="checkbox-option__label" :for="`char_${pair.right.key}_right`">
                {{ pair.right.label }}
              </label>
            </div>
          </div>
        </div>
      </div>

      <div class="mb-3">
        <div class="h2">Sugestoes</div>
        <div class="small mb-2">
          Termos mais utilizados em nosso acervo
        </div>
        <div class="d-flex flex-wrap gap-2">
          <button
            v-for="tag in tagSuggestions"
            :key="tag.id"
            type="button"
            :class="[
              'btn btn-sm',
              selectedTags.includes(tag.id) ? 'btn-primary' : 'btn-outline-secondary',
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

      <div class="drawer-actions d-grid gap-2 pt-3">
        <button class="btn btn-outline-secondary" @click="cancel">
          Limpar
        </button>
        <button class="btn btn-dark" @click="confirm">Buscar</button>
      </div>
    </div>
  </ui-mobile-drawer>
</template>

<script setup>
import { computed, onUnmounted, ref, watch } from "vue";
import UiMobileDrawer from "@/components/ui/UiMobileDrawer.vue";
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

defineOptions({ name: "MobileDrawerSearchText" });

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

const emit = defineEmits([
  "update:modelValue",
  "update:filters",
  "confirm",
  "open",
  "clear",
]);

const open = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const { getTermById, isTermLoaded, loadSubjectTerms } = useSubjectTerms();
const extraSelectedTags = computed(() =>
  selectedTags.value.filter((id) => !knownTagIds.has(id))
);

const fieldOptions = ref([
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
]);
const selectedField = ref("all");
const textQueryInput = ref("");
const searchTerms = ref([]); // { field, value, label }
const selectedTags = ref([]);
const selectedLicenses = ref([]);
const selectedMaterials = ref([]);
const selectedTechniques = ref([]);
const selectedStylePeriods = ref([]);
const selectedCulturalContexts = ref([]);
const selectedWorkTypes = ref([]);
//--------
const currentYear = new Date().getFullYear();
const imageStartYear = ref(null);
const imageEndYear = ref(null);
const workStartYear = ref(null);
const workEndYear = ref(null);
const selectedCharacteristics = ref({});

const textQueryPlaceholder = computed(
  () => fieldOptions.value.find((f) => f.value === selectedField.value)?.placeholder || "Texto exemplo"
);

// Integração dos 5 vocabulários VRAC dentro do MESMO input de "Termos" — ver
// AdvancedSearchModal.vue (mesma lógica). Diferença aqui: select/remove
// chamam emitFiltersUpdate() no final, porque o drawer emite ao vivo.
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
  emitFiltersUpdate();
}

function removeVocabItem(fieldKey, id) {
  const field = VOCAB_FIELD_CONFIG[fieldKey];
  if (!field) return;
  field.selected.value = field.selected.value.filter((existingId) => existingId !== id);
  emitFiltersUpdate();
}

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

function onTermInputEnter() {
  if (activeVocabField.value) {
    const first = vocabSuggestions.value[0];
    if (first) selectVocabItem(first.id);
  } else {
    addSearchTerm();
  }
}

function setSelectedField(value) {
  selectedField.value = value;
  textQueryInput.value = "";
}

function toggleCharacteristic(pairKey, side) {
  if (selectedCharacteristics.value[pairKey] === side) {
    delete selectedCharacteristics.value[pairKey];
  } else {
    selectedCharacteristics.value[pairKey] = side;
  }
}

function onYearKeydown(event) {
  const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
  if (allowedKeys.includes(event.key)) return;
  if (!/^\d$/.test(event.key)) {
    event.preventDefault();
    return;
  }
  const input = event.target;
  const alreadyAtMax = input.value.length >= 4 && input.selectionStart === input.selectionEnd;
  if (alreadyAtMax) {
    event.preventDefault();
  }
}

function normalizeYear(value) {
  if (value === null || value === "" || value === undefined) return null;
  let year = Number(value);
  if (Number.isNaN(year)) return null;
  year = Math.floor(year);
  return Math.min(Math.max(year, 0), currentYear);
}

function validateYearRange(start, end, changedField, setStart, setEnd) {
  let normalizedStart = normalizeYear(start);
  let normalizedEnd = normalizeYear(end);
  if (normalizedStart !== null && normalizedEnd !== null && normalizedStart > normalizedEnd) {
    if (changedField === "start") normalizedEnd = normalizedStart;
    else normalizedStart = normalizedEnd;
  }
  setStart(normalizedStart);
  setEnd(normalizedEnd);
}

watch(
  () => props.filters,
  (filters) => {
    searchTerms.value = (filters?.terms || []).map((term) => ({
      field: term.field,
      value: term.value,
      label: term.label,
    }));
    selectedTags.value = [...(filters?.tags || [])];
    selectedLicenses.value = [...(filters?.licenses || [])];
    selectedMaterials.value = [...(filters?.materials || [])];
    selectedTechniques.value = [...(filters?.techniques || [])];
    selectedStylePeriods.value = [...(filters?.stylePeriods || [])];
    selectedCulturalContexts.value = [...(filters?.culturalContexts || [])];
    selectedWorkTypes.value = [...(filters?.workTypes || [])];
    materialTermsApi.loadTerms(selectedMaterials.value);
    techniqueTermsApi.loadTerms(selectedTechniques.value);
    stylePeriodTermsApi.loadTerms(selectedStylePeriods.value);
    culturalContextTermsApi.loadTerms(selectedCulturalContexts.value);
    workTypeTermsApi.loadTerms(selectedWorkTypes.value);

    imageStartYear.value = filters?.imageStartYear ?? null;
    imageEndYear.value = filters?.imageEndYear ?? null;
    workStartYear.value = filters?.workStartYear ?? null;
    workEndYear.value = filters?.workEndYear ?? null;
    selectedCharacteristics.value = { ...(filters?.characteristics || {}) };

    // Load labels for extra tags (IDs not in hardcoded suggestions)
    const extras = selectedTags.value.filter((id) => !knownTagIds.has(id));
    if (extras.length > 0) loadSubjectTerms(extras);
  },
  { immediate: true }
);

const emitFiltersUpdate = () => {
  emit("update:filters", {
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
  });
};

// A diferença pro modal desktop: o drawer emite update:filters a cada
// mudança — selectVocabItem/removeVocabItem já chamam emitFiltersUpdate()
// internamente (ver acima), então não precisa de wrappers extras aqui.

const selectedFieldLabel = computed(() => {
  const found = fieldOptions.value.find((f) => f.value === selectedField.value);
  return found ? found.label : "Todos os campos";
});

function addSearchTerm() {
  const value = textQueryInput.value.trim();
  if (!value) return;
  const fieldLabel =
    fieldOptions.value.find((f) => f.value === selectedField.value)?.label ||
    "Termo";
  searchTerms.value.push({
    field: selectedField.value,
    value,
    label: `${fieldLabel}: ${value}`,
  });
  textQueryInput.value = "";
  emitFiltersUpdate();
}

function removeSearchTerm(index) {
  searchTerms.value.splice(index, 1);
  emitFiltersUpdate();
}

function toggleTagId(id) {
  toggleArrayItem(selectedTags.value, id);
  emitFiltersUpdate();
}

function toggleLicense(label) {
  toggleArrayItem(selectedLicenses.value, label);
  emitFiltersUpdate();
}

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

function toggleTag(id) {
  toggleArrayItem(selectedTags.value, id);
  emitFiltersUpdate();
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
  emit("confirm", { mode: "avancada", value: payload });
  open.value = false;
}

// Cancelar: limpa os campos (emite pro pai limpar a URL/busca ativa) e fecha
// o drawer — antes, só limpava quando havia filtro ativo e nunca fechava
// sozinho nesse caso (só fechava quando não havia nada pra limpar).
function cancel() {
  emit("clear");
  open.value = false;
}

watch(
  () => props.modelValue,
  (isOpen, wasOpen) => {
    if (isOpen && !wasOpen) {
      emit("open");
      document.body.style.overflow = "hidden";
    }
    if (!isOpen && wasOpen) {
      document.body.style.overflow = "";
    }
  }
);

onUnmounted(() => {
  document.body.style.overflow = "";
});
</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;

.drawer-content .btn.btn-sm {
  border-radius: 2px !important;
}

.drawer-content .p {
  font-size: 14px;
  font-weight: 500;
  line-height: 150%;
}

.dropdown-menu-scroll {
  max-height: 240px; /* ajuste o valor conforme o espaço do seu modal */
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: #ccc;
}

.drawer-content .d-flex > .btn.flex-fill {
  min-width: 0;
}

.drawer-content .drawer-actions {
  grid-template-columns: 1fr 1fr;
}
.drawer-content .drawer-actions > .btn {
  width: 100%;
}

.drawer-content .btn-enlarge-40 {
  padding: calc(0.1rem) calc(0.75rem);
}
.drawer-content .btn-enlarge-40 > i.bi {
  font-size: 1.6rem;
  line-height: 1.4;
}

.drawer-close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  min-width: 24px;
  border-radius: 50%;
  background-color: #000;
  color: #fff;
  border: none;
  padding: 0;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
}

/* Block: Checkbox Option */
.checkbox-option {
  display: flex;
  align-items: center;
  gap: .5rem;
  width: 100%;
  flex: 1;
  min-width: 90px;

  &__input {
    cursor: pointer;
    accent-color: var(--Cinza_M);
  }

  &__label {
    cursor: pointer;
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
}
</style>
