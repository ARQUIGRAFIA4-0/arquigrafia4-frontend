<script setup>
import { computed, shallowRef, ref, watch } from "vue";
import { LngLatBounds } from "maplibre-gl";
import MapLibreMap from "@/components/map/MapLibreMap.vue";
import PathPointsPanel from "@/components/map/PathPointsPanel.vue";
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
  isSaving: { type: Boolean, default: false },
  initialStops: { type: Array, default: () => [] },
  initialRoute: { type: Object, default: null },
});

const emit = defineEmits(["stop-change", "save", "back"]);

const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";
const IMAGE_COLOR = "#D27D30";
const WORK_COLOR = "#3B6EA5";
const PATH_COLOR = "#AA4F28";

const SOURCE_ID = "path-stops";
const LAYER_ID = "path-stops-symbols";
const LINE_SOURCE_ID = "path-line";
const LINE_LAYER_ID = "path-line-layer";
const PATH_PIN_SOURCE_ID = "path-route-pins";
const PATH_PIN_LAYER_ID = "path-route-pins-symbols";

const SELECTED_ICON_ZOOM = 8;
const SELECTED_ICON_ANIMATION_MS = 700;

const mapRef = shallowRef(null);

/** true = próximo clique no mapa cria ponto livre (custom) */
const isPickingCustom = ref(false);

/** id do pin custom sendo arrastado */
const draggingStopId = ref(null);

/**
 * Fonte da verdade do percurso.
 * type: "image" | "custom"
 * { id, type, title, order, coordinates: [lng, lat], imageId }
 */
const pathStops = ref([]);
let pathStopSeq = 0;

const routeCoordinates = ref(/** @type {Array<[number, number]>} */ ([]));
const routeDistanceMeters = ref(0);
const routeDurationSeconds = ref(0);
const routeLoading = ref(false);
const routeIsStreet = ref(false);

let routeAbort = /** @type {AbortController | null} */ (null);
let routeRequestId = 0;

// Aplica a rota inicial do percurso.
function applyInitialRoute(route) {
  if (!route || !Array.isArray(route.coordinates) || route.coordinates.length < 2) {
    routeCoordinates.value = [];
    routeDistanceMeters.value = 0;
    routeDurationSeconds.value = 0;
    routeIsStreet.value = false;

    return;

  }

  routeCoordinates.value = route.coordinates.map(([lng, lat]) => [lng, lat]);
  routeDistanceMeters.value = Number(route.distanceMeters) || 0;
  routeDurationSeconds.value = Number(route.durationSeconds) || 0;
  routeIsStreet.value = Boolean(route.isStreet);

}

// Esse método é responsável por hidratar as paradas iniciais do percurso.
// Hidratar significa preencher o estado local com os dados iniciais do percurso.
function hydrateStopsFromInitial(list) {
  if (!Array.isArray(list) || !list.length) {
    pathStops.value = [];
    pathStopSeq = 0;
    
    return;

  }

  // Reinicia o contador de paradas.
  pathStopSeq = 0;
  pathStops.value = list.map((stop, index) => {
    pathStopSeq += 1; // Incrementa o contador de paradas.
    const raw = Array.isArray(stop.coordinates) ? stop.coordinates.slice(0, 2) : null;
    const coordinates = raw && raw.length >= 2 ? [Number(raw[0]), Number(raw[1])] : null;

    return {
      id: `stop-${pathStopSeq}`,
      type: stop.type === "custom" ? "custom" : "image",
      title: stop.title?.trim() || `Ponto ${index + 1}`,
      order: Number(stop.order) || index + 1,
      coordinates:
        coordinates &&
        Number.isFinite(coordinates[0]) &&
        Number.isFinite(coordinates[1])
          ? coordinates
          : null,
      imageId: stop.imageId ?? null,
    };
  });
}

hydrateStopsFromInitial(props.initialStops);
applyInitialRoute(props.initialRoute);

// Emite o evento de mudança de parada.
function emitStopChange() {
  emit(
    "stop-change",
    pathStops.value.map(({ type, title, order, imageId }) => ({
      type,
      title,
      order,
      imageId,
    }))
  );
}

// Renumera as paradas do percurso.
function renumberPathStops() {
  pathStops.value = pathStops.value.map((stop, index) => ({
    ...stop,
    order: index + 1,
  }));
}

