<template>
  <div>
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

    <template v-if="activeTab === 'acervo'">
      <template v-if="hasNoResults">
        <no-search-results @clear="handleClearSearch" @new-search="handleNewSearch" />
      </template>

      <template v-else-if="viewMode === 'grid'">
        <div class="container-grid" data-cy="view-grid">
          <view-grid
            :search="activeSearch"
            :selection-mode="isAddToCollectionMode"
            v-model:selected-images="selectedGridImages"
            @no-results="handleNoResults"
          />
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
          <page-toolbar-mobile :view-selection="viewSelection" :search-mode="localSearchMode" data-cy="toolbar-mobile"
            @search-mode-change="handleMobileSearchModeChange" @open-view-menu="openViewMenu"
            @open-search-text="openSearchText" @open-search-color="openSearchColor"
            @open-search-date="openSearchDate" />
        </template>
        <template v-else>
          <page-toolbar v-model:add-to-collection-mode="isAddToCollectionMode"
            :search-mode="localSearchMode" :text-query="textQuery" :date-range="dateRange"
            :color="selectedColor" :advanced-filters="advancedFilters" :view-selection="viewSelection"
            :map-settings="mapSettings" data-cy="toolbar-desktop" @search-mode-change="handleToolbarSearchModeChange"
            @update:text-query="handleTextQueryUpdate" @update:date-range="handleDateRangeUpdate"
            @update:color="handleColorUpdate" @update:map-settings="handleMapSettingsUpdate"
            @view-change="handleViewChange" @view-subcontrol="handleToolbarViewSubcontrol"
            @open-advanced-search="openAdvancedSearch" @confirm="handleToolbarConfirm" @remove-chip="handleRemoveChip"
            @remove-url-chip="handleRemoveUrlChip" @clear-all-filters="handleClearAllFilters"
            @add-to-collection-open="handleAddToCollectionOpen"
            @add-to-collection-close="handleAddToCollectionClose"
            @add-to-collection-confirm="handleAddToCollectionConfirm" />
        </template>
      </div>

      <!-- Mobile Drawers -->
      <mobile-drawer-view-menu v-model="drawerViewMenu" @select="handleMobileViewChange" />

      <mobile-drawer-search-text v-model="drawerSearchText" :filters="advancedFilters"
        :has-active-filters="hasActiveDrawerTextFilters"
        @update:filters="handleAdvancedFiltersUpdate" 
        @open="handleDrawerTextOpen" 
        @confirm="confirmAdvancedDrawer"
        @clear="handleClearTextFilters" 
      />

      <mobile-drawer-search-color v-model="drawerSearchColor" :available-colors="availableColors" :value="selectedColor"
        @update:value="handleColorUpdate" @open="handleDrawerColorOpen" @confirm="confirmColor" />

      <mobile-drawer-search-date v-model="drawerSearchDate" :value="dateRange"
        :active-range="{ from: route.query.date_from || '', to: route.query.date_to || '' }"
        @update:value="handleDateRangeUpdate" @open="handleDrawerDateOpen" @confirm="confirmDate"
        @clear="handleClearDateFilter" />

      <advanced-search-modal 
        v-model="modalAdvancedSearch" 
        :filters="advancedFilters"
        @confirm="confirmAdvancedSearch" 
        :has-active-filters="hasActiveDrawerTextFilters"
        @clear="handleClearTextFilters" 
      />

      <Teleport to="body">
        <AlbumPickerModal
          v-model="showAlbumPicker"
          :albums="loadedAlbums"
          :preselected-album-ids="[]"
          :scopes="collectionScopes"
          :selected-scope-id="selectedScope?.id"
          @change-scope="onScopeChange"
          @open-create-collection="onCollectionCreateModalOpen"
          @confirm-add="onGridAlbumPickerConfirmAdd"
        />

        <CollectionCreateModal
          v-model="showCollectionCreateModal"
          :user-data="selectedScope?.type === 'user' ? loggedUser : null"
          :collective-id="selectedScope?.type === 'collective' ? selectedScope.id : null"
          @created="onCollectionCreated"
        />

        <transition name="copy-toast-fade">
          <div
            v-if="showAddToAlbumToast"
            class="homepage-add-to-album-toast"
            role="status"
            aria-live="polite"
          >
            <i class="bi bi-check-all" aria-hidden="true" />
            <span class="homepage-add-to-album-toast__text">
              <template v-if="!addToAlbumToastMultipleCollections">
                Imagens adicionadas à Coleção
                <span class="homepage-add-to-album-toast__collection-name">
                  {{ addToAlbumToastCollectionName }}
                </span>
              </template>
              <template v-else>
                Imagens adicionadas às coleções
              </template>
            </span>
            <button
              type="button"
              class="homepage-add-to-album-toast__link"
              @click="onAddToAlbumToastVisualizar"
            >
              visualizar
            </button>
          </div>
        </transition>
      </Teleport>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/store/auth";
