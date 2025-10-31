<template>
  <div class="container-fluid mosaic-container">
    <MosaicWall :images="mosaicItems" @reach-end="handleReachEnd">
      <template #item="{ image }">
        <MosaicCard
          v-if="image"
          :id="image.id"
          :title="image.title"
          :image-url="image.src"
          :aspect-ratio="image.aspectRatio"
        />
      </template>
    </MosaicWall>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import MosaicCard from "@/components/MosaicCard.vue";
import MosaicWall from "@/components/MosaicWall.vue";
import { useImagesInfiniteQuery } from "@/composables/useImagesInfiniteQuery";

const isProcessing = ref(false);
const mosaicItems = ref([]);
const processedIds = new Set();

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
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      return;
    }
  });
};

const processItems = async (sourceItems) => {
  const pendingItems = sourceItems.filter((item) => !processedIds.has(item.id));

  if (pendingItems.length === 0) {
    return;
  }

  isProcessing.value = true;
  try {
    const resolvedItems = await Promise.all(
      pendingItems.map(async (item) => {
        try {
          const dimensions = await preloadImageDimensions(item.imageUrl);

          if (
            !dimensions ||
            dimensions.width === 1 ||
            dimensions.height === 1
          ) {
            return null;
          }

          const { width, height } = dimensions;
          const aspectRatio = width && height ? width / height : 1;

          return {
            id: item.id,
            src: item.imageUrl,
            title: item.title,
            width,
            height,
            aspectRatio,
          };
        } catch (preloadError) {
          return null;
        }
      })
    );

    const newItems = resolvedItems.filter((item) => item !== null);
    newItems.forEach((item) => processedIds.add(item.id));
    mosaicItems.value = [...mosaicItems.value, ...newItems];
  } catch (error) {
    console.error("Error processing items:", error);
  } finally {
    isProcessing.value = false;
  }
};

const {
  items: rawItems,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
} = useImagesInfiniteQuery({ initialLimit: 100 });

const tryFetchNextPage = () => {
  if (!hasNextPage.value || isFetchingNextPage.value) {
    return;
  }

  fetchNextPage();
};

const handleReachEnd = () => {
  tryFetchNextPage();
};

watch(
  () => rawItems.value,
  async (newItems) => {
    await processItems(newItems ?? []);
  },
  { immediate: true }
);
</script>
