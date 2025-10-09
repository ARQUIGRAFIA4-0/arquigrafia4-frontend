<template>
  <div class="container-fluid mosaic-container">
    <masonry-wall
      :items="items"
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
import { onBeforeUnmount, onMounted, ref } from "vue";
import MosaicCard from "@/components/MosaicCard.vue";
import { api } from "@/services/api";

const isLoading = ref(false);
const items = ref([]);
const columnWidths = [320, 200, 280, 260, 210, 220, 300];
const currentPage = ref(1);
const hasMore = ref(true);

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

const loadImages = async () => {
  if (isLoading.value || !hasMore.value) {
    return;
  }

  isLoading.value = true;
  try {
    const response = await api.getImages(currentPage.value);
    const responseItems = response?.items ?? [];

    const resolvedItems = await Promise.all(
      responseItems.map(async (item) => {
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
    items.value = [...items.value, ...newItems];
    hasMore.value = Boolean(response?.hasMore);
    currentPage.value += 1;
  } catch (error) {
    console.error("Error loading images:", error);
  } finally {
    isLoading.value = false;
  }
};

const handleScroll = () => {
  const scrollPosition = window.innerHeight + window.scrollY;
  const pageBottom = document.documentElement.offsetHeight - 1000;

  if (scrollPosition >= pageBottom) {
    loadImages();
  }
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
