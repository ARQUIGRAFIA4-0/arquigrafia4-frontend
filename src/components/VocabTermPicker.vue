<template>
  <section class="vocab-term-picker">
    <h3 class="vocab-term-picker__title">{{ title }}</h3>

    <div class="input-group">
      <input
        v-model="query"
        type="text"
        class="form-control border-preto"
        :placeholder="placeholder"
        :aria-label="`Buscar ${title}`"
        @focus="ensureLoaded"
      />
    </div>

    <ul v-if="showSuggestions" class="vocab-term-picker__suggestions list-group">
      <li v-if="isLoadingList" class="list-group-item text-muted">
        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
        Carregando...
      </li>
      <li v-else-if="filteredOptions.length === 0" class="list-group-item text-muted">
        Nenhum resultado para "{{ query }}".
      </li>
      <li v-for="opt in filteredOptions" :key="opt.id" class="list-group-item p-0">
        <button
          type="button"
          class="dropdown-item"
          @click="select(opt.id)"
        >
          {{ opt.label }}
        </button>
      </li>
    </ul>

    <div class="d-flex flex-wrap gap-2 mt-2">
      <button
        v-for="id in modelValue"
        :key="id"
        type="button"
        class="btn btn-primary btn-sm btn-tag"
      >
        <span v-if="!isTermLoaded(id)" class="spinner-border spinner-border-sm" role="status" aria-label="Carregando..." />
        <template v-else>{{ getTermById(id) }}</template>
        <button
          type="button"
          class="btn-close ms-2"
          :aria-label="`Remover ${title}`"
          @click.stop="remove(id)"
        ></button>
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  title: {
    type: String,
    required: true,
  },
  placeholder: {
    type: String,
    default: "Digite para buscar...",
  },
  // Composable no padrão de useVocabTerms.js: () => ({ loadAll, allItems, getTermById, isTermLoaded, ... })
  useTerms: {
    type: Function,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue"]);

const { loadAll, loadTerms, allItems, getTermById, isTermLoaded } = props.useTerms();

const query = ref("");
const isLoadingList = ref(false);

// Carrega labels dos IDs já selecionados (para exibir o chip corretamente
// mesmo antes do usuário abrir o campo de busca — ex: filtro vindo da URL).
watch(
  () => props.modelValue,
  (ids) => {
    if (Array.isArray(ids) && ids.length > 0) {
      loadTerms(ids);
    }
  },
  { immediate: true }
);

async function ensureLoaded() {
  if (allItems.value.length > 0) return;
  isLoadingList.value = true;
  try {
    await loadAll();
  } finally {
    isLoadingList.value = false;
  }
}

const showSuggestions = computed(() => query.value.trim().length > 0);

const filteredOptions = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return [];
  return allItems.value
    .filter((item) => !props.modelValue.includes(item.id))
    .filter((item) => item.label.toLowerCase().includes(q))
    .slice(0, 20);
});

function select(id) {
  if (!props.modelValue.includes(id)) {
    emit("update:modelValue", [...props.modelValue, id]);
  }
  query.value = "";
}

function remove(id) {
  emit("update:modelValue", props.modelValue.filter((existingId) => existingId !== id));
}
</script>

<style scoped>
.vocab-term-picker {
  margin-bottom: 1rem;
}

.vocab-term-picker__title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.vocab-term-picker__suggestions {
  position: relative;
  z-index: 5;
  max-height: 220px;
  overflow-y: auto;
  margin-top: 2px;
  border: 1px solid var(--Cinza_C, #a6a6a6);
  border-radius: 4px;
}
</style>