import { useAlbumsStore } from "@/store/albums";
import AlbumPickerModal from "@/components/imageDetail/AlbumPickerModal.vue";
import CollectionCreateModal from "@/components/CollectionCreateModal.vue";
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
import { queryToFilters, filtersToQuery, clearAdvancedFilterKeys, hasAnyAdvancedFilter } from "@/helpers/searchQueryMapping";
import { sanitizeDateParam } from "@/helpers/dateUtils";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const albumsStore = useAlbumsStore();
const { isLoggedIn, authHeader, loggedUser } = storeToRefs(authStore);
const breakpoints = useBreakpoints({ md: 768 });
const isMobile = breakpoints.smaller("md");

const activeTab = computed(() => {
  if (route.path.startsWith("/explore/lab")) return "lab";
  if (route.path.startsWith("/explore/rede")) return "rede";
  return "acervo";
});
const viewSelection = ref(viewRouteToSelection(route.params.viewMode));
const viewMode = computed(() => selectionToViewMode(viewSelection.value));
const isAddToCollectionMode = ref(false);
const selectedGridImages = ref([]);
const showAlbumPicker = ref(false);
const showCollectionCreateModal = ref(false);
const loadedAlbums = ref([]);
const showAddToAlbumToast = ref(false);
const addToAlbumToastCollectionName = ref("");
const addToAlbumToastCollectionId = ref(null);
const addToAlbumToastMultipleCollections = ref(false);
let addToAlbumToastTimeout = null;

const API_BASE_URL = import.meta.env.VITE_BASE_REQUEST_URL;

const getInitials = (name) => name?.charAt(0).toUpperCase() || "?";

const resolveAvatarUrl = (entity) => {
  if (!entity) return null;
  if (entity.avatar_url) {
    return entity.avatar_url.startsWith("http")
      ? entity.avatar_url
      : `${API_BASE_URL}${entity.avatar_url}`;
  }
  if (entity.avatar_path) {
    return `${API_BASE_URL}/storage/${entity.avatar_path}`;
  }
  return null;
};

// Escopos de coleção: o usuário + os coletivos dos quais ele faz parte
const collectionScopes = computed(() => {
  if (!loggedUser.value) return [];
  const u = loggedUser.value;
  const scopes = [
    {
      id: u.id,
      type: "user",
      name: u.name || u.username,
      avatar: resolveAvatarUrl(u),
      initials: u.initials || getInitials(u.name || u.username),
    },
  ];
  for (const c of u.collectives ?? []) {
    scopes.push({
      id: c.id,
      type: "collective",
      name: c.name,
      avatar: resolveAvatarUrl(c),
      initials: getInitials(c.name),
    });
  }
  return scopes;
});

// Fase 3.1 (retroativa): era uma 4ª cópia manual da mesma checagem, com os
// mesmos dois problemas das outras 3 (route.query['material_term[]']/etc.,
// nomes mortos desde a correção do backend; sem 'location'). Ainda é passada
// como prop pro modal/drawer mesmo eles não lendo mais o valor pra decidir
// o texto do botão (isso mudou pro botão "Cancelar" fixo).
const hasActiveDrawerTextFilters = computed(() => hasAnyAdvancedFilter(queryToFilters(route.query)));

const selectedScopeId = ref(null);
const selectedScope = computed(
  () =>
    collectionScopes.value.find((s) => s.id === selectedScopeId.value) ??
    collectionScopes.value[0] ??
    null
);

