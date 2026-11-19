<template>
  <!-- DESKTOP -->
  <div v-if="!isMobile" class="collections-toolbar" role="search" aria-label="Filtrar coleções">
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
          <i :class="['bi', currentFilterOption.icon]" aria-hidden="true" />
          <span><strong>Filtrar:</strong> {{ currentFilterOption.label }}</span>
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
      <span class="search-icon-wrapper">
        <i class="bi bi-search collections-toolbar__search-icon" aria-hidden="true" />
        <span v-if="search" class="search-active-dot" />
      </span>

      <!-- Modo: chip da busca aplicada -->
      <template v-if="search && !isEditing">
        <span class="collections-toolbar__chip" :title="search">{{ search }}</span>
        <button type="button" class="btn collections-toolbar__chip-clear" @click="clearSearch">
          <i class="bi bi-x-lg" aria-hidden="true" />
          Limpar
        </button>
      </template>

      <!-- Modo: input -->
      <template v-else>
        <label for="collections-search-input" class="visually-hidden">Buscar coleções</label>
        <input
          id="collections-search-input"
          ref="inputRef"
          v-model="inputDraft"
          class="collections-toolbar__search-input"
          type="text"
          placeholder="Busca por termos ou nomes"
          maxlength="255"
          autocomplete="off"
          @keydown.enter.prevent="confirmSearch"
        />
        <button type="button" class="btn collections-toolbar__submit-btn" aria-label="Buscar" @click="confirmSearch">
          <i class="bi bi-arrow-right" aria-hidden="true" />
        </button>
      </template>
    </div>
  </div>

  <!-- MOBILE (mesmo padrão da tela de Rede) -->
  <div v-else class="collections-toolbar collections-toolbar--mobile">
    <div class="collections-toolbar__mobile-block">
      <button
        class="btn collections-toolbar__mobile-btn"
        type="button"
        data-bs-toggle="offcanvas"
        data-bs-target="#collectionsOffcanvasFilters"
        :aria-label="`Filtrar: ${currentFilterOption.label}`"
      >
        <i :class="['bi', currentFilterOption.icon]" aria-hidden="true" />
      </button>
    </div>

    <div class="collections-toolbar__mobile-block">
      <button
        class="btn collections-toolbar__mobile-btn"
        type="button"
        data-bs-toggle="offcanvas"
        data-bs-target="#offcanvasSearch"
        aria-label="Buscar coleções"
      >
        <span class="search-icon-wrapper">
          <i class="bi bi-search" aria-hidden="true" />
          <span v-if="search" class="search-active-dot" />
        </span>
      </button>
    </div>
  </div>

  <Teleport to="body">
    <!-- OFFCANVAS — Filtros (mobile) -->
    <div
      v-if="isMobile"
      id="collectionsOffcanvasFilters"
      class="offcanvas offcanvas-bottom collections-offcanvas"
      tabindex="-1"
      aria-labelledby="collectionsOffcanvasFiltersLabel"
    >
      <div class="offcanvas-body collections-offcanvas__body">
        <button class="collections-offcanvas__close btn btn-icon" type="button" data-bs-dismiss="offcanvas"
          aria-label="Fechar" @click="cancelMobileFilter">
          <i class="bi bi-x-lg" aria-hidden="true" />
        </button>

        <h2 id="collectionsOffcanvasFiltersLabel" class="collections-offcanvas__title">Filtros</h2>

        <fieldset class="collections-offcanvas__group">
          <legend class="collections-offcanvas__group-label">Percurso</legend>
          <div v-for="option in COLLECTION_PERCURSO_FILTERS" :key="option.value" class="collections-offcanvas__radio">
            <input
              :id="`collections-filter-${option.value}`"
              v-model="mobileFilter"
              type="radio"
              :value="option.value"
              class="collections-offcanvas__radio-input"
            />
            <label :for="`collections-filter-${option.value}`" class="collections-offcanvas__radio-label">
              <i :class="['bi', option.icon]" aria-hidden="true" />
              {{ option.label }}
            </label>
          </div>
        </fieldset>

        <div class="collections-offcanvas__actions">
          <button class="btn collections-offcanvas__btn-voltar" type="button" data-bs-dismiss="offcanvas"
            @click="cancelMobileFilter">
            Voltar
          </button>
          <button class="btn collections-offcanvas__btn-salvar" type="button" data-bs-dismiss="offcanvas"
            @click="saveMobileFilter">
            Salvar
          </button>
        </div>
      </div>
    </div>

    <!-- OFFCANVAS — Busca (mobile): mesmo painel da Rede -->
    <NetworkSearchModal
      ref="searchModalRef"
      title="Busca por coleção"
      explain="Busque pelo nome de uma coleção."
      placeholder="Digite o nome da coleção..."
      :value="search"
      @search="emitSearch"
    />
  </Teleport>
