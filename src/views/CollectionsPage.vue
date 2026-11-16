<template>
  <section class="collections-page">
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
          <button :class="['nav-link', { active: activeTab === 'colecoes' }]"
            :aria-current="activeTab === 'colecoes' ? 'page' : undefined" data-label="Coleções"
            @click="navigateToColecoes">
            Coleções
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

    <div class="collections-page__content">
      <p class="visually-hidden" role="status" aria-live="polite">{{ statusMessage }}</p>

      <ProfileGridSkeleton v-if="isInitialLoading" :count="8" />

      <div v-else-if="isError && !items.length" class="collections-page__state collections-page__state--error"
        role="alert">
        <p class="mb-3">Não foi possível carregar as coleções. Verifique sua conexão e tente novamente.</p>
        <button type="button" class="btn btn-secondary btn-sm" @click="refetch()">
          Tentar novamente
        </button>
      </div>

      <template v-else-if="isEmpty">
        <NoSearchResults v-if="hasActiveFilters" @clear="clearAll" @new-search="focusSearch" />
        <p v-else class="collections-page__state">Ainda não há coleções públicas.</p>
      </template>

      <template v-else>
        <div class="row g-4 collections-page__grid" :class="{ 'collections-page__grid--stale': isShowingStaleResults }"
          :aria-busy="isShowingStaleResults ? 'true' : 'false'">
          <div v-for="album in items" :key="album.id" class="col-6 profile-grid-col">
            <CollectionCard :album="album" @open="openCollection" />
          </div>
        </div>

        <div v-if="isFetchingNextPage" class="text-center my-4">
          <div class="spinner-border spinner-border-sm text-secondary" role="status">
            <span class="visually-hidden">Carregando mais coleções...</span>
          </div>
        </div>

        <div v-else-if="isFetchNextPageError" class="collections-page__state text-center" role="alert">
          <p class="mb-2">Não foi possível carregar mais coleções.</p>
          <button type="button" class="btn btn-outline-secondary btn-sm" @click="fetchNextPage()">
            Tentar novamente
          </button>
        </div>
      </template>

      <div ref="sentinelRef" class="collections-page__sentinel" aria-hidden="true" />
    </div>

    <div class="collections-toolbar-container">
      <CollectionsToolbar ref="toolbarRef" v-model:search="searchDraft" :filter="activeFilterOption.value"
        @update:filter="setFilter" @submit="applySearchNow" @clear="clearSearch" />
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useRouteQuery } from "@vueuse/router";
import { refDebounced, useElementVisibility } from "@vueuse/core";
import CollectionCard from "@/components/collection/CollectionCard.vue";
import CollectionsToolbar from "@/components/collection/CollectionsToolbar.vue";
import ProfileGridSkeleton from "@/components/ProfileGridSkeleton.vue";
import NoSearchResults from "@/components/homepage/NoSearchResults.vue";
import { usePublicAlbumsInfiniteQuery } from "@/composables/usePublicAlbumsInfiniteQuery";
import {
  DEFAULT_COLLECTION_PERCURSO_FILTER,
  resolveCollectionPercursoFilter,
} from "@/constants/collectionFilters";

const SEARCH_DEBOUNCE_MS = 400;
const LOAD_MORE_MARGIN = "400px";

const router = useRouter();

const activeTab = "colecoes";

function navigateToCollection() {
  router.push("/explore/acervo/mosaic");
}

function navigateToLab() {
  router.push("/explore/lab");
}

function navigateToRede() {
  router.push("/explore/rede");
}

function navigateToColecoes() {
  clearAll();
}

const filterQuery = useRouteQuery("percurso", DEFAULT_COLLECTION_PERCURSO_FILTER);
const searchQuery = useRouteQuery("q", "");

const activeFilterOption = computed(() => resolveCollectionPercursoFilter(filterQuery.value));
const appliedSearch = computed(() =>
  typeof searchQuery.value === "string" ? searchQuery.value.trim() : "",
);
const hasActiveFilters = computed(
  () => Boolean(appliedSearch.value) || activeFilterOption.value.value !== DEFAULT_COLLECTION_PERCURSO_FILTER,
);

const searchDraft = ref(appliedSearch.value);
const debouncedSearchDraft = refDebounced(searchDraft, SEARCH_DEBOUNCE_MS);

