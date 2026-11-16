<template>
  <div class="collections-toolbar" role="search" aria-label="Filtrar coleções">
    <!-- Filtro de percurso -->
    <div class="collections-toolbar__box collections-toolbar__filter">
      <div class="dropdown dropup">
        <button
          id="collections-filter-dropdown"
          class="btn dropdown-toggle caret-right collections-toolbar__filter-btn"
          type="button"
          data-bs-toggle="dropdown"
          data-bs-offset="0,16"
          aria-expanded="false"
          :aria-label="`Filtrar: ${currentFilterOption.label}`"
        >
          <i :class="['bi', currentFilterOption.icon, 'collections-toolbar__filter-icon']" aria-hidden="true" />
          <span class="collections-toolbar__filter-text">
            <strong>Filtrar:</strong> {{ currentFilterOption.label }}
          </span>
        </button>
        <ul class="dropdown-menu menu-dark collections-toolbar__menu" aria-labelledby="collections-filter-dropdown">
          <li v-for="option in COLLECTION_PERCURSO_FILTERS" :key="option.value">
            <button
              type="button"
              class="dropdown-item collections-toolbar__menu-item"
              :class="{ active: filter === option.value }"
              :aria-current="filter === option.value ? 'true' : undefined"
              @click="emit('update:filter', option.value)"
            >
              <i class="bi bi-check2 collections-toolbar__menu-check" :class="{ invisible: filter !== option.value }"
                aria-hidden="true" />
              <i :class="['bi', option.icon]" aria-hidden="true" />
              {{ option.label }}
            </button>
          </li>
        </ul>
      </div>
    </div>

    <!-- Busca -->
    <div class="collections-toolbar__box collections-toolbar__search">
      <i class="bi bi-search collections-toolbar__search-icon" aria-hidden="true" />
      <div class="collections-toolbar__input-wrapper">
        <label for="collections-search-input" class="visually-hidden">Buscar coleções</label>
        <input
          id="collections-search-input"
          ref="inputRef"
          :value="search"
          class="collections-toolbar__search-input"
          type="search"
          placeholder="Busca por termos ou nomes"
          maxlength="255"
          autocomplete="off"
          @input="emit('update:search', $event.target.value)"
          @keydown.enter.prevent="emit('submit')"
          @keydown.esc="search && emit('clear')"
        />
        <button
          v-if="search"
          type="button"
          class="btn collections-toolbar__clear-btn"
          aria-label="Limpar busca"
          @click="onClear"
        >
          <i class="bi bi-x-lg" aria-hidden="true" />
        </button>
      </div>
      <button type="button" class="btn collections-toolbar__submit-btn" aria-label="Buscar" @click="emit('submit')">
        <i class="bi bi-arrow-right" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import {
  COLLECTION_PERCURSO_FILTERS,
  resolveCollectionPercursoFilter,
} from "@/constants/collectionFilters";

const props = defineProps({
  filter: { type: String, required: true },
  search: { type: String, default: "" },
});

const emit = defineEmits(["update:filter", "update:search", "submit", "clear"]);

const inputRef = ref(null);

const currentFilterOption = computed(() => resolveCollectionPercursoFilter(props.filter));

function onClear() {
  emit("clear");
  inputRef.value?.focus();
}

function focusSearch() {
  inputRef.value?.focus();
}

defineExpose({ focusSearch });
</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;

.collections-toolbar {
  display: flex;
  align-items: stretch;
  gap: 3.25rem;

  @media (max-width: 1023.98px) {
    gap: 1rem;
  }

  @media (max-width: 575.98px) {
    gap: 0.5rem;
  }
}

.collections-toolbar__box {
  display: flex;
  align-items: center;
  background-color: var(--Branco, #fff);
  border-radius: 0.5rem;
  box-shadow: var(--shadow-elevation-medium);
}

// --- Filtro ---------------------------------------------------------------
.collections-toolbar__filter {
  flex-shrink: 0;
  padding: 1rem 1.5rem;

  @media (max-width: 575.98px) {
    padding: 0.75rem;
  }
}

.collections-toolbar__filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0;
  border: 0;
  white-space: nowrap;
  font-size: 1rem;
  color: var(--Preto, #1a1a1a);
}

.collections-toolbar__filter-text strong {
  font-weight: 700;
}

// Em telas estreitas só o ícone + caret ficam visíveis (o texto segue no aria-label).
.collections-toolbar__filter-text {
  @media (max-width: 575.98px) {
    display: none;
  }
}

.collections-toolbar__menu {
  min-width: 100%;
  padding: 0.5rem 0;
  border-radius: 0.375rem;
}

.collections-toolbar__menu-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem 0.5rem 1rem;
  font-size: 1rem;
}

.collections-toolbar__menu-check {
  font-size: 0.875rem;
  margin-right: 0.25rem;
}

// --- Busca ----------------------------------------------------------------
.collections-toolbar__search {
  flex: 1;
  min-width: 0;
  gap: 1.5rem;
  padding: 1rem 1.5rem;

  @media (min-width: 768px) {
    min-width: 440px;
  }

  @media (max-width: 575.98px) {
    gap: 0.75rem;
    padding: 0.75rem;
  }
}

.collections-toolbar__search-icon {
  flex-shrink: 0;
  font-size: 1.5rem;
  line-height: 1;
  color: var(--Preto, #1a1a1a);

  @media (max-width: 575.98px) {
    display: none;
  }
}

.collections-toolbar__input-wrapper {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}

.collections-toolbar__search-input {
  width: 100%;
  min-width: 0;
  height: 36px;
  border: 1px solid var(--Cinza_E, #2f2f2f);
  border-radius: 5px;
  outline: none;
  background: transparent;
  font-size: 1rem;
  color: var(--Preto, #1a1a1a);
  padding: 0.25rem 2.25rem 0.25rem 0.75rem;

  &::placeholder {
    font-style: italic;
    color: var(--Cinza_M, #a6a6a6);
  }

  &:focus-visible {
    border-color: var(--Laranja_E, #aa4f28);
  }

  // Usa o botão de limpar próprio em vez do "x" nativo do input[type=search].
  &::-webkit-search-cancel-button {
    -webkit-appearance: none;
    appearance: none;
  }
}

.collections-toolbar__clear-btn {
  position: absolute;
  right: 4px;
  width: 28px;
  height: 28px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: var(--Cinza_E, #2f2f2f);

  .bi {
    font-size: 0.75rem;
    line-height: 0;
  }

  &:hover {
    color: var(--Laranja_E, #aa4f28);
  }
}

.collections-toolbar__submit-btn {
  width: 32px;
  height: 32px;
  min-width: 32px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 0.25rem;
  background-color: var(--Preto, #1a1a1a);
  color: var(--Branco, #fff);
  flex-shrink: 0;

  &:hover {
    opacity: 0.85;
    color: var(--Branco, #fff);
    background-color: var(--Preto, #1a1a1a);
  }
}
</style>
