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
 * Mesmos filtros do grid/mosaico (URL).
 * Sem filtros > null > acervo completo.
 */
const mapSearchParams = computed(() => {
  const params = {};
  const q = typeof route.query.q === "string" ? route.query.q.trim() : "";

  if (q) params.q = q;

  if (route.query.title) params.title = route.query.title;
  if (route.query.contributor) params.contributor = route.query.contributor;

  if (route.query.date_from) params.date_from = route.query.date_from;
  if (route.query.date_to) params.date_to = route.query.date_to;

  if (route.query.work_date_from) params.work_date_from = route.query.work_date_from;
  if (route.query.work_date_to) params.work_date_to = route.query.work_date_to;

  // Características binomiais
  Object.keys(route.query).forEach((key) => {
    const match = key.match(/^binomial\[(.+)\]$/);
    if (match) {
      const side = route.query[key];
      if (side === "left" || side === "right") {
        params[`binomial[${match[1]}]`] = side;
      }
    }
  });

  // Assuntos
  const rawSubjects = route.query["subject[]"];
  if (rawSubjects) {
    params["subject[]"] = Array.isArray(rawSubjects) ? rawSubjects : [rawSubjects];
  }

  // Assuntos
  const rawSubjectTerms = route.query["subject_term[]"];
  if (rawSubjectTerms) {
    params["subject_term[]"] = Array.isArray(rawSubjectTerms) ? rawSubjectTerms : [rawSubjectTerms];
  }

  // Licenças
  const rawLicenses = route.query["license[]"];
  if (rawLicenses) {
    params["license[]"] = Array.isArray(rawLicenses) ? rawLicenses : [rawLicenses];
  }

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
