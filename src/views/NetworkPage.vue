<template>
  <section class="network-page">
    <!-- Grid de resultados -->
    <div class="user-grid">
      <template v-for="item in results" :key="`${item.type}-${item.id}`">
        <UserCardNetwork v-if="item.type === 'user'" :user="item" />
        <ColletiveCardNetwork v-else :collective="item" />
      </template>

      <template v-if="isLoading">
        <div v-for="n in 6" :key="`skeleton-${n}`" class="user-grid__skeleton" />
      </template>
    </div>

    <div ref="sentinel" class="network-page__sentinel" />

    <!-- Fim da lista -->
    <p v-if="hasReachedEnd && results.length > 0" class="network-page__end-msg">
      Nenhum resultado adicional.
    </p>

    <!-- Nenhum resultado -->
    <p v-if="!isLoading && results.length === 0" class="network-page__empty-msg">
      Nenhum resultado encontrado.
    </p>

    <!-- Toolbar flutuante -->
    <div class="network-toolbar-container">
      <NetworkToolbar @search="onSearch" />
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import ColletiveCardNetwork from "../components/network/ColletiveCardNetwork.vue";
import UserCardNetwork from "../components/network/UserCardNetwork.vue";
import NetworkToolbar from "../components/network/NetworkToolbar.vue";
import { useNetworksStore } from "@/store/networks";

const store = useNetworksStore();

const PER_PAGE = 20;

const results = ref([]);
const isLoading = ref(false);
const hasReachedEnd = ref(false);
const currentPage = ref(1);
const activeParams = ref({ filter: "todos", sort: "mais-recentes", query: "" });

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

// --- Busca ---
async function fetchPage(page) {
  if (isLoading.value || hasReachedEnd.value) return;

  isLoading.value = true;
  try {
    const { data, meta } = await store.searchNetworks(buildQueryParams(page));

    results.value.push(...data);
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

onMounted(() => {
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
});

</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-md: 768px;
$breakpoint-sm: 425px;

.network-page {
  padding-bottom: 120px; // espaço para a toolbar flutuante
}

.user-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(142px, 220px));
  gap: 1rem;

  @media (max-width: $breakpoint-md) {
    grid-template-columns: repeat(4, 142px);
    justify-content: center;
  }

  @media (max-width: $breakpoint-sm) {
    grid-template-columns: repeat(2, 142px);
    justify-content: center;
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
  transform: translateX(-50%);
  z-index: 1000;
}
</style>