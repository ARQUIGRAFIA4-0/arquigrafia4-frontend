<template>
  <div class="network-toolbar">
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

    <!-- Busca por nome -->
    <div class="network-toolbar__search">
      <i class="bi bi-search network-toolbar__search-icon" />
      <input v-model="searchText" class="network-toolbar__search-input" type="text" placeholder="Busca por nome"
        @keydown.enter="onConfirm" />
      <button class="btn network-toolbar__search-btn" type="button" @click="onConfirm">
        <i class="bi bi-arrow-right" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";

const emit = defineEmits(["search"]);

const filterOptions = [
  { value: "todos", label: "Todos", icon: "bi-globe2" },
  { value: "pessoas", label: "Pessoas", icon: "bi-person-fill" },
  { value: "coletivos", label: "Coletivos", icon: "bi-people-fill" },
];
const sortOptions = [
  { value: "a-z", label: "A-Z" },
  { value: "z-a", label: "Z-A" },
  { value: "mais-recentes", label: "mais recentes" },
  { value: "mais-antigas", label: "mais antigas" },
];

const currentFilter = ref("todos");
const searchText = ref("");
const currentSort = ref("mais-recentes");

const currentFilterOption = computed(
  () => filterOptions.find((o) => o.value === currentFilter.value) ?? filterOptions[0]
);
const currentSortOption = computed(
  () => sortOptions.find((o) => o.value === currentSort.value) ?? sortOptions[0]
);

watch(currentFilter, () => {
  onConfirm();
});

watch(currentSort, () => {
  onConfirm();
});

function onConfirm() {
  emit("search", {
    filter: currentFilter.value,
    sort: currentSort.value,
    query: searchText.value.trim(),
  });
}
</script>

<style scoped>
.network-toolbar {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
}

/* --- Filtro --- */
.network-toolbar__filter {
  box-shadow: var(--shadow-elevation-medium);
  background-color: var(--Branco, #fff);
  border-radius: 0.375rem;
  padding: 12px;
}

.network-toolbar__filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

/* --- Busca --- */
.network-toolbar__search {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: var(--Branco, #fff);
  border-radius: 0.375rem;
  padding: 12px 16px;
  box-shadow: var(--shadow-elevation-medium);
  flex: 1;
}

.network-toolbar__search-icon {
  color: var(--Cinza_M, #a6a6a6);
  font-size: 1rem;
  flex-shrink: 0;
}

.network-toolbar__search-input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.875rem;
  color: var(--Preto, #1a1a1a);
  flex: 1;
  min-width: 0;
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

/* --- Dropdown (reutiliza padrão do projeto) --- */
.dropdown-menu.menu-dark .dropdown-item {
  position: relative;
  padding-left: 2rem;
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

.network-toolbar__sort {
  box-shadow: var(--shadow-elevation-medium);
  background-color: var(--Branco, #fff);
  border-radius: 0.375rem;
  padding: 12px;
}

.network-toolbar__sort-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  white-space: nowrap;
  font-size: 0.875rem;
}

.network-toolbar__sort-label strong {
  font-weight: 700;
}
</style>