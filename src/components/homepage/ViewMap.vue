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

const createPopupCardContent = ({ imageUrl, title }) => {
  const resolvedImageUrl = (() => {
    if (typeof imageUrl === "string") {
      const trimmed = imageUrl.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
    return PLACEHOLDER_IMAGE_URL;
  })();

  const safeTitle = title ? escapeHtml(title) : "Imagem Arquigrafia";

  return `<article class="popup-card"><div class="popup-card__media"><img src="${escapeHtml(
    resolvedImageUrl
  )}" alt="" loading="lazy" /></div><div class="popup-card__content"><header class="popup-card__header"><h3 class="popup-card__title">${safeTitle}</h3></header></div></article>`;
};

const styleUrl = "https://tiles.openfreemap.org/styles/positron";

const cameraIconId = "camera-fill-icon";
const imagemIconId = "paris-sight-icon";

const obraSourceId = "arquigrafia-obras";
const obraClusterColor = "#D27D30";

const imagemSourceId = "arquigrafia-imagens";
const imagemClusterColor = "#1D70B8";

const cameraIconSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8" fill="#D27D30" /><g transform="translate(8 8) scale(0.75) translate(-8 -8)"><path fill="#FFFFFF" d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0" /><path fill="#FFFFFF" d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4Zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1m9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0" /></g></svg>';

const imagemIconSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 28 28"><circle cx="14" cy="14" r="14" fill="#1D70B8" /><g transform="translate(14 14) scale(1) translate(-8 -8)"><path fill="#FFFFFF" d="M14.763.075A.5.5 0 0 1 15 .5v15a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5V14h-1v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V10a.5.5 0 0 1 .342-.474L6 7.64V4.5a.5.5 0 0 1 .276-.447l8-4a.5.5 0 0 1 .487.022M6 8.694 1 10.36V15h5zM7 15h2v-1.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5V15h2V1.309l-7 3.5z" /><path fill="#FFFFFF" d="M2 11h1v1H2zm2 0h1v1H4zm-2 2h1v1H2zm2 0h1v1H4zm4-4h1v1H8zm2 0h1v1h-1zm-2 2h1v1H8zm2 0h1v1h-1zm2-2h1v1h-1zm0 2h1v1h-1zM8 7h1v1H8zm2 0h1v1h-1zm2 0h1v1h-1zM8 5h1v1H8zm2 0h1v1h-1zm2 0h1v1h-1zm0-2h1v1h-1z" /></g></svg>';

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
    iconId: imagemIconId,
    iconSvg: imagemIconSvg,
    baseColor: imagemClusterColor,
    data: imagemData,
    getPopupContent: (feature) => {
      const imageUrl = feature.properties?.imageUrl ?? null;
      const title = feature.properties?.title ?? "Imagem";

      return createPopupCardContent({ imageUrl, title });
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

const handleMapReady = (map) => {
  mapInstance.value = markRaw(map);
  handleMapLoad();
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
  font-family: inherit;
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
  font-size: var(--h5-fs);
  font-weight: var(--h5-fw);
  line-height: var(--h5-lh);
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
