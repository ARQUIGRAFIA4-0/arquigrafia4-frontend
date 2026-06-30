<script setup>
import { computed, markRaw, onUnmounted, ref, shallowRef, watch } from "vue";
import { LngLatBounds, Popup } from "maplibre-gl";

import MapLibreMap from "@/components/map/MapLibreMap.vue";
import { createCollectionImagesFeatureCollection } from "@/helpers/geojson.js";
import escapeHtml from "@/helpers/escapeHtml";

defineOptions({ name: "CollectionImagesMap" });

const props = defineProps({
  images: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
});

const emit = defineEmits(["select"]);

const mapInstance = shallowRef(null);
const selectedId = ref(null);
let activePopup = null;

const styleUrl = "https://tiles.openfreemap.org/styles/positron";
const sourceId = "collection-images";
const iconId = "collection-camera-icon";
const selectedIconId = "collection-camera-icon-active";

const clusterLayerId = `${sourceId}-clusters`;
const clusterCountLayerId = `${sourceId}-cluster-count`;
const unclusteredLayerId = `${sourceId}-unclustered`;

const baseColor = "#2F2F2F";
const selectedColor = "#D27D30"; // Laranja_M

const DEFAULT_CENTER = [-46.6333, -23.5505]; // São Paulo
const DEFAULT_ZOOM = 3;

// SVG do ícone (preto = normal, laranja = selecionado)
const cameraIconSvg = (fill) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8" fill="${fill}"/><g transform="translate(8 8) scale(0.75) translate(-8 -8)"><path fill="#FFFFFF" d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/><path fill="#FFFFFF" d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4Zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1m9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0"/></g></svg>`;

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

const hasLocatedImages = computed(() => geoJsonData.value.features.length > 0);

// Define o centro do mapa com base na primeira imagem localizada.
const mapCenter = computed(() => {
  const first = geoJsonData.value.features[0];
  return first?.geometry?.coordinates ?? DEFAULT_CENTER;
});

// Zoom inicial: 14 se houver apenas uma imagem, senão o padrão.
const mapZoom = computed(() =>
  geoJsonData.value.features.length === 1 ? 14 : DEFAULT_ZOOM
);

