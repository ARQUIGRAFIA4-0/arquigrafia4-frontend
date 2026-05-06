<template>
  <ui-mobile-drawer
    id="drawer-search-text"
    v-model="open"
    title=""
  >
    <div class="p-3 drawer-content">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div class="h2 m-0">Busca por palavras</div>
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
                @click.prevent="selectedField = opt.value"
              >
                {{ opt.label }}
              </button>
            </li>
          </ul>
          <input
            v-model="textQueryInput"
            type="text"
            class="form-control border-preto border-end-0"
            placeholder="Digite o termo de busca"
            @keydown.enter="addSearchTerm"
          />
          <button
            class="btn btn-light border-preto border-start-0 bg-transparent btn-enlarge-40"
            type="button"
            aria-label="Buscar"
            @click="addSearchTerm"
          >
            <i class="bi bi-plus-square-fill"></i>
          </button>
        </div>
      </div>

      <div class="mb-4">
        <div class="h2 pt-3">Termos de busca</div>
        <div class="d-flex flex-wrap gap-2">
          <span v-if="searchTerms.length === 0 && extraSelectedTags.length === 0" class="text-muted"
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
        </div>
      </div>

      <div class="mb-3 pt-3">
        <div class="h2">Sugestões de busca</div>
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

      <div class="mb-3">
        <div class="p">Tags</div>
        <div class="text-muted small mb-2">
          (termos mais utilizados em nosso acervo)
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

      <div class="mb-3 pt-2">
        <div class="p">Licença de uso</div>
        <div class="text-muted small mb-2">
          (selecione uma ou mais licenças; a busca retorna imagens com qualquer uma das selecionadas)
        </div>
        <div class="d-flex flex-wrap gap-2">
          <button
            v-for="license in CC_LICENSES"
            :key="license.label"
            type="button"
            :class="[
              'btn btn-sm',
              selectedLicenses.includes(license.label) ? 'btn-primary' : 'btn-outline-secondary',
            ]"
            @click="toggleLicense(license.label)"
          >
            {{ license.label }}
          </button>
        </div>
      </div>

      <!-- <div class="mb-4">
        <div class="p pb-2">Uso permitido</div>
        <div class="d-flex flex-wrap gap-2">
          <button
            type="button"
            :class="[
              'btn btn-sm',
              selectedUse === 'commercial'
                ? 'btn-dark'
                : 'btn-outline-secondary',
            ]"
            @click="setUse('commercial')"
          >
            Permite uso comercial
          </button>
          <button
            type="button"
            :class="[
              'btn btn-sm',
              selectedUse === 'nonCommercial'
                ? 'btn-dark'
                : 'btn-outline-secondary',
            ]"
            @click="setUse('nonCommercial')"
          >
            Não permite uso comercial
          </button>
        </div>
      </div> -->

      <div class="drawer-actions d-grid gap-2 pt-3">
        <button class="btn btn-outline-secondary" @click="hasActiveFilters ? emit('clear') : open = false">
          {{ hasActiveFilters ? 'Limpar busca' : 'Cancelar' }}
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
import { CC_LICENSES } from "@/constants/creativeCommonsLicenses";

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
  { value: "all", label: "Todos os campos" },
  { value: "author", label: "Autoria" },
  { value: "tag", label: "Tag" },
  { value: "title", label: "Título" },
]);
const selectedField = ref("all");
const textQueryInput = ref("");
const searchTerms = ref([]); // { field, value, label }
const selectedLocations = ref([]);
const selectedTags = ref([]);
const selectedUse = ref(null);
const selectedLicenses = ref([]);

watch(
  () => props.filters,
  (filters) => {
    searchTerms.value = (filters?.terms || []).map((term) => ({
      field: term.field,
      value: term.value,
      label: term.label,
    }));
    selectedLocations.value = [...(filters?.locations || [])];
    selectedTags.value = [...(filters?.tags || [])];
    selectedUse.value = filters?.use || null;
    selectedLicenses.value = [...(filters?.licenses || [])];
    // Load labels for extra tags (IDs not in hardcoded suggestions)
    const extras = selectedTags.value.filter((id) => !knownTagIds.has(id));
    if (extras.length > 0) loadSubjectTerms(extras);
  },
  { immediate: true }
);

const emitFiltersUpdate = () => {
  emit("update:filters", {
    terms: searchTerms.value,
    locations: selectedLocations.value,
    tags: selectedTags.value,
    use: selectedUse.value,
    licenses: selectedLicenses.value,
  });
};

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

const locationSuggestions = ref([
  "São Paulo",
  "Rio de Janeiro",
  "Brasilia",
  "Jaú",
  "Ribeirão Preto",
  "Londrina",
  "Mauá",
  "Itu",
  "Ouro Preto",
  "Praia Grande",
]);
function toggleLocation(city) {
  toggleArrayItem(selectedLocations.value, city);
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

function setUse(use) {
  selectedUse.value = selectedUse.value === use ? null : use;
  emitFiltersUpdate();
}

function confirm() {
  const payload = {
    terms: searchTerms.value,
    locations: selectedLocations.value,
    tags: selectedTags.value,
    use: selectedUse.value,
    licenses: selectedLicenses.value,
  };
  emit("confirm", { mode: "avancada", value: payload });
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

<style scoped>
.drawer-content .btn.btn-sm {
  border-radius: 2px !important;
}

.drawer-content .p {
  font-size: 14px;
  font-weight: 500;
  line-height: 150%;
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
</style>
