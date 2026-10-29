<script setup>
import { ref } from "vue";
import LocationsMap from "@/components/map/LocationsMap.vue";

defineOptions({ name: "CollectionImagesMap" });

defineProps({
  images: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  initialSelectedId: { type: String, default: null },
  route: { type: Object, default: null },
  stops: { type: Array, default: () => [] },
  activeStopNumber: { type: Number, default: null },
});

defineEmits(["select", "stop-select"]);

const mapRef = ref(null);

defineExpose({
  resetToInitial: () => mapRef.value?.resetToInitial?.(),
  selectImage: (id, options) => mapRef.value?.selectImage?.(id, options) ?? false,
  clearSelection: () => mapRef.value?.clearSelection?.(),
  focusCoordinates: (coordinates, options) =>
    mapRef.value?.focusCoordinates?.(coordinates, options),
});
</script>

<template>
  <div class="collection-images-map">
    <LocationsMap
      ref="mapRef"
      class="collection-images-map__inner"
      context="collection"
      :images="images"
      :is-loading="isLoading"
      :initial-selected-id="initialSelectedId"
      :route="route"
      :stops="stops"
      :active-stop-number="activeStopNumber"
      @select="$emit('select', $event)"
      @stop-select="$emit('stop-select', $event)"
    />
  </div>
</template>

<style scoped>
.collection-images-map {
  width: 100%;
  height: 100%;
  min-height: inherit;
}

.collection-images-map__inner {
  width: 100%;
  height: 100%;
  min-height: inherit;
}
</style>
