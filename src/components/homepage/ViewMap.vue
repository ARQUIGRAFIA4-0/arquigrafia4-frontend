<template>
  <div class="explore-acervo-map">
    <LocationsMap
      context="explore"
      :images="locatedImages"
      :is-loading="isLoading"
      :pitch="mapPitch"
      @select="handleMapSelect"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useRouteQuery } from "@vueuse/router";

import LocationsMap from "@/components/map/LocationsMap.vue";
import { mapLocationsGeoJsonToImages } from "@/helpers/geojson.js";
import { api } from "@/services/api.js";

const router = useRouter();
const mapSettingsQuery = useRouteQuery("map-settings", "2d");

const MAP_PITCH_2D = 0;
const MAP_PITCH_3D = 60;

// Inclinação do mapa (2D ou 3D).
const mapPitch = computed(() =>
  mapSettingsQuery.value === "3d" ? MAP_PITCH_3D : MAP_PITCH_2D
);

const locatedImages = ref([]);
const isLoading = ref(true);

// Carrega as localizações das imagens do acervo.
const loadLocatedImages = async () => {
  isLoading.value = true;

  try {
    const featureCollection = await api.getLocationsGeoJSON();
    const baseUrl = import.meta.env.VITE_BASE_REQUEST_URL ?? "";
    locatedImages.value = mapLocationsGeoJsonToImages(featureCollection, baseUrl);

  } catch (error) {
    console.error("Erro ao carregar localizações do acervo", error);
    locatedImages.value = [];

  } finally {
    isLoading.value = false;

  }
};

// Redireciona para a página de detalhes da imagem selecionada.
const handleMapSelect = (imageId) => {
  if (!imageId) return;
  router.push(`/explore/dados/image/${imageId}`);
};

onMounted(() => {
  loadLocatedImages();
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