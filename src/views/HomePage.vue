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
          <view-grid :search="activeSearch" @no-results="handleNoResults" />
        </div>
      </template>

      <template v-else-if="viewMode === 'mosaic'">
        <div class="container-mosaic pb-4" data-cy="view-mosaic">
          <view-mosaic :search="activeSearch" @no-results="handleNoResults" />
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
            @remove-chip="handleRemoveChip"
            @remove-url-chip="handleRemoveUrlChip"
            @clear-all-filters="handleClearAllFilters"
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
import { useSearchQuery } from "@/composables/useSearchQuery";
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

const hasNoResults = ref(false);
const activeSearch = ref(null);

syncFromSnapshot(searchMode.value);

// If the URL already contains search parameters, trigger the search on load
{
  const snapshot = loadSnapshot(searchMode.value);
  const hasValue =
    snapshot.mode === "textual"
      ? Boolean(snapshot.value)
      : snapshot.mode === "data"
        ? Boolean(snapshot.value?.start || snapshot.value?.end)
        : snapshot.mode === "cor"
          ? Boolean(snapshot.value)
          : snapshot.mode === "avancada"
            ? Boolean(
                snapshot.value?.terms?.length ||
                  snapshot.value?.locations?.length ||
                  snapshot.value?.tags?.length ||
                  snapshot.value?.subjects?.length ||
                  snapshot.value?.use
              )
            : false;

  if (hasValue) {
    performSearch({ mode: snapshot.mode, value: snapshot.value });
  }
}

