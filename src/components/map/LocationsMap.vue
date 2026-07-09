<script setup>
import { computed, markRaw, onUnmounted, ref, shallowRef, watch } from "vue";
import { LngLatBounds, Popup } from "maplibre-gl";

import MapLibreMap from "@/components/map/MapLibreMap.vue";
import { createCollectionImagesFeatureCollection } from "@/helpers/geojson.js";
import escapeHtml from "@/helpers/escapeHtml";

defineOptions({ name: "LocationsMap" });

const props = defineProps({
  images: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  /** 'collection' | 'explore' */
  context: { type: String, default: "collection" },
});

const emit = defineEmits(["select"]);

const mapInstance = shallowRef(null);
const selectedId = ref(null);
let activePopup = null;
let initialView = null;

const styleUrl = "https://tiles.openfreemap.org/styles/positron";
const sourceId = "locations-images";
const iconId = "locations-camera-icon";
const selectedIconId = "locations-camera-icon-active";

const clusterLayerId = `${sourceId}-clusters`;
const clusterCountLayerId = `${sourceId}-cluster-count`;
const unclusteredLayerId = `${sourceId}-unclustered`;

const baseColor = "#2F2F2F";
const selectedColor = "#D27D30";

const DEFAULT_CENTER = [-46.6333, -23.5505];
const DEFAULT_ZOOM = 3;
const SELECTED_ICON_ZOOM = 8;
const SELECTED_ICON_ANIMATION_MS = 700;

const cameraIconSvg = (fill) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8" fill="${fill}"/><g transform="translate(8 8) scale(0.75) translate(-8 -8)"><path fill="#FFFFFF" d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/><path fill="#FFFFFF" d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4Zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1m9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0"/></g></svg>`;

/* ------------------------------- Validação ---------------------------------- */
// Verifica se as coordenadas são válidas.
const isValidCoordinate = (coordinates) =>
  Array.isArray(coordinates) &&
  coordinates.length >= 2 &&
  Number.isFinite(coordinates[0]) &&
  Number.isFinite(coordinates[1]);

// Obtém as features localizadas.
const getLocatedFeatures = () =>
  createCollectionImagesFeatureCollection(props.images).features.filter((feature) =>
    isValidCoordinate(feature.geometry?.coordinates)
  );

// Mensagem de placeholder quando não há imagens localizadas.
const emptyMessage = computed(() =>
  props.context === "explore"
    ? "Nenhuma imagem com localização no acervo."
    : "Nenhuma imagem com localização nesta coleção."
);

// FeatureCollection com a flag selected por feature (usada no clustering e nos ícones).
const geoJsonData = computed(() => {
  const base = createCollectionImagesFeatureCollection(props.images);
  return {
    type: "FeatureCollection",
    features: base.features.map((feature) => ({
      ...feature,
      properties: {
        ...feature.properties,
        selected: feature.properties?.id === selectedId.value,
      },
    })),
  };
});

// Verifica se há imagens localizadas.
const hasLocatedImages = computed(() => geoJsonData.value.features.length > 0);

// Obtém as opções iniciais do mapa.
const initialMapOptions = computed(() => {
  const features = getLocatedFeatures();
  return {
    center: features[0]?.geometry?.coordinates ?? DEFAULT_CENTER,
    zoom: features.length === 1 ? 14 : DEFAULT_ZOOM,
  };
});

/* ----------------------- HOVER: miniatura circular ----------------------- */
// Cria o conteúdo HTML do popup circular com a miniatura da imagem.
const createCircularPopupContent = ({ thumbUrl, title }) => {
  const resolvedThumb =
    typeof thumbUrl === "string" && thumbUrl.trim().length > 0
      ? thumbUrl.trim()
      : "";
  const safeTitle = escapeHtml(title || "Imagem");

  return `
    <article class="locations-map-popup" aria-label="${safeTitle}">
      <div class="locations-map-popup__thumb">
        ${
          resolvedThumb
            ? `<img src="${escapeHtml(resolvedThumb)}" alt="" loading="lazy" />`
            : ""
        }
      </div>
    </article>
  `;

};

// Fecha o popup ativo.
const closeActivePopup = () => {
  if (!activePopup) return;

  activePopup.remove();
  activePopup = null;

};

// Mostra o popup para o feature.
const showPopupForFeature = (event) => {
  const map = mapInstance.value;
  const feature = event.features?.[0];
  if (!map || !feature) return;

  const coordinates = feature.geometry.coordinates.slice();
  const { thumbUrl, title } = feature.properties ?? {};

  closeActivePopup();

  const popup = new Popup({ // Popup para exibir a miniatura da imagem.
    anchor: "bottom",
    offset: [0, -10],
    closeButton: false,
    className: "locations-map-popup-container",
  })
    .setLngLat(coordinates)
    .setHTML(createCircularPopupContent({ thumbUrl, title }))
    .addTo(map);

  activePopup = popup;

  // Fecha o popup quando o usuário clica fora dele.
  popup.on("close", () => {
    if (activePopup === popup) activePopup = null;
  });

};

