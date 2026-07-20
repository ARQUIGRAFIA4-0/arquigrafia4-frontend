<template>
  <div class="container-fluid work-detail__container">
    <div class="row align-items-start gy-4 work-detail__layout">
      <!-- Lado esquerdo (7 colunas): voltar + mosaico das imagens da obra -->
      <div class="col-12 col-md-7">
        <header class="work-detail__header">
          <button type="button" class="work-detail__back-btn" aria-label="Voltar" @click="goBack">
            <span class="work-detail__back-content">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 14 14" fill="none"
                aria-hidden="true">
                <path fill-rule="evenodd" clip-rule="evenodd"
                  d="M13.1248 7.00055C13.1248 6.88452 13.0787 6.77324 12.9967 6.69119C12.9146 6.60915 12.8033 6.56305 12.6873 6.56305H2.36843L5.12206 3.8103C5.16273 3.76963 5.195 3.72134 5.21701 3.66819C5.23903 3.61504 5.25036 3.55808 5.25036 3.50055C5.25036 3.44303 5.23903 3.38606 5.21701 3.33292C5.195 3.27977 5.16273 3.23148 5.12206 3.1908C5.08138 3.15013 5.03309 3.11786 4.97994 3.09584C4.92679 3.07383 4.86983 3.0625 4.81231 3.0625C4.75478 3.0625 4.69782 3.07383 4.64467 3.09584C4.59152 3.11786 4.54323 3.15013 4.50256 3.1908L1.00256 6.6908C0.961813 6.73144 0.929488 6.77972 0.907432 6.83287C0.885376 6.88603 0.874023 6.94301 0.874023 7.00055C0.874023 7.0581 0.885376 7.11508 0.907432 7.16823C0.929488 7.22138 0.961813 7.26966 1.00256 7.3103L4.50256 10.8103C4.54323 10.851 4.59152 10.8832 4.64467 10.9053C4.69782 10.9273 4.75478 10.9386 4.81231 10.9386C4.86983 10.9386 4.92679 10.9273 4.97994 10.9053C5.03309 10.8832 5.08138 10.851 5.12206 10.8103C5.16273 10.7696 5.195 10.7213 5.21701 10.6682C5.23903 10.615 5.25036 10.5581 5.25036 10.5006C5.25036 10.443 5.23903 10.3861 5.21701 10.3329C5.195 10.2798 5.16273 10.2315 5.12206 10.1908L2.36843 7.43805H12.6873C12.8033 7.43805 12.9146 7.39196 12.9967 7.30991C13.0787 7.22786 13.1248 7.11658 13.1248 7.00055Z"
                  fill="#2F2F2F" />
              </svg>
              <span class="work-detail__back-text">voltar</span>
            </span>
          </button>
        </header>

        <div class="work-detail__mosaic">
          <!-- Loading -->
          <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Carregando...</span>
            </div>
          </div>

          <!-- Error -->
          <div v-else-if="error" class="alert alert-warning" role="alert">
            {{ error }}
          </div>

          <!-- Masonry: até 3 colunas, caindo para 2 em telas estreitas (como na home) -->
          <masonry-wall v-else-if="mosaicItems.length" :items="mosaicItems" :column-width="200" :gap="8"
            :min-columns="2" :max-columns="3" :class="['masonry-grid', { 'masonry-ready': isMasonryReady }]"
            @redraw="handleMasonryRedraw">
            <template #default="slotProps">
              <mosaic-card v-if="slotProps && slotProps.item" :id="slotProps.item.id" :title="slotProps.item.title"
                :image-url="slotProps.item.src" :aspect-ratio="slotProps.item.aspectRatio" />
            </template>
          </masonry-wall>

          <p v-else class="text-muted mb-0">Nenhuma imagem associada a esta obra.</p>

          <!-- Loading das próximas páginas (scroll infinito) -->
          <div v-if="isFetchingNextPage" class="text-center my-4">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Carregando...</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Lado direito (5 colunas): metadados da obra — em breve -->
      <div class="col-12 col-md-5">
        <!-- TODO: dados da obra -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import MosaicCard from "@/components/MosaicCard.vue";
import { api } from "@/services/api";

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error = ref(null);
const work = ref(null);
const galleryMeta = ref(null);
const mosaicItems = ref([]);
const isMasonryReady = ref(false);

const PER_PAGE = 24;
const currentPage = ref(1);
const hasNextPage = ref(false);
const isFetchingNextPage = ref(false);
// Evita reprocessar dimensões de imagens já presentes no mosaico.
const processedIds = new Set();

