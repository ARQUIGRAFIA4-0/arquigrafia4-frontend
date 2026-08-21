<template>
  <!-- DESKTOP -->
  <div v-if="!isMobile" class="network-toolbar">
    <!-- Filtro de tipo -->
    <div class="network-toolbar__filter">
      <div class="dropdown dropup">
        <button class="btn btn-icon dropdown-toggle caret-right network-toolbar__filter-btn" type="button"
          data-bs-toggle="dropdown" data-bs-offset="0,16" aria-expanded="false">
          <i :class="['bi', currentFilterOption.icon]" />
        </button>
        <ul class="dropdown-menu menu-dark">
          <li v-for="option in filterOptions" :key="option.value">
            <button class="dropdown-item" :class="{ active: currentFilter === option.value }"
              @click="currentFilter = option.value">
              <i :class="['bi', option.icon, 'me-2']" />
              {{ option.label }}
            </button>
          </li>
        </ul>
      </div>
    </div>

    <!-- Ordenação -->
    <div class="network-toolbar__sort">
      <div class="dropdown dropup">
        <button class="btn btn-icon dropdown-toggle caret-right network-toolbar__sort-btn" type="button"
          data-bs-toggle="dropdown" data-bs-offset="0,16" aria-expanded="false">
          <span class="network-toolbar__sort-label">
            <strong>Ordenar por:</strong> {{ currentSortOption.label }}
          </span>
        </button>
        <ul class="dropdown-menu menu-dark">
          <li v-for="option in sortOptions" :key="option.value">
            <button class="dropdown-item" :class="{ active: currentSort === option.value }"
              @click="currentSort = option.value">
              {{ option.label }}
            </button>
          </li>
        </ul>
      </div>
    </div>

    <!-- Busca -->
    <div class="network-toolbar__search">
      <span class="search-icon-wrapper">
        <i class="bi bi-search network-toolbar__search-icon-static" />
        <span v-if="searched" class="search-active-dot" />
      </span>

      <!-- Modo: chip ativo -->
      <template v-if="searchText && searched">
        <span class="network-toolbar__chip">
          {{ searchText }}
        </span>
        <button type="button" class="btn network-toolbar__chip--clear" @click="clearSearch">
          <i class="bi bi-x-lg" />
          Limpar
        </button>
      </template>

      <!-- Modo: input -->
      <template v-else>
        <input v-model="inputDraft" class="network-toolbar__search-input" type="text" placeholder="Busca por nome"
          @keydown.enter="onConfirm" />
        <button class="btn network-toolbar__search-btn" type="button" @click="onConfirm">
          <i class="bi bi-arrow-right" />
        </button>
      </template>
    </div>

  </div>

  <!-- MOBILE -->
  <div v-else class="network-toolbar network-toolbar--mobile">
    <!-- Botão filtro + ordenação -->
    <div class="network-toolbar__mobile-block">
      <button class="btn network-toolbar__mobile-btn" type="button" data-bs-toggle="offcanvas"
        data-bs-target="#offcanvasFilters">
        <i :class="['bi', currentFilterOption.icon]" />
        <i class="bi bi-sort-down" />
      </button>
    </div>

    <!-- Botão busca -->
    <div class="network-toolbar__mobile-block">
      <button class="btn network-toolbar__mobile-btn" type="button" data-bs-toggle="offcanvas"
        data-bs-target="#offcanvasSearch">
        <span class="search-icon-wrapper">
          <i class="bi bi-search" />
          <span v-if="searched" class="search-active-dot" />
        </span>
      </button>
    </div>
  </div>

  <!-- OFFCANVAS — Filtros (mobile) -->
  <div id="offcanvasFilters" class="offcanvas offcanvas-bottom network-offcanvas" tabindex="-1"
    aria-labelledby="offcanvasFiltersLabel">
    <div class="offcanvas-body network-offcanvas__body">
      <button class="network-offcanvas__close btn btn-icon" type="button" data-bs-dismiss="offcanvas"
        aria-label="Fechar">
        <i class="bi bi-x-lg" />
      </button>

      <h2 class="network-offcanvas__title">Filtros</h2>

      <!-- Tipo de perfil -->
      <fieldset class="network-offcanvas__group">
        <legend class="network-offcanvas__group-label">Tipo de perfil</legend>
        <div v-for="option in filterOptions" :key="option.value" class="network-offcanvas__radio">
          <input :id="`filter-${option.value}`" v-model="mobileFilter" type="radio" :value="option.value"
            class="network-offcanvas__radio-input" />
          <label :for="`filter-${option.value}`" class="network-offcanvas__radio-label">
            {{ option.label }}
          </label>
        </div>
      </fieldset>

      <!-- Ordenar por -->
      <fieldset class="network-offcanvas__group">
        <legend class="network-offcanvas__group-label">Ordenar por</legend>
        <div v-for="option in sortOptions" :key="option.value" class="network-offcanvas__radio">
          <input :id="`sort-${option.value}`" v-model="mobileSort" type="radio" :value="option.value"
            class="network-offcanvas__radio-input" />
          <label :for="`sort-${option.value}`" class="network-offcanvas__radio-label">
            {{ option.label }}
          </label>
        </div>
      </fieldset>

      <!-- Ações -->
      <div class="network-offcanvas__actions">
        <button class="btn network-offcanvas__btn-voltar" type="button" data-bs-dismiss="offcanvas"
          @click="cancelMobileFilters">
          Voltar
        </button>
        <button class="btn network-offcanvas__btn-salvar" type="button" data-bs-dismiss="offcanvas"
          @click="saveMobileFilters">
          Salvar
        </button>
      </div>
    </div>
  </div>

  <NetworkSearchModal ref="searchModalRef" @search="onSearchTerms" />
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import NetworkSearchModal from "./NetworkSearchModal.vue";

