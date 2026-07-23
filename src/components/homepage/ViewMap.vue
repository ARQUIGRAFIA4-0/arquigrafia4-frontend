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
import { computed, onMounted, ref } from "vue";
import { useRouteQuery } from "@vueuse/router";

import LocationsMap from "@/components/map/LocationsMap.vue";
import { mapLocationsGeoJsonToMapItems } from "@/helpers/geojson.js";
import { api } from "@/services/api.js";

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

// Carrega as localizações (imagens e obras) do acervo.
const loadLocatedItems = async () => {
  isLoading.value = true;

  try {
    const featureCollection = await api.getLocationsGeoJSON();
    const baseUrl = import.meta.env.VITE_BASE_REQUEST_URL ?? "";
    locatedItems.value = mapLocationsGeoJsonToMapItems(
      featureCollection,
      baseUrl
    );
  } catch (error) {
    console.error("Erro ao carregar localizações do acervo", error);
    locatedItems.value = [];
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadLocatedItems();
});
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