function applySearch(value) {
  const term = value.trim();
  if (term !== appliedSearch.value) {
    searchQuery.value = term;
  }
}

watch(debouncedSearchDraft, applySearch);

watch(appliedSearch, (term) => {
  if (term !== searchDraft.value.trim()) {
    searchDraft.value = term;
  }
});

function applySearchNow() {
  applySearch(searchDraft.value);
}

function setFilter(value) {
  filterQuery.value = resolveCollectionPercursoFilter(value).value;
}

function clearSearch() {
  searchDraft.value = "";
  applySearch("");
}

function clearAll() {
  searchDraft.value = "";
  router.replace({ query: {} });
}

const toolbarRef = ref(null);

function focusSearch() {
  toolbarRef.value?.focusSearch();
}

// --- Dados --------------------------------------------------------------
const {
  items,
  data,
  isPending,
  isError,
  isFetching,
  isPlaceholderData,
  isFetchNextPageError,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  refetch,
} = usePublicAlbumsInfiniteQuery({
  title: appliedSearch,
  hasPercursos: computed(() => activeFilterOption.value.hasPercursos),
});

const isInitialLoading = computed(() => isPending.value && !items.value.length && !isError.value);
// Troca de filtro/busca: mantém os cards anteriores (esmaecidos) até a nova
// resposta chegar, em vez de piscar o skeleton.
const isShowingStaleResults = computed(() => isPlaceholderData.value && isFetching.value);
const isEmpty = computed(
  () => !isPending.value && !isPlaceholderData.value && !isError.value && items.value.length === 0,
);

const total = computed(() => data.value?.pages?.[0]?.total ?? null);

const statusMessage = computed(() => {
  if (isInitialLoading.value || isShowingStaleResults.value) return "Carregando coleções...";
  if (isError.value && !items.value.length) return "Erro ao carregar as coleções.";
  if (isEmpty.value) return "Nenhuma coleção encontrada.";
  if (total.value != null) {
    return total.value === 1 ? "1 coleção encontrada." : `${total.value} coleções encontradas.`;
  }
  return "";
});

watch([appliedSearch, () => activeFilterOption.value.value], () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// --- Scroll infinito ----------------------------------------------------
const sentinelRef = ref(null);
const isSentinelVisible = useElementVisibility(sentinelRef, { rootMargin: LOAD_MORE_MARGIN });

// Reage também ao fim de cada carregamento: se a página for curta e o
// sentinel continuar visível, encadeia a próxima página.
watch(
  [isSentinelVisible, hasNextPage, isFetchingNextPage, isPlaceholderData, isFetchNextPageError],
  ([visible, hasNext, fetchingNext, placeholder, nextPageError]) => {
    if (visible && hasNext && !fetchingNext && !placeholder && !nextPageError) {
      fetchNextPage();
    }
  },
);

function openCollection(album) {
  router.push({
    name: "collection-detail",
    params: { collectionId: album.id, viewMode: "grid" },
  });
}
</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
@use "@/scss/profile-grid-cols.scss";
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.collections-page {
  min-height: 100vh;
  padding-bottom: 120px;
}

.tabs-container {
  display: flex;
  justify-content: flex-start;
  padding-left: 1rem;
  padding-right: 1rem;

  @include md {
    padding-left: 50px;
    padding-right: 50px;
  }
}

.tabs-nav {
  max-width: 560px;
  margin-bottom: 12px;
}

.collections-page__content {
  padding-left: 1rem;
  padding-right: 1rem;

  @include md {
    margin-top: 24px;
    padding-left: 50px;
    padding-right: 50px;
  }
}

.collections-page__grid {
  transition: opacity 0.2s ease;

  &--stale {
    opacity: 0.5;
    pointer-events: none;
  }
}

.collections-page__state {
  padding: 16px 0;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: var(--Cinza_E, #2f2f2f);

  &--error {
    color: #7a1c1c;
  }
}

.collections-page__sentinel {
  height: 1px;
}

.collections-toolbar-container {
  position: fixed;
  bottom: 32px;
  left: 0;
  right: 0;
  z-index: 1000;
  width: fit-content;
  margin: 0 auto;

  @media (max-width: 767.98px) {
    bottom: 16px;
    left: 12px;
    right: 12px;
    width: auto;
  }
}
</style>