// Constroi o GeoJSON das paradas do percurso.
function buildPathPinsGeoJson() {
  return {
    type: "FeatureCollection",
    features: pathStops.value
      .filter((s) => Array.isArray(s.coordinates) && s.coordinates.length >= 2)
      .map((stop) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: stop.coordinates },
        properties: {
          id: stop.id,
          order: stop.order,
          title: stop.title,
          type: stop.type,
          icon: `path-pin-${stop.order}`,
        },
      })),
  };
}

// Sincroniza a fonte das paradas do percurso.
async function syncPathPinsSource() {
  const map = mapRef.value;

  if (!map?.getSource) return;

  await ensurePathPinIcons(map, pathStops.value);

  const source = map.getSource(PATH_PIN_SOURCE_ID);

  if (source) source.setData(buildPathPinsGeoJson());
}

/** Botão “Adicionar novo ponto” > modo escolher no mapa */
function onAddPathStopClick() {
  isPickingCustom.value = true;
}

// Remove uma parada do percurso.
function removePathStop(id) {
  pathStops.value = pathStops.value.filter((stop) => stop.id !== id);
  renumberPathStops();
  syncPathPinsSource();
  refreshRoute();
  emitStopChange();
}

// Renomeia uma parada do percurso.
function renamePathStop({ id, title }) {
  pathStops.value = pathStops.value.map((stop) =>
    stop.id === id ? { ...stop, title } : stop
  );
  emitStopChange();
}

// Atualiza as coordenadas de uma parada do percurso.
function updateStopCoordinates(id, coordinates) {
  pathStops.value = pathStops.value.map((stop) =>
    stop.id === id
      ? {
          ...stop,
          coordinates: (coordinates.slice(0, 2)),
        }
      : stop
  );
  syncPathPinsSource();
}

// Salva o percurso.
function onPathStopsSave() {
  if (props.isSaving) return;

  if (pathStops.value.length < 2) {
    emit("save", { error: "Adicione pelo menos 2 pontos para salvar o percurso." });
    return;
  }

  const stops = pathStops.value.map(
    ({ type, title, order, coordinates, imageId }) => ({
      type,
      title,
      order,
      coordinates,
      imageId: type === "image" ? imageId : null,
    })
  );

  const route = {
    isStreet: routeIsStreet.value,
    distanceMeters: routeDistanceMeters.value || null,
    durationSeconds: routeDurationSeconds.value || null,
    coordinates: routeCoordinates.value.map(([lng, lat]) => [lng, lat]),
  };

  if (!route.coordinates.length) {
    route.coordinates = stopCoordinatesInOrder();
  }

  emit("save", { stops, route });
}

// Volta para a tela anterior.
function onPathStopsBack() {
  emit("back");
}

// Adiciona uma parada customizada ao percurso.
function addCustomPathStop(coordinates) {
  if (!coordinates?.length) return;

  pathStopSeq += 1;
  const order = pathStops.value.length + 1;
  pathStops.value = [
    ...pathStops.value,
    {
      id: `stop-${pathStopSeq}`,
      type: "custom",
      title: `Ponto ${order}`,
      order,
      coordinates: (coordinates.slice(0, 2)),
      imageId: null,
    },
  ];

  isPickingCustom.value = false;
  syncPathPinsSource();
  refreshRoute();
  emitStopChange();
}

/** Clique na imagem > ponto ligado à imagem (type: "image") */
function toggleImageAsPathStop(imageId, coordinates, title) {
  if (imageId == null || !coordinates?.length) return;

  if (isPickingCustom.value) {
    addCustomPathStop(coordinates);
    return;
  }

  const key = String(imageId);
  const existing = pathStops.value.find(
    (s) => s.type === "image" && String(s.imageId) === key
  );

  if (existing) {
    removePathStop(existing.id);
    return;
  }

  pathStopSeq += 1;
  const order = pathStops.value.length + 1;
  pathStops.value = [
    ...pathStops.value,
    {
      id: `stop-${pathStopSeq}`,
      type: "image",
      title: title?.trim() || `Ponto ${order}`,
      order,
      coordinates: /** @type {[number, number]} */ (coordinates.slice(0, 2)),
      imageId: key,
    },
  ];

  syncPathPinsSource();
  refreshRoute();
  emitStopChange();
}

const featureCollection = computed(() =>
  createCollectionImagesFeatureCollection(props.images)
);