</template>

<script setup>
import { computed, nextTick, ref, watch } from "vue";
import { useMediaQuery } from "@vueuse/core";
import NetworkSearchModal from "@/components/network/NetworkSearchModal.vue";
import {
  COLLECTION_PERCURSO_FILTERS,
  resolveCollectionPercursoFilter,
} from "@/constants/collectionFilters";

const props = defineProps({
  filter: { type: String, required: true },
  // Termo de busca aplicado (vem da URL).
  search: { type: String, default: "" },
});

const emit = defineEmits(["update:filter", "search"]);

const isMobile = useMediaQuery("(max-width: 767.98px)");

const currentFilterOption = computed(() => resolveCollectionPercursoFilter(props.filter));

// --- Busca (desktop) -------------------------------------------------------
// A busca só é aplicada no Enter ou no botão de seta; depois disso o termo
// vira um chip com "Limpar", como na tela de Rede.
const inputRef = ref(null);
const inputDraft = ref(props.search);
const isEditing = ref(false);

watch(
  () => props.search,
  (term) => {
    inputDraft.value = term;
    isEditing.value = false;
  },
);

function emitSearch(term) {
  isEditing.value = false;
  emit("search", (term ?? "").trim());
}

function confirmSearch() {
  const term = inputDraft.value.trim();
  if (!term && !props.search) return;
  emitSearch(term);
}

function clearSearch() {
  inputDraft.value = "";
  emitSearch("");
}

// --- Filtro (mobile) -------------------------------------------------------
const mobileFilter = ref(props.filter);

watch(
  () => props.filter,
  (value) => {
    mobileFilter.value = value;
  },
);

function cancelMobileFilter() {
  mobileFilter.value = props.filter;
}

function saveMobileFilter() {
  if (mobileFilter.value !== props.filter) {
    emit("update:filter", mobileFilter.value);
  }
}

// --- API pública -----------------------------------------------------------
const searchModalRef = ref(null);

// Usado pelo "Editar busca" da tela sem resultados.
async function focusSearch() {
  if (isMobile.value) {
    searchModalRef.value?.openModal();
    return;
  }
  inputDraft.value = props.search;
  isEditing.value = true;
  await nextTick();
  inputRef.value?.focus();
}

defineExpose({ focusSearch });
</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;

// ── Desktop (layout do design) ──
.collections-toolbar {
  display: flex;
  align-items: stretch;
  gap: 3.25rem;

  @media (max-width: 1023.98px) {
    gap: 1rem;
  }
}

