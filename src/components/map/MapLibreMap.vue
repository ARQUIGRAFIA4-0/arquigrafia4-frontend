<template>
  <div class="maplibre-map">
    <div ref="mapContainer" class="maplibre-map__canvas"></div>
    <slot />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, shallowRef, watch } from "vue";
import { Map, Marker } from "maplibre-gl";
import { cameraIconSvg, workIconSvg } from "@/helpers/mapIcons";

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

const createMarkerElement = (color) => {
  const element = document.createElement("div");
  element.className = "maplibre-map__camera-marker";
  const iconSvg = props.markerVariant === "building" ? workIconSvg : cameraIconSvg;
  element.innerHTML = iconSvg(color, { size: 28 });
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
