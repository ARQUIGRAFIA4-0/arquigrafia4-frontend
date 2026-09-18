<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import MosaicCard from "@/components/MosaicCard.vue";
import MosaicSkeleton from "@/components/MosaicSkeleton.vue";

defineOptions({ name: "CollectionImagesMosaic" });

const props = defineProps({
  images: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  isFetchingNextPage: { type: Boolean, default: false },
  hasNextPage: { type: Boolean, default: false },
  isInfoActive: { type: Boolean, default: false },
});

const emit = defineEmits(["load-more"]);

const columnWidths = [320, 200, 280, 260, 210, 220, 300];
const isProcessing = ref(false);
const mosaicItems = ref([]);
const processedIds = new Set();
const isMasonryReady = ref(false);

const preloadImageDimensions = (url) =>
  new Promise((resolve) => {
    const img = new Image();

    const cleanup = () => {
      img.onload = null;
      img.onerror = null;
    };

    img.onload = () => {
      cleanup();
      resolve({
        width: img.naturalWidth || 1,
        height: img.naturalHeight || 1,
      });
    };

    img.onerror = () => {
      cleanup();
      resolve({ width: 1, height: 1 });
    };

    img.decoding = "async";
    img.src = url;

    if (img.complete && img.naturalWidth) {
      cleanup();
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    }

  });

const processItems = async (sourceItems) => {
  const pendingItems = (sourceItems ?? []).filter(
    (item) => !processedIds.has(item.id)
  );
  if (pendingItems.length === 0) return;

  isProcessing.value = true;
  try {
    const resolvedItems = await Promise.all(
      pendingItems.map(async (item) => {
        try {
          const dimensions = await preloadImageDimensions(item.imageUrl);
          const width = dimensions?.width || 1;
          const height = dimensions?.height || 1;
          // Não descarta item: card 1×1 some do mosaico e deixa a área em branco.
          const aspectRatio = width / height || 1;
          return {
            id: item.id,
            src: item.imageUrl,
            title: item.title || "Imagem da coleção",
            width,
            height,
            aspectRatio,
          };
        } catch {
          return {
            id: item.id,
            src: item.imageUrl,
            title: item.title || "Imagem da coleção",
            width: 1,
            height: 1,
            aspectRatio: 1,
          };
        }
      })
    );

    const newItems = resolvedItems.filter(Boolean);
    newItems.forEach((item) => processedIds.add(item.id));
    mosaicItems.value = [...mosaicItems.value, ...newItems];
  } catch (error) {
    console.error("Erro ao montar mosaico da coleção:", error);
  } finally {
    isProcessing.value = false;
  }
};

const showSkeleton = computed(() => {
  if (props.isLoading && mosaicItems.value.length === 0) return true;
  if (isProcessing.value && mosaicItems.value.length === 0) return true;
  return false;
});

const tryFetchNextPage = () => {
  if (!props.hasNextPage || props.isFetchingNextPage || props.isLoading) return;
  emit("load-more");
};

watch(
  () => props.images,
  async (images) => {
    const list = images ?? [];
    if (!list.length) {
      mosaicItems.value = [];
      processedIds.clear();
      isMasonryReady.value = false;
      isProcessing.value = false;
      return;
    }

    const imageIds = new Set(list.map((item) => item.id));
    const isContinuation = [...processedIds].every((id) => imageIds.has(id));

    if (!isContinuation) {
      mosaicItems.value = [];
      processedIds.clear();
      isMasonryReady.value = false;
    }

    await processItems(list);
  },
  { immediate: true }
);

const handleScroll = () => {
  const scrollPosition = window.innerHeight + window.scrollY;
  const pageBottom = document.documentElement.offsetHeight - 1000;
  if (scrollPosition >= pageBottom) tryFetchNextPage();
};

const handleMasonryRedraw = () => {
  if (!isMasonryReady.value && mosaicItems.value.length > 0) {
    requestAnimationFrame(() => {
      isMasonryReady.value = true;
    });
  }
};

onMounted(() => {
  if (props.hasNextPage) tryFetchNextPage();
  window.addEventListener("scroll", handleScroll, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<template>
  <div
    class="container-fluid collection-mosaic-container"
    :class="{ 'collection-mosaic-container--info-open': isInfoActive }"
  >
    <MosaicSkeleton
      v-if="showSkeleton"
      :gap="5"
      :column-widths="columnWidths"
      :min-columns="2"
      :max-columns="7"
    />

    <masonry-wall
      v-show="mosaicItems.length > 0"
      :items="mosaicItems"
      :column-width="columnWidths"
      :gap="5"
      :min-columns="2"
      :max-columns="7"
      :class="[
        'collection-masonry-grid',
        {
          'collection-masonry-grid--ready': isMasonryReady || mosaicItems.length > 0,
          'collection-masonry-grid--info-open': isInfoActive,
        },
      ]"
      @redraw="handleMasonryRedraw"
      @redraw-skip="handleMasonryRedraw"
    >
      <template #default="slotProps">
        <MosaicCard
          v-if="slotProps?.item"
          :id="slotProps.item.id"
          :title="slotProps.item.title"
          :image-url="slotProps.item.src"
          :aspect-ratio="slotProps.item.aspectRatio"
        />
      </template>
    </masonry-wall>

    <div v-if="isFetchingNextPage" class="text-center my-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <div
      v-if="!props.isLoading && !isProcessing && props.images.length === 0"
      class="collection-mosaic-empty"
    >
      Esta coleção ainda não possui imagens.
    </div>
  </div>
</template>

<style scoped>
.collection-mosaic-container {
  width: 100%;
  min-width: 0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.collection-mosaic-container :deep(.skeleton-masonry) {
  width: 100%;
}

.container-fluid {
  --bs-gutter-x: 0;
}

.collection-masonry-grid {
  width: 100%;
  min-width: 0;
  opacity: 1;
}

.collection-masonry-grid--info-open {
  justify-content: center;
}

.collection-mosaic-empty {
  color: #666;
  font-size: 14px;
  padding: 12px 0;
}
</style>
