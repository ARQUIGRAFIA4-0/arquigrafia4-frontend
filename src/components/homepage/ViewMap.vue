<template>
  <div class="map-wrap">
    <MapLibreMap
      :style-url="styleUrl"
      :center="[initialState.lng, initialState.lat]"
      :zoom="initialState.zoom"
      @map-ready="handleMapReady"
      @map-error="handleMapError"
    />
  </div>
</template>

<script setup>
import { onUnmounted, markRaw, shallowRef, watch } from "vue";
import { useRouteQuery } from "@vueuse/router";

import MapLibreMap from "@/components/map/MapLibreMap.vue";
import { useIconLayer } from "@/composables/useIconLayer.js";
import { api } from "@/services/api.js";
import escapeHtml from "@/helpers/escapeHtml";

const mapInstance = shallowRef(null);

const mapSettingsQuery = useRouteQuery("map-settings", "2d");

const MAP_PITCH_2D = 0;
const MAP_PITCH_3D = 60;

const initialState = {
  lng: -51.9253,
  lat: -14.235,
  zoom: 3,
};

const PLACEHOLDER_IMAGE_URL = "https://placehold.co/320x180?text=Imagem";

const createPopupCardContent = ({ imageUrl, title, imageId }) => {
  const resolvedImageUrl = (() => {
    if (typeof imageUrl === "string") {
      const trimmed = imageUrl.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
    return PLACEHOLDER_IMAGE_URL;
  })();

  const safeTitle = title ? escapeHtml(title) : "Imagem ARQUIGRAFIA";
  const titleContent = imageId
    ? `<a class="popup-card__title-link" href="/explore/dados/image/${escapeHtml(imageId)}">${safeTitle}</a>`
    : safeTitle;

  return `<article class="popup-card"><div class="popup-card__media"><img src="${escapeHtml(
    resolvedImageUrl
  )}" alt="" loading="lazy" /></div><div class="popup-card__content"><header class="popup-card__header"><h3 class="popup-card__title">${titleContent}</h3></header></div></article>`;
};

const styleUrl = "https://tiles.openfreemap.org/styles/bright";

const cameraIconId = "camera-fill-icon";

const obraSourceId = "arquigrafia-obras";
const obraClusterColor = "#D27D30";

const imagemSourceId = "arquigrafia-imagens";
const imagemClusterColor = "#1D70B8";

const cameraIconSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8" fill="#D27D30" /><g transform="translate(8 8) scale(0.75) translate(-8 -8)"><path fill="#FFFFFF" d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0" /><path fill="#FFFFFF" d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4Zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1m9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0" /></g></svg>';

const obraData = shallowRef({ type: "FeatureCollection", features: [] });
const imagemData = shallowRef({ type: "FeatureCollection", features: [] });

const loadMockImages = async () => {
  try {
    const collections = await api.getGeoJSON();

    obraData.value = collections.obra;
    imagemData.value = collections.imagem;
  } catch (error) {
    console.error("Erro ao carregar imagens mockadas", error);
  }
};

const applyMapTilt = (mode) => {
  const map = mapInstance.value;
  if (!map) return;

  const pitch = mode === "3d" ? MAP_PITCH_3D : MAP_PITCH_2D;
  map.easeTo({ pitch, duration: 500 });
};

watch(mapSettingsQuery, (mode) => {
  applyMapTilt(mode);
});

const { setupLayer: setupObraLayer, teardownLayer: teardownObraLayer } =
  useIconLayer({
    mapRef: mapInstance,
    sourceId: obraSourceId,
    iconId: cameraIconId,
    iconSvg: cameraIconSvg,
    baseColor: obraClusterColor,
    data: obraData,
    getPopupContent: (feature) => {
      const imageUrl = feature.properties?.imageUrl ?? null;
      const title = feature.properties?.title ?? "Imagem";

      return createPopupCardContent({ imageUrl, title });
    },
  });

const { setupLayer: setupImagemLayer, teardownLayer: teardownImagemLayer } =
  useIconLayer({
    mapRef: mapInstance,
    sourceId: imagemSourceId,
    iconId: cameraIconId,
    iconSvg: cameraIconSvg,
    baseColor: imagemClusterColor,
    data: imagemData,
    getPopupContent: (feature) => {
      const imageUrl = feature.properties?.imageUrl ?? null;
      const title = feature.properties?.title ?? "Imagem";
      const imageId = feature.properties?.image_id ?? null;

      return createPopupCardContent({ imageUrl, title, imageId });
    },
  });

let hasLoadedMockData = false;

const handleMapLoad = () => {
  setupObraLayer();
  setupImagemLayer();

  if (!hasLoadedMockData) {
    loadMockImages();
    hasLoadedMockData = true;
  }

  applyMapTilt(mapSettingsQuery.value);
};

const setMapLanguagePt = (map) => {
  const style = map.getStyle();
  if (!style?.layers) return;

  style.layers.forEach((layer) => {
    if (layer.type !== "symbol") return;
    const textField = map.getLayoutProperty(layer.id, "text-field");
    if (!textField) return;

    map.setLayoutProperty(layer.id, "text-field", [
      "coalesce",
      ["get", "name:pt"],
      ["get", "name:latin"],
      ["get", "name"],
    ]);
  });
};

const handleMapReady = (map) => {
  mapInstance.value = markRaw(map);
  handleMapLoad();
  setMapLanguagePt(map);
};

const handleMapError = (error) => {
  console.error("Erro no MapLibre", error);
};

onUnmounted(() => {
  const map = mapInstance.value;
  if (!map) return;

  teardownObraLayer();
  teardownImagemLayer();
  mapInstance.value = null;
});
</script>

<style>
.map-wrap {
  position: relative;
  width: 100%;
  height: calc(100vh - 70px - 75px);
}

.maplibregl-popup {
  font-family: "DM Sans", sans-serif;
  margin-left: -13px;
}

.maplibregl-popup-content {
  padding: 0;
  background: transparent;
  box-shadow: none;
  border-radius: 5px;
  margin-bottom: 18px;
}

.maplibregl-popup-close-button {
  display: none;
}

.maplibregl-popup-tip {
  /*   border-top-color: var(--Laranja_C) !important; */
  display: none;
}

.popup-card {
  display: flex;
  flex-direction: column;
  background-color: var(--Laranja_C);
  border-radius: 5px;
  overflow: hidden;
  box-shadow: var(--shadow-elevation-medium);
  color: var(--Cinza_E);
  min-width: 240px;
  max-width: min(320px, 80vw);
}

.popup-card__media {
  position: relative;
  overflow: hidden;
}

.popup-card__media img {
  display: block;
  width: 100%;
  height: auto;
  object-fit: cover;
}

.popup-card__content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
}

.popup-card__header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.popup-card__title {
  margin: 0;
  font-size: var(--h3-fs);
  font-weight: var(--h3-fw);
  line-height: var(--h3-lh);
}

.popup-card__title-link {
  color: var(--Cinza_E);
  text-decoration: none;
  font-size: inherit;
  font-weight: inherit;
  line-height: inherit;
}

.popup-card__title-link:hover {
  text-decoration: underline;
}

.popup-card__subtitle {
  margin: 0;
  font-size: var(--p-fs);
  font-weight: var(--p-fw);
  line-height: var(--p-lh);
}

.popup-card__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.popup-card__body p {
  margin: 0;
}
</style>