// "Voltar": volta no histórico interno se houver; senão cai no acervo.
const goBack = () => {
  if (window.history.state?.back) router.back();
  else router.push({ name: "explore" });
};

// Precarrega as dimensões reais da imagem para o masonry posicionar corretamente
// (mesma abordagem do mosaico da página inicial).
const preloadImageDimensions = (url) =>
  new Promise((resolve) => {
    const img = new Image();
    const cleanup = () => {
      img.onload = null;
      img.onerror = null;
    };
    img.onload = () => {
      cleanup();
      resolve({ width: img.naturalWidth || 1, height: img.naturalHeight || 1 });
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

const buildMosaicItems = async (items) => {
  const pending = items.filter((item) => !processedIds.has(item.id));
  const resolved = await Promise.all(
    pending.map(async (item) => {
      const { width, height } = await preloadImageDimensions(item.imageUrl);
      if (width === 1 || height === 1) return null;
      return {
        id: item.id,
        src: item.imageUrl,
        title: item.title,
        aspectRatio: width / height,
      };
    })
  );
  const built = resolved.filter((item) => item !== null);
  built.forEach((item) => processedIds.add(item.id));
  return built;
};

const handleMasonryRedraw = () => {
  if (!isMasonryReady.value && mosaicItems.value.length > 0) {
    requestAnimationFrame(() => {
      isMasonryReady.value = true;
    });
  }
};

const fetchWork = async () => {
  loading.value = true;
  error.value = null;
  isMasonryReady.value = false;
  currentPage.value = 1;
  processedIds.clear();
  try {
    const id = route.params.id;
    const [workData, gallery] = await Promise.all([
      api.getWorkDetails(id),
      api.getWorkImages(id, { page: 1, perPage: PER_PAGE }),
    ]);
    work.value = workData;
    galleryMeta.value = gallery.meta;
    hasNextPage.value = Boolean(gallery.hasMore);
    mosaicItems.value = await buildMosaicItems(gallery.items);
  } catch (err) {
    console.error("Erro ao carregar obra:", err);
    error.value = "Não foi possível carregar esta obra.";
  } finally {
    loading.value = false;
  }
};

// Scroll infinito: mesma dinâmica do mosaico da home e dos grids de perfil.
const fetchNextPage = async () => {
  if (!hasNextPage.value || isFetchingNextPage.value || loading.value) return;

  isFetchingNextPage.value = true;
  const nextPage = currentPage.value + 1;
  try {
    const gallery = await api.getWorkImages(route.params.id, {
      page: nextPage,
      perPage: PER_PAGE,
    });
    currentPage.value = nextPage;
    galleryMeta.value = gallery.meta;
    hasNextPage.value = Boolean(gallery.hasMore);
    const newItems = await buildMosaicItems(gallery.items);
    if (newItems.length) {
      mosaicItems.value = [...mosaicItems.value, ...newItems];
    }
  } catch (err) {
    console.error("Erro ao carregar mais imagens da obra:", err);
    hasNextPage.value = false;
  } finally {
    isFetchingNextPage.value = false;
  }
};

const handleScroll = () => {
  if (window.innerHeight + window.scrollY < document.documentElement.offsetHeight - 1000) return;
  fetchNextPage();
};

onMounted(() => {
  fetchWork();
  window.addEventListener("scroll", handleScroll, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

// Mesmo alinhamento da página de detalhe da imagem (navbar).
.work-detail__container {
  padding-top: 1rem;
  padding-bottom: 1rem;

  @include md {
    padding: 24px 50px;
  }
}

.work-detail__layout {
  --bs-gutter-x: 1.5rem;
}

.work-detail__header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.work-detail__back-btn {
  display: inline-flex;
  padding: 4px 14px;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  border-radius: 5px;
  border: 1px solid var(--Cinza_E, #2f2f2f);
  background: var(--Off_white, #faf9f9);
  cursor: pointer;
}

.work-detail__back-content {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.work-detail__back-text {
  color: var(--Cinza_E, #2f2f2f);
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 150%;
}

// 28px entre o botão "voltar" e o mosaico
.work-detail__mosaic {
  margin-top: 28px;
}

.masonry-grid {
  opacity: 0;
  transition: opacity 0.15s ease-in;
}

.masonry-grid.masonry-ready {
  opacity: 1;
}
</style>
