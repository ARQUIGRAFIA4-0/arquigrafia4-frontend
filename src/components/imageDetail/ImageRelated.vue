<template>
  <div v-if="isLoading || hasItems" class="related-images">
    <div class="related-images__header">
      <div class="related-images__header-content">
        <h2 class="title">
          Continue explorando
        </h2>
        <i class="bi bi-arrow-down title-icon" aria-hidden="true"></i>
      </div>
      <UiField label=" " explain="Clique nas imagens para descobrir como se relacionam com a imagem principal.">
      </UiField>
    </div>

    <mosaic-skeleton v-if="showSkeleton && !isMobileGrid" :gap="5" :column-widths="columnWidths"
      :min-columns="minColumns" :max-columns="maxColumns" />

    <masonry-wall v-if="!isMobileGrid" v-show="mosaicItems.length > 0" :items="mosaicItems" :column-width="columnWidths"
      :gap="5" :min-columns="minColumns" :max-columns="maxColumns"
      :class="['masonry-grid', { 'masonry-ready': isMasonryReady }]" @redraw="handleMasonryRedraw">
      <template #default="slotProps">

        <div v-if="slotProps && slotProps.item" class="related-card" :ref="(el) => setCardRef(el, slotProps.item.id)"
          :class="[cardSizeClasses[slotProps.item.id]]" :data-card-id="slotProps.item.id">

          <!-- <img v-if="activeCardId !== slotProps.item.id" :src="LogoConection" alt="" class="related-card__logo" />
          <span v-else @click.stop="toggleCard(slotProps.item.id)" class="related-card__close-button">
            <i class="bi bi-x" aria-hidden="true"></i>
          </span> -->

          <mosaic-card :id="slotProps.item.id" :title="slotProps.item.title" :image-url="slotProps.item.src"
            :aspect-ratio="slotProps.item.aspectRatio" />

          <!-- <div class="related-card__click-catcher" @click="toggleCard(slotProps.item.id)"></div>

          <div v-if="activeCardId === slotProps.item.id" class="related-card__overlay"
            @click="toggleCard(slotProps.item.id)">
            <span class="related-card__overlay-title">Relacionada por:</span>
            <FitTags :subjects="RELATION_CATEGORIES_TAGS ?? []" />
            <span class="related-card__open-image">
              <a :href="`/explore/dados/image/${slotProps.item.id}`" class="bi bi-arrow-right-circle-fill"></a>
            </span>
          </div> -->
        </div>
      </template>
    </masonry-wall>

    <div v-else class="related-grid">
      <div v-for="item in mosaicItems" :key="item.id" class="related-card related-grid__item" :data-card-id="item.id">

        <!-- <img v-if="activeCardId !== item.id" :src="LogoConection" alt="" class="related-card__logo" />
        <span v-else @click.stop="toggleCard(item.id)" class="related-card__close-button">
          <i class="bi bi-x" aria-hidden="true"></i>
        </span> -->

        <mosaic-card :id="item.id" :title="item.title" :image-url="item.src" :aspect-ratio="1" />

        <!-- <div class="related-card__click-catcher" @click="toggleCard(item.id)"></div>

        <div v-if="activeCardId === item.id" class="related-card__overlay" @click="toggleCard(item.id)">
          <span class="related-card__overlay-title">Relacionada por:</span>
          <FitTags :subjects="RELATION_CATEGORIES_TAGS ?? []" />
          <span class="related-card__open-image">
            <a :href="`/explore/dados/image/${item.id}`" class="bi bi-arrow-right-circle-fill"></a>
          </span>
        </div> -->
      </div>
    </div>

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
import UiField from "@/components/ui/UiField.vue";

const props = defineProps({
  imageId: {
    type: [String, Number],
    default: null,
  },
});


