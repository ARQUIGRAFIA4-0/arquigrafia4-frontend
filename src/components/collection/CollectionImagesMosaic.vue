<script setup>
import { computed, ref, watch } from "vue";
import MosaicCard from "@/components/MosaicCard.vue";
import MosaicSkeleton from "@/components/MosaicSkeleton.vue";

defineOptions({ name: "CollectionImagesMosaic" });

const props = defineProps({
  images: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  isInfoActive: {
    type: Boolean,
    default: false,
  },
});

const columnWidths = [320, 200, 280, 260, 210, 220, 300];

const isProcessing = ref(false);
const mosaicItems = ref([]);
const isMasonryReady = ref(false);

// Pre-carrega as dimensões da imagem
const preloadImageDimensions = (url) => {
  return new Promise((resolve) => {
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
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    }

  });
  
};

// Processa as imagens do mosaico
const processItems = async (sourceItems) => {
  isProcessing.value = true;
  isMasonryReady.value = false;

  try {
    // Processa as imagens do mosaico
    const resolvedItems = await Promise.all(
      sourceItems.map(async (item) => {

        // Pre-carrega as dimensões da imagem
        const dimensions = await preloadImageDimensions(item.imageUrl);

        const { width, height } = dimensions;
        const aspectRatio = width && height ? width / height : 1;

        return {
          id: item.id,
          src: item.imageUrl,
          title: item.title || "Imagem da coleção",
          width,
          height,
          aspectRatio,
        };
      })
    );

    mosaicItems.value = resolvedItems.filter(Boolean);
  } catch (error) {
    console.error("Erro ao montar mosaico da coleção:", error);
    mosaicItems.value = [];

  } finally {
    isProcessing.value = false;

  }

};

const showSkeleton = computed(() => {
  if (props.isLoading) return true;
  if (isProcessing.value && mosaicItems.value.length === 0) return true;
  if (mosaicItems.value.length > 0 && !isMasonryReady.value) return true;
  return false;
});

watch(
  () => props.images,
  (images) => {
    mosaicItems.value = [];
    isMasonryReady.value = false;

    if (!images?.length) {
      isProcessing.value = false;
      return;
    }

    processItems(images);
  },
  { immediate: true }
);

const handleMasonryRedraw = () => {
  if (!isMasonryReady.value && mosaicItems.value.length > 0) {
    requestAnimationFrame(() => {
      isMasonryReady.value = true;
    });
  }
};
</script>

<template>
  <div class="container-fluid collection-mosaic-container" :class="{ 'collection-mosaic-container--info-open': isInfoActive }">
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
            'collection-masonry-grid--ready': isMasonryReady,
            'collection-masonry-grid--info-open': isInfoActive,
        },
       ]"
      @redraw="handleMasonryRedraw"
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
  min-height: 320px;
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
  opacity: 0;
  transition: opacity 0.15s ease-in;
}

.collection-masonry-grid--ready {
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