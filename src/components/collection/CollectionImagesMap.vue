<script setup>
import { computed, markRaw, onUnmounted, shallowRef, watch } from "vue";
import { LngLatBounds, Popup } from "maplibre-gl";

import MapLibreMap from "@/components/map/MapLibreMap.vue";
import { useIconLayer } from "@/composables/useIconLayer.js";
import { createCollectionImagesFeatureCollection } from "@/helpers/geojson.js";
import escapeHtml from "@/helpers/escapeHtml";

defineOptions({ name: "CollectionImagesMap" });

const props = defineProps({
  images: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
});

const emit = defineEmits(["select"]);

const mapInstance = shallowRef(null);
let activePopup = null;

const styleUrl = "https://tiles.openfreemap.org/styles/positron";
const sourceId = "collection-images";
const iconId = "collection-camera-icon";
const unclusteredLayerId = `${sourceId}-unclustered`;

const selectedSourceId = "collection-images-selected";
const selectedLayerId = "collection-images-selected-layer";
const selectedIconId = "collection-camera-icon-active";

const baseColor = "#2F2F2F";
const selectedColor = "#D27D30"; // Laranja_M

const DEFAULT_CENTER = [-46.6333, -23.5505]; // São Paulo
const DEFAULT_ZOOM = 3;
const EMPTY_FC = { type: "FeatureCollection", features: [] };

// SVG do ícone (preto = normal, laranja = selecionado)
const cameraIconSvg = (fill) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8" fill="${fill}"/><g transform="translate(8 8) scale(0.75) translate(-8 -8)"><path fill="#FFFFFF" d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/><path fill="#FFFFFF" d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4Zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1m9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0"/></g></svg>`;

const geoJsonData = computed(() =>
  createCollectionImagesFeatureCollection(props.images)
);
const hasLocatedImages = computed(() => geoJsonData.value.features.length > 0);

// Define o centro do mapa com base na primeira imagem localizada.
const mapCenter = computed(() => {
  const first = geoJsonData.value.features[0];
  return first?.geometry?.coordinates ?? DEFAULT_CENTER;
});

/**
 * Define o zoom do mapa com base no número de imagens.
 * Se houver apenas uma imagem, define o zoom para 14.
 * Caso contrário, define o zoom para o valor padrão.
 */
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

// Atualiza o layer de seleção com o featureCollection fornecido.
const setSelectedFeature = (featureCollection) => {
  const source = mapInstance.value?.getSource(selectedSourceId);
  if (source?.setData) source.setData(featureCollection);
};

// Manipulador de evento para quando o usuário clica em um ponto no mapa.
const handlePointClick = (event) => {
  const feature = event.features?.[0];
  if (!feature) return;

  setSelectedFeature({
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: feature.geometry,
        properties: feature.properties,
      },
    ],
  });

  emit("select", feature.properties?.id ?? null);

};

// Limpa a seleção e emite o evento de seleção.
const clearSelection = () => {
  setSelectedFeature(EMPTY_FC);
  emit("select", null);

};

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

// Configura o layer de ícones no mapa.
const { setupLayer, teardownLayer } = useIconLayer({
  mapRef: mapInstance,
  sourceId,
  iconId,
  iconSvg: cameraIconSvg(baseColor),
  baseColor,
  data: geoJsonData,
  onUnclusteredPointMouseEnter: showPopupForFeature, // Mostra o popup para o feature.
  onUnclusteredPointMouseLeave: closeActivePopup, // Fecha o popup ativo.
  onUnclusteredPointClick: handlePointClick, // Manipulador de evento para quando o usuário clica em um ponto no mapa.
});

// Configura o layer de seleção no mapa. (ícone laranja)
const setupSelectedLayer = async (map) => {
  await registerIcon(map, selectedIconId, cameraIconSvg(selectedColor));

  if (!map.getSource(selectedSourceId)) {
    map.addSource(selectedSourceId, { type: "geojson", data: EMPTY_FC });
  }

  if (!map.getLayer(selectedLayerId)) {
    map.addLayer({
      id: selectedLayerId,
      type: "symbol",
      source: selectedSourceId,
      layout: {
        "icon-image": selectedIconId,
        "icon-size": 0.95,
        "icon-allow-overlap": true,
      },
    });
  }

};

// Manipulador de evento para quando o mapa estiver pronto.
const handleMapReady = async (map) => {
  mapInstance.value = markRaw(map);
  await setupLayer();
  await setupSelectedLayer(map);
  fitMapToFeatures();

  // Clique fora dos ícones → limpa a seleção
  map.on("click", (event) => {
    const hits = map.queryRenderedFeatures(event.point, {
      layers: [unclusteredLayerId],
    });
    
    if (!hits.length) clearSelection();

  });

};

// Manipulador de evento para quando ocorrer um erro no mapa.
const handleMapError = (error) => {
  console.error("Erro no mapa da coleção:", error);
};

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
  teardownLayer();

  // O MapLibreMap (filho) desmonta antes e já chama map.remove(),
  // destruindo o style. Só mexemos nas camadas se o style ainda existir.
  if (map && map.style) {
    if (map.getLayer(selectedLayerId)) map.removeLayer(selectedLayerId);
    if (map.getSource(selectedSourceId)) map.removeSource(selectedSourceId);
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