/** Centro só na criação do mapa — não reagir a saves/edições (MapLibreMap faz setCenter no watch). */
function resolveInitialCenter() {
  const firstStop = props.initialStops?.find(
    (s) => Array.isArray(s?.coordinates) && s.coordinates.length >= 2
  );
  if (firstStop) {
    return [
      Number(firstStop.coordinates[0]),
      Number(firstStop.coordinates[1]),
    ];
  }

  const first = createCollectionImagesFeatureCollection(props.images).features[0];
  return first ? first.geometry.coordinates : [-46.6333, -23.5505];
}

const mapCenter = ref(resolveInitialCenter());

/** Evita fitBounds / re-hidratação depois do enquadramento inicial (ex.: após Salvar). */
let didInitialPathFit = false;

// Exibe uma mensagem de ajuda para o usuário
const routeHint = computed(() => {
  if (isPickingCustom.value) {
    return "Clique no mapa para posicionar o novo ponto";
  }

  if (draggingStopId.value) {
    return "Arraste o ponto e solte para atualizar a rota";
  }

  const n = pathStops.value.length;
  if (n < 2) {
    return n
      ? `${n} ponto no percurso — adicione outro para traçar a rota`
      : "Clique em imagens ou em “Adicionar novo ponto” para montar o percurso";
  }

  if (routeLoading.value) return "Calculando rota nas ruas…";

  const dist = formatRouteDistance(routeDistanceMeters.value);
  const dur = formatRouteDuration(routeDurationSeconds.value);
  const stats = [dist, dur].filter(Boolean).join(" · ");
  const mode = routeIsStreet.value ? "pelas ruas" : "linha reta (fallback)";

  return stats ? `${n} paradas · ${stats} (${mode})` : `${n} paradas (${mode})`;
});

const cameraIconSvg = (fill) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8" fill="${fill}"/><g transform="translate(8 8) scale(0.75) translate(-8 -8)"><path fill="#FFFFFF" d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/><path fill="#FFFFFF" d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4Zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1m9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0"/></g></svg>`;
const workIconSvg = (fill) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="${fill}"/><path fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" d="M18 45 V31.5 L28 19.5 L46.5 28.5 V45 H18 Z"/><line x1="28" y1="19.5" x2="28" y2="45" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/><g fill="#FFFFFF"><rect x="21" y="33" width="3.4" height="3.4" rx="0.35"/><rect x="21" y="38.2" width="3.4" height="3.4" rx="0.35"/><rect x="31" y="24.8" width="3.2" height="3.2" rx="0.3"/><rect x="35.6" y="24.8" width="3.2" height="3.2" rx="0.3"/><rect x="40.2" y="24.8" width="3.2" height="3.2" rx="0.3"/><rect x="31" y="29" width="3.2" height="3.2" rx="0.3"/><rect x="35.6" y="29" width="3.2" height="3.2" rx="0.3"/><rect x="40.2" y="29" width="3.2" height="3.2" rx="0.3"/><rect x="31" y="33.2" width="3.2" height="3.2" rx="0.3"/><rect x="35.6" y="33.2" width="3.2" height="3.2" rx="0.3"/><rect x="40.2" y="33.2" width="3.2" height="3.2" rx="0.3"/><rect x="31" y="37.4" width="3.2" height="3.2" rx="0.3"/><rect x="35.6" y="37.4" width="3.2" height="3.2" rx="0.3"/><rect x="40.2" y="37.4" width="3.2" height="3.2" rx="0.3"/><rect x="31" y="41.6" width="3.2" height="3.2" rx="0.3"/><rect x="35.6" y="41.6" width="3.2" height="3.2" rx="0.3"/><rect x="40.2" y="41.6" width="3.2" height="3.2" rx="0.3"/></g></svg>`;

