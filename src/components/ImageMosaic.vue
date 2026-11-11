<script setup>
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import MasonryWall from "@yeger/vue-masonry-wall";
import MosaicCard from "@/components/MosaicCard.vue";
import MosaicSkeleton from "@/components/MosaicSkeleton.vue";

const props = defineProps({
  items: { type: Array, default: () => [] },
  columnWidth: {
    type: [Number, Array],
    default: () => [320, 200, 280, 260, 210, 220, 300],
  },
  gap: { type: Number, default: 5 },
  minColumns: { type: Number, default: 2 },
  maxColumns: { type: Number, default: 7 },
  loading: { type: Boolean, default: false },
  loadingMore: { type: Boolean, default: false },
  masonry: { type: Boolean, default: true },
  skeleton: { type: Boolean, default: true },
  revealOnRedraw: { type: Boolean, default: true },
});

const emit = defineEmits(["redraw"]);
const containerRef = ref(null);
const renderedItems = shallowRef(props.items);
const preservedHeight = ref(null);
const isReady = ref(false);
const isRebuilding = ref(props.masonry && props.items.length > 0);
let releaseFrame = null;

const showSkeleton = computed(() => props.masonry && props.skeleton && (
  props.loading || (props.revealOnRedraw && renderedItems.value.length > 0 && !isReady.value)
));
const skeletonColumnWidths = computed(() => Array.isArray(props.columnWidth)
  ? props.columnWidth
  : [props.columnWidth]);

watch([() => props.items, () => props.masonry], async ([items, masonry], _previous, onCleanup) => {
  let cancelled = false;
  onCleanup(() => { cancelled = true; });
  cancelAnimationFrame(releaseFrame);

  const previousItems = renderedItems.value;
  const nextIds = new Set(items.map((item) => item.id));
  const isContinuation = previousItems.length > 0 && previousItems.every((item) => nextIds.has(item.id));
  isRebuilding.value = masonry && items.length > 0;

  if (masonry && isContinuation && containerRef.value) {
    // A biblioteca esvazia todas as colunas. Aplica a reserva de altura
    // antes de entregar a nova lista para impedir o colapso da página.
    preservedHeight.value = Math.max(
      preservedHeight.value ?? 0,
      containerRef.value.getBoundingClientRect().height
    );
    await nextTick();
    if (cancelled) return;
  } else {
    preservedHeight.value = null;
    isReady.value = false;
  }

  renderedItems.value = items;
});

const handleRedraw = () => {
  cancelAnimationFrame(releaseFrame);
  releaseFrame = requestAnimationFrame(() => {
    preservedHeight.value = null;
    isRebuilding.value = false;
    isReady.value = renderedItems.value.length > 0;
    emit("redraw");
  });
};

onBeforeUnmount(() => cancelAnimationFrame(releaseFrame));

// Permite que a página aguarde o recálculo antes de buscar outra leva.
defineExpose({ isRebuilding });
</script>

<template>
  <div ref="containerRef" class="image-mosaic"
    :style="preservedHeight === null ? undefined : { minHeight: `${preservedHeight}px` }">
    <slot name="header" />

    <MosaicSkeleton v-if="showSkeleton" :gap="gap" :column-widths="skeletonColumnWidths"
      :min-columns="minColumns" :max-columns="maxColumns" />

    <MasonryWall v-if="masonry" v-show="renderedItems.length > 0" :items="renderedItems"
      :column-width="columnWidth" :gap="gap" :min-columns="minColumns" :max-columns="maxColumns"
      class="image-mosaic__wall" :class="{ 'image-mosaic__wall--ready': isReady || !revealOnRedraw }"
      @redraw="handleRedraw" @redraw-skip="handleRedraw">
      <template #default="slotProps">
        <slot v-bind="slotProps">
          <MosaicCard v-if="slotProps.item" :id="slotProps.item.id" :title="slotProps.item.title" :image-url="slotProps.item.src"
            :aspect-ratio="slotProps.item.aspectRatio" />
        </slot>
      </template>
    </MasonryWall>
    <slot v-else name="grid" :items="renderedItems" />

    <slot name="after" />

    <div class="image-mosaic__loading">
      <div v-if="loadingMore || isRebuilding" class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Carregando...</span>
      </div>
    </div>

    <slot name="empty" v-if="!loading && renderedItems.length === 0" />
  </div>
</template>

<style scoped>
.image-mosaic {
  width: 100%;
  min-width: 0;
  /* Os cards recriados não devem servir de âncoras de rolagem. */
  overflow-anchor: none;
}

.image-mosaic__wall {
  width: 100%;
  min-width: 0;
  opacity: 0;
  transition: opacity 0.15s ease-in;
}

.image-mosaic__wall--ready {
  opacity: 1;
}

.image-mosaic__loading {
  /* O indicador pode aparecer e desaparecer sem mudar a altura da página. */
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 5.25rem;
  padding: 1.5rem 0;
}
</style>