/* ------------------------- CLIQUE: seleção laranja ------------------------ */
// Registra o ícone SVG no mapa, se ainda não estiver registrado.
const registerIcon = (map, id, svg) => new Promise((resolve) => {
    if (map.hasImage(id)) return resolve();

    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const image = new Image(64, 64);

    image.onload = () => {
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

/* ------------------------------- Seleção ---------------------------------- */
// Define o cursor do mapa.
const setCursor = (value) => {
  const map = mapInstance.value;
  if (map) map.getCanvas().style.cursor = value;
};

// Aproxima o zoom para exibir o ícone selecionado.
const focusOnCoordinates = (coordinates) => {
  const map = mapInstance.value;
  if (!map || !isValidCoordinate(coordinates)) return;

  const currentZoom = map.getZoom();
  const targetZoom = Math.max(currentZoom, SELECTED_ICON_ZOOM);

  map.easeTo({
    center: coordinates,
    zoom: targetZoom,
    duration: SELECTED_ICON_ANIMATION_MS,
    essential: true,
  });

};

// Manipulador de evento para quando o usuário clica em um ponto no mapa.
const handlePointClick = (event) => {
  const feature = event.features?.[0];
  if (!feature) return;

  const coordinates = feature.geometry.coordinates.slice();
  const id = feature.properties?.id ?? null;

  selectedId.value = id;
  emit("select", id);

  requestAnimationFrame(() => {
    focusOnCoordinates(coordinates);
  });
};

// Constroi a view inicial do mapa.
const buildInitialView = () => {
  const features = getLocatedFeatures();
  if (!features.length) {
    return { type: "point", center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM };
  }

  if (features.length === 1) {
    return {
      type: "point",
      center: features[0].geometry.coordinates,
      zoom: 14,
    };
  }

  const bounds = new LngLatBounds();
  features.forEach((feature) => {
    bounds.extend(feature.geometry.coordinates);
  });

  return { type: "bounds", bounds };

};

const saveInitialView = () => {
  initialView = buildInitialView();
};

/* ------------------------------- Restauração ---------------------------------- */
// Restaura a view inicial do mapa.
const restoreInitialView = () => {
  const map = mapInstance.value;
  if (!map) return;

  const view = initialView ?? buildInitialView();
  if (!view) return;

  map.stop();

  if (view.type === "point") {
    map.easeTo({
      center: view.center,
      zoom: view.zoom,
      duration: SELECTED_ICON_ANIMATION_MS,
      essential: true,
    });
    return;
  }

  map.fitBounds(view.bounds, {
    padding: 56,
    maxZoom: 14,
    duration: SELECTED_ICON_ANIMATION_MS,
    essential: true,
  });

};

// Limpa a seleção e restaura a view inicial.
const resetToInitial = () => {
  if (selectedId.value === null) return;

  selectedId.value = null;
  emit("select", null);
  closeActivePopup();

  const map = mapInstance.value;
  if (!map) return;

  let restored = false;

  const run = () => {
    if (restored) return;
    restored = true;
    restoreInitialView();
  };

  map.once("idle", run);
  window.setTimeout(run, 80);

};

/* ------------------------------- Limpeza ---------------------------------- */
// Limpa a seleção e restaura a view inicial.
const clearSelection = () => {
  resetToInitial();
};

// Clique em um cluster -> aproxima o zoom para expandi-lo.
const handleClusterClick = async (event) => {
  const map = mapInstance.value;
  if (!map) return;

  const features = map.queryRenderedFeatures(event.point, {
    layers: [clusterLayerId, clusterCountLayerId],
  });
  const clusterId = features[0]?.properties?.cluster_id;
  if (clusterId == null) return;

  const source = map.getSource(sourceId);
  if (!source?.getClusterExpansionZoom) return;

  try {
    const zoom = await source.getClusterExpansionZoom(clusterId);

    map.easeTo({
      center: features[0].geometry.coordinates,
      zoom,
      duration: SELECTED_ICON_ANIMATION_MS,
      essential: true,
    });

  } catch {
    // Fazer nada
  }
};

const handleUnclusteredEnter = (event) => {
  setCursor("pointer");
  showPopupForFeature(event);
};

const handleUnclusteredLeave = () => {
  setCursor("");
  closeActivePopup();
};

const handleClusterEnter = () => setCursor("pointer");
const handleClusterLeave = () => setCursor("");

/* ------------------------------- Mapa ------------------------------------- */
// Ajusta o mapa para exibir todas as features visíveis.
const fitMapToFeatures = () => {
  restoreInitialView();
};

// Configura as camadas do mapa.
const setupLayers = async (map) => {
  await registerIcon(map, iconId, cameraIconSvg(baseColor));
  await registerIcon(map, selectedIconId, cameraIconSvg(selectedColor));

  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: "geojson",
      data: geoJsonData.value,
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
      // has_selected = 1 se algum ponto do cluster estiver selecionado
      clusterProperties: {
        has_selected: ["max", ["case", ["get", "selected"], 1, 0]],
      },
    });
  }

  if (!map.getLayer(clusterLayerId)) {
    map.addLayer({
      id: clusterLayerId,
      type: "circle",
      source: sourceId,
      filter: ["has", "point_count"],
      paint: {
        "circle-color": [
          "case",
          [">", ["get", "has_selected"], 0],
          selectedColor,
          baseColor,
        ],
        "circle-radius": ["step", ["get", "point_count"], 20, 100, 30, 750, 40],
      },
    });
  }

  if (!map.getLayer(clusterCountLayerId)) {
    map.addLayer({
      id: clusterCountLayerId,
      type: "symbol",
      source: sourceId,
      filter: ["has", "point_count"],
      layout: {
        "text-field": "{point_count_abbreviated}",
        "text-font": ["Noto Sans Regular"],
        "text-size": 12,
      },
      paint: { "text-color": "#FFFFFF" },
    });
  }

  if (!map.getLayer(unclusteredLayerId)) {
    map.addLayer({
      id: unclusteredLayerId,
      type: "symbol",
      source: sourceId,
      filter: ["!", ["has", "point_count"]],
      layout: {
        "icon-image": ["case", ["get", "selected"], selectedIconId, iconId],
        "icon-size": ["case", ["get", "selected"], 0.95, 0.8],
        "icon-allow-overlap": true,
      },
    });
  }

  map.on("click", clusterLayerId, handleClusterClick);
  map.on("click", clusterCountLayerId, handleClusterClick);
  map.on("click", unclusteredLayerId, handlePointClick);
  map.on("mouseenter", unclusteredLayerId, handleUnclusteredEnter);
  map.on("mouseleave", unclusteredLayerId, handleUnclusteredLeave);
  map.on("mouseenter", clusterLayerId, handleClusterEnter);
  map.on("mouseleave", clusterLayerId, handleClusterLeave);
  map.on("mouseenter", clusterCountLayerId, handleClusterEnter);
  map.on("mouseleave", clusterCountLayerId, handleClusterLeave);
};