const { searchMode, loadSnapshot, submitSearch } = useSearchQuery();

const localSearchMode = ref(searchMode.value ?? "textual");

const textQuery = ref("");
const dateRange = ref({ start: "", end: "" });
const selectedColor = ref(null);
const advancedFilters = ref(createDefaultAdvancedFilters());
const mapSettingsQuery = useRouteQuery("map-settings", "2d");

function normalizeMapSettings(value) {
  return value === "3d" ? "3d" : "2d";
}

const mapSettings = ref(normalizeMapSettings(mapSettingsQuery.value));


watch(viewMode, (mode) => {
  if (mode !== "grid") {
    isAddToCollectionMode.value = false;
    selectedGridImages.value = [];
  }

  if (
    route.name === "explore" &&
    mode !== "map" &&
    route.query.image
  ) {
    const query = { ...route.query };
    delete query.image;
    router.replace({ query });
  }
});

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
      // Fase 2: queryToFilters vem do módulo consolidado (vocabulário B),
      // fonte única de verdade — antes era a função local buildAdvancedFiltersFromUrl,
      // e antes disso, snapshot.value (useSearchQuery/vocabulário A, com o bug de autoria).
      advancedFilters.value = queryToFilters(route.query);
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
  // Fase 1: para "avancada", a fonte de verdade é advancedFilters.value
  // (já preenchido acima por syncFromSnapshot -> buildAdvancedFiltersFromUrl),
  // não snapshot.value (vocabulário A).
  // hasAnyAdvancedFilter vem do módulo consolidado — antes essa checagem era
  // reimplementada na mão aqui e nunca foi atualizada quando os 5 campos de
  // vocabulário (materials/techniques/stylePeriods/culturalContexts/
  // workTypes) foram adicionados: selecionar só um deles fazia a URL mudar e
  // o chip aparecer (ambos não dependem disso), mas hasValue continuava
  // false, então performSearch nunca disparava — tela estática, nenhuma
  // requisição.
  const hasValue =
    snapshot.mode === "textual"
      ? Boolean(snapshot.value)
      : snapshot.mode === "data"
        ? Boolean(snapshot.value?.start || snapshot.value?.end)
        : snapshot.mode === "cor"
          ? Boolean(snapshot.value)
          : snapshot.mode === "avancada"
            ? hasAnyAdvancedFilter(advancedFilters.value)
            : false;

  if (hasValue) {
    performSearch({
      mode: snapshot.mode,
      value: snapshot.mode === "avancada" ? advancedFilters.value : snapshot.value,
    });
  }
}

// Guard: sanitiza date_from/date_to inválidos na URL (ex: acesso manual com ano absurdo)
watch(
  () => [route.query.date_from, route.query.date_to],
  ([df, dt]) => {
    const query = { ...route.query };
    let changed = false;
    if (df) {
      const sanitized = sanitizeDateParam(df, true);
      if (sanitized && sanitized !== df) {
        query.date_from = sanitized;
        changed = true;
      } else if (!sanitized) {
        delete query.date_from;
        changed = true;
      }
    }
    if (dt) {
      const sanitized = sanitizeDateParam(dt, false);
      if (sanitized && sanitized !== dt) {
        query.date_to = sanitized;
        changed = true;
      } else if (!sanitized) {
        delete query.date_to;
        changed = true;
      }
    }
    if (changed) {
      router.replace({ query });
    }
  },
  { immediate: true }
);

