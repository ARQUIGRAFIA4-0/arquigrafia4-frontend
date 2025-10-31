<template>
  <div class="maplibre-map">
    <div ref="mapContainer" class="maplibre-map__canvas"></div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, shallowRef, watch } from "vue";
import { Map } from "maplibre-gl";

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
});

const emit = defineEmits(["map-ready", "map-load", "map-error"]);

const mapContainer = shallowRef(null);
const mapInstance = shallowRef(null);

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
    emit("map-ready", map);
    emit("map-load", map);
  });

  map.on("error", (event) => {
    emit("map-error", event?.error ?? event);
  });

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

onMounted(() => {
  instantiateMap();
});

onUnmounted(() => {
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
</style>
