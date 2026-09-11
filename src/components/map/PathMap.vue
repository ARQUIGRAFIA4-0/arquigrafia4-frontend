<script setup>
import { computed, shallowRef, ref, watch } from "vue";
import { LngLatBounds } from "maplibre-gl";
import MapLibreMap from "@/components/map/MapLibreMap.vue";
import { createCollectionImagesFeatureCollection } from "@/helpers/geojson";
import {
  fetchOsrmRoute,
  formatRouteDistance,
  formatRouteDuration,
} from "@/helpers/osrmRoute";

defineOptions({ name: "PathMap" });

const props = defineProps({
  images: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
});

const emit = defineEmits(["stop-change"]);

const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";
const IMAGE_COLOR = "#D27D30";
const WORK_COLOR = "#3B6EA5";
const PATH_COLOR = "#AA4F28";

const SOURCE_ID = "path-stops";
const LAYER_ID = "path-stops-symbols";
const LINE_SOURCE_ID = "path-line";
const LINE_LAYER_ID = "path-line-layer";

const SELECTED_ICON_ZOOM = 8;
const SELECTED_ICON_ANIMATION_MS = 700;

const mapRef = shallowRef(null);

const stopIds = ref([]);

const routeCoordinates = ref(/** @type {Array<[number, number]>} */ ([])); // Coordenadas da rota
const routeDistanceMeters = ref(0); // Distância da rota em metros
const routeDurationSeconds = ref(0); // Tempo da rota em segundos
const routeLoading = ref(false); // Indica se a rota está sendo calculada
const routeIsStreet = ref(false); // Indica se a rota é uma reta

let routeAbort = /** @type {AbortController | null} */ (null); // Sinal de abortação da requisição
let routeRequestId = 0; // ID da requisição

// Cria a coleção de imagens das paradas
const featureCollection = computed(() =>
  createCollectionImagesFeatureCollection(props.images)
);

// Define o centro do mapa para as coordenadas da primeira parada
const defaultCenter = computed(() => {
  const first = featureCollection.value.features[0];
  return first ? first.geometry.coordinates : [-46.6333, -23.5505];
});

// Exibe uma mensagem de ajuda para o usuário
const routeHint = computed(() => {
  if (stopIds.value.length < 2) {
    return stopIds.value.length ? `${stopIds.value.length} ponto no percurso — clique em outro para traçar a rota` : ""; // Se não houver pelo menos 2 paradas, retorna uma mensagem
  }

  if (routeLoading.value) return "Calculando rota nas ruas…";

  const dist = formatRouteDistance(routeDistanceMeters.value);
  const dur = formatRouteDuration(routeDurationSeconds.value);
  const stats = [dist, dur].filter(Boolean).join(" · ");
  const mode = routeIsStreet.value ? "pelas ruas" : "linha reta (fallback)";

  return stats ? `${stopIds.value.length} paradas · ${stats} (${mode})` : `${stopIds.value.length} paradas (${mode})`;

});

const cameraIconSvg = (fill) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8" fill="${fill}"/><g transform="translate(8 8) scale(0.75) translate(-8 -8)"><path fill="#FFFFFF" d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/><path fill="#FFFFFF" d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4Zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1m9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0"/></g></svg>`;
const workIconSvg = (fill) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="${fill}"/><path fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" d="M18 45 V31.5 L28 19.5 L46.5 28.5 V45 H18 Z"/><line x1="28" y1="19.5" x2="28" y2="45" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/><g fill="#FFFFFF"><rect x="21" y="33" width="3.4" height="3.4" rx="0.35"/><rect x="21" y="38.2" width="3.4" height="3.4" rx="0.35"/><rect x="31" y="24.8" width="3.2" height="3.2" rx="0.3"/><rect x="35.6" y="24.8" width="3.2" height="3.2" rx="0.3"/><rect x="40.2" y="24.8" width="3.2" height="3.2" rx="0.3"/><rect x="31" y="29" width="3.2" height="3.2" rx="0.3"/><rect x="35.6" y="29" width="3.2" height="3.2" rx="0.3"/><rect x="40.2" y="29" width="3.2" height="3.2" rx="0.3"/><rect x="31" y="33.2" width="3.2" height="3.2" rx="0.3"/><rect x="35.6" y="33.2" width="3.2" height="3.2" rx="0.3"/><rect x="40.2" y="33.2" width="3.2" height="3.2" rx="0.3"/><rect x="31" y="37.4" width="3.2" height="3.2" rx="0.3"/><rect x="35.6" y="37.4" width="3.2" height="3.2" rx="0.3"/><rect x="40.2" y="37.4" width="3.2" height="3.2" rx="0.3"/><rect x="31" y="41.6" width="3.2" height="3.2" rx="0.3"/><rect x="35.6" y="41.6" width="3.2" height="3.2" rx="0.3"/><rect x="40.2" y="41.6" width="3.2" height="3.2" rx="0.3"/></g></svg>`;