/** Pin em gota: branco + círculo preto + número branco */
function pathPinSvg(order) {
  const n = String(order);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 52" width="40" height="52">
  <ellipse cx="20" cy="49" rx="7" ry="2.5" fill="rgba(0,0,0,0.22)"/>
  <path fill="#FFFFFF" stroke="#E0E0E0" stroke-width="0.75" d="M20 1.5C10.3 1.5 2.5 9.3 2.5 19c0 12.2 17.5 31 17.5 31S37.5 31.2 37.5 19C37.5 9.3 29.7 1.5 20 1.5z"/>
  <circle cx="20" cy="19" r="11" fill="#1F1F1F"/>
  <text x="20" y="19.5" text-anchor="middle" dominant-baseline="middle" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="700">${n}</text>
</svg>`;
}

async function ensurePathPinIcons(map, stops) {
  const orders = [...new Set(stops.map((s) => s.order).filter(Boolean))];
  await Promise.all(
    orders.map((order) =>
      registerIcon(map, `path-pin-${order}`, pathPinSvg(order), {
        width: 40,
        height: 52,
      })
    )
  );
}

function registerIcon(map, id, svg, { width = 64, height = 64, pixelRatio = 2 } = {}) {
  return new Promise((resolve) => {
    if (map.hasImage(id)) return resolve();

    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const image = new Image(width, height);

    image.onload = () => {
      image.width = width;
      image.height = height;
      if (!map.hasImage(id)) map.addImage(id, image, { pixelRatio });
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
  return pathStops.value.map((s) => s.coordinates).filter((c) => Array.isArray(c) && c.length >= 2);
}

/**
 * IMPORTANTE: Cria o GeoJSON da linha da rota
*/
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

// Atualiza a fonte da linha do mapa
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
 * Atualiza a rota
 * ---------------------------------------------------------------------------
 *
 * Aqui ele pega as coordenadas das paradas e chama a função fetchOsrmRoute para calcular a rota.
 * Depois ele atualiza as coordenadas da rota, a distância e o tempo.
 * E depois ele desenha a rota no mapa.
 *
 * @returns {Promise<void>}
 */
async function refreshRoute() {
  const waypoints = stopCoordinatesInOrder();

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
  syncLineSource(); // IMPORTANTE: Desenha os percursos no mapa. É aqui que desenha os percursos no mapa.

  if (routeAbort) routeAbort.abort();
  routeAbort = new AbortController();
  const requestId = ++routeRequestId;
  routeLoading.value = true;

  try {
    /**
     * Calcula a rota
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
      profile: "walking", // walking, driving, cycling
      signal: routeAbort.signal,
    });

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

    syncLineSource(); // IMPORTANTE: Desenha os percursos no mapa. É aqui que desenha os percursos no mapa.

  } catch (err) {
    if (err?.name === "AbortError") return;
    if (requestId !== routeRequestId) return;

    routeIsStreet.value = false;
    syncLineSource(); // Limpa a linha do mapa se houver erro

  } finally {
    if (requestId === routeRequestId) routeLoading.value = false;

  }
}

/**
 * Prioriza o percurso existente (paradas + geometria da rota);
 * se não houver, enquadra as imagens da coleção.
 */
function fitToPoints(map) {
  const pathCoords = [
    ...stopCoordinatesInOrder(),
    ...(Array.isArray(routeCoordinates.value) ? routeCoordinates.value : []),
  ].filter((c) => Array.isArray(c) && c.length >= 2);

  const coords =
    pathCoords.length >= 1
      ? pathCoords
      : featureCollection.value.features.map((f) => f.geometry.coordinates);

  if (!coords.length) return;

  if (coords.length === 1) {
    map.flyTo({ center: coords[0], zoom: 14 });
    return;
  }

  const bounds = coords.reduce(
    (b, c) => b.extend(c),
    new LngLatBounds(coords[0], coords[0])
  );
  map.fitBounds(bounds, { padding: 64, maxZoom: 15 });
}

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

  if (!map.getSource(PATH_PIN_SOURCE_ID)) {
    map.addSource(PATH_PIN_SOURCE_ID, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
  }

  // Remove layers antigas (círculo/label) se existirem de hot-reload
  if (map.getLayer("path-route-pins-label")) map.removeLayer("path-route-pins-label");
  if (map.getLayer("path-route-pins-circle")) map.removeLayer("path-route-pins-circle");

  if (!map.getLayer(PATH_PIN_LAYER_ID)) {
    map.addLayer({
      id: PATH_PIN_LAYER_ID,
      type: "symbol",
      source: PATH_PIN_SOURCE_ID,
      layout: {
        "icon-image": ["get", "icon"],
        "icon-size": 1.45,
        "icon-anchor": "bottom",
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
      },
    });
  } else {
    map.setLayoutProperty(PATH_PIN_LAYER_ID, "icon-size", 1.45);
  }

  // Registra ícones e aplica pins já hidratados (percurso carregado da API).
  await syncPathPinsSource();
  syncLineSource();

  map.on("click", LAYER_ID, (e) => {
    const feature = e.features?.[0];
    if (!feature) return;

    const id = feature.properties?.id;
    const title = feature.properties?.title;
    const coordinates = feature.geometry?.coordinates?.slice();

    toggleImageAsPathStop(id, coordinates, title);

    requestAnimationFrame(() => {
      focusOnCoordinates(coordinates);
    });
  });

  map.on("click", (e) => {
    if (!isPickingCustom.value) return;
    if (draggingStopId.value) return;

    const onImage = map.queryRenderedFeatures(e.point, { layers: [LAYER_ID] });
    if (onImage.length) return;

    const onPin = map.queryRenderedFeatures(e.point, {
      layers: [PATH_PIN_LAYER_ID],
    });
    if (onPin.length) return;

    addCustomPathStop([e.lngLat.lng, e.lngLat.lat]);
  });

  map.on("mouseenter", LAYER_ID, () => {
    if (!draggingStopId.value) map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", LAYER_ID, () => {
    if (!draggingStopId.value && !isPickingCustom.value) {
      map.getCanvas().style.cursor = "";
    }
  });

  map.on("mouseenter", PATH_PIN_LAYER_ID, () => {
    map.getCanvas().style.cursor = "grab";
  });
  map.on("mouseleave", PATH_PIN_LAYER_ID, () => {
    if (!draggingStopId.value) {
      map.getCanvas().style.cursor = isPickingCustom.value ? "crosshair" : "";
    }
  });

  map.on("mousedown", PATH_PIN_LAYER_ID, (e) => {
    const feature = e.features?.[0];
    if (!feature || feature.properties?.type !== "custom") return;

    e.preventDefault();
    draggingStopId.value = String(feature.properties.id);
    map.dragPan.disable();
    map.getCanvas().style.cursor = "grabbing";
  });

  map.on("mousemove", (e) => {
    if (!draggingStopId.value) return;
    updateStopCoordinates(draggingStopId.value, [e.lngLat.lng, e.lngLat.lat]);

    const waypoints = stopCoordinatesInOrder();
    if (waypoints.length >= 2) {
      routeCoordinates.value = waypoints;
      routeIsStreet.value = false;
      syncLineSource();
    }
  });

  const endDrag = () => {
    if (!draggingStopId.value) return;
    draggingStopId.value = null;
    map.dragPan.enable();
    map.getCanvas().style.cursor = "";
    refreshRoute();
  };

  map.on("mouseup", endDrag);
  map.on("mouseleave", endDrag);

  // Enquadra só na abertura se já houver percurso; depois disso nunca mais via props/save.
  if (stopCoordinatesInOrder().length) {
    fitToPoints(map);
  }
  didInitialPathFit = true;
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

watch(
  pathStops,
  () => {
    syncPathPinsSource();
  },
  { deep: true }
);

watch(isPickingCustom, (picking) => {
  const map = mapRef.value;
  if (!map?.getCanvas) return;
  map.getCanvas().style.cursor = picking ? "crosshair" : "";
});

watch(
  () => [props.initialStops, props.initialRoute],
  ([stops, route], [prevStops, prevRoute]) => {
    // Depois do enquadramento inicial, props vindas do save não devem
    // reposicionar a câmera nem resetar o estado local do editor.
    if (didInitialPathFit) return;

    const sameStops =
      JSON.stringify(stops ?? []) === JSON.stringify(prevStops ?? []);
    const sameRoute =
      JSON.stringify(route ?? null) === JSON.stringify(prevRoute ?? null);
    if (sameStops && sameRoute) return;

    hydrateStopsFromInitial(stops);
    applyInitialRoute(route);
    syncPathPinsSource();
    syncLineSource();
    if (!route?.coordinates?.length) {
      refreshRoute();
    }

    const map = mapRef.value;
    if (map && stopCoordinatesInOrder().length) {
      fitToPoints(map);
      didInitialPathFit = true;
    }
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
      :center="mapCenter"
      :zoom="12"
      @map-ready="onMapReady"
    />
    <PathPointsPanel
      class="path-map__points-panel"
      :stops="pathStops"
      :saving="isSaving"
      @add="onAddPathStopClick"
      @remove="removePathStop"
      @rename="renamePathStop"
      @save="onPathStopsSave"
      @back="onPathStopsBack"
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

.path-map__points-panel {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 3;
}
</style>