// Manipulador de evento para quando o mapa estiver pronto.
const handleMapReady = async (map) => {
  mapInstance.value = markRaw(map);

  // Clique fora dos ícones -> limpa a seleção.
  // Registrado antes dos awaits para garantir que sempre exista.
  map.on("click", (event) => {
    if (!map.getLayer(unclusteredLayerId)) return;
    if (selectedId.value === null) return;

    const hits = map.queryRenderedFeatures(event.point, {
      layers: [unclusteredLayerId, clusterLayerId, clusterCountLayerId],
    });

    if (!hits.length) clearSelection();
  });

  await setupLayers(map);
  saveInitialView();
  fitMapToFeatures();
};

const handleMapError = (error) => {
  console.error("Erro no mapa da coleção:", error);
};

// Atualiza os dados do source quando imagens ou seleção mudam (re-clusteriza).
watch(geoJsonData, (data) => {
  const source = mapInstance.value?.getSource(sourceId);
  if (source?.setData) source.setData(data);
});

// Reposiciona o mapa quando a quantidade de imagens muda.
watch(
  () => props.images,
  () => {
    if (!mapInstance.value) return;

    selectedId.value = null;
    emit("select", null);
    saveInitialView();
    fitMapToFeatures();
  },
  { deep: true }
);

defineExpose({ resetToInitial });

onUnmounted(() => {
  const map = mapInstance.value;
  closeActivePopup();

  // O MapLibreMap (filho) desmonta antes e já chama map.remove(),
  // destruindo o style. Só mexemos nas camadas se o style ainda existir.
  if (map && map.style) {
    [clusterLayerId, clusterCountLayerId, unclusteredLayerId].forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    if (map.getSource(sourceId)) map.removeSource(sourceId);
    if (map.hasImage(iconId)) map.removeImage(iconId);
    if (map.hasImage(selectedIconId)) map.removeImage(selectedIconId);
  }

  mapInstance.value = null;
});
</script>

