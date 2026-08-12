<template>
  <section class="network-page">
    <div class="tabs-container">
      <ul class="nav nav-underline tabs-nav">
        <li class="nav-item">
          <button :class="['nav-link', { active: activeTab === 'acervo' }]"
            :aria-current="activeTab === 'acervo' ? 'page' : undefined" data-label="Acervo"
            @click="navigateToCollection">
            Acervo
          </button>
        </li>
        <li class="nav-item">
          <button :class="['nav-link', { active: activeTab === 'lab' }]"
            :aria-current="activeTab === 'lab' ? 'page' : undefined" data-label="Lab" @click="navigateToLab">
            Lab
          </button>
        </li>
        <li class="nav-item">
          <button :class="['nav-link', { active: activeTab === 'rede' }]"
            :aria-current="activeTab === 'rede' ? 'page' : undefined" data-label="Rede" @click="navigateToRede">
            Rede
          </button>
        </li>
      </ul>
    </div>

    <div ref="gridRef" class="user-grid">
      <div v-if="isLoading && results.length === 0" class="user-grid__skeletons">
        <div v-for="n in 6" :key="`skeleton-${n}`" class="user-grid__skeleton" />
      </div>

      <div v-else-if="hasResults" class="user-masonry">
        <div
          v-for="(column, colIndex) in masonryColumns"
          :key="`col-${colIndex}-${columnCount}`"
          class="user-masonry__column"
        >
          <div
            v-for="item in column"
            :key="`${item.type}-${item.id}`"
            class="user-masonry__item"
          >
            <UserCardNetwork v-if="item.type === 'user'" :user="item" />
            <ColletiveCardNetwork v-else :collective="item" />
          </div>
        </div>
      </div>

      <div v-if="isLoading && results.length > 0" class="user-grid__loading text-center my-4">
        <div class="spinner-border spinner-border-sm text-secondary" role="status">
          <span class="visually-hidden">Carregando...</span>
        </div>
      </div>
    </div>

    <div ref="sentinel" class="network-page__sentinel" />

    <p v-if="hasReachedEnd && hasResults" class="network-page__end-msg">
      Nenhum resultado adicional.
    </p>

    <p v-if="!isLoading && !hasResults" class="network-page__empty-msg">
      Nenhum resultado encontrado.
    </p>

    <div class="network-toolbar-container">
      <NetworkToolbar @search="onSearch" />
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from "vue";
import ColletiveCardNetwork from "../components/network/ColletiveCardNetwork.vue";
import UserCardNetwork from "../components/network/UserCardNetwork.vue";
import NetworkToolbar from "../components/network/NetworkToolbar.vue";
import { useNetworksStore } from "@/store/networks";
import { useRoute, useRouter } from "vue-router";

const store = useNetworksStore();

const PER_PAGE = 20;
const COLUMN_WIDTH = 220;
const COLUMN_GAP = 16;
const MIN_COLUMNS = 2;
const MAX_COLUMNS = 6;

const route = useRoute();
const router = useRouter();
const results = ref([]);
const isLoading = ref(false);
const hasReachedEnd = ref(false);
const currentPage = ref(1);
const activeParams = ref({ filter: "todos", sort: "mais-recentes", query: "" });
const gridRef = ref(null);
const columnCount = ref(MAX_COLUMNS);

/**
 * Start: Modo de exibição do grid
 */
function buildCheckerboardColumns(items, cols) {
  const columns = Array.from({ length: cols }, () => []);
  const users = items.filter((item) => item.type === "user");
  const collectives = items.filter((item) => item.type !== "user");

  let userIndex = 0;
  let collectiveIndex = 0;
  let row = 0;
  const total = items.length;

  while (userIndex + collectiveIndex < total) {
    let placedInRow = 0;

    for (let col = 0; col < cols; col++) {
      // linha par + col par → coletivo; linha par + col ímpar → perfil (e o inverso na linha ímpar)
      const wantCollective = (col % 2 === 0) === (row % 2 === 0);
      let item = null;

      if (wantCollective && collectiveIndex < collectives.length) {
        item = collectives[collectiveIndex++];
      } else if (!wantCollective && userIndex < users.length) {
        item = users[userIndex++];
      } else if (collectiveIndex < collectives.length) {
        item = collectives[collectiveIndex++];
      } else if (userIndex < users.length) {
        item = users[userIndex++];
      }

      if (item) {
        columns[col].push(item);
        placedInRow++;
      }
    }

    if (placedInRow === 0) break;
    row++;
  }

  return columns;
}

function buildRoundRobinColumns(items, cols) {
  const columns = Array.from({ length: cols }, () => []);
  items.forEach((item, index) => {
    columns[index % cols].push(item);
  });
  return columns;
}

