<template>
  <div v-if="isLoading || hasItems" class="related-images">
    <h2 class="related-images__title">
      Continue explorando
      <i class="bi bi-arrow-down related-images__title-icon" aria-hidden="true"></i>
    </h2>

    <!-- Skeleton Masonry -->
    <mosaic-skeleton v-if="showSkeleton" :gap="5" :column-widths="columnWidths" :min-columns="minColumns"
      :max-columns="maxColumns" />

    <!-- Masonry Wall -->
    <masonry-wall v-show="mosaicItems.length > 0" :items="mosaicItems" :column-width="columnWidths" :gap="5"
      :min-columns="minColumns" :max-columns="maxColumns" :class="['masonry-grid', { 'masonry-ready': isMasonryReady }]"
      @redraw="handleMasonryRedraw">
      <template #default="slotProps">

        <div v-if="slotProps && slotProps.item" class="related-card" :data-card-id="slotProps.item.id">

          <img v-if="activeCardId !== slotProps.item.id" :src="LogoConection" alt="" class="related-card__logo" />
          <span v-else @click.stop="toggleCard(slotProps.item.id)" class="related-card__close-button">
            <i class="bi bi-x" aria-hidden="true"></i>
          </span>


          <mosaic-card :id="slotProps.item.id" :title="slotProps.item.title" :image-url="slotProps.item.src"
            :aspect-ratio="slotProps.item.aspectRatio" />

          <div class="related-card__click-catcher" @click="toggleCard(slotProps.item.id)"></div>

          <div v-if="activeCardId === slotProps.item.id" class="related-card__overlay"
            @click="toggleCard(slotProps.item.id)">
            <span class="related-card__overlay-title">Relacionada por:</span>
            <!-- <div class="related-card__tags">
              <span v-for="tag in RELATION_CATEGORIES" :key="tag" class="related-card__tag">{{ tag }}</span>
            </div> -->
            <FitTags :subjects="RELATION_CATEGORIES_TAGS ?? []" />
            <router-link :to="`/explore/dados/image/${slotProps.item.id}`" class="related-card__open-image">
              <i class="bi bi-arrow-right-circle-fill"></i>
            </router-link>
          </div>
        </div>
      </template>
    </masonry-wall>

    <!-- Sentinela para o scroll infinito -->
    <div ref="sentinel" class="related-images__sentinel"></div>

    <!-- Loading da próxima página -->
    <div v-if="isFetchingNextPage" class="text-center my-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Carregando...</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import MosaicCard from "@/components/MosaicCard.vue";
import MosaicSkeleton from "@/components/MosaicSkeleton.vue";
import FitTags from "@/views/Profile/FitTags.vue";
import { api } from "@/services/api";
import LogoConection from "@/assets/logo-connection.png";

const props = defineProps({
  imageId: {
    type: [String, Number],
    default: null,
  },
});


// Lista estatica só que com id e term, para o FitTags funcionar
const RELATION_CATEGORIES_TAGS = [
  { id: 1, term: "assuntos" },
  { id: 2, term: "período" },
  { id: 3, term: "localização" },
  { id: 4, term: "materiais" },
  { id: 5, term: "estilos" },
  { id: 6, term: "interpretações" },
  { id: 7, term: "autoria da imagem" },
  { id: 8, term: "obra" },
  { id: 9, term: "autoria da obra" },
  { id: 10, term: "aspectos estéticos" },
  { id: 11, term: "contexto cultural" },
  { id: 12, term: "tipologia" },
  { id: 13, term: "técnicas" }
]

const activeCardId = ref(null);
const toggleCard = (id) => {
  activeCardId.value = activeCardId.value === id ? null : id;
};

const handleClickOutside = (event) => {
  if (activeCardId.value === null) return;

  const cardEl = event.target.closest(".related-card");
  if (!cardEl || cardEl.dataset.cardId !== String(activeCardId.value)) {
    activeCardId.value = null;
  }
};



const columnWidths = [320, 200, 280, 260, 210, 220, 300];

// ─── Colunas responsivas ────────────────────────────────────────────────────────
// >= 1440px  → fixa em 3 colunas
// <= 768px   → fixa em 2 colunas
// entre eles → deixa o masonry-wall decidir (2 a 7, conforme largura disponível)
const windowWidth = ref(window.innerWidth);
let resizeTimeout = null;

const handleResize = () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    windowWidth.value = window.innerWidth;
  }, 150);
};

const minColumns = computed(() => {
  if (windowWidth.value >= 1440) return 3;
  if (windowWidth.value <= 768) return 2;
  return 2;
});

const maxColumns = computed(() => {
  if (windowWidth.value >= 1440) return 3;
  if (windowWidth.value <= 768) return 2;
  return 7;
});


const mosaicItems = ref([]);
const processedIds = new Set();
const isMasonryReady = ref(false);
const isPending = ref(false);
const isFetchingNextPage = ref(false);
const currentPage = ref(0);
const hasNextPage = ref(true);
const sentinel = ref(null);
let observer = null;

const hasItems = computed(() => mosaicItems.value.length > 0);
const isLoading = computed(() => isPending.value || isFetchingNextPage.value);
const IIIF_BASE = "https://api-dev.arquigrafia.org.br";

const buildImageUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${IIIF_BASE}/${path.replace(/^\/+/, "")}`;
};

const processItems = (sourceItems) => {
  const newItems = sourceItems
    .filter((item) => !processedIds.has(item.id))
    .map((item) => {
      const dims = item.sizes?.mid || item.sizes?.thumb || item.sizes?.original;
      const width = dims?.width || 1;
      const height = dims?.height || 1;

      return {
        id: item.id,
        src: buildImageUrl(item.mid_url || item.thumb_url),
        width,
        title: item.title || "",
        height,
        aspectRatio: width / height,
      };
    });

  if (newItems.length === 0) {
    return;
  }

  newItems.forEach((item) => processedIds.add(item.id));
  mosaicItems.value = [...mosaicItems.value, ...newItems];
};

const showSkeleton = computed(() => {
  if (isPending.value) return true;
  if (mosaicItems.value.length > 0 && !isMasonryReady.value) return true;
  return false;
});

const handleMasonryRedraw = () => {
  if (!isMasonryReady.value && mosaicItems.value.length > 0) {
    requestAnimationFrame(() => {
      isMasonryReady.value = true;
    });
  }
};

// ─── Busca paginada em /images/{id}/related ────────────────────────────────────
const fetchRelated = async () => {
  if (!props.imageId || !hasNextPage.value || isPending.value || isFetchingNextPage.value) {
    return;
  }

  const nextPage = currentPage.value + 1;
  if (nextPage === 1) {
    isPending.value = true;
  } else {
    isFetchingNextPage.value = true;
  }

  try {
    const response = await api.getRelatedImages(props.imageId, nextPage);
    const items = response?.data ?? [];
    const meta = response?.meta ?? null;

    currentPage.value = nextPage;
    hasNextPage.value = meta
      ? meta.current_page < meta.last_page
      : items.length > 0;

    processItems(items);
  } catch (error) {
    console.error("Erro ao carregar imagens relacionadas:", error);
    hasNextPage.value = false;
  } finally {
    isPending.value = false;
    isFetchingNextPage.value = false;
  }
};

const resetAndFetch = () => {
  mosaicItems.value = [];
  processedIds.clear();
  isMasonryReady.value = false;
  currentPage.value = 0;
  hasNextPage.value = true;
  fetchRelated();
};

watch(
  () => props.imageId,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      resetAndFetch();
    }
  }
);

onMounted(async () => {
  window.addEventListener("resize", handleResize);
  document.addEventListener("click", handleClickOutside);

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) {
        fetchRelated();
      }
    },
    { rootMargin: "600px" }
  );

  if (props.imageId) {
    fetchRelated();
  }

  await nextTick();
  if (sentinel.value) {
    observer.observe(sentinel.value);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
  document.removeEventListener("click", handleClickOutside);
  clearTimeout(resizeTimeout);
  observer?.disconnect();
});
</script>

<style lang="scss" scoped>
.related-images {
  margin-top: 40px;
  width: 100%;
}

.related-images__title {
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 500;
  font-size: 1.25rem;
  margin-bottom: 13px;
  color: var(--Preto);
}

.related-images__title-icon {
  color: var(--Cinza_E);
  font-size: 1rem;
  -webkit-text-stroke: 0.8px;
}

.masonry-grid {
  opacity: 0;
  transition: opacity 0.15s ease-in;
}

.masonry-grid.masonry-ready {
  opacity: 1;
}

.related-images__sentinel {
  height: 1px;
}

.related-card {
  position: relative;
  cursor: pointer;

  &:hover {
    .related-card__logo {
      opacity: 1;
    }
  }

  &__close-button {
    position: absolute;
    top: 0px;
    right: 0px;
    width: 24px;
    height: 24px;
    margin: 20px 23px 0 0;
    z-index: 4;
    color: var(--Branco);
  }

  &__logo {
    position: absolute;
    top: 0px;
    right: 0px;
    width: 24px;
    height: 24px;
    margin: 20px 23px 0 0;
    z-index: 4;
    opacity: 0;
  }

  &__open-image {
    width: 100%;
    height: 24px;
    display: flex;
    justify-content: end;
    align-items: center;
    color: var(--Branco);
    margin-bottom: 8px;
    padding-right: 8px;
  }

}

.related-card__click-catcher {
  position: absolute;
  inset: 0;
  z-index: 1;

  &:hover {
    background: rgba(0, 0, 0, 0.4);
  }
}

.related-card__overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  background: rgba(176, 66, 31, 0.82);
  display: flex;
  flex-direction: column;
  justify-content: end;
  padding: 16px;
  color: #fff;
  border-radius: inherit;

  .fit-tags {
    margin-top: .5rem;
    padding-top: 0;
  }

  :deep(.fit-tags__tag) {
    background: transparent;
    border: 1px solid var(--Branco);
    color: var(--Branco);
    border-radius: 2px;
    padding: .25rem .5rem;
    font-weight: 400;
  }

}

.related-card__overlay-title {
  font-weight: 700;
}

.related-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.related-card__tag {
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 0.8rem;
  white-space: nowrap;
}
</style>