const emit = defineEmits(["search"]);
const inputDraft = ref("");
const searchText = ref("");
const searched = ref(false);

// --- Responsivo ---
const isMobile = ref(window.innerWidth < 768);
function onResize() { isMobile.value = window.innerWidth < 768; }
onMounted(() => window.addEventListener("resize", onResize));
onBeforeUnmount(() => window.removeEventListener("resize", onResize));


// --- Estado desktop ---
const currentFilter = ref("todos");
const currentSort = ref("mais-recentes");
const searchModalRef = ref(null);

// --- Opções ---
const filterOptions = [
  { value: "todos", label: "Todos", icon: "bi-globe" },
  { value: "pessoas", label: "Pessoal", icon: "bi-person-fill" },
  { value: "coletivos", label: "Coletivo", icon: "bi-people-fill" },
];

const sortOptions = [
  { value: "mais-recentes", label: "Mais recentes" },
  { value: "mais-antigas", label: "Mais antigos" },
  { value: "a-z", label: "A-Z" },
  { value: "z-a", label: "Z-A" },
];
const currentFilterOption = computed(() => filterOptions.find(o => o.value === currentFilter.value) ?? filterOptions[0]);
const currentSortOption = computed(() => sortOptions.find(o => o.value === currentSort.value) ?? sortOptions[0]);
const mobileFilter = ref("todos");
const mobileSort = ref("mais-recentes");

const scrollToTop = () => { window.scrollTo({ top: 0, behavior: "smooth", }); };

function cancelMobileFilters() {
  mobileFilter.value = currentFilter.value;
  mobileSort.value = currentSort.value;
}

function saveMobileFilters() {
  currentFilter.value = mobileFilter.value;
  currentSort.value = mobileSort.value;
  onConfirm();
}

function onSearchTerms(query) {
  searchText.value = query;
  searched.value = !!query;
  inputDraft.value = query;
  emitSearch();
}

function emitSearch() {
  emit("search", {
    filter: currentFilter.value,
    sort: currentSort.value,
    query: searchText.value,
  });
  scrollToTop();
}

function clearSearch() {
  inputDraft.value = "";
  searchText.value = "";
  searched.value = false;
  emitSearch();
}

// --- Confirm ---
function onConfirm() {
  const value = inputDraft.value.trim();
  if (!value) return;
  searchText.value = value;
  searched.value = true;
  emitSearch();
  scrollToTop();
}

watch(currentFilter, emitSearch);
watch(currentSort, emitSearch);
</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-sm: 425px;

/* ── Desktop ── */
.network-toolbar {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
}

.network-toolbar__filter,
.network-toolbar__sort {
  box-shadow: var(--shadow-elevation-medium);
  background-color: var(--Branco, #fff);
  border-radius: 0.75rem;
  padding: 12px;
}

.network-toolbar__filter-btn,
.network-toolbar__sort-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  font-size: 0.875rem;
}

.network-toolbar__sort-label strong {
  font-weight: 700;
}

.network-toolbar__search {
  display: flex;
  align-items: center;
  gap: 1rem;
  background-color: var(--Branco, #fff);
  border-radius: 0.75rem;
  padding: 12px 16px;
  box-shadow: var(--shadow-elevation-medium);
  flex: 1;
}

.network-toolbar__search-icon {
  color: var(--Cinza_M, #a6a6a6);
  font-size: 1rem;
  flex-shrink: 0;
}

.search-icon-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 1rem;

  .bi-chevron-down {
    font-size: 0.688rem;
  }
}

.search-active-dot {
  position: absolute;
  box-sizing: border-box;
  top: 0px;
  right: 0px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--Laranja_M, #c0622a);
  border: 1.5px solid var(--Branco, #fff);
}

.network-toolbar__search-input {
  border: 1px solid var(--Cinza_E, #2f2f2f);
  outline: none;
  border-radius: 5px;
  background: transparent;
  font-size: 0.875rem;
  color: var(--Preto, #1a1a1a);
  flex: 1;
  min-width: 0;
  padding: 0.281rem 0.625rem;
}

.network-toolbar__search-input::placeholder {
  color: var(--Cinza_M, #a6a6a6);
}

.network-toolbar__search-btn {
  width: 32px;
  height: 32px;
  min-width: 32px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: var(--Preto, #1a1a1a);
  color: var(--Branco, #fff);
  border: none;
  border-radius: 0.375rem;
  flex-shrink: 0;
}

.network-toolbar__search-btn:hover {
  opacity: 0.85;
}

/* ── Mobile toolbar ── */
.network-toolbar--mobile {
  gap: 0.75rem;
}

.network-toolbar__mobile-block {
  box-shadow: var(--shadow-elevation-medium);
  background-color: var(--Branco, #fff);
  border-radius: 0.375rem;
  padding: 10px 14px;
}

.network-toolbar__mobile-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  color: var(--Preto, #1a1a1a);
  background: transparent;
  border: none;
  padding: 0;
}

/* ── Offcanvas ── */
.network-offcanvas {
  height: 100vh;
  max-height: 100vh;
  width: 100vw;
  max-width: 100vw;
  left: 0;
}

.network-offcanvas__body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow-y: auto;
}

.network-offcanvas__close {
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

.network-offcanvas__title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  margin-bottom: 2.5rem;
}

.network-offcanvas__group {
  border: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2.5rem;
}

.network-offcanvas__group-label {
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0;
}

.network-offcanvas__radio {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.network-offcanvas__radio-input {
  width: 12px;
  height: 12px;
  accent-color: var(--Preto, #1a1a1a);
  cursor: pointer;
}

.network-offcanvas__radio-label {
  font-size: 0.875rem;
  font-weight: 400;
  cursor: pointer;
}

.network-offcanvas__actions {
  display: flex;
  gap: 0.75rem;
  margin-top: auto;
}

.network-offcanvas__btn-voltar {
  flex: 1;
  border: 1px solid var(--Preto, #1a1a1a);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  height: var(--control-height-desk, 38px);
  min-height: var(--control-height-desk, 38px);
  box-sizing: border-box;
  padding: 2px 14px;
}

.network-offcanvas__btn-salvar {
  flex: 1;
  background-color: var(--Preto, #1a1a1a);
  color: var(--Branco, #fff);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  height: var(--control-height-desk, 38px);
  min-height: var(--control-height-desk, 38px);
  box-sizing: border-box;
  padding: 2px 14px;
}

@media (max-width: 767.98px) {
  .network-offcanvas__btn-voltar,
  .network-offcanvas__btn-salvar {
    height: var(--control-height-mobile, 48px);
    min-height: var(--control-height-mobile, 48px);
  }
}

.network-toolbar__chip--clear {
  background-color: transparent;
  color: var(--Preto, #1a1a1a);
  border: 1px solid var(--Cinza_M, #a6a6a6);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.250rem 0.688rem;
  cursor: pointer;
  font-size: 0.875rem;

  & .bi {
    line-height: 0;
    font-size: 0.7rem;
  }

  &:hover {
    color: var(--Branco, #fff);
    background-color: var(--Preto, #1a1a1a);
  }
}

.network-toolbar__search-icon-static {
  color: var(--Cinza_M, #a6a6a6);
  font-size: 1rem;
  flex-shrink: 0;
}

.network-toolbar__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--Laranja_M, #c0622a);
  color: var(--Branco, #fff);
  padding: 0.25rem 0.625rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  white-space: nowrap;
}
</style>