function registerIcon(map, id, svg) {
  return new Promise((resolve) => {
    if (map.hasImage(id)) return resolve();

    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const image = new Image(64, 64);

    image.onload = () => {
      image.width = 64;
      image.height = 64;
      if (!map.hasImage(id)) map.addImage(id, image, { pixelRatio: 2 });
      URL.revokeObjectURL(url);
      resolve();
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve();
    };

    image.src = url;
  });
}

/**
 * Pega as coordenadas das paradas em ordem
 * @returns {Array<[number, number]>}
 */
function stopCoordinatesInOrder() {
  const byId = new Map( // Cria um mapa com as coordenadas das paradas
    featureCollection.value.features.map((f) => [String(f.properties.id), f])
  );

  return stopIds.value // Pega as coordenadas das paradas em ordem
    .map((id) => byId.get(String(id))?.geometry?.coordinates)
    .filter(Boolean);
}

function buildLineGeoJson() {
  const coordinates = routeCoordinates.value;
  return {
    type: "FeatureCollection",
    features:
      coordinates.length >= 2
        ? [
            {
              type: "Feature",
              geometry: { type: "LineString", coordinates },
              properties: {},
            },
          ]
        : [],
  };
}

function syncStopSource() {
  const map = mapRef.value;
  if (!map?.getSource) return;
  const stops = map.getSource(SOURCE_ID);
  if (stops) stops.setData(featureCollection.value);
}

function syncLineSource() {
  const map = mapRef.value;
  if (!map?.getSource) return;
  const line = map.getSource(LINE_SOURCE_ID);
  if (line) line.setData(buildLineGeoJson());
}

// Limpa a rota
function clearRoute() {
  if (routeAbort) {
    routeAbort.abort();
    routeAbort = null;
  }
  routeCoordinates.value = [];
  routeDistanceMeters.value = 0;
  routeDurationSeconds.value = 0;
  routeIsStreet.value = false;
  routeLoading.value = false;
  syncLineSource();
}

/**
 * TUTORIAL - Atualiza a rota
 * ---------------------------------------------------------------------------
 *
 * Aqui ele pega as coordenadas das paradas e chama a função fetchOsrmRoute para calcular a rota.
 * Depois ele atualiza as coordenadas da rota, a distância e o tempo.
 * E depois ele desenha a rota no mapa.
 *
 * @returns {Promise<void>}
 */
async function refreshRoute() {
  const waypoints = stopCoordinatesInOrder(); // Pega as coordenadas das paradas

  // Se não houver pelo menos 2 paradas, limpa a rota
  if (waypoints.length < 2) {
    clearRoute();
    return;
  }

  // Mostra reta imediatamente enquanto o OSRM responde.
  routeCoordinates.value = waypoints;
  routeIsStreet.value = false;
  routeDistanceMeters.value = 0;
  routeDurationSeconds.value = 0;
  syncLineSource();

  if (routeAbort) routeAbort.abort();
  routeAbort = new AbortController();
  const requestId = ++routeRequestId;
  routeLoading.value = true;

  try {
    /**
     * TUTORIAL - Calcula a rota
     * ---------------------------------------------------------------------------
     *
     * Aqui ele chama a função fetchOsrmRoute para calcular a rota.
     * Depois ele atualiza as coordenadas da rota, a distância e o tempo.
     * E depois ele desenha a rota no mapa.
     *
     * @returns {Promise<void>}
     * @param {Array<[number, number]>} waypoints - As coordenadas das paradas
     * @param {Object} options - As opções para calcular a rota
     * @param {string} options.profile - O perfil da rota (walking, driving, cycling)
     * @param {AbortSignal} options.signal - O sinal de abortação da requisição
     */
    const result = await fetchOsrmRoute(waypoints, {
      profile: "driving", // walking, driving, cycling
      signal: routeAbort.signal,
    });

    console.log("result OSRM:", result);
    
    if (requestId !== routeRequestId) return; // Verifica se a requisição ainda é a mesma

    // Se a rota foi calculada com sucesso, atualiza as coordenadas da rota, a distância e o tempo
    if (result) {
      // Atualiza as coordenadas da rota, a distância e o tempo
      routeCoordinates.value = result.coordinates;
      routeDistanceMeters.value = result.distanceMeters;
      routeDurationSeconds.value = result.durationSeconds;
      routeIsStreet.value = true;

    } else {
      // Mantém a reta já desenhada.
      routeIsStreet.value = false;
    }

    syncLineSource();

  } catch (err) {
    if (err?.name === "AbortError") return;
    if (requestId !== routeRequestId) return;

    routeIsStreet.value = false;
    syncLineSource();

  } finally {
    if (requestId === routeRequestId) routeLoading.value = false;

  }
}