watch(
  () => route.query,
  () => {
    const mode = searchMode.value;
    syncFromSnapshot(mode);
    const snapshot = loadSnapshot(mode);
    const hasValue =
      snapshot.mode === "textual"
        ? Boolean(snapshot.value)
        : snapshot.mode === "data"
          ? Boolean(snapshot.value?.start || snapshot.value?.end)
          : snapshot.mode === "cor"
            ? Boolean(snapshot.value)
            : snapshot.mode === "avancada"
              ? Boolean(
                  snapshot.value?.terms?.length ||
                  snapshot.value?.locations?.length ||
                  snapshot.value?.tags?.length ||
                  snapshot.value?.subjects?.length ||
                  snapshot.value?.use
                )
              : false;
    if (hasValue) {
      performSearch({ mode: snapshot.mode, value: snapshot.value });
    } else {
      // Limpa busca ativa quando não há mais filtros (ex: chip 'q' removido)
      hasNoResults.value = false;
      activeSearch.value = null;
    }
  },
  { deep: true }
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

function handleToolbarConfirm({ mode, value }) {
  submitSearch({ mode, value });
  performSearch({ mode, value });
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

function buildAdvancedFiltersFromUrl() {
  const query = route.query;
  const terms = [];

  if (query.q) {
    terms.push({ field: 'all', value: query.q, label: `Todos os campos: ${query.q}` });
  }
  if (query.title) {
    terms.push({ field: 'title', value: query.title, label: `Título: ${query.title}` });
  }
  if (query.contributor) {
    terms.push({ field: 'author', value: query.contributor, label: `Autoria: ${query.contributor}` });
  }
  const rawSubjectTerms = query['subject_term[]'];
  const subjectTerms = rawSubjectTerms
    ? (Array.isArray(rawSubjectTerms) ? rawSubjectTerms : [rawSubjectTerms])
    : [];
  subjectTerms.forEach((term) => {
    terms.push({ field: 'tag', value: term, label: `Tag: ${term}` });
  });

  return {
    ...createDefaultAdvancedFilters(),
    terms,
  };
}

function openAdvancedSearch() {
  advancedFilters.value = buildAdvancedFiltersFromUrl();
  modalAdvancedSearch.value = true;
}

function confirmAdvancedSearch(payload) {
  // Mantém advancedFilters sincronizado (necessário para "Editar" reabrir com dados)
  handleAdvancedFiltersUpdate(payload);

  // --- Bypass: monta URL diretamente a partir do payload ---
  const terms = Array.isArray(payload.terms) ? payload.terms : [];

  // Agrupa termos por campo
  const qValues = [];
  const titleValues = [];
  const contributorValues = [];
  const subjectTermValues = [];

  terms.forEach((term) => {
    if (!term || typeof term.value !== 'string' || !term.value.trim()) return;
    const v = term.value.trim();
    switch (term.field) {
      case 'title':  titleValues.push(v); break;
      case 'author': contributorValues.push(v); break;
      case 'tag':    subjectTermValues.push(v); break;
      case 'all':
      default:       qValues.push(v); break;
    }
  });

  // Clona query atual e remove chaves do pipeline legado + bypass anteriores
  const legacyKeys = [
    'searchMode', 'author', 'subject_term', 'subject', 'dateStart',
    'dateEnd', 'color', 'location', 'use',
  ];
  const bypassKeys = ['q', 'title', 'contributor', 'subject_term[]', 'date_from', 'date_to', 'subject[]'];
  const newQuery = { ...route.query };
  [...legacyKeys, ...bypassKeys].forEach((k) => { delete newQuery[k]; });

  // Atribui novos params de bypass
  if (qValues.length > 0) newQuery.q = qValues.join(' ');
  if (titleValues.length > 0) newQuery.title = titleValues.join(' ');
  if (contributorValues.length > 0) newQuery.contributor = contributorValues.join(' ');
  if (subjectTermValues.length === 1) {
    newQuery['subject_term[]'] = subjectTermValues[0];
  } else if (subjectTermValues.length > 1) {
    newQuery['subject_term[]'] = subjectTermValues;
  }

  router.push({ query: newQuery });
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
  performSearch({ mode: "cor", value: color });
}

function confirmDate(range) {
  dateRange.value = { ...range };
  submitSearch({ mode: "data", value: range });
  drawerSearchDate.value = false;
  performSearch({ mode: "data", value: range });
}

function confirmAdvancedDrawer({ value }) {
  handleAdvancedFiltersUpdate(value);
  submitSearch({ mode: "avancada", value: advancedFilters.value });
  drawerSearchText.value = false;
  performSearch({ mode: "avancada", value: advancedFilters.value });
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
    tags: filters?.tags || [],
    subjects: filters?.subjects || [],
    use: filters?.use || null,
  };
}

function handleRemoveChip(chip) {
  const filters = { ...advancedFilters.value };
  if (chip.type === "term") {
    filters.terms = filters.terms.filter((_, i) => i !== chip.index);
  } else if (chip.type === "location") {
    filters.locations = filters.locations.filter((_, i) => i !== chip.index);
  } else if (chip.type === "tag") {
    filters.tags = filters.tags.filter((_, i) => i !== chip.index);
  } else if (chip.type === "subject") {
    filters.subjects = filters.subjects.filter((_, i) => i !== chip.index);
  } else if (chip.type === "use") {
    filters.use = null;
  }
  handleAdvancedFiltersUpdate(filters);
  submitSearch({ mode: "avancada", value: advancedFilters.value });

  const isEmpty =
    !advancedFilters.value.terms?.length &&
    !advancedFilters.value.locations?.length &&
    !advancedFilters.value.tags?.length &&
    !advancedFilters.value.subjects?.length &&
    !advancedFilters.value.use;

  if (isEmpty) {
    hasNoResults.value = false;
    activeSearch.value = null;
  } else {
    performSearch({ mode: "avancada", value: advancedFilters.value });
  }
}

function handleRemoveUrlChip(chip) {
  const query = { ...route.query };
  
  if (chip.type === "q") {
    delete query.q;
  } else if (chip.type === "date_range") {
    delete query.date_from;
    delete query.date_to;
  } else if (chip.type === "subject_url") {
    const rawSubjects = query['subject[]'];
    const existing = rawSubjects
      ? (Array.isArray(rawSubjects) ? rawSubjects : [rawSubjects])
      : [];
    const updated = existing.filter((id) => id !== chip.subjectId);
    if (updated.length === 0) {
      delete query['subject[]'];
    } else {
      query['subject[]'] = updated.length === 1 ? updated[0] : updated;
    }
  } else if (chip.type === "subject_term") {
    const rawTerms = query['subject_term[]'];
    const existing = rawTerms
      ? (Array.isArray(rawTerms) ? rawTerms : [rawTerms])
      : [];
    const updated = existing.filter((t) => t !== chip.termValue);
    if (updated.length === 0) {
      delete query['subject_term[]'];
    } else {
      query['subject_term[]'] = updated.length === 1 ? updated[0] : updated;
    }
  } else if (chip.type === "title") {
    delete query.title;
  } else if (chip.type === "contributor") {
    delete query.contributor;
  }
  
  router.push({ query });
}

function handleClearAllFilters() {
  const query = { ...route.query };
  delete query.q;
  delete query.date_from;
  delete query.date_to;
  delete query['subject[]'];
  delete query['subject_term[]'];
  delete query.title;
  delete query.contributor;
  router.push({ query });
}

function performSearch({ mode, value }) {
  hasNoResults.value = false;
  activeSearch.value = { mode, value };
}

function handleNoResults() {
  hasNoResults.value = true;
}

function handleClearSearch() {
  textQuery.value = "";
  dateRange.value = { start: "", end: "" };
  selectedColor.value = null;
  advancedFilters.value = createDefaultAdvancedFilters();
  hasNoResults.value = false;
  activeSearch.value = null;
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
