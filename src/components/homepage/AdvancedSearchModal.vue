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
            <span v-if="searchTerms.length === 0" class="text-muted"
              >Nenhum termo adicionado.</span
            >
            <button
              v-for="(term, idx) in searchTerms"
              :key="idx"
              type="button"
              class="btn btn-info btn-sm btn-tag"
            >
              {{ term.label }}
              <button
                type="button"
                class="btn-close ms-2"
                aria-label="Remover termo"
                @click.stop="removeSearchTerm(idx)"
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
                :key="tag"
                type="button"
                :class="[
                  'btn btn-sm',
                  selectedTags.includes(tag)
                    ? 'btn-dark'
                    : 'btn-outline-secondary',
                ]"
                @click="toggleTag(tag)"
              >
                {{ tag }}
              </button>
            </div>
          </div>
        </div>

        <div class="mb-1 mt-2">
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
        </div>
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

const fieldOptions = [
  { value: "all", label: "Todos os campos" },
  { value: "author", label: "Autoria" },
  { value: "tag", label: "Tag" },
  { value: "location", label: "Localização" },
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
  "Concreto",
  "Público",
  "Ferro",
  "Vidro",
  "Alvenaria",
  "Vegetação",
  "Fachada",
  "Edifício",
  "Prédio",
  "Pilar",
];
const selectedTags = ref([]);
const selectedUse = ref(null);

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