// Ajusta o zoom e a posição do mapa para as coordenadas das paradas
function fitToPoints(map) {
  const feats = featureCollection.value.features;
  if (!feats.length) return;

  if (feats.length === 1) {
    map.flyTo({ center: feats[0].geometry.coordinates, zoom: 14 });
    return;
  }

  const bounds = feats.reduce(
    (b, f) => b.extend(f.geometry.coordinates),
    new LngLatBounds(feats[0].geometry.coordinates, feats[0].geometry.coordinates)
  );
  map.fitBounds(bounds, { padding: 48, maxZoom: 15 });
}

// Ajusta o zoom e a posição do mapa para as coordenadas das paradas
function focusOnCoordinates(coordinates) {
  const map = mapRef.value;
  if (!map || !coordinates?.length) return;

  const currentZoom = map.getZoom();
  const targetZoom = Math.max(currentZoom, SELECTED_ICON_ZOOM);

  map.easeTo({
    center: coordinates,
    zoom: targetZoom,
    duration: SELECTED_ICON_ANIMATION_MS,
    essential: true,
  });
}

// Alterna a parada selecionada
function toggleStop(id) {
  if (id == null) return;
  const key = String(id);
  const idx = stopIds.value.indexOf(key);
  if (idx >= 0) stopIds.value = stopIds.value.filter((x) => x !== key);
  else stopIds.value = [...stopIds.value, key];

  syncStopSource();
  refreshRoute();
  emit("stop-change", [...stopIds.value]);
}

// Inicializa o mapa
async function onMapReady(map) {
  mapRef.value = map;

  await Promise.all([
    registerIcon(map, "path-image-icon", cameraIconSvg(IMAGE_COLOR)),
    registerIcon(map, "path-work-icon", workIconSvg(WORK_COLOR)),
  ]);

  if (!map.getSource(SOURCE_ID)) {
    map.addSource(SOURCE_ID, {
      type: "geojson",
      data: featureCollection.value,
    });
  }

  if (!map.getSource(LINE_SOURCE_ID)) {
    map.addSource(LINE_SOURCE_ID, {
      type: "geojson",
      data: buildLineGeoJson(),
    });
  }

  if (!map.getLayer(LINE_LAYER_ID)) {
    map.addLayer({
      id: LINE_LAYER_ID,
      type: "line",
      source: LINE_SOURCE_ID,
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": PATH_COLOR,
        "line-width": 4,
        "line-opacity": 0.9,
      },
    });
  }

  if (!map.getLayer(LAYER_ID)) {
    map.addLayer({
      id: LAYER_ID,
      type: "symbol",
      source: SOURCE_ID,
      layout: {
        "icon-image": [
          "case",
          ["==", ["get", "featureType"], "work"],
          "path-work-icon",
          "path-image-icon",
        ],
        "icon-size": 0.8,
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
      },
    });
  }

  map.on("click", LAYER_ID, (e) => {
    const feature = e.features?.[0];
    if (!feature) return;

    const id = feature.properties?.id;
    const coordinates = feature.geometry?.coordinates?.slice();

    toggleStop(id);

    requestAnimationFrame(() => {
      focusOnCoordinates(coordinates);
    });
  });

  map.on("mouseenter", LAYER_ID, () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", LAYER_ID, () => {
    map.getCanvas().style.cursor = "";
  });

  fitToPoints(map);
  refreshRoute();
}

watch(
  () => props.images,
  () => {
    syncStopSource();
    refreshRoute();
  },
  { deep: true }
);
</script>

<template>
  <div class="path-map">
    <div v-if="isLoading" class="path-map__loading">Carregando mapa…</div>
    <MapLibreMap
      class="path-map__inner"
      :style-url="STYLE_URL"
      :center="defaultCenter"
      :zoom="12"
      @map-ready="onMapReady"
    />
    <p v-if="routeHint" class="path-map__hint">
      {{ routeHint }}
    </p>
  </div>
</template>

<style scoped>
.path-map {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: inherit;
}

.path-map__inner {
  width: 100%;
  height: 100%;
  min-height: inherit;
}

.path-map__loading {
  position: absolute;
  z-index: 2;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(250, 249, 249, 0.7);
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  color: #2f2f2f;
}

.path-map__hint {
  position: absolute;
  left: 12px;
  bottom: 12px;
  z-index: 2;
  margin: 0;
  padding: 6px 10px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.92);
  font-family: "DM Sans", sans-serif;
  font-size: 12px;
  color: #2f2f2f;
}
</style>
