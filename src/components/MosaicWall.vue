<template>
  <div class="mosaic-wall" ref="containerRef">
    <div
      v-for="(group, groupIndex) in imageGroups"
      :key="`group-${groupIndex}`"
      class="mosaic-wall__cluster"
    >
      <div class="cluster-grid">
        <div
          v-for="(image, imageIndex) in group"
          :key="
            image
              ? (image.id ?? image.src ?? `${groupIndex}-${imageIndex}`)
              : `${groupIndex}-${imageIndex}`
          "
          :class="[
            'cluster-grid__item',
            areaClasses[imageIndex] ?? 'cluster-grid__item--fallback',
          ]"
        >
          <slot name="item" :image="image">
            <mosaic-card
              v-if="image"
              :id="image.id"
              :title="image.title"
              :image-url="image.src"
              :aspect-ratio="image.aspectRatio"
            />
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import MosaicCard from "@/components/MosaicCard.vue";

const emit = defineEmits(["reach-end"]);

const props = defineProps({
  images: {
    type: Array,
    default: () => [],
  },
});

const areaClasses = [
  "cluster-grid__item--1",
  "cluster-grid__item--2",
  "cluster-grid__item--3",
  "cluster-grid__item--4",
  "cluster-grid__item--5",
];

const imageGroups = computed(() => {
  const items = Array.isArray(props.images) ? props.images : [];
  const chunkSize = 5;
  const groups = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    groups.push(items.slice(index, index + chunkSize));
  }

  return groups;
});

const containerRef = ref(null);
const SCROLL_THRESHOLD = 320;
const LINE_SCROLL_DISTANCE = 40;

const handleScroll = () => {
  const element = containerRef.value;

  if (!element) {
    return;
  }

  const maxScrollLeft = element.scrollWidth - element.clientWidth;

  if (maxScrollLeft <= 100) {
    return;
  }

  if (element.scrollLeft >= maxScrollLeft - SCROLL_THRESHOLD) {
    emit("reach-end");
  }
};

const handleWheel = (event) => {
  const element = containerRef.value;

  if (!element) {
    return;
  }

  if (element.scrollWidth <= element.clientWidth) {
    return;
  }

  const isVerticalScrollDominant =
    Math.abs(event.deltaY) > Math.abs(event.deltaX);

  if (!isVerticalScrollDominant || event.deltaY === 0) {
    return;
  }

  const deltaY =
    event.deltaMode === WheelEvent.DOM_DELTA_LINE
      ? event.deltaY * LINE_SCROLL_DISTANCE
      : event.deltaY;

  event.preventDefault();
  element.scrollLeft += deltaY;
};

onMounted(() => {
  const element = containerRef.value;

  if (!element) {
    return;
  }

  element.addEventListener("scroll", handleScroll, { passive: true });
  element.addEventListener("wheel", handleWheel, { passive: false });
});

onBeforeUnmount(() => {
  const element = containerRef.value;

  if (!element) {
    return;
  }

  element.removeEventListener("scroll", handleScroll);
  element.removeEventListener("wheel", handleWheel);
});
</script>

<style scoped>
.mosaic-wall {
  display: grid;
  grid-template-rows: repeat(2, minmax(0, 1fr));
  grid-auto-flow: column;
  grid-auto-columns: 500px;
  gap: 8px;
  overflow-x: auto;
  overflow-y: hidden;
  align-items: stretch;
  height: calc(100vh - 73px - 56px - 32px);
}

.mosaic-wall__cluster {
  display: flex;
  grid-row: span 1;
  min-width: 0;
  height: 100%;
}

.cluster-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: 0.2727fr 0.1212fr 0.6061fr;
  grid-column-gap: 8px;
  grid-row-gap: 8px;
  width: 100%;
  min-height: 100%;
  height: 100%;
  min-width: 0;
}

.cluster-grid__item {
  min-width: 0;
  min-height: 0;
  display: flex;
  overflow: hidden;
}

.cluster-grid__item--fallback {
  display: none;
}

.cluster-grid__item--1 {
  grid-area: 2 / 1 / 4 / 2;
}

.cluster-grid__item--2 {
  grid-area: 1 / 1 / 2 / 2;
}

.cluster-grid__item--3 {
  grid-area: 1 / 2 / 3 / 3;
}

.cluster-grid__item--4 {
  grid-area: 1 / 3 / 3 / 4;
}

.cluster-grid__item--5 {
  grid-area: 3 / 2 / 4 / 4;
}

.cluster-grid__item :deep(.mosaic-card) {
  flex: 1;
  display: flex;
}

.cluster-grid__item :deep(.image-container) {
  flex: 1;
  width: 100%;
  height: 100%;
  aspect-ratio: auto;
}

.cluster-grid__item :deep(.card-img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
