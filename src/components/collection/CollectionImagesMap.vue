<script setup>
import { ref } from "vue";
import LocationsMap from "@/components/map/LocationsMap.vue";

defineOptions({ name: "CollectionImagesMap" });

defineProps({
  images: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  initialSelectedId: { type: String, default: null },
});

defineEmits(["select"]);

const mapRef = ref(null);

defineExpose({
  resetToInitial: () => mapRef.value?.resetToInitial?.(),
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
      @select="$emit('select', $event)"
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
