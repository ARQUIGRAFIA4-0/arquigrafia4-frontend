<template>
  <div>
    <div class="tabs-container">
      <ul class="nav nav-underline tabs-nav">
        <li class="nav-item">
          <button
            :class="['nav-link', { active: activeTab === 'acervo' }]"
            :aria-current="activeTab === 'acervo' ? 'page' : undefined"
            data-label="Acervo"
            @click="navigateToCollection"
          >
            Acervo
          </button>
        </li>
        <li class="nav-item">
          <button
            :class="['nav-link', { active: activeTab === 'lab' }]"
            :aria-current="activeTab === 'lab' ? 'page' : undefined"
            data-label="Lab"
            @click="navigateToLab"
          >
            Lab
          </button>
        </li>
      </ul>
    </div>

    <template v-if="activeTab === 'acervo'">
      <template v-if="hasNoResults">
        <no-search-results
          @clear="handleClearSearch"
          @new-search="handleNewSearch"
        />
      </template>

      <template v-else-if="viewMode === 'grid'">
        <div class="container-grid" data-cy="view-grid">
          <view-grid />
        </div>
      </template>

      <template v-else-if="viewMode === 'mosaic'">
        <div class="container-mosaic pb-4" data-cy="view-mosaic">
          <view-mosaic />
        </div>
      </template>

      <template v-else>
        <div data-cy="view-map">
          <view-map />
        </div>
      </template>

      <div class="toolbar" data-cy="toolbar">
        <template v-if="isMobile">
          <page-toolbar-mobile
            :view-selection="viewSelection"
            :search-mode="searchMode"
            data-cy="toolbar-mobile"
            @search-mode-change="handleMobileSearchModeChange"
            @open-view-menu="openViewMenu"
            @open-search-text="openSearchText"
            @open-search-color="openSearchColor"
            @open-search-date="openSearchDate"
          />
        </template>
        <template v-else>
          <page-toolbar
            :search-mode="searchMode"
            :text-query="textQuery"
            :date-range="dateRange"
            :color="selectedColor"
            :advanced-filters="advancedFilters"
            :active-filters="activeUrlFilters"
            :view-selection="viewSelection"
            :map-settings="mapSettings"
            data-cy="toolbar-desktop"
            @search-mode-change="handleToolbarSearchModeChange"
            @update:text-query="handleTextQueryUpdate"
            @update:date-range="handleDateRangeUpdate"
            @update:color="handleColorUpdate"
            @update:map-settings="handleMapSettingsUpdate"
            @view-change="handleViewChange"
            @view-subcontrol="handleToolbarViewSubcontrol"
            @open-advanced-search="openAdvancedSearch"
            @confirm="handleToolbarConfirm"
            @remove-filter="handleRemoveFilter"
          />
        </template>
      </div>

      <!-- Mobile Drawers -->
      <mobile-drawer-view-menu
        v-model="drawerViewMenu"
        @select="handleMobileViewChange"
      />

      <mobile-drawer-search-text
        v-model="drawerSearchText"
        :filters="advancedFilters"
        @update:filters="handleAdvancedFiltersUpdate"
        @open="handleDrawerTextOpen"
        @confirm="confirmAdvancedDrawer"
      />

      <mobile-drawer-search-color
        v-model="drawerSearchColor"
        :available-colors="availableColors"
        :value="selectedColor"
        @update:value="handleColorUpdate"
        @open="handleDrawerColorOpen"
        @confirm="confirmColor"
      />

      <mobile-drawer-search-date
        v-model="drawerSearchDate"
        :value="dateRange"
        @update:value="handleDateRangeUpdate"
        @open="handleDrawerDateOpen"
        @confirm="confirmDate"
      />

      <advanced-search-modal
        v-model="modalAdvancedSearch"
        :filters="advancedFilters"
        @confirm="confirmAdvancedSearch"
      />
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useRouteQuery } from "@vueuse/router";
import PageToolbar from "@/components/Toolbar.vue";
import PageToolbarMobile from "@/components/ToolbarMobile.vue";
import MobileDrawerSearchDate from "@/components/homepage/MobileDrawerSearchDate.vue";
import MobileDrawerSearchColor from "@/components/homepage/MobileDrawerSearchColor.vue";
import MobileDrawerViewMenu from "@/components/homepage/MobileDrawerViewMenu.vue";
import MobileDrawerSearchText from "@/components/homepage/MobileDrawerSearchText.vue";
import AdvancedSearchModal from "@/components/homepage/AdvancedSearchModal.vue";
import ViewGrid from "@/components/homepage/ViewGrid.vue";
import ViewMap from "@/components/homepage/ViewMap.vue";
import ViewMosaic from "@/components/homepage/ViewMosaic.vue";
import NoSearchResults from "@/components/homepage/NoSearchResults.vue";
import { useBreakpoints } from "@vueuse/core";
import {
  selectionToViewMode,
  selectionToViewRoute,
  viewRouteToSelection,
} from "@/constants/viewModes";
import { useSearchQuery, extractActiveFilters } from "@/composables/useSearchQuery";
import { api } from "@/services/api";
import createDefaultAdvancedFilters from "@/helpers/createDefaultAdvancedFilters";

