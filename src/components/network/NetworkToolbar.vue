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
      <!-- Lupa — abre o modal -->
      <button v-if="!isMobile" class="btn network-toolbar__search-icon-btn" type="button"
        @click="searchModalRef.openModal()" data-bs-target="#offcanvasSearch">
        <span class="search-icon-wrapper">
          <i class="bi bi-search" />
          <i class="bi bi-chevron-down"></i>
          <span v-if="modalTerms.length > 0" class="search-active-dot" />
        </span>
      </button>

      <!-- Modo: termos do modal ativos -->
      <template v-if="modalTerms.length > 0">
        <!-- Primeiro chip -->
        <span class="network-toolbar__chip">
          {{ modalTerms[0] }}
          <button type="button" class="network-toolbar__chip-remove" @click="removeTerm(0)">×</button>
        </span>

        <button v-if="modalTerms.length > 1" class="btn network-toolbar__chip network-toolbar__chip--overflow"
          type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasSearch">
          +{{ modalTerms.length - 1 }} mais
        </button>
      </template>

      <!-- Modo: sem termos do modal — input simples visível -->
      <template v-else>
        <input v-model="searchText" class="network-toolbar__search-input" type="text" placeholder="Busca por nome"
          @keydown.enter="onConfirm" />
      </template>

      <button class="btn network-toolbar__search-btn" type="button" @click="onConfirm">
        <i class="bi bi-arrow-right" />
      </button>
    </div>

  </div>

  <!-- MOBILE -->
  <div v-else class="network-toolbar network-toolbar--mobile">
    <!-- Botão filtro + ordenação -->
    <div class="network-toolbar__mobile-block">
      <button class="btn network-toolbar__mobile-btn" type="button" data-bs-toggle="offcanvas"
        data-bs-target="#offcanvasFilters">
        <i class="bi bi-person-fill" />
        <i class="bi bi-sort-down" />
      </button>
    </div>

    <!-- Botão busca -->
    <div class="network-toolbar__mobile-block">
      <button class="btn network-toolbar__mobile-btn" type="button" data-bs-toggle="offcanvas"
        data-bs-target="#offcanvasSearch">
        <span class="search-icon-wrapper">
          <i class="bi bi-search" />
          <span v-if="modalTerms.length > 0" class="search-active-dot" />
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
// import { Offcanvas } from "bootstrap";
import NetworkSearchModal from "./NetworkSearchModal.vue";

const emit = defineEmits(["search"]);

// --- Responsivo ---
const isMobile = ref(window.innerWidth < 768);
function onResize() { isMobile.value = window.innerWidth < 768; }
onMounted(() => window.addEventListener("resize", onResize));
onBeforeUnmount(() => window.removeEventListener("resize", onResize));


// --- Estado desktop ---
const currentFilter = ref("todos");
const currentSort = ref("mais-recentes");
const searchText = ref("");
const modalTerms = ref([]);
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

// --- Estado mobile (cópias para o offcanvas não aplicar antes de salvar) ---
const mobileFilter = ref("todos");
const mobileSort = ref("mais-recentes");

const scrollToTop = () => { window.scrollTo({ top: 0, behavior: "smooth", }); };

function cancelMobileFilters() {
  // reverte para o valor aplicado atual
  mobileFilter.value = currentFilter.value;
  mobileSort.value = currentSort.value;
}

function saveMobileFilters() {
  currentFilter.value = mobileFilter.value;
  currentSort.value = mobileSort.value;
  onConfirm();
}
// --- Busca ---
function onSearchTerms(terms) {
  // terms é um array: ["mari", "maria"]
  // passa como query separada por vírgula ou ajuste conforme a API esperar
  modalTerms.value = terms;
  onConfirm();
}
function removeTerm(index) {
  modalTerms.value.splice(index, 1);
  // sincroniza com o modal
  if (searchModalRef.value) {
    searchModalRef.value.terms.splice(index, 1);
  }
  onConfirm();
}


// --- Confirm ---
function onConfirm() {
  const allTerms = [
    ...modalTerms.value,
    ...(searchText.value.trim() ? [searchText.value.trim()] : []),
  ];
  console.log(allTerms);

  emit("search", {
    filter: currentFilter.value,
    sort: currentSort.value,
    query: allTerms.join(","),
  });
  scrollToTop();
}

// --- Watches desktop ---
watch(currentFilter, onConfirm);
watch(currentSort, onConfirm);
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

.network-toolbar__search--offcanvas {
  box-shadow: none;
  border: 1px solid var(--Cinza_C, #d9d9d9);
  border-radius: 0.5rem;
  padding: 10px 12px;
  flex: none;
  width: 100%;
}

.network-toolbar__search-icon {
  color: var(--Cinza_M, #a6a6a6);
  font-size: 1rem;
  flex-shrink: 0;
}

.network-toolbar__search-icon-btn {
  background: none;
  border: none;
  padding: 0;
  color: var(--Cinza_M, #a6a6a6);
  font-size: 1rem;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.network-toolbar__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background-color: var(--Laranja_M, #c0622a);
  color: var(--Branco, #fff);
  padding: 0.2rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  white-space: nowrap;
}

.network-toolbar__chip--overflow {
  background-color: transparent;
  color: var(--Cinza_M, #a6a6a6);
  border: 1px solid var(--Cinza_M, #a6a6a6);
  font-size: 0.8rem;
  padding: 0.2rem 0.5rem;
  border-radius: 0.25rem;
}

.network-toolbar__chip--overflow:hover {
  background-color: var(--Off_white, #f8f8f8);
}

.network-toolbar__chip-remove {
  background: none;
  border: none;
  color: inherit;
  font-size: 1rem;
  line-height: 1;
  padding: 0;
  cursor: pointer;
  opacity: 0.8;
}

.network-toolbar__chip-remove:hover {
  opacity: 1;
}

.network-toolbar__divider {
  display: inline-block;
  width: 1px;
  height: 20px;
  background-color: var(--Cinza_C, #d9d9d9);
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
  top: 0px;
  right: 20px;
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
  /* FORÇAR tela inteira */
  width: 100vw;
  max-width: 100vw;
  left: 0;
  // bottom: 0;
}

.network-offcanvas--search {
  height: 100vh;
  max-height: 100vh;
  width: 100vw;
  max-width: 100vw;
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
  height: 30px;
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
  height: 30px;
}

/* ── Dropdown (padrão do projeto) ── */
.dropdown-menu.menu-dark .dropdown-item {
  position: relative;
  padding-left: 2rem;
}

.offcanvas-backdrop {
  width: 100vw;
  height: 100vh;
  left: 0;
  top: 0;
  position: relative;
}

.dropdown-menu.menu-dark .dropdown-item.active::before {
  content: "";
  display: inline-block;
  width: 1rem;
  height: 1rem;
  position: absolute;
  left: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background-color: currentColor;
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M13.485 1.929a1.25 1.25 0 0 1 0 1.768l-7.071 7.07a1.25 1.25 0 0 1-1.768 0L.515 7.676A1.25 1.25 0 0 1 2.283 5.91l2.121 2.12 6.187-6.187a1.25 1.25 0 0 1 1.768 0z'/%3E%3C/svg%3E");
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M13.485 1.929a1.25 1.25 0 0 1 0 1.768l-7.071 7.07a1.25 1.25 0 0 1-1.768 0L.515 7.676A1.25 1.25 0 0 1 2.283 5.91l2.121 2.12 6.187-6.187a1.25 1.25 0 0 1 1.768 0z'/%3E%3C/svg%3E");
  mask-repeat: no-repeat;
  mask-position: center;
  mask-size: contain;
}
</style>