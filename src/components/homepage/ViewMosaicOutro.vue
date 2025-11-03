<template>
  <div class="container-fluid mosaic-container">
    <masonry-wall
      :items="mosaicItems"
      :column-width="columnWidths"
      :gap="8"
      :min-columns="1"
      :max-columns="7"
      class="masonry-grid"
    >
      <template #default="slotProps">
        <mosaic-card
          v-if="slotProps && slotProps.item"
          :id="slotProps.item.id"
          :title="slotProps.item.title"
          :image-url="slotProps.item.src"
          :aspect-ratio="slotProps.item.aspectRatio"
        />
      </template>
    </masonry-wall>

    <div v-if="isLoading" class="text-center my-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import MosaicCard from "@/components/MosaicCard.vue";
import { useImagesInfiniteQuery } from "@/composables/useImagesInfiniteQuery";

const columnWidths = [320, 200, 280, 260, 210, 220, 300];
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
  isPending,
  isFetchingNextPage,
} = useImagesInfiniteQuery({ initialLimit: 100 });

const isLoading = computed(
  () => isPending.value || isFetchingNextPage.value || isProcessing.value
);

const tryFetchNextPage = () => {
  if (!hasNextPage.value || isFetchingNextPage.value) {
    return;
  }

  fetchNextPage();
};

/* const handleReachEnd = () => {
  tryFetchNextPage();
}; */

watch(
  () => rawItems.value,
  async (newItems) => {
    await processItems(newItems ?? []);
  },
  { immediate: true }
);

const handleScroll = () => {
  const scrollPosition = window.innerHeight + window.scrollY;
  const pageBottom = document.documentElement.offsetHeight - 1000;

  if (scrollPosition >= pageBottom) {
    tryFetchNextPage();
  }
};

const loadImages = async () => {
  if (!hasNextPage.value) {
    return;
  }

  await tryFetchNextPage();
};

onMounted(() => {
  loadImages();
  window.addEventListener("scroll", handleScroll, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<style scoped>
.mosaic-container {
  min-height: 100vh;
}
</style>
