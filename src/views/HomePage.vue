<template>
  <div>
    <div class="tabs-container px-3 px-md-4">
      <ul class="nav nav-underline tabs-nav">
        <li class="nav-item">
          <button
            class="nav-link active"
            aria-current="page"
            data-label="Acervo"
          >
            Acervo
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link" data-label="Percurso">Percurso</button>
        </li>
        <li class="nav-item">
          <button class="nav-link" data-label="Colecoes">Coleções</button>
        </li>
      </ul>
    </div>

    <template v-if="viewMode === 'grid'">
      <div class="px-3 px-md-4 pb-4 pt-2" data-cy="view-grid">
        <view-grid />
      </div>
    </template>

    <template v-else-if="viewMode === 'mosaic'">
      <div data-cy="view-mosaic">
        <view-mosaic />
      </div>
    </template>

    <template v-else-if="viewMode === 'mosaicOutro'">
      <div data-cy="view-mosaic-outro">
        <view-mosaic-outro />
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
import ViewMosaicOutro from "@/components/homepage/ViewMosaicOutro.vue";
import { useBreakpoints } from "@vueuse/core";
import {
  selectionToViewMode,
  selectionToViewRoute,
  viewRouteToSelection,
} from "@/constants/viewModes";
import { useSearchQuery } from "@/composables/useSearchQuery";

const route = useRoute();
const router = useRouter();
const breakpoints = useBreakpoints({ md: 768 });
const isMobile = breakpoints.smaller("md");

const viewSelection = ref(viewRouteToSelection(route.params.viewMode));
const viewMode = computed(() => selectionToViewMode(viewSelection.value));

const { searchMode, loadSnapshot, setSearchMode, submitSearch } =
  useSearchQuery();

const textQuery = ref("");
const dateRange = ref({ start: "", end: "" });
const selectedColor = ref(null);
const advancedFilters = ref({
  terms: [],
  locations: [],
  tags: [],
  use: null,
});
const mapSettingsQuery = useRouteQuery("map-settings", "2d");

function normalizeMapSettings(value) {
  return value === "3d" ? "3d" : "2d";
}

const mapSettings = ref(normalizeMapSettings(mapSettingsQuery.value));

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
        terms: snapshot.value?.terms || [],
        locations: snapshot.value?.locations || [],
        tags: snapshot.value?.tags || [],
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

function handleViewChange({ selection }) {
  viewSelection.value = selection;
  updateRoute(selection);
}

function handleToolbarConfirm({ mode, value }) {
  submitSearch({ mode, value });
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

function confirmAdvancedSearch(payload) {
  handleAdvancedFiltersUpdate(payload);
  submitSearch({ mode: "avancada", value: advancedFilters.value });
  modalAdvancedSearch.value = false;
}

function handleToolbarViewSubcontrol(payload) {
  updateMapSettings(payload.value);
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

function confirmColor(color) {
  selectedColor.value = color;
  submitSearch({ mode: "cor", value: color });
  drawerSearchColor.value = false;
}

function confirmDate(range) {
  dateRange.value = { ...range };
  submitSearch({ mode: "data", value: range });
  drawerSearchDate.value = false;
}

function confirmAdvancedDrawer({ value }) {
  handleAdvancedFiltersUpdate(value);
  submitSearch({ mode: "avancada", value: advancedFilters.value });
  drawerSearchText.value = false;
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
    terms: filters?.terms || [],
    locations: filters?.locations || [],
    tags: filters?.tags || [],
    use: filters?.use || null,
  };
}
</script>

<style scoped>
.container {
  min-height: 100vh; /* Ensure full page height */
}

.tabs-container {
  display: flex;
  justify-content: flex-start;
}

.tabs-nav {
  max-width: 560px;
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