const hasResults = computed(() => results.value.length > 0);

const masonryColumns = computed(() => {
  const cols = columnCount.value;
  const items = results.value;
  if (!items.length) return [];

  if (activeParams.value.filter === "todos") {
    return buildCheckerboardColumns(items, cols);
  }

  return buildRoundRobinColumns(items, cols);
});

/**
 * End: Modo de exibição do grid
 */

const activeTab = computed(() => {
  const path = route.path;
  if (path.includes("/acervo")) return "acervo";
  if (path.includes("/lab")) return "lab";
  if (path.includes("/rede")) return "rede";
  return "";
});

function navigateToCollection() {
  router.push("/explore/acervo/mosaic");
}

function navigateToLab() {
  router.push("/explore/lab");
}

function navigateToRede() {
  router.push("/explore/rede");
}

const filterMap = {
  todos: undefined,
  pessoas: "user",
  coletivos: "collective",
};

const sortMap = {
  "a-z": "name",
  "z-a": "-name",
  "mais-recentes": "-created_at",
  "mais-antigas": "created_at",
};

function buildQueryParams(page) {
  const { filter, sort, query } = activeParams.value;
  return {
    ...(query && { q: query }),
    ...(filterMap[filter] && { type: filterMap[filter] }),
    sort: sortMap[sort] ?? "-created_at",
    per_page: PER_PAGE,
    page,
  };
}

function updateColumnCount() {
  const el = gridRef.value;
  if (!el) return;
  const width = el.clientWidth;
  const cols = Math.floor((width + COLUMN_GAP) / (COLUMN_WIDTH + COLUMN_GAP));
  columnCount.value = Math.max(MIN_COLUMNS, Math.min(MAX_COLUMNS, cols || MIN_COLUMNS));
}

async function fetchPage(page) {
  if (isLoading.value || hasReachedEnd.value) return;

  isLoading.value = true;
  try {
    const { data, meta } = await store.searchNetworks(buildQueryParams(page));

    results.value = [...results.value, ...data];
    currentPage.value = meta.current_page;

    if (meta.current_page >= meta.last_page) {
      hasReachedEnd.value = true;
    }
  } finally {
    isLoading.value = false;
  }
}

function resetAndFetch() {
  results.value = [];
  currentPage.value = 1;
  hasReachedEnd.value = false;
  fetchPage(1);
}

// --- Callback do toolbar ---
function onSearch({ filter, sort, query }) {
  activeParams.value = { filter, sort, query };
  resetAndFetch();
}

// --- Scroll infinito com IntersectionObserver ---
const sentinel = ref(null);
let observer = null;
let resizeObserver = null;

onMounted(async () => {
  await nextTick();
  updateColumnCount();

  if (gridRef.value && typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => updateColumnCount());
    resizeObserver.observe(gridRef.value);
  } else {
    window.addEventListener("resize", updateColumnCount);
  }

  resetAndFetch();

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !isLoading.value && !hasReachedEnd.value) {
        fetchPage(currentPage.value + 1);
      }
    },
    { rootMargin: "200px" }
  );

  if (sentinel.value) observer.observe(sentinel.value);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  resizeObserver?.disconnect();
  window.removeEventListener("resize", updateColumnCount);
});

</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-sm: 425px;

.network-page {
  padding-left: 50px;
  padding-right: 50px;
  padding-bottom: 120px;
  position: relative;
  box-sizing: border-box;

  @media (max-width: $breakpoint-sm) {
    padding-left: 12px;
    padding-right: 12px;
  }
}

.user-grid {
  box-sizing: border-box;
  width: 100%;
  padding-top: 5px;
}

.user-masonry {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  width: 100%;
}

.user-masonry__column {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.user-masonry__item {
  width: 100%;
}

.user-grid__skeletons {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr));
  gap: 1rem;

  @media (max-width: $breakpoint-sm) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.user-grid__skeleton {
  min-height: 211px;
  border-radius: 0.25rem;
  background: linear-gradient(90deg, #e8e8e8 25%, #f5f5f5 50%, #e8e8e8 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

.network-page__sentinel {
  height: 1px;
}

.network-page__end-msg,
.network-page__empty-msg {
  text-align: center;
  color: var(--Cinza_M, #a6a6a6);
  font-size: 0.875rem;
  margin-top: 2rem;
}

.network-toolbar-container {
  position: fixed;
  bottom: 32px;
  left: 50%;
  margin-left: calc(-1 * var(--toolbar-width, 300px) / 2);
  z-index: 1000;
  transform: none;
  width: fit-content;
  left: 0;
  right: 0;
  margin: 0 auto;
}
</style>