const route = useRoute();
const router = useRouter();
const breakpoints = useBreakpoints({ md: 768 });
const isMobile = breakpoints.smaller("md");

const activeTab = computed(() => {
  return route.path.startsWith("/explore/lab") ? "lab" : "acervo";
});
const viewSelection = ref(viewRouteToSelection(route.params.viewMode));
const viewMode = computed(() => selectionToViewMode(viewSelection.value));

const { searchMode, loadSnapshot, setSearchMode, submitSearch } =
  useSearchQuery();

const textQuery = ref("");
const dateRange = ref({ start: "", end: "" });
const selectedColor = ref(null);
const advancedFilters = ref(createDefaultAdvancedFilters());
const mapSettingsQuery = useRouteQuery("map-settings", "2d");

function normalizeMapSettings(value) {
  return value === "3d" ? "3d" : "2d";
}

const mapSettings = ref(normalizeMapSettings(mapSettingsQuery.value));

// Extrai filtros ativos da URL (independente do searchMode)
const activeUrlFilters = computed(() => extractActiveFilters(route.query));

watch(
  mapSettingsQuery,
  (value) => {
    mapSettings.value = normalizeMapSettings(value);
  },
  { immediate: false }
);

const drawerViewMenu = ref(false);
const drawerSearchText = ref(false);
const drawerSearchColor = ref(false);
const drawerSearchDate = ref(false);
const modalAdvancedSearch = ref(false);

const availableColors = ref([
  "#000000",
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
]);

function syncFromSnapshot(mode) {
  const snapshot = loadSnapshot(mode);
  switch (snapshot.mode) {
    case "textual":
      textQuery.value = snapshot.value || "";
      break;
    case "data":
      dateRange.value = {
        start: snapshot.value?.start || "",
        end: snapshot.value?.end || "",
      };
      break;
    case "cor":
      selectedColor.value = snapshot.value || null;
      break;
    case "avancada":
      advancedFilters.value = {
        ...createDefaultAdvancedFilters(),
        terms: snapshot.value?.terms || [],
        locations: snapshot.value?.locations || [],
        subjects: snapshot.value?.subjects || [],
        use: snapshot.value?.use || null,
      };
      break;
    default:
      break;
  }
}

syncFromSnapshot(searchMode.value);

watch(
  () => searchMode.value,
  (mode) => {
    syncFromSnapshot(mode);
  }
);

watch(
  () => route.params.viewMode,
  (newViewMode) => {
    viewSelection.value = viewRouteToSelection(newViewMode);
  },
  { immediate: true }
);

function updateRoute(selection) {
  const targetRoute = selectionToViewRoute(selection);
  if (targetRoute === route.params.viewMode) {
    return;
  }

  router.push({
    name: "explore",
    params: { viewMode: targetRoute },
    query: route.query,
    hash: route.hash,
  });
}

function navigateToCollection() {
  router.push("/explore/acervo/mosaic");
}

function navigateToLab() {
  router.push("/explore/lab");
}

function handleViewChange({ selection }) {
  viewSelection.value = selection;
  updateRoute(selection);
}

async function handleToolbarConfirm({ mode, value }) {
  submitSearch({ mode, value });
  await performSearch({ mode, value });
}

async function handleToolbarSearchModeChange(mode) {
  await setSearchMode(mode, { replace: true });
  syncFromSnapshot(mode);
}

function handleTextQueryUpdate(value) {
  textQuery.value = value;
}

function handleDateRangeUpdate(range) {
  dateRange.value = { ...range };
}

function handleColorUpdate(color) {
  selectedColor.value = color;
}

function updateMapSettings(value) {
  const normalized = normalizeMapSettings(value);
  mapSettings.value = normalized;
  mapSettingsQuery.value = normalized;
}

function handleMapSettingsUpdate(value) {
  updateMapSettings(value);
}

function openAdvancedSearch() {
  modalAdvancedSearch.value = true;
}

