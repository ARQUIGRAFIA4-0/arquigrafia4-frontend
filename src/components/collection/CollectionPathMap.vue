<script setup>
import { ref } from "vue";
import PathMap from "@/components/map/PathMap.vue";

defineOptions({ name: "CollectionPathMap" });

defineProps({
  images: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  isSaving: { type: Boolean, default: false },
  initialStops: { type: Array, default: () => [] },
  initialRoute: { type: Object, default: null },
});

defineEmits(["stop-change", "save", "back"]);

const mapRef = ref(null);
</script>

<template>
  <div class="collection-path-map">
    <PathMap
      ref="mapRef"
      class="collection-path-map__inner"
      :images="images"
      :is-loading="isLoading"
      :is-saving="isSaving"
      :initial-stops="initialStops"
      :initial-route="initialRoute"
      @stop-change="$emit('stop-change', $event)"
      @save="$emit('save', $event)"
      @back="$emit('back')"
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