watch(
  () => route.query,
  () => {
    const mode = searchMode.value;
    syncFromSnapshot(mode);
    const snapshot = loadSnapshot(mode);
    // Fase 1: para "avancada", usa advancedFilters.value (buildAdvancedFiltersFromUrl),
    // não snapshot.value (vocabulário A) — mesma correção dos outros 2 pontos.
    // hasAnyAdvancedFilter vem do módulo consolidado (ver nota no bloco de
    // inicialização, logo acima) — este é o watcher que reage quando o
    // usuário confirma um filtro novo, então era aqui que a tela ficava
    // estática ao selecionar só location/material/technique/stylePeriod/
    // culturalContext/workType.
    const hasValue =
      snapshot.mode === "textual"
        ? Boolean(snapshot.value)
        : snapshot.mode === "data"
          ? Boolean(snapshot.value?.start || snapshot.value?.end)
          : snapshot.mode === "cor"
            ? Boolean(snapshot.value)
            : snapshot.mode === "avancada"
              ? hasAnyAdvancedFilter(advancedFilters.value)
              : false;
    if (hasValue) {
      performSearch({
        mode: snapshot.mode,
        value: snapshot.mode === "avancada" ? advancedFilters.value : snapshot.value,
      });
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

function navigateToRede() {
  router.push("/explore/rede");
}

function handleViewChange({ selection }) {
  viewSelection.value = selection;
  updateRoute(selection);
}

function handleAddToCollectionOpen() {
  isAddToCollectionMode.value = true;
}

function handleAddToCollectionClose() {
  isAddToCollectionMode.value = false;
  selectedGridImages.value = [];
}

// Busca os álbuns do escopo (usuário ou coletivo)
async function loadAlbumsForScope(scope) {
  if (!scope) return;
  try {
    const response =
      scope.type === "collective"
        ? await albumsStore.getCollectiveAlbums(authHeader.value, scope.id)
        : await albumsStore.getUserAlbums(authHeader.value, scope.id);
    loadedAlbums.value = Array.isArray(response) ? response : response?.data ?? [];
  } catch (error) {
    console.error("Erro ao buscar coleções:", error);
    loadedAlbums.value = [];
  }
}

// Troca o escopo selecionado e recarrega os álbuns
async function onScopeChange(scope) {
  if (!scope) return;
  selectedScopeId.value = scope.id;
  await loadAlbumsForScope(scope);
}

function showBulkCollectionsToast(albumIds) {
  if (addToAlbumToastTimeout) {
    clearTimeout(addToAlbumToastTimeout);
  }

  const selectedAlbums = albumIds
    .map((id) => loadedAlbums.value.find((album) => album.id === id))
    .filter(Boolean);

  if (selectedAlbums.length === 1) {
    addToAlbumToastCollectionName.value = selectedAlbums[0].title;
    addToAlbumToastCollectionId.value = selectedAlbums[0].id;
    addToAlbumToastMultipleCollections.value = false;
  } else {
    addToAlbumToastCollectionName.value = "";
    addToAlbumToastCollectionId.value = null;
    addToAlbumToastMultipleCollections.value = true;
  }

  showAddToAlbumToast.value = true;

  addToAlbumToastTimeout = setTimeout(() => {
    showAddToAlbumToast.value = false;
    addToAlbumToastTimeout = null;
  }, 4400);
}

// Visualizar coleção
function onAddToAlbumToastVisualizar() {
  if (addToAlbumToastCollectionId.value) {
    router.push({
      name: "collection-detail",
      params: {
        collectionId: addToAlbumToastCollectionId.value,
        viewMode: "grid",
      },
    });
  } else {
    router.push({ name: "my-profile-collections" });
  }

  showAddToAlbumToast.value = false;

  if (addToAlbumToastTimeout) {
    clearTimeout(addToAlbumToastTimeout);
    addToAlbumToastTimeout = null;
  }
}

// Confirmar adicionar imagens às coleções
async function onGridAlbumPickerConfirmAdd({ albumIds }) {
  if (!Array.isArray(albumIds) || albumIds.length === 0) return;

  const imageIds = selectedGridImages.value.map((img) => img.id);
  if (!imageIds.length) return;

  try {
    await Promise.all(
      albumIds.map((albumId) =>
        albumsStore.addImageToAlbum(authHeader.value, albumId, imageIds)
      )
    );

    showBulkCollectionsToast(albumIds);

    showAlbumPicker.value = false;
    isAddToCollectionMode.value = false;
    selectedGridImages.value = [];

  } catch (error) {
    console.error("Erro ao adicionar imagens às coleções:", error);
  }
}

function onCollectionCreateModalOpen() {
  showAlbumPicker.value = false;
  nextTick(() => {
    showCollectionCreateModal.value = true;
  });
}

async function onCollectionCreated() {
  showCollectionCreateModal.value = false;
  await loadAlbumsForScope(selectedScope.value);
  showAlbumPicker.value = true;
}

async function handleAddToCollectionConfirm() {
  if (selectedGridImages.value.length === 0) return;
  if (!isLoggedIn.value || !loggedUser.value?.id) {
    console.warn("Usuário não logado — não é possível adicionar à coleção.");
    return;
  }
  // Abre sempre no escopo do usuário; o coletivo pode ser trocado no modal.
  selectedScopeId.value = collectionScopes.value[0]?.id ?? null;
  await loadAlbumsForScope(selectedScope.value);
  showAlbumPicker.value = true;
}

onUnmounted(() => {
  if (addToAlbumToastTimeout) {
    clearTimeout(addToAlbumToastTimeout);
  }
});

function handleToolbarConfirm({ mode, value }) {
  submitSearch({ mode, value });
  performSearch({ mode, value });
}

function handleToolbarSearchModeChange(mode) {
  localSearchMode.value = mode;
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

//Abre o modal de busca avançada, sincronizando os filtros com a URL atual
function openAdvancedSearch() {
  // Fase 2: queryToFilters vem do módulo consolidado (antes: buildAdvancedFiltersFromUrl local).
  advancedFilters.value = queryToFilters(route.query);
  modalAdvancedSearch.value = true;
}

function confirmAdvancedSearch(payload) {
  // Mantém advancedFilters sincronizado (necessário para "Editar" reabrir com dados)
  handleAdvancedFiltersUpdate(payload);

  // --- Bypass: monta URL diretamente a partir do payload ---

  // legacyKeys: chaves do pipeline antigo (useSearchQuery/vocabulário A) + searchMode.
  // A URL pode ter herdado essas chaves de um estado anterior (ex: link salvo antes
  // desta migração); não fazem parte do vocabulário B, então clearAdvancedFilterKeys
  // não as cobre — seguem removidas manualmente aqui.
  const legacyKeys = [
    'searchMode', 'author', 'subject_term', 'subject', 'dateStart',
    'dateEnd', 'color', 'location', 'use',
  ];
  const newQuery = clearAdvancedFilterKeys(route.query);
  legacyKeys.forEach((k) => { delete newQuery[k]; });

  // Reescreve searchMode explicitamente — legacyKeys apaga a chave acima, e
  // sem ela useRouteQuery('searchMode', 'textual') volta pro default assim
  // que a navegação resolve. O watcher de route.query em HomePage.vue lê
  // searchMode.value pra decidir qual branch de hasValue usar; se ele achar
  // 'textual', só olha route.query.q — os filtros avançados (author, tags,
  // materials, etc.) nunca disparam performSearch, mesmo estando corretos
  // na URL e no shape canônico. Bug real, confirmado com Vue Router de
  // verdade (não só teoria) antes de aplicar esta correção. Só reescreve se
  // o payload confirmado tem algum filtro — confirmar um modal vazio não
  // deve deixar "?searchMode=avancada" pendurado numa URL sem nada.
  if (hasAnyAdvancedFilter(payload)) {
    newQuery.searchMode = 'avancada';
  }

  // Atribui novos params — mesma função usada em searchImages (api.js) e useSearchQuery.js
  Object.assign(newQuery, filtersToQuery(payload));

  router.push({ query: newQuery });
  modalAdvancedSearch.value = false;
}

function handleToolbarViewSubcontrol(payload) {
  updateMapSettings(payload.value);
}

function handleDrawerTextOpen() {
  // Fase 2: queryToFilters vem do módulo consolidado (antes: buildAdvancedFiltersFromUrl local).
  advancedFilters.value = queryToFilters(route.query);
}

function handleDrawerColorOpen() {
  syncFromSnapshot("cor");
}

function handleDrawerDateOpen() {
  dateRange.value = {
    start: route.query.date_from || "",
    end: route.query.date_to || "",
  };
}

function handleClearDateFilter() {
  const query = { ...route.query };
  delete query.date_from;
  delete query.date_to;
  dateRange.value = { start: "", end: "" };
  drawerSearchDate.value = false;
  router.push({ query });
}

function confirmColor(color) {
  selectedColor.value = color;
  submitSearch({ mode: "cor", value: color });
  drawerSearchColor.value = false;
  performSearch({ mode: "cor", value: color });
}

function confirmDate(range) {
  dateRange.value = { ...range };
  drawerSearchDate.value = false;
  const newQuery = { ...route.query };
  // Remove legacy params
  delete newQuery.searchMode;
  delete newQuery.dateStart;
  delete newQuery.dateEnd;
  if (range.start) newQuery.date_from = range.start;
  if (range.end) newQuery.date_to = range.end;
  if (newQuery.date_from || newQuery.date_to) {
    router.push({ query: newQuery });
  }
}

function confirmAdvancedDrawer({ value }) {
  handleAdvancedFiltersUpdate(value);

  // Bypass: mesma lógica de confirmAdvancedSearch, agora via módulo consolidado.
  const legacyKeys = [
    'searchMode', 'author', 'subject_term', 'subject', 'dateStart',
    'dateEnd', 'color', 'location', 'use',
  ];
  const newQuery = clearAdvancedFilterKeys(route.query);
  legacyKeys.forEach((k) => { delete newQuery[k]; });
  // Ver comentário em confirmAdvancedSearch — sem isso, mode volta pro
  // default 'textual' e o watcher nunca dispara a busca avançada. Só
  // reescreve se 'value' tem algum filtro.
  if (hasAnyAdvancedFilter(value)) {
    newQuery.searchMode = 'avancada';
  }

  Object.assign(newQuery, filtersToQuery(value));

  drawerSearchText.value = false;
  router.push({ query: newQuery });
}

function handleClearTextFilters() {
  // Fase 3.1 (retroativa): esta função tinha sua própria lista de chaves,
  // desatualizada desde a correção dos 5 campos de vocabulário (ainda usava
  // material_term[]/technique_term[]/etc., que não existem mais, e nunca
  // teve 'location'). Trocada por clearAdvancedFilterKeys — mesma fonte
  // única de verdade usada em confirmAdvancedSearch/confirmAdvancedDrawer/
  // handleRemoveChip/handleClearAllFilters.
  const query = clearAdvancedFilterKeys(route.query);
  delete query.searchMode;
  advancedFilters.value = createDefaultAdvancedFilters();
  drawerSearchText.value = false;
  modalAdvancedSearch.value = false;
  router.push({ query });
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
    tags: filters?.tags || [],
    licenses: filters?.licenses || [],
    materials: filters?.materials || [],
    techniques: filters?.techniques || [],
    stylePeriods: filters?.stylePeriods || [],
    culturalContexts: filters?.culturalContexts || [],
    workTypes: filters?.workTypes || [],
    imageStartYear: filters?.imageStartYear ?? null,
    imageEndYear: filters?.imageEndYear ?? null,
    workStartYear: filters?.workStartYear ?? null,
    workEndYear: filters?.workEndYear ?? null,
    characteristics: filters?.characteristics || {},
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
  } else if (chip.type === "material") {
    filters.materials = filters.materials.filter((_, i) => i !== chip.index);
  } else if (chip.type === "technique") {
    filters.techniques = filters.techniques.filter((_, i) => i !== chip.index);
  } else if (chip.type === "stylePeriod") {
    filters.stylePeriods = filters.stylePeriods.filter((_, i) => i !== chip.index);
  } else if (chip.type === "culturalContext") {
    filters.culturalContexts = filters.culturalContexts.filter((_, i) => i !== chip.index);
  } else if (chip.type === "workType") {
    filters.workTypes = filters.workTypes.filter((_, i) => i !== chip.index);
  }
  handleAdvancedFiltersUpdate(filters);

  // Fase 3: escreve a URL diretamente (mesmo padrão de confirmAdvancedSearch/
  // confirmAdvancedDrawer) e deixa só o watcher de route.query decidir se
  // dispara ou limpa a busca. Antes disparava DUAS vezes por remoção de chip:
  // uma vez aqui de forma síncrona (performSearch/activeSearch.value = null)
  // e outra quando o watcher reagia à mudança de URL feita por submitSearch
  // (vocabulário A) — a lógica de "isEmpty" já existia no watcher (Fase 1),
  // então não precisa ser reimplementada aqui.
  const legacyKeys = [
    'searchMode', 'author', 'subject_term', 'subject', 'dateStart',
    'dateEnd', 'color', 'location', 'use',
  ];
  const newQuery = clearAdvancedFilterKeys(route.query);
  legacyKeys.forEach((k) => { delete newQuery[k]; });
  // Ver comentário em confirmAdvancedSearch — sem isso, mode volta pro
  // default 'textual' e o watcher para de reconhecer os filtros restantes
  // como avançados (ex: sobrou 1 chip depois de remover outro, mas a busca
  // não atualiza). Só reescreve se ainda sobrar filtro: legacyKeys já apagou
  // a chave acima, então sem filtro nenhum o padrão certo é deixar apagado
  // mesmo (senão fica "?searchMode=avancada" pendurado numa URL vazia).
  if (hasAnyAdvancedFilter(advancedFilters.value)) {
    newQuery.searchMode = 'avancada';
  }
  Object.assign(newQuery, filtersToQuery(advancedFilters.value));

  router.push({ query: newQuery });
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
  } else if (chip.type === "location_url") {
    delete query.location;
  } else if (chip.type === "license") {
    const rawLicenses = query['license[]'];
    const existing = rawLicenses
      ? (Array.isArray(rawLicenses) ? rawLicenses : [rawLicenses])
      : [];
    const updated = existing.filter((l) => l !== chip.licenseValue);
    if (updated.length === 0) {
      delete query['license[]'];
    } else {
      query['license[]'] = updated.length === 1 ? updated[0] : updated;
    }
  }

  // Mesma lógica de confirmAdvancedSearch/confirmAdvancedDrawer/
  // handleRemoveChip: se não sobrar nenhum filtro depois da remoção, limpa
  // searchMode também — sem isso, um chip "rápido" (urlChips, usado quando
  // só 1 tipo de filtro está ativo — a busca avançada com 2+ tipos mostra o
  // banner em vez do chip) deixava "?searchMode=avancada" pendurado numa URL
  // já sem filtro nenhum, já que esta função nunca fazia essa checagem.
  if (!hasAnyAdvancedFilter(queryToFilters(query))) {
    delete query.searchMode;
  }

  router.push({ query });
}

function handleClearAllFilters() {
  // Fase 3.1: mesma lista de chaves do módulo consolidado, em vez de uma
  // 5ª cópia manual (essa era a única que faltava atualizar quando
  // adicionamos 'location' — motivo pelo qual agora ela lê do módulo).
  const query = clearAdvancedFilterKeys(route.query);
  delete query.searchMode;
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
  // Navega para a mesma view sem nenhum parâmetro de busca na URL
  router.push({
    name: "explore",
    params: { viewMode: route.params.viewMode || "mosaic" },
  });
}

function handleNewSearch() {
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

.homepage-add-to-album-toast {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1300;
  display: inline-flex;
  align-items: center;
  gap: 24px;
  width: auto;
  max-width: calc(100vw - 24px);
  box-sizing: border-box;
  padding: 12px 12px 12px 16px;
  border-radius: 4px;
  background: #356407;
  color: var(--branco, #fff);
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
}

.homepage-add-to-album-toast .bi {
  font-size: 16px;
  line-height: 1;
  flex-shrink: 0;
}

.homepage-add-to-album-toast__text {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  white-space: nowrap;
}

.homepage-add-to-album-toast__collection-name {
  font-style: italic;
}

.homepage-add-to-album-toast__link {
  margin: 0;
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  font-style: italic;
  line-height: 1.5;
  text-decoration: underline;
  cursor: pointer;
  flex-shrink: 0;
}

.copy-toast-fade-enter-active,
.copy-toast-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.copy-toast-fade-enter-from,
.copy-toast-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-4px);
}

@media (max-width: 767px) {
  .homepage-add-to-album-toast {
    top: max(12px, env(safe-area-inset-top, 0px));
    width: calc(100vw - 20px);
    max-width: calc(100vw - 20px);
    gap: 16px;
    padding: 12px 14px;
    white-space: normal;
  }

  .homepage-add-to-album-toast__text {
    white-space: normal;
    min-width: 0;
  }
}
</style>