// Lista estatica só que com id e term, para o FitTags funcionar
const RELATION_CATEGORIES_TAGS = [
  { id: 1, term: "assuntos", icon: "bi bi-bookmark" },
  { id: 2, term: "período", icon: "bi bi-calendar-range" },
  { id: 3, term: "localização", icon: "bi bi-geo-alt" },
  { id: 4, term: "materiais", icon: "bi bi-box-seam" },
  { id: 5, term: "estilos", icon: "bi bi-palette" },
  { id: 6, term: "interpretações", icon: "bi bi-chat-square-text" },
  { id: 7, term: "autoria da imagem", icon: "bi bi-camera" },
  { id: 8, term: "obra", icon: "bi bi-easel" },
  { id: 9, term: "autoria da obra", icon: "bi bi-pencil-square" },
  { id: 10, term: "aspectos estéticos", icon: "bi bi-stars" },
  { id: 11, term: "contexto cultural", icon: "bi bi-globe2" },
  { id: 12, term: "tipologia", icon: "bi bi-diagram-3" },
  { id: 13, term: "técnicas", icon: "bi bi-tools" },
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


const isMobileGrid = computed(() => windowWidth.value <= 768);

//----
// Medição de altura dos cards (baseada em layout, não em click)
const SHORT_HEIGHT_THRESHOLD = 178.79;
const NARROWLY_LOW_HEIGHT_THRESHOLD = 91.79;

// Guarda a referência de cada card pelo id (não precisa ser reativo)
const cardRefs = new Map();

// Classes calculadas por card: { [cardId]: 'related-card--short' | '' }
const cardSizeClasses = ref({});

const setCardRef = (el, id) => {
  if (el) {
    cardRefs.set(id, el);
  } else {
    cardRefs.delete(id);
  }
};

const updateAllCardSizeClasses = () => {
  const updated = { ...cardSizeClasses.value };
  cardRefs.forEach((el, id) => {
    const height = el.getBoundingClientRect().height;
    if (height <= NARROWLY_LOW_HEIGHT_THRESHOLD) {
      updated[id] = "related-card--short related-card--very-short"
    }
    else if (height <= SHORT_HEIGHT_THRESHOLD) {
      updated[id] = "related-card--short"
    }

    // updated[id] = height <= SHORT_HEIGHT_THRESHOLD ? "related-card--short" : "";
  });
  cardSizeClasses.value = updated;
};

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
  if (isMobileGrid.value) return false; // grid simples não usa a animação/skeleton do masonry
  if (mosaicItems.value.length > 0 && !isMasonryReady.value) return true;
  return false;
});

const handleMasonryRedraw = () => {
  if (!isMasonryReady.value && mosaicItems.value.length > 0) {
    requestAnimationFrame(() => {
      isMasonryReady.value = true;
    });
  }

  // Recalcula as classes de tamanho depois que o DOM
  // já refletiu o novo layout do masonry (nova qtd de colunas, etc.)
  nextTick(() => {
    updateAllCardSizeClasses();
  });
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
$breakpoint-sm-mobile: 320px;
$breakpoint-sm: 768px;
$breakpoint-md: 1024px;
$breakpoint-lg: 1440px;


@mixin sm-mobile {
  @media (min-width: #{$breakpoint-sm-mobile}) {
    @content;
  }
}

@mixin sm {
  @media (min-width: #{$breakpoint-sm}) {
    @content;
  }
}

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

@mixin lg {
  @media (min-width: #{$breakpoint-lg}) {
    @content;
  }
}

.related-images {
  margin-top: 40px;
  width: 100%;
}

.related-images__header {
  display: flex;
  align-items: center;
  margin-bottom: 13px;

  &-content {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 0px;

    .title {
      font-weight: 500;
      font-size: 1.25rem;
      color: var(--Preto);
      margin-bottom: 0px;
      white-space: nowrap
    }

    .title-icon {
      color: var(--Cinza_E);
      font-size: 1rem;
      -webkit-text-stroke: .8px;
    }
  }


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

.related-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.related-grid__item {
  border: .2496px solid var(--Cinza_C, #A6A6A6);
  box-shadow: 1px 1px 3px 2px #0000001A;
  border-radius: 5px;
  overflow: hidden;
}

.related-card {
  container-type: inline-size;
  container-name: related-card;
  position: relative;
  cursor: pointer;

  .related-card__logo {
    pointer-events: none;
  }

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
    margin-bottom: 8px;
    padding-right: 8px;

    a {
      color: var(--Branco);
    }
  }
}

.related-card--short {

  .related-card__close-button {
    // display: none;
    position: absolute;
    right: 0;
    top: 0;
    margin: 15px 10px 0 0;
  }

  .related-card__open-image {
    position: absolute;
    right: 0;
    bottom: 0;
    margin: 20px 6px 15px 0;
  }

  .related-card__overlay {
    .fit-tags {
      margin-bottom: 0px;
      width: 75%;
    }
  }
}

.related-card--very-short {
  .related-card__overlay-title {
    display: none;
  }
}

@container related-card (max-width: 190px) {
  .related-card__overlay {
    .fit-tags {
      // margin-bottom: 0px;
      width: 70%;
    }
  }
}


@include sm-mobile {
  @container related-card (max-width: 146px) {
    .related-card__overlay-title {
      display: none;
    }

    .related-card__open-image {
      position: absolute;
      right: 0;
      bottom: 0;
      margin: 20px 0px 20px 0;
    }


    .related-card__close-button {
      display: none;
    }

    .related-card__overlay {

      .fit-tags {
        width: 85%;
        margin-bottom: .7625rem;

        :deep(.fit-tags__tag) {
          font-size: .6rem;
        }
      }
    }
  }

  @container related-card (max-width: 233px) {
    .related-card__overlay {
      .fit-tags {
        :deep(.fit-tags__tag) {
          font-size: .6rem;
        }
      }
    }
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
    margin-bottom: .5625rem;
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
  font-size: .75rem;
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
  font-size: .8rem;
  white-space: nowrap;
}
</style>