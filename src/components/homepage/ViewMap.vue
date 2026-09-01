<template>
  <div class="explore-acervo-map">
    <LocationsMap
      context="explore"
      :images="locatedItems"
      :is-loading="isLoading"
      :pitch="mapPitch"
      :load-image-details="api.getImageDetails"
      :initial-selected-id="selectedImageId"
      @select="handleMapSelect"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useRouteQuery } from "@vueuse/router";

import LocationsMap from "@/components/map/LocationsMap.vue";
import { mapLocationsGeoJsonToMapItems } from "@/helpers/geojson.js";
import { api } from "@/services/api.js";
import { queryToFilters, filtersToQuery } from "@/helpers/searchQueryMapping";

const route = useRoute();

const mapSettingsQuery = useRouteQuery("map-settings", "2d");
const selectedImageQuery = useRouteQuery("image", null);

const selectedImageId = computed(() =>
  typeof selectedImageQuery.value === "string"
    ? selectedImageQuery.value
    : null
);

const handleMapSelect = (id) => {
  selectedImageQuery.value = id || null;
};

const MAP_PITCH_2D = 0;
const MAP_PITCH_3D = 60;

// Inclinação do mapa (2D ou 3D).
const mapPitch = computed(() =>
  mapSettingsQuery.value === "3d" ? MAP_PITCH_3D : MAP_PITCH_2D
);

const locatedItems = ref([]);
const isLoading = ref(true);
let loadRequestId = 0;

/**
 * Mesmos filtros do grid/mosaico (URL), via módulo consolidado (Fase 2).
 * Sem filtros > null > acervo completo.
 *
 * Ganha automaticamente, em relação ao parser manual anterior:
 * - sanitização de data (queryToFilters usa sanitizeDateParam) — antes só
 *   ViewGrid/ViewMosaic sanitizavam, o mapa aceitava datas inválidas direto;
 * - os campos material_term[]/technique_term[]/aesthetics_term[]/
 *   cultural_context_term[]/typology_term[], que este parser nunca lia.
 */
const mapSearchParams = computed(() => {
  const params = filtersToQuery(queryToFilters(route.query));
  return Object.keys(params).length > 0 ? params : null;
});

// Chave estável evita re-disparos do watch por novo objeto com o mesmo conteúdo.
const mapSearchKey = computed(() => JSON.stringify(mapSearchParams.value));

// Carrega os itens do mapa.
const loadLocatedItems = async () => {
  const requestId = ++loadRequestId;
  isLoading.value = true;

  try {
    const featureCollection = mapSearchParams.value
      ? await api.getFilteredLocationsGeoJSON(mapSearchParams.value)
      : await api.getLocationsGeoJSON();

    if (requestId !== loadRequestId) return;

    const baseUrl = import.meta.env.VITE_BASE_REQUEST_URL ?? "";
    locatedItems.value = mapLocationsGeoJsonToMapItems(
      featureCollection,
      baseUrl
    );

  } catch (error) {
    if (requestId !== loadRequestId) return;
    console.error("Erro ao carregar localizações do acervo", error);
    locatedItems.value = [];

  } finally {
    if (requestId === loadRequestId) {
      isLoading.value = false;
    }
  }
  
};

// Qualquer mudança de filtro (inclui limpar o q) recarrega o mapa.
watch(
  mapSearchKey,
  () => {
    loadLocatedItems();
  },
  { immediate: true }
);
</script>

<style scoped>
.explore-acervo-map {
  position: relative;
  width: 100%;
  height: calc(100vh - 70px - 75px);
}

.explore-acervo-map :deep(.locations-map) {
  width: 100%;
  height: 100%;
  min-height: inherit;
  border: none;
  border-radius: 0;
}
</style>