/* ----------------------- HOVER: miniatura circular ----------------------- */
// Cria o conteúdo HTML do popup circular com a miniatura da imagem.
const createCircularPopupContent = ({ thumbUrl, title }) => {
  const resolvedThumb = typeof thumbUrl === "string" && thumbUrl.trim().length > 0 ? thumbUrl.trim() : "";
  const safeTitle = escapeHtml(title || "Imagem");

  return `
    <article class="collection-map-popup" aria-label="${safeTitle}">
      <div class="collection-map-popup__thumb">
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

  const popup = new Popup({
    anchor: "bottom",
    offset: [0, -10],
    closeButton: false,
    className: "collection-map-popup-container",
  })
    .setLngLat(coordinates)
    .setHTML(createCircularPopupContent({ thumbUrl, title }))
    .addTo(map);

  activePopup = popup;
  popup.on("close", () => {
    if (activePopup === popup) activePopup = null;
  });
};

/* ------------------------- CLIQUE: seleção laranja ------------------------ */
// Registra o ícone SVG no mapa, se ainda não estiver registrado.
const registerIcon = (map, id, svg) =>
  new Promise((resolve) => {
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
const setCursor = (value) => {
  const map = mapInstance.value;
  if (map) map.getCanvas().style.cursor = value;
};

// Manipulador de evento para quando o usuário clica em um ponto no mapa.
const handlePointClick = (event) => {
  const feature = event.features?.[0];
  if (!feature) return;

  selectedId.value = feature.properties?.id ?? null;
  emit("select", selectedId.value);

};

// Limpa a seleção e emite o evento de seleção.
const clearSelection = () => {
  if (selectedId.value === null) return;
  selectedId.value = null;
  emit("select", null);
};

// Clique em um cluster -> aproxima o zoom para expandi-lo.
const handleClusterClick = async (event) => {
  const map = mapInstance.value;
  if (!map) return;

  const features = map.queryRenderedFeatures(event.point, {
    layers: [clusterLayerId],
  });
  const clusterId = features[0]?.properties?.cluster_id;
  if (clusterId == null) return;

  const source = map.getSource(sourceId);
  if (!source?.getClusterExpansionZoom) return;

  try {
    const zoom = await source.getClusterExpansionZoom(clusterId);
    map.easeTo({ center: features[0].geometry.coordinates, zoom });
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
// Ajusta o mapa para exibir todos os features visíveis.
const fitMapToFeatures = () => {
  const map = mapInstance.value;
  const features = geoJsonData.value.features;
  if (!map || !features.length) return;

  if (features.length === 1) {
    map.easeTo({
      center: features[0].geometry.coordinates,
      zoom: 14,
      duration: 500,
    });
    return;
  }

  const bounds = new LngLatBounds();
  features.forEach((feature) => bounds.extend(feature.geometry.coordinates));
  map.fitBounds(bounds, { padding: 56, maxZoom: 14, duration: 500 });

};

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
  map.on("click", unclusteredLayerId, handlePointClick);
  map.on("mouseenter", unclusteredLayerId, handleUnclusteredEnter);
  map.on("mouseleave", unclusteredLayerId, handleUnclusteredLeave);
  map.on("mouseenter", clusterLayerId, handleClusterEnter);
  map.on("mouseleave", clusterLayerId, handleClusterLeave);
};

// Manipulador de evento para quando o mapa estiver pronto.
const handleMapReady = async (map) => {
  mapInstance.value = markRaw(map);

  // Clique fora dos ícones -> limpa a seleção.
  // Registrado antes dos awaits para garantir que sempre exista.
  map.on("click", (event) => {
    if (!map.getLayer(unclusteredLayerId)) return;
    const hits = map.queryRenderedFeatures(event.point, {
      layers: [unclusteredLayerId],
    });
    if (!hits.length) clearSelection();
  });

  await setupLayers(map);
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
  () => geoJsonData.value.features.length,
  () => {
    clearSelection();
    fitMapToFeatures();
  }
);

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
      class="collection-images-map__state"
      role="status"
    >
      Carregando mapa...
    </div>

    <template v-else>
      <MapLibreMap
        class="collection-images-map__canvas"
        :style-url="styleUrl"
        :center="mapCenter"
        :zoom="mapZoom"
        @map-ready="handleMapReady"
        @map-error="handleMapError"
      />

      <p
        v-if="!hasLocatedImages"
        class="collection-images-map__empty"
      >
        Nenhuma imagem com localização nesta coleção.
      </p>

      <div v-if="selectedId" class="collection-images-map__hint">
        <span class="collection-images-map__hint-icon" aria-hidden="true">
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
        <span class="collection-images-map__hint-text">Clique fora para voltar</span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.collection-images-map {
  position: relative;
  width: 100%;
  min-height: 480px;
  height: 100%;
  border-radius: 5px;
  overflow: hidden;
  border: 0.25px solid var(--Cinza_C, #a6a6a6);
  background: var(--Off_white, #faf9f9);
}

.collection-images-map__canvas {
  width: 100%;
  height: 100%;
  min-height: 480px;
}

.collection-images-map__state,
.collection-images-map__empty {
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

.collection-images-map__hint {
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

.collection-images-map__hint-icon {
  display: inline-flex;
  width: 12.958px;
  height: 12.958px;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.collection-images-map__hint-text {
  color: var(--Branco, #fff);
  font-family: "DM Sans";
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 115%;
}
</style>

<style>
.collection-map-popup-container.maplibregl-popup {
  z-index: 5;
  pointer-events: none;
}

.collection-map-popup-container .maplibregl-popup-content {
  padding: 0;
  background: transparent;
  box-shadow: none;
}

.collection-map-popup-container .maplibregl-popup-tip {
  display: none;
}

.collection-map-popup {
  display: flex;
  align-items: center;
  justify-content: center;
}

.collection-map-popup__thumb {
  width: 92px;
  height: 92px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--Preto, #1f1f1f);
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
}

.collection-map-popup__thumb img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