<template>
  <div class="collection-images-map" aria-label="Mapa das imagens da coleção">
    <div
      v-if="isLoading"
      class="locations-map__state"
      role="status"
    >
      Carregando mapa...
    </div>

    <template v-else>
      <MapLibreMap
        class="locations-map__canvas"
        :style-url="styleUrl"
        :map-options="initialMapOptions"
        @map-ready="handleMapReady"
        @map-error="handleMapError"
      />

      <p
        v-if="!hasLocatedImages"
        class="locations-map__empty"
      >
        {{ emptyMessage }}
      </p>

      <div v-if="selectedId" class="locations-map__hint">
        <span class="locations-map__hint-icon" aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="13"
            height="13"
            viewBox="0 0 13 13"
            fill="none"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M0.118945 12.8394C0.195128 12.9156 0.29844 12.9584 0.406163 12.9584C0.513886 12.9584 0.617199 12.9156 0.693382 12.8394L4.02138 9.51145V11.7604C4.02138 11.8682 4.06418 11.9715 4.14037 12.0477C4.21656 12.1239 4.31989 12.1667 4.42763 12.1667C4.53538 12.1667 4.63871 12.1239 4.71489 12.0477C4.79108 11.9715 4.83388 11.8682 4.83388 11.7604V8.53076C4.83388 8.42301 4.79108 8.31968 4.71489 8.2435C4.63871 8.16731 4.53538 8.12451 4.42763 8.12451H1.19794C1.0902 8.12451 0.986869 8.16731 0.910682 8.2435C0.834496 8.31968 0.791695 8.42301 0.791695 8.53076C0.791695 8.6385 0.834496 8.74183 0.910682 8.81802C0.986869 8.89421 1.0902 8.93701 1.19794 8.93701H3.44694L0.118945 12.265C0.0427844 12.3412 0 12.4445 0 12.5522C0 12.6599 0.0427844 12.7633 0.118945 12.8394V12.8394ZM12.8394 0.118945C12.7633 0.0427844 12.6599 0 12.5522 0C12.4445 0 12.3412 0.0427844 12.265 0.118945L8.93701 3.44694V1.19794C8.93701 1.0902 8.89421 0.986869 8.81802 0.910682C8.74183 0.834496 8.6385 0.791695 8.53076 0.791695C8.42301 0.791695 8.31968 0.834496 8.2435 0.910682C8.16731 0.986869 8.12451 1.0902 8.12451 1.19794V4.42763C8.12451 4.53538 8.16731 4.63871 8.2435 4.71489C8.31968 4.79108 8.42301 4.83388 8.53076 4.83388H11.7604C11.8682 4.83388 11.9715 4.79108 12.0477 4.71489C12.1239 4.63871 12.1667 4.53538 12.1667 4.42763C12.1667 4.31989 12.1239 4.21656 12.0477 4.14037C11.9715 4.06418 11.8682 4.02138 11.7604 4.02138H9.51145L12.8394 0.693382C12.9156 0.617199 12.9584 0.513886 12.9584 0.406163C12.9584 0.29844 12.9156 0.195128 12.8394 0.118945V0.118945Z"
              fill="white"
            />
          </svg>
        </span>
        <span class="locations-map__hint-text">Clique fora para voltar</span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.locations-map {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 480px;
  height: 100%;
  border-radius: 5px;
  overflow: hidden;
  border: 0.25px solid var(--Cinza_C, #a6a6a6);
  background: var(--Off_white, #faf9f9);
  box-sizing: border-box;
}

.locations-map__canvas {
  flex: 1 1 auto;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.locations-map__state,
.locations-map__empty {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 24px;
  box-sizing: border-box;
  text-align: center;
  color: var(--Cinza_E, #2f2f2f);
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  line-height: 150%;
  background: rgba(250, 249, 249, 0.92);
  pointer-events: none;
}

.locations-map__hint {
  position: absolute;
  left: 16px;
  bottom: 16px;
  z-index: 3;
  display: inline-flex;
  padding: var(--pp, 8px) var(--p, 12px) var(--pp, 8px) var(--m, 16px);
  align-items: center;
  gap: 24px;
  border-radius: 4px;
  background: var(--Cinza_E, #2f2f2f);
  pointer-events: none;
}

.locations-map__hint-icon {
  display: inline-flex;
  width: 12.958px;
  height: 12.958px;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.locations-map__hint-text {
  color: var(--Branco, #fff);
  font-family: "DM Sans";
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 115%;
}
</style>

<style>
.locations-map-popup-container.maplibregl-popup {
  z-index: 5;
  pointer-events: none;
}

.locations-map-popup-container .maplibregl-popup-content {
  padding: 0;
  background: transparent;
  box-shadow: none;
}

.locations-map-popup-container .maplibregl-popup-tip {
  display: none;
}

.locations-map-popup {
  display: flex;
  align-items: center;
  justify-content: center;
}

.locations-map-popup__thumb {
  width: 92px;
  height: 92px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--Preto, #1f1f1f);
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
}

.locations-map-popup__thumb img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
