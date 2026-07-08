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
          <img :src="LogoConection" alt="" class="related-card__logo" />

          <mosaic-card :id="slotProps.item.id" :title="slotProps.item.title" :image-url="slotProps.item.src"
            :aspect-ratio="slotProps.item.aspectRatio" />

          <div class="related-card__click-catcher" @click="toggleCard(slotProps.item.id)"></div>

          <div v-if="activeCardId === slotProps.item.id" class="related-card__overlay"
            @click="toggleCard(slotProps.item.id)">
            <span class="related-card__overlay-title">Relacionada por:</span>
            <div class="related-card__tags">
              <span v-for="tag in RELATION_CATEGORIES" :key="tag" class="related-card__tag">{{ tag }}</span>
            </div>
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
import { api } from "@/services/api";
import LogoConection from "@/assets/logo-connection.png";

const props = defineProps({
  imageId: {
    type: [String, Number],
    default: null,
  },
});

// Lista estática — a API não informa quais categorias geraram o match,
// então exibimos sempre a lista completa de critérios possíveis.
const RELATION_CATEGORIES = [
  "assuntos", "período", "localização", "materiais", "estilos",
  "interpretações", "autoria da imagem", "obra", "autoria da obra",
  "aspectos estéticos", "contexto cultural", "tipologia", "técnicas",
];

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

<style scoped>
.related-images {
  margin-top: 40px;
  width: 100%;
}

.related-images__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 16px;
}

.related-images__title-icon {
  color: var(--Cinza_M, #6c757d);
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
}

.related-card__logo {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 24px;
  height: 24px;
  z-index: 4;
}

.related-card__click-catcher {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.related-card__overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  background: rgba(176, 66, 31, 0.85);
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 16px;
  color: #fff;
  border-radius: inherit;
}

.related-card__overlay-title {
  font-weight: 700;
  margin-bottom: 12px;
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