.collections-toolbar__box {
  display: flex;
  align-items: center;
  background-color: var(--Branco, #fff);
  border-radius: 0.5rem;
  box-shadow: var(--shadow-elevation-medium);
}

.collections-toolbar__filter {
  flex-shrink: 0;
  padding: 1rem 1.5rem;
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

  strong {
    font-weight: 700;
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

.collections-toolbar__search {
  flex: 1;
  min-width: 440px;
  gap: 1.5rem;
  padding: 1rem 1.5rem;
}

.search-icon-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.search-active-dot {
  position: absolute;
  box-sizing: border-box;
  top: 0;
  right: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--Laranja_M, #c0622a);
  border: 1.5px solid var(--Branco, #fff);
}

.collections-toolbar__search-icon {
  flex-shrink: 0;
  font-size: 1.5rem;
  line-height: 1;
  color: var(--Preto, #1a1a1a);
}

.collections-toolbar__search-input {
  flex: 1;
  min-width: 0;
  height: 36px;
  border: 1px solid var(--Cinza_E, #2f2f2f);
  border-radius: 5px;
  outline: none;
  background: transparent;
  font-size: 1rem;
  color: var(--Preto, #1a1a1a);
  padding: 0.25rem 0.75rem;

  &::placeholder {
    font-style: italic;
    color: var(--Cinza_M, #a6a6a6);
  }

  &:focus-visible {
    border-color: var(--Laranja_E, #aa4f28);
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

// Chip + "Limpar" — mesmo visual da tela de Rede.
.collections-toolbar__chip {
  display: inline-block;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background-color: var(--Laranja_M, #c0622a);
  color: var(--Branco, #fff);
  padding: 0.25rem 0.625rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.collections-toolbar__chip-clear {
  flex-shrink: 0;
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.25rem 0.688rem;
  border: 1px solid var(--Cinza_M, #a6a6a6);
  background-color: transparent;
  color: var(--Preto, #1a1a1a);
  font-size: 0.875rem;
  cursor: pointer;

  .bi {
    line-height: 0;
    font-size: 0.7rem;
  }

  &:hover {
    color: var(--Branco, #fff);
    background-color: var(--Preto, #1a1a1a);
  }
}

// ── Mobile (padrão da tela de Rede) ──
.collections-toolbar--mobile {
  gap: 0.75rem;
}

.collections-toolbar__mobile-block {
  box-shadow: var(--shadow-elevation-medium);
  background-color: var(--Branco, #fff);
  border-radius: 0.375rem;
  padding: 10px 14px;
}

.collections-toolbar__mobile-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  color: var(--Preto, #1a1a1a);
  background: transparent;
  border: none;
  padding: 0;
}

// ── Offcanvas de filtros (mesmos valores do NetworkToolbar) ──
.collections-offcanvas {
  height: 100vh;
  max-height: 100vh;
  width: 100vw;
  max-width: 100vw;
  left: 0;
}

.collections-offcanvas__body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow-y: auto;
}

.collections-offcanvas__close {
  align-self: flex-end;
  width: 24px;
  height: 24px;
  border-radius: 100%;
  background-color: var(--Gray-900, #212529);
  color: var(--Branco, #fff);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px;
  border: none;

  & .bi {
    font-size: 15px;
  }
}

.collections-offcanvas__title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  margin-bottom: 2.5rem;
}

.collections-offcanvas__group {
  border: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2.5rem;
}

.collections-offcanvas__group-label {
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0;
}

.collections-offcanvas__radio {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.collections-offcanvas__radio-input {
  width: 12px;
  height: 12px;
  accent-color: var(--Preto, #1a1a1a);
  cursor: pointer;
}

.collections-offcanvas__radio-label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 400;
  cursor: pointer;
}

.collections-offcanvas__actions {
  display: flex;
  gap: 0.75rem;
  margin-top: auto;
}

.collections-offcanvas__btn-voltar,
.collections-offcanvas__btn-salvar {
  flex: 1;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  height: var(--control-height-mobile, 48px);
  min-height: var(--control-height-mobile, 48px);
  box-sizing: border-box;
  padding: 2px 14px;
}

.collections-offcanvas__btn-voltar {
  border: 1px solid var(--Preto, #1a1a1a);
}

.collections-offcanvas__btn-salvar {
  background-color: var(--Preto, #1a1a1a);
  color: var(--Branco, #fff);
}
</style>
