<script setup>
import { computed, onBeforeUnmount, onMounted, ref, toRef, watch } from "vue";
import { useRoute } from "vue-router";
import MosaicCard from "@/components/MosaicCard.vue";
import MosaicSkeleton from "@/components/MosaicSkeleton.vue";
import { useImagesInfiniteQuery } from "@/composables/useImagesInfiniteQuery";

const props = defineProps({
  search: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["no-results"]);

const route = useRoute();

const columnWidths = [320, 200, 280, 260, 210, 220, 300];
const isProcessing = ref(false);
const mosaicItems = ref([]);
const processedIds = new Set();
const isMasonryReady = ref(false);

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

// Combina filtros da prop search com filtros da URL
const filters = computed(() => {
  const f = {};
  if (route.query.q) {
    f.q = route.query.q;
  }
  if (route.query.date_from) {
    f.date_from = route.query.date_from;
  }
  if (route.query.date_to) {
    f.date_to = route.query.date_to;
  }
  const rawSubjects = route.query['subject[]'];
  if (rawSubjects) {
    f.subjects = Array.isArray(rawSubjects) ? rawSubjects : [rawSubjects];
  }
  return f;
});

const {
  items: rawItems,
  hasNextPage,
  fetchNextPage,
  isPending,
  isFetchingNextPage,
} = useImagesInfiniteQuery({ initialLimit: 100, search: toRef(props, "search"), filters });

watch(rawItems, (val) => {
  if (props.search && !isPending.value && val.length === 0) {
    emit("no-results");
  }
});

const showSkeleton = computed(() => {
  if (isPending.value) return true;
  if (isProcessing.value && mosaicItems.value.length === 0) return true;
  if (mosaicItems.value.length > 0 && !isMasonryReady.value) return true;
  return false;
});

const isLoading = computed(
  () => isPending.value || isFetchingNextPage.value || isProcessing.value
);

const tryFetchNextPage = () => {
  if (!hasNextPage.value || isFetchingNextPage.value) {
    return;
  }

  fetchNextPage();
};

let lastSearchKey = null;

watch(
  rawItems,
  async (newItems) => {
    const rawSubjects = route.query['subject[]'];
    const subjectsKey = rawSubjects ? (Array.isArray(rawSubjects) ? [...rawSubjects].sort().join(',') : rawSubjects) : null;
    const searchKey = JSON.stringify({ search: props.search, q: route.query.q || null, date_from: route.query.date_from || null, date_to: route.query.date_to || null, subjects: subjectsKey });
    if (searchKey !== lastSearchKey) {
      // Reset when search params change (including going from search to browse)
      mosaicItems.value = [];
      processedIds.clear();
      isMasonryReady.value = false;
      lastSearchKey = searchKey;
    }
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

// Evento disparado quando o masonry termina de organizar
const handleMasonryRedraw = () => {
  if (!isMasonryReady.value && mosaicItems.value.length > 0) {
    // Pequeno delay para garantir que o render CSS está completo
    requestAnimationFrame(() => {
      isMasonryReady.value = true;
    });
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

<template>
  <div class="container-fluid mosaic-container">
    <!-- Skeleton Masonry -->
    <mosaic-skeleton v-if="showSkeleton" :gap="5" :column-widths="columnWidths" :min-columns="2" :max-columns="7" />
    <!-- Masonry Wall -->
    <masonry-wall v-show="mosaicItems.length > 0" :items="mosaicItems" :column-width="columnWidths" :gap="5"
      :min-columns="2" :max-columns="7" :class="['masonry-grid', { 'masonry-ready': isMasonryReady }]"
      @redraw="handleMasonryRedraw">
      <template #default="slotProps">
        <mosaic-card v-if="slotProps && slotProps.item" :id="slotProps.item.id" :title="slotProps.item.title"
          :image-url="slotProps.item.src" :aspect-ratio="slotProps.item.aspectRatio" />
      </template>
    </masonry-wall>
    <!-- Loading -->
    <div v-if="isFetchingNextPage" class="text-center my-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mosaic-container {
  min-height: 100vh;
}

.container-fluid {
  --bs-gutter-x: 0;
}

.masonry-grid {
  opacity: 0;
  transition: opacity 0.15s ease-in;
}

.masonry-grid.masonry-ready {
  opacity: 1;
}
</style>