async function confirmAdvancedSearch(payload) {
  handleAdvancedFiltersUpdate(payload);
  submitSearch({ mode: "avancada", value: advancedFilters.value });
  modalAdvancedSearch.value = false;
  await performSearch({ mode: "avancada", value: advancedFilters.value });
}

function handleToolbarViewSubcontrol(payload) {
  updateMapSettings(payload.value);
}

function handleRemoveFilter(filter) {
  if (filter.type === "subject") {
    const currentQuery = { ...route.query };
    
    // Obter array de subjects atuais
    let subjects = [];
    if (Array.isArray(currentQuery.subject)) {
      subjects = currentQuery.subject.filter((id) => id !== filter.value);
    } else if (typeof currentQuery.subject === "string") {
      if (currentQuery.subject !== filter.value) {
        subjects = [currentQuery.subject];
      }
    }
    
    // Remover subject da query ou atualizar com novo array
    if (subjects.length === 0) {
      delete currentQuery.subject;
    } else {
      currentQuery.subject = subjects;
    }
    
    // Navegar com a nova query
    router.push({
      name: route.name,
      params: route.params,
      query: currentQuery,
    });
  } else if (filter.type === "subjectTerm") {
    const currentQuery = { ...route.query };
    
    // Remover subject_term da query
    delete currentQuery.subject_term;
    
    // Navegar com a nova query
    router.push({
      name: route.name,
      params: route.params,
      query: currentQuery,
    });
  }
}

function handleDrawerTextOpen() {
  syncFromSnapshot("avancada");
}

function handleDrawerColorOpen() {
  syncFromSnapshot("cor");
}

function handleDrawerDateOpen() {
  syncFromSnapshot("data");
}

async function confirmColor(color) {
  selectedColor.value = color;
  submitSearch({ mode: "cor", value: color });
  drawerSearchColor.value = false;
  await performSearch({ mode: "cor", value: color });
}

async function confirmDate(range) {
  dateRange.value = { ...range };
  submitSearch({ mode: "data", value: range });
  drawerSearchDate.value = false;
  await performSearch({ mode: "data", value: range });
}

async function confirmAdvancedDrawer({ value }) {
  handleAdvancedFiltersUpdate(value);
  submitSearch({ mode: "avancada", value: advancedFilters.value });
  drawerSearchText.value = false;
  await performSearch({ mode: "avancada", value: advancedFilters.value });
}

function handleMobileSearchModeChange(mode) {
  handleToolbarSearchModeChange(mode);
}

function handleMobileViewChange({ selection }) {
  updateRoute(selection);
  viewSelection.value = selection;
}

function openViewMenu() {
  drawerViewMenu.value = true;
}

function openSearchText() {
  drawerSearchText.value = true;
}

function openSearchColor() {
  drawerSearchColor.value = true;
}

function openSearchDate() {
  drawerSearchDate.value = true;
}

function handleAdvancedFiltersUpdate(filters) {
  advancedFilters.value = {
    ...createDefaultAdvancedFilters(),
    terms: filters?.terms || [],
    locations: filters?.locations || [],
    subjects: filters?.subjects || [],
    use: filters?.use || null,
  };
}

const hasNoResults = ref(false);
const isSearching = ref(false);

async function performSearch({ mode, value }) {
  isSearching.value = true;
  try {
    const result = await api.searchImages({ mode, value });
    hasNoResults.value = result.items.length === 0;
  } finally {
    isSearching.value = false;
  }
}

function handleClearSearch() {
  textQuery.value = "";
  dateRange.value = { start: "", end: "" };
  selectedColor.value = null;
  advancedFilters.value = createDefaultAdvancedFilters();
  hasNoResults.value = false;
}

function handleNewSearch() {
  hasNoResults.value = false;
  if (isMobile.value) {
    openSearchText();
  } else {
    openAdvancedSearch();
  }
}
</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.container {
  min-height: 100vh;
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
  margin-bottom: 4px;
}

.nav-underline {
  @include md {
    gap: 40px; //sobrescreve tabs.scss
  }
}

.container-grid {
  padding-left: 1rem;
  padding-right: 1rem;

  @include md {
    padding-left: 50px;
    padding-right: 50px;
  }
}

.container-lab {
  padding-left: 1rem;
  padding-right: 1rem;
  padding-bottom: 2rem;

  @include md {
    margin-top: 40px;
    padding-left: 50px;
    padding-right: 50px;
  }
}

.container-mosaic {
  @include md {
    padding-left: 50px;
    padding-right: 50px;
  }
}

.toolbar {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  max-width: fit-content;
  z-index: 1000;
}
</style>
