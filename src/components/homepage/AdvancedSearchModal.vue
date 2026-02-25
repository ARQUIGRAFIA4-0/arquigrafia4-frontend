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
              placeholder="Texto exemplo"
              @keydown.enter="addSearchTerm"
            />
            <button
              class="btn btn-light border-preto border-start-0 bg-transparent btn-enlarge-40"
              type="button"
              aria-label="Adicionar termo"
              @click="addSearchTerm"
            >
              <i class="bi bi-plus-square-fill"></i>
            </button>
          </div>
        </div>

        <div class="mb-4">
          <div class="h3 pt-2">Termos de busca</div>
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
                @click.stop="toggleTag(id)"
              ></button>
            </button>
          </div>
        </div>

        <div class="mb-3 pt-1">
          <div class="h3">Sugestões de busca</div>
        </div>

        <div class="row g-4">
          <div class="col-12 col-md-6" style="opacity: 0.4; pointer-events: none;">
            <div class="p">Localização</div>
            <div class="text-muted small mb-2">
              (localizações mais utilizadas em nosso acervo)
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
                disabled
              >
                {{ city }}
              </button>
            </div>
          </div>

          <div class="col-12 col-md-6">
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
        </div>

        <!-- <div class="mb-1 mt-2" style="opacity: 0.4; pointer-events: none;">
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
      </div>

      <div class="modal-footer footer-grid">
        <button
          type="button"
          class="btn btn-outline-secondary btn-sm w-100"
          @click="close"
        >
          Cancelar
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
import { computed, ref, watch } from "vue";
import toggleArrayItem from "@/helpers/toggleArrayItem";
import createDefaultAdvancedFilters from "@/helpers/createDefaultAdvancedFilters";
import { useSubjectTerms } from "@/composables/useSubjectTerms";

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
});

const emit = defineEmits(["update:modelValue", "confirm"]);

const { getTermById, isTermLoaded, loadSubjectTerms } = useSubjectTerms();

const fieldOptions = [
  { value: "all", label: "Todos os campos" },
  { value: "author", label: "Autoria" },
  { value: "tag", label: "Tag" },
  { value: "title", label: "Título" },
];

const selectedField = ref("all");
const textQueryInput = ref("");
const searchTerms = ref([]);
const locationSuggestions = [
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
];
const selectedLocations = ref([]);
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
const selectedUse = ref(null);

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
}

function syncFromFilters(filters) {
  const safeFilters = filters || {};
  searchTerms.value = (safeFilters.terms || []).map((term) => ({
    field: term.field,
    value: term.value,
    label: term.label,
  }));
  selectedLocations.value = [...(safeFilters.locations || [])];
  selectedTags.value = [...(safeFilters.tags || [])];
  selectedUse.value = safeFilters.use || null;
}

syncFromFilters(props.filters);

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      syncFromFilters(props.filters);
      // Carrega labels para tags extras (vindas do ViewGrid, não conhecidas pelo modal)
      const extras = selectedTags.value.filter((id) => !knownTagIds.has(id));
      if (extras.length > 0) {
        loadSubjectTerms(extras);
      }
    }
  }
);

watch(
  () => props.filters,
  (newVal) => {
    if (!props.modelValue) {
      syncFromFilters(newVal);
    }
  },
  { deep: true }
);

function close() {
  emit("update:modelValue", false);
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

function toggleLocation(city) {
  toggleArrayItem(selectedLocations.value, city);
}

function toggleTag(tag) {
  toggleArrayItem(selectedTags.value, tag);
}

function setUse(use) {
  selectedUse.value = selectedUse.value === use ? null : use;
}

function confirm() {
  const payload = {
    terms: searchTerms.value,
    locations: selectedLocations.value,
    tags: selectedTags.value,
    use: selectedUse.value,
  };
  emit("confirm", payload);
  emit("update:modelValue", false);
}
</script>

<style scoped>
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
  max-width: 750px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: var(--shadow-elevation-medium);
  padding: 0px 40px;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: none;
}

.modal-body {
  padding: 20px;
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
