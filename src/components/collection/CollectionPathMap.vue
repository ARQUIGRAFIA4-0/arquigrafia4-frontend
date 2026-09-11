<script setup>
import { ref } from "vue";
import PathMap from "@/components/map/PathMap.vue";

defineOptions({ name: "CollectionPathMap" });

defineProps({
  images: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
});

defineEmits(["stop-change"]);

const mapRef = ref(null);
</script>

<template>
  <div class="collection-path-map">
    <PathMap
      ref="mapRef"
      class="collection-path-map__inner"
      :images="images"
      :is-loading="isLoading"
      @stop-change="$emit('stop-change', $event)"
    />
  </div>
</template>

<style scoped>
.collection-path-map {
  width: 100%;
  height: 100%;
  min-height: inherit;
}

.collection-path-map__inner {
  width: 100%;
  height: 100%;
  min-height: inherit;
}
</style>
