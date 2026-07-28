<template>
  <div class="maplibre-map">
    <div ref="mapContainer" class="maplibre-map__canvas"></div>
    <slot />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, shallowRef, watch } from "vue";
import { Map, Marker } from "maplibre-gl";

const props = defineProps({
  styleUrl: {
    type: String,
    required: true,
  },
  center: {
    type: Array,
    default: () => [0, 0],
    validator: (value) =>
      Array.isArray(value) &&
      value.length === 2 &&
      value.every((coordinate) => typeof coordinate === "number"),
  },
  zoom: {
    type: Number,
    default: 0,
  },
  mapOptions: {
    type: Object,
    default: () => ({}),
  },
  clickable: {
    type: Boolean,
    default: false,
  },
  markerColor: {
    type: String,
    default: "#2F2F2F",
  },
  // Ícone do marker: "camera" (imagens, padrão) ou "building" (obras).
  markerVariant: {
    type: String,
    default: "camera",
  },
  markerPosition: {
    type: Object,
    default: null,
    validator: (value) =>
      value === null ||
      (typeof value === "object" &&
        typeof value.lng === "number" &&
        typeof value.lat === "number"),
  },
});

const emit = defineEmits(["map-ready", "map-load", "map-error", "click"]);

const mapContainer = shallowRef(null);
const mapInstance = shallowRef(null);
const markerInstance = shallowRef(null);

// Mesmo ícone circular de câmera usado no LocationsMap.
const cameraIconSvg = (fill) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="28" height="28" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="${fill}"/><g transform="translate(8 8) scale(0.75) translate(-8 -8)"><path fill="#FFFFFF" d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/><path fill="#FFFFFF" d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4Zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1m9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0"/></g></svg>`;

const buildingIconSvg = (fill) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="28" height="28" aria-hidden="true"><circle cx="32" cy="32" r="32" fill="${fill}"/><path fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" d="M18 45 V31.5 L28 19.5 L46.5 28.5 V45 H18 Z"/><line x1="28" y1="19.5" x2="28" y2="45" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/><g fill="#FFFFFF"><rect x="21" y="33" width="3.4" height="3.4" rx="0.35"/><rect x="21" y="38.2" width="3.4" height="3.4" rx="0.35"/><rect x="31" y="24.8" width="3.2" height="3.2" rx="0.3"/><rect x="35.6" y="24.8" width="3.2" height="3.2" rx="0.3"/><rect x="40.2" y="24.8" width="3.2" height="3.2" rx="0.3"/><rect x="31" y="29" width="3.2" height="3.2" rx="0.3"/><rect x="35.6" y="29" width="3.2" height="3.2" rx="0.3"/><rect x="40.2" y="29" width="3.2" height="3.2" rx="0.3"/><rect x="31" y="33.2" width="3.2" height="3.2" rx="0.3"/><rect x="35.6" y="33.2" width="3.2" height="3.2" rx="0.3"/><rect x="40.2" y="33.2" width="3.2" height="3.2" rx="0.3"/><rect x="31" y="37.4" width="3.2" height="3.2" rx="0.3"/><rect x="35.6" y="37.4" width="3.2" height="3.2" rx="0.3"/><rect x="40.2" y="37.4" width="3.2" height="3.2" rx="0.3"/><rect x="31" y="41.6" width="3.2" height="3.2" rx="0.3"/><rect x="35.6" y="41.6" width="3.2" height="3.2" rx="0.3"/><rect x="40.2" y="41.6" width="3.2" height="3.2" rx="0.3"/></g></svg>`;

const createMarkerElement = (color) => {
  const element = document.createElement("div");
  element.className = "maplibre-map__camera-marker";
  const iconSvg = props.markerVariant === "building" ? buildingIconSvg : cameraIconSvg;
  element.innerHTML = iconSvg(color);
  return element;
};

const updateMarker = (lngLat) => {
  const map = mapInstance.value;
  if (!map) return;

  if (markerInstance.value) {
    markerInstance.value.remove();
    markerInstance.value = null;
  }

  if (lngLat) {
    const marker = new Marker({
      element: createMarkerElement(props.markerColor),
      anchor: "center",
    })
      .setLngLat([lngLat.lng, lngLat.lat])
      .addTo(map);
    markerInstance.value = marker;
  }
};

const handleMapClick = (event) => {
  if (!props.clickable) return;

  const { lng, lat } = event.lngLat;
  updateMarker({ lng, lat });
  emit("click", { lng, lat });
};

const instantiateMap = () => {
  if (!mapContainer.value) return;

  const baseOptions = {
    container: mapContainer.value,
    style: props.styleUrl,
    ...props.mapOptions,
  };

  if (!("center" in baseOptions)) {
    baseOptions.center = props.center;
  }

  if (!("zoom" in baseOptions)) {
    baseOptions.zoom = props.zoom;
  }

  const map = new Map(baseOptions);

  map.on("load", () => {
    if (props.markerPosition) {
      updateMarker(props.markerPosition);
    }
    emit("map-ready", map);
    emit("map-load", map);
  });

  map.on("error", (event) => {
    emit("map-error", event?.error ?? event);
  });

  map.on("click", handleMapClick);

  mapInstance.value = map;
};

watch(
  () => props.center,
  (nextCenter) => {
    const map = mapInstance.value;
    if (!map || !Array.isArray(nextCenter) || nextCenter.length < 2) return;
    map.setCenter(nextCenter);
  },
  { deep: true }
);

watch(
  () => props.zoom,
  (nextZoom) => {
    const map = mapInstance.value;
    if (!map || typeof nextZoom !== "number") return;
    map.setZoom(nextZoom);
  }
);

watch(
  () => props.markerPosition,
  (position) => {
    updateMarker(position);
  },
  { deep: true }
);

watch(
  () => props.markerColor,
  () => {
    if (props.markerPosition) {
      updateMarker(props.markerPosition);
    }
  }
);

onMounted(() => {
  instantiateMap();
});

onUnmounted(() => {
  if (markerInstance.value) {
    markerInstance.value.remove();
    markerInstance.value = null;
  }

  const map = mapInstance.value;
  if (!map) return;
  map.remove?.();
  mapInstance.value = null;
});
</script>

<style>
@import "maplibre-gl/dist/maplibre-gl.css";

.maplibre-map {
  position: relative;
  width: 100%;
  height: 100%;
}

.maplibre-map__canvas {
  position: absolute;
  inset: 0;
}

.maplibre-map__camera-marker {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  pointer-events: auto;
  cursor: pointer;
}

.maplibre-map__camera-marker svg {
  display: block;
  width: 28px;
  height: 28px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35));
}
</style>
