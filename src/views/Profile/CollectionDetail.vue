<script setup>
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth";
import { useAlbumsStore } from "@/store/albums";
import { useUsersStore } from "@/store/users";
import defaultProfileImage from "@/assets/profile_image.png";
import CollectionPeriodsChart from "@/components/CollectionPeriodsChart.vue";
import UiField from "../../components/ui/UiField.vue";
import CollectionImagesGrid from "@/components/collection/CollectionImagesGrid.vue";
import CollectionImagesMosaic from "@/components/collection/CollectionImagesMosaic.vue";
import {
  viewRouteToSelection,
  selectionToViewRoute,
  selectionToViewMode,
} from "@/constants/viewModes";
import { api } from "@/services/api";
import CollectionToolbar from "@/components/CollectionToolbar.vue";
import DownloadModal from "@/components/imageDetail/DownloadModal.vue";
import { downloadCollectionAsZip } from "@/helpers/downloadCollectionZip";
import { sanitizeDownloadFilename } from "@/helpers/downloadImage";

defineOptions({ name: "CollectionDetail" });

const usersStore = useUsersStore();
const API_BASE_URL = import.meta.env.VITE_BASE_REQUEST_URL;

const ownerUser = ref(null);

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const albumsStore = useAlbumsStore();

const isLoadingOwner = ref(true);

const collectionId = computed(() => route.params.collectionId);

const albumData = ref(null);
const collectionImages = ref([]);
const isLoadingCollection = ref(true);

// título e descrição reais vindos da API
const collectionTitle = computed(() => {
  return albumData.value?.title?.trim() || "Sem título";
});

const collectionDescription = computed(() => {
  return albumData.value?.description?.trim() || "Sem descrição.";
});

// avatar do proprietário da coleção
const ownerAvatarSrc = computed(() => {
  const avatarUrl = ownerUser.value?.avatar_url;
  const avatarPath = ownerUser.value?.avatar_path;

  // Caso já venha URL completa da API/CDN
  if (avatarUrl && /^https?:\/\//.test(avatarUrl)) {
    return avatarUrl;
  }

  // Caso venha caminho relativo em avatar_url
  if (avatarUrl) {
    return `${API_BASE_URL}${avatarUrl.startsWith("/") ? "" : "/"}${avatarUrl}`;
  }

  // Caso backend retorne avatar_path (apenas pra eu lembra: mesmo padrão do ProfileCard)
  if (avatarPath) {
    return `${API_BASE_URL}/storage/${avatarPath}`;
  }

  return defaultProfileImage;

});

// busca os dados da coleção
async function fetchCollectionData() {
  if (!collectionId.value) return;

  isLoadingCollection.value = true;
  isLoadingOwner.value = true;

  try {
    // busca os dados da coleção
    const data = await albumsStore.getDataAlbumByAlbumId(
      authStore.authHeader,
      collectionId.value
    );

    albumData.value = data;

    // carrega as imagens da coleção
    await loadCollectionImageDetails(data.images || []);

    // carrega as tags da coleção
    await loadCollectionTags();

    if (data.user_id) {
      try {
        ownerUser.value = await usersStore.getUser(data.user_id);
      } catch (e) {
        ownerUser.value = null;
      } finally {
        isLoadingOwner.value = false;
      }
    } else {
      ownerUser.value = null;
      isLoadingOwner.value = false;
    }

  } catch (error) {
    albumData.value = null;
    collectionImages.value = [];
    collectionTags.value = [];
    isLoadingCollectionTags.value = false;
    ownerUser.value = null;
    isLoadingOwner.value = false;

  } finally {
    isLoadingCollection.value = false;

  }

}

// Carrega as imagens da coleção
async function loadCollectionImageDetails(imagesFromAlbum = []) {
  
  // Ordena as imagens pela position do pivot
  const ordered = [...imagesFromAlbum].sort((a, b) => {
    const pa = a?.pivot?.position ?? Number.MAX_SAFE_INTEGER;
    const pb = b?.pivot?.position ?? Number.MAX_SAFE_INTEGER;
    return pa - pb;
  });

  // Se não houver imagens, retorna um array vazio
  if (!ordered.length) {
    collectionImages.value = [];
    return;
  }

  try {
    // Carrega as imagens detalhadas
    collectionImages.value = await Promise.all(
      ordered.map((img) => api.getImageDetails(img.id))
    );

  } catch (err) {
    console.error("Erro ao carregar imagens da coleção:", err);
    collectionImages.value = [];

  }

}

/**
* Start: Remover imagem
**/
const selectedImageId = ref(null);
const removingImageId = ref(null);

// Ativa a imagem (seleciona ou desseleciona)
function onCardActivate(item, event) {
  // evita que clique em botão interno dispare toggle duas vezes
  const target = event?.target;
  if (target?.closest?.("button,a")) return;

  selectedImageId.value = selectedImageId.value === item.id ? null : item.id; // Toggle seleção
}

// Remove a imagem da coleção
async function removeImageFromCollection(imageId) {
  if (!collectionId.value || !imageId) return; // Verifica se a coleção e a imagem existem. Para evitar bugs;

  removingImageId.value = imageId; // Define o ID da imagem que está sendo removida
  
  try {
    await albumsStore.removeImagesFromAlbum(
      authStore.authHeader,
      collectionId.value,
      imageId
    );

    // Controle de estado: Remove a imagem da lista de imagens da coleção
    collectionImages.value = collectionImages.value.filter((img) => img.id !== imageId);

    if (selectedImageId.value === imageId) {
      selectedImageId.value = null;
    }

    if (albumData.value?.images?.length) {
      albumData.value.images = albumData.value.images.filter(
        (img) => img.id !== imageId
      );
    }
  } catch (err) {
    console.error(err);
  } finally {
    removingImageId.value = null;
  }
}
/**
* End: Remover imagem
*/

/**
 * Start: Toolbar
*/
const viewSelection = computed(() =>
  viewRouteToSelection(route.params.viewMode)
);
const collectionViewMode = computed(() =>
  selectionToViewMode(viewSelection.value)
);
const isInfoActive = ref(true);
const isGridReflowing = ref(false);
const isMobileGridExpanded = ref(false);
const galleryRef = ref(null);

const MOBILE_BREAKPOINT = 768;
const isMobile = ref(
  typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT
);

function updateIsMobile() {
  isMobile.value = window.innerWidth < MOBILE_BREAKPOINT;
}

async function handleToggleMobileGrid() {
  const willExpand = !isMobileGridExpanded.value;
  isMobileGridExpanded.value = willExpand;

  if (!willExpand || !isMobile.value) return;

  await nextTick();

  galleryRef.value?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

// Muda o modo de visualização da coleção
function handleCollectionViewChange({ selection }) {
  if (isMobile.value && selection === "mosaic") return;

  const viewMode = selectionToViewRoute(selection);

  if (viewMode === route.params.viewMode) return;

  router.push({
    name: "my-collection-detail",
    params: {
      collectionId: collectionId.value,
      viewMode,
    },
  });

}

function handleToggleCollectionInfo() {
  if (isMobile.value) return;

  isGridReflowing.value = true;

  window.setTimeout(() => {
    isInfoActive.value = !isInfoActive.value;
    window.setTimeout(() => {
      isGridReflowing.value = false;

    }, 220);

  }, 120);

}
/*
 * End: Toolbar
*/

/**
 * Start: Tags
 */
const collectionTags = ref([]);
const isLoadingCollectionTags = ref(true);

// Normaliza as tags da coleção
function normalizeCollectionTags(tags = []) {
  return tags.map((tag) => tag.term).slice(0, 8);
}

// Carrega as tags da coleção
async function loadCollectionTags() {
  if (!collectionId.value) {
    collectionTags.value = [];
    isLoadingCollectionTags.value = false;
    return;
  }

  isLoadingCollectionTags.value = true;

  try {
    const data = await albumsStore.getTagsByAlbumId(
      authStore.authHeader,
      collectionId.value
    );

    collectionTags.value = normalizeCollectionTags(data.tags ?? data);

  } catch (error) {
    console.error("Erro ao carregar tags da coleção:", error);
    collectionTags.value = [];

  } finally {
    isLoadingCollectionTags.value = false;

  }
}

/**
 * End: Tags
 */

/**
 * Start: Download
 */

const showDownloadModal = ref(false);
const downloadingCollection = ref(false);

// Abre o modal de download da coleção.
function handleDownloadCollection() {
  if (!collectionImages.value.length) return;
  showDownloadModal.value = true;

}

// Edita a coleção.
function handleEditCollection() {
  if (!collectionId.value) return;

  router.push({
    name: "my-collection-edit",
    params: {
      collectionId: collectionId.value,
    },
    query: {
      viewMode: route.params.viewMode || "grid",
    },
  });

}

// Baixa a coleção como ZIP.
async function handleCollectionDownloadConfirm() {
  downloadingCollection.value = true;

  try {
    const zipName = `${sanitizeDownloadFilename(collectionTitle.value, "coleção")}.zip`;
    await downloadCollectionAsZip(collectionImages.value, zipName);
    showDownloadModal.value = false;

  } catch (err) {
    console.error(err);

  } finally {
    downloadingCollection.value = false;

  }
}

/**
 * End: Download
 */

onMounted(() => {
  fetchCollectionData();
  updateIsMobile();
  window.addEventListener("resize", updateIsMobile);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateIsMobile);
});

watch(
  () => route.params.collectionId,
  () => {
    fetchCollectionData();
  }
);

watch(
  [isMobile, () => route.params.viewMode],
  ([mobile, viewMode]) => {
    if (!mobile || viewMode !== "mosaic" || !collectionId.value) return;

    router.replace({
      name: "my-collection-detail",
      params: {
        collectionId: collectionId.value,
        viewMode: "grid",
      },
    });
  },
  { immediate: true }
);

</script>

<template>
  <section
    class="collection-detail__container"
    :class="{
      'collection-detail__container--mobile': isMobile,
    }"
  >
    <CollectionToolbar
      v-if="!isMobile"
      class="collection-detail__floating-toolbar"
      :view-selection="viewSelection"
      :is-info-active="isInfoActive"
      :allowed-views="['grid', 'mosaic']"
      @view-change="handleCollectionViewChange"
      @toggle-info="handleToggleCollectionInfo"
      @download="handleDownloadCollection"
      @edit="handleEditCollection"
    />

    <DownloadModal
      v-model="showDownloadModal"
      :collection-count="collectionImages.length"
      :busy="downloadingCollection"
      @confirm="handleCollectionDownloadConfirm"
    />
    <header class="collection-detail__header">
        <button
          type="button"
          class="collection-detail__back-btn"
          aria-label="Voltar"
          @click="router.push({ name: 'my-profile-collections' })"
        >
            <span class="collection-detail__back-content">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M13.1248 7.00055C13.1248 6.88452 13.0787 6.77324 12.9967 6.69119C12.9146 6.60915 12.8033 6.56305 12.6873 6.56305H2.36843L5.12206 3.8103C5.16273 3.76963 5.195 3.72134 5.21701 3.66819C5.23903 3.61504 5.25036 3.55808 5.25036 3.50055C5.25036 3.44303 5.23903 3.38606 5.21701 3.33292C5.195 3.27977 5.16273 3.23148 5.12206 3.1908C5.08138 3.15013 5.03309 3.11786 4.97994 3.09584C4.92679 3.07383 4.86983 3.0625 4.81231 3.0625C4.75478 3.0625 4.69782 3.07383 4.64467 3.09584C4.59152 3.11786 4.54323 3.15013 4.50256 3.1908L1.00256 6.6908C0.961813 6.73144 0.929488 6.77972 0.907432 6.83287C0.885376 6.88603 0.874023 6.94301 0.874023 7.00055C0.874023 7.0581 0.885376 7.11508 0.907432 7.16823C0.929488 7.22138 0.961813 7.26966 1.00256 7.3103L4.50256 10.8103C4.54323 10.851 4.59152 10.8832 4.64467 10.9053C4.69782 10.9273 4.75478 10.9386 4.81231 10.9386C4.86983 10.9386 4.92679 10.9273 4.97994 10.9053C5.03309 10.8832 5.08138 10.851 5.12206 10.8103C5.16273 10.7696 5.195 10.7213 5.21701 10.6682C5.23903 10.615 5.25036 10.5581 5.25036 10.5006C5.25036 10.443 5.23903 10.3861 5.21701 10.3329C5.195 10.2798 5.16273 10.2315 5.12206 10.1908L2.36843 7.43805H12.6873C12.8033 7.43805 12.9146 7.39196 12.9967 7.30991C13.0787 7.22786 13.1248 7.11658 13.1248 7.00055Z"
                    fill="#2F2F2F"
                />
                </svg>
                <span class="collection-detail__back-text">voltar</span>
            </span>
        </button>      
    </header>
    <main class="collection-detail__main container-fluid px-0">
      <div
        class="row g-0 collection-detail__row"
        :class="{
          'collection-detail__row--mobile': isMobile,
          'collection-detail__row--grid-expanded': isMobile && isMobileGridExpanded,
        }"
      >
        <template v-if="!isMobile">
          <div class="collection-detail__image-wrapper">
            <header
              class="collection-detail__main-title-area"
              :class="{
                'collection-detail__main-title-area--visible':
                  !isInfoActive && !isLoadingCollection,
              }"
              :aria-hidden="isInfoActive || isLoadingCollection"
            >
              <h1 class="collection-detail__main-title">
                {{ collectionTitle }}
              </h1>
            </header>

            <section
              class="collection-detail__gallery"
              :class="{
                'collection-detail__gallery--with-title':
                  !isInfoActive && !isLoadingCollection,
              }"
            >
              <CollectionImagesGrid
                v-if="collectionViewMode === 'grid'"
                :images="collectionImages"
                :is-loading="isLoadingCollection"
                :is-grid-reflowing="isGridReflowing"
                :selected-image-id="selectedImageId"
                :removing-image-id="removingImageId"
                :is-info-active="isInfoActive"
                @activate="onCardActivate"
                @remove="removeImageFromCollection"
              />

              <CollectionImagesMosaic
                v-else-if="collectionViewMode === 'mosaic'"
                :images="collectionImages"
                :is-loading="isLoadingCollection"
                :is-info-active="isInfoActive"
              />
            </section>
          </div>
        </template>

        <div
          v-if="isMobile"
          class="collection-detail__mobile-stage"
        >
          <div
            id="collection-detail-mobile-gallery"
            ref="galleryRef"
            class="collection-detail__image-wrapper collection-detail__image-wrapper--mobile"
            :class="{
              'collection-detail__image-wrapper--grid-collapsed': !isMobileGridExpanded,
              'collection-detail__image-wrapper--grid-expanded': isMobileGridExpanded,
            }"
          >
            <section class="collection-detail__gallery">
              <CollectionImagesGrid
                :images="collectionImages"
                :is-loading="isLoadingCollection"
                :selected-image-id="selectedImageId"
                :removing-image-id="removingImageId"
                :is-info-active="false"
                @activate="onCardActivate"
                @remove="removeImageFromCollection"
              />
            </section>
          </div>

          <button
            type="button"
            class="collection-detail__mobile-handle"
            :aria-expanded="isMobileGridExpanded"
            aria-controls="collection-detail-mobile-gallery"
            :aria-label="
              isMobileGridExpanded
                ? 'Recolher grade de imagens'
                : 'Expandir grade de imagens'
            "
            @click="handleToggleMobileGrid"
          >
            <svg
              class="collection-detail__mobile-handle-icon"
              :class="{
                'collection-detail__mobile-handle-icon--expanded': isMobileGridExpanded,
              }"
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M3.88145 16.941C4.02998 16.6453 4.28972 16.4205 4.60371 16.316C4.91771 16.2115 5.26033 16.2358 5.55645 16.3835L19.999 23.601L34.439 16.381C34.5859 16.3059 34.7462 16.2607 34.9106 16.2479C35.0751 16.2351 35.2405 16.255 35.3972 16.3064C35.554 16.3578 35.699 16.4398 35.8239 16.5475C35.9489 16.6552 36.0512 16.7866 36.1251 16.9341C36.199 17.0816 36.243 17.2423 36.2546 17.4068C36.2661 17.5714 36.2449 17.7366 36.1923 17.893C36.1396 18.0493 36.0566 18.1937 35.9479 18.3178C35.8392 18.4419 35.707 18.5432 35.559 18.616L20.559 26.116C20.3851 26.2031 20.1934 26.2484 19.999 26.2484C19.8045 26.2484 19.6128 26.2031 19.439 26.116L4.43895 18.616C4.14323 18.4674 3.91848 18.2077 3.81397 17.8937C3.70946 17.5797 3.73373 17.2371 3.88145 16.941V16.941Z"
                fill="#636262"
              />
            </svg>
          </button>
        </div>

        <div
          v-if="isMobile"
          class="collection-detail__info-slot collection-detail__info-slot--mobile"
        >
          <div
            id="collection-detail-mobile-info"
            class="collection-detail__info-wrapper collection-detail__info-wrapper--mobile"
            aria-label="Informações da coleção"
          >
            <div class="collection-detail__info-inner">
              <aside v-if="isLoadingCollection" class="collection-detail__info-summary">
                <div class="collection-detail__title-skeleton" />
                <div class="collection-detail__description-skeleton" />
              </aside>
              <aside v-else class="collection-detail__info-summary">
                <h1 class="collection-detail__title">{{ collectionTitle }}</h1>
                <p class="collection-detail__description">{{ collectionDescription }}</p>
              </aside>

              <section class="collection-detail__actors">
              <div class="collection-detail__actors-title-area">
                <h2 class="collection-detail__actors-title">Coleção criada por</h2>
              </div>
              <div class="collection-detail__actors-list">
                <div class="collection-detail__actor-image-area">
                  <div
                    v-if="isLoadingOwner"
                    class="collection-detail__actor-image-skeleton"
                    aria-hidden="true"
                  />
                  <img
                    v-else
                    :src="ownerAvatarSrc"
                    :alt="`Avatar de ${ownerUser?.name?.trim() || 'usuário'}`"
                    class="collection-detail__actor-image"
                  />
                </div>
                <div class="collection-detail__actor-name-wrapper">
                  <div v-if="isLoadingOwner" class="collection-detail__actor-name-skeleton" />
                  <p
                    v-else
                    class="collection-detail__actor-name"
                    :class="{ 'collection-detail__actor-name--visible': !isLoadingOwner }"
                  >
                    {{ ownerUser?.name?.trim() || "Usuário desconhecido" }}
                  </p>
                </div>
              </div>
            </section>

            <section
              class="collection-detail__tags-block"
              aria-labelledby="collection-tags-heading"
            >
              <div class="collection-detail__tags-heading-row">
                <h2 id="collection-tags-heading" class="collection-detail__tags-title">
                  Tags na coleção
                </h2>
                <UiField
                  id="collection-tags-help"
                  class="collection-detail__help-field"
                  label="Ajuda"
                  explain="Estas etiquetas são geradas automaticamente a partir do texto da descrição da coleção."
                />
              </div>
              <div v-if="isLoadingCollectionTags" class="metadata-tags metadata-tags--skeleton">
                <span
                  v-for="n in 5"
                  :key="`tag-skeleton-${n}`"
                  class="metadata-tags__skeleton"
                  aria-hidden="true"
                />
              </div>
              <div v-else-if="collectionTags.length" class="metadata-tags">
                <button
                  v-for="(tag, index) in collectionTags"
                  :key="`${tag}-${index}`"
                  type="button"
                  class="btn btn-outline-primary btn-sm btn-tag"
                >
                  {{ tag }}
                </button>
              </div>
            </section>

            <section
              class="collection-detail__periods-block"
              aria-labelledby="collection-periods-heading"
            >
              <div class="collection-detail__periods-heading-row">
                <h2 id="collection-periods-heading" class="collection-detail__periods-title">
                  Períodos da coleção
                </h2>
                <UiField
                  id="collection-periods-help"
                  class="collection-detail__help-field"
                  label="Ajuda"
                  explain="Distribuição temporal das obras desta coleção (em construção)."
                />
              </div>
              <CollectionPeriodsChart aria-label="Gráfico de períodos da coleção" />
            </section>
            </div>
          </div>
        </div>

        <div v-if="!isMobile" class="collection-detail__info-slot">
          <div
            class="collection-detail__info-wrapper"
            :class="{ 'collection-detail__info-wrapper--closed': !isInfoActive }"
            :aria-hidden="!isInfoActive"
            aria-label="Informações da coleção"
          >
            <div class="collection-detail__info-inner">
              <aside v-if="isLoadingCollection" class="collection-detail__info-summary">
                <div class="collection-detail__title-skeleton" />
                <div class="collection-detail__description-skeleton" />
              </aside>
              <aside v-else class="collection-detail__info-summary">
                <h1 class="collection-detail__title">{{ collectionTitle }}</h1>
                <p class="collection-detail__description">{{ collectionDescription }}</p>
              </aside>

              <section class="collection-detail__actors">
                <div class="collection-detail__actors-title-area">
                  <h2 class="collection-detail__actors-title">Coleção criada por</h2>
                </div>
                <div class="collection-detail__actors-list">
                  <div class="collection-detail__actor-image-area">
                    <div
                      v-if="isLoadingOwner"
                      class="collection-detail__actor-image-skeleton"
                      aria-hidden="true"
                    />
                    <img
                      v-else
                      :src="ownerAvatarSrc"
                      :alt="`Avatar de ${ownerUser?.name?.trim() || 'usuário'}`"
                      class="collection-detail__actor-image"
                    />
                  </div>
                  <div class="collection-detail__actor-name-wrapper">
                    <div v-if="isLoadingOwner" class="collection-detail__actor-name-skeleton" />
                    <p
                      v-else
                      class="collection-detail__actor-name"
                      :class="{ 'collection-detail__actor-name--visible': !isLoadingOwner }"
                    >
                      {{ ownerUser?.name?.trim() || "Usuário desconhecido" }}
                    </p>
                  </div>
                </div>
              </section>

              <section
                class="collection-detail__tags-block"
                aria-labelledby="collection-tags-heading-desktop"
              >
                <div class="collection-detail__tags-heading-row">
                  <h2 id="collection-tags-heading-desktop" class="collection-detail__tags-title">
                    Tags na coleção
                  </h2>
                  <UiField
                    id="collection-tags-help-desktop"
                    class="collection-detail__help-field"
                    label="Ajuda"
                    explain="Estas etiquetas são geradas automaticamente a partir do texto da descrição da coleção."
                  />
                </div>
                <div v-if="isLoadingCollectionTags" class="metadata-tags metadata-tags--skeleton">
                  <span
                    v-for="n in 5"
                    :key="`tag-skeleton-desktop-${n}`"
                    class="metadata-tags__skeleton"
                    aria-hidden="true"
                  />
                </div>
                <div v-else-if="collectionTags.length" class="metadata-tags">
                  <button
                    v-for="(tag, index) in collectionTags"
                    :key="`desktop-${tag}-${index}`"
                    type="button"
                    class="btn btn-outline-primary btn-sm btn-tag"
                  >
                    {{ tag }}
                  </button>
                </div>
              </section>

              <section
                class="collection-detail__periods-block"
                aria-labelledby="collection-periods-heading-desktop"
              >
                <div class="collection-detail__periods-heading-row">
                  <h2 id="collection-periods-heading-desktop" class="collection-detail__periods-title">
                    Períodos da coleção
                  </h2>
                  <UiField
                    id="collection-periods-help-desktop"
                    class="collection-detail__help-field"
                    label="Ajuda"
                    explain="Distribuição temporal das obras desta coleção (em construção)."
                  />
                </div>
                <CollectionPeriodsChart aria-label="Gráfico de períodos da coleção" />
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  </section>
</template>

<style scoped>

.collection-detail__image-wrapper {
  flex: 1 1 0;
  min-width: 0;
  transition: flex-basis 350ms ease;
}

.collection-detail__actors {
  display: flex;
  height: 103px;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  align-self: stretch;
  padding: 0 12px;
}

.collection-detail__actors-title-area {
  display: flex;
  padding: var(--g, 12px) var(--p, 12px) 8px 0;
  align-items: center;
  gap: var(--p, 12px);
  align-self: stretch;
}

.collection-detail__actors-title {
  flex: 1 0 0;
  color: var(--Preto, #1F1F1F);
  font-family: "DM Sans";
  font-size: 20px;
  font-style: normal;
  font-weight: 500;
  line-height: 150%;
}

.collection-detail__actors-list {
  display: flex;
  align-items: center;
  gap: var(--m, 16px);
  align-self: stretch;
}

.collection-detail__actor-image-area {
  display: flex;
  width: 40px;
  height: 40px;
  justify-content: center;
  align-items: center;
  aspect-ratio: 1/1;  
  background-color: var(--Cinza_C, #A6A6A6);
  border-radius: 50%;
}

.collection-detail__actor-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  opacity: 0;
  animation: actorFadeIn 220ms ease forwards;
}

@keyframes actorFadeIn {
  to {
    opacity: 1;
  }
}

.collection-detail__actor-image-skeleton {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #e8e8e8;
  animation: skeletonPulse 1.8s ease-in-out infinite;
}

.collection-detail__actor-name {
  color: var(--Preto, #1F1F1F);
  font-family: "DM Sans";
  font-size: 16px;
  font-style: normal;
  font-weight: 500;
  line-height: 150%;
  margin: 0;
  opacity: 0;
  transform: translateY(2px);
  transition: opacity 220ms ease, transform 220ms ease;  
}

.collection-detail__actor-name--visible {
  opacity: 1;
  transform: translateY(0);
}

.collection-detail__container {
  width: 100%;
  min-height: 0;
  padding: 26px 52px 0;
  display: flex;
  flex-direction: column;
}

.collection-detail__main {
  width: 100%;
  margin-top: 16px;
  flex: 0 0 auto;
}

.collection-detail__header {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: space-between;
}

.collection-detail__back-btn {
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

.collection-detail__back-content {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.collection-detail__back-text {
  color: var(--Cinza_E, #2f2f2f);
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 150%;
}

.collection-detail__row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  margin-left: 0;
  margin-right: 0;
}

.collection-detail__gallery {
  width: 100%;
  min-height: 320px;
  border-radius: 8px;
  background: #fff;
  transition:
    transform 320ms ease,
    opacity 260ms ease;
}

.collection-detail__gallery--with-title {
  transform: translateY(0);
}

.collection-detail__main-title-area {
  width: 100%;
  max-height: 0;
  padding: 0;
  opacity: 0;
  transform: translateY(-8px);
  overflow: hidden;
  pointer-events: none;
  transition:
    max-height 360ms cubic-bezier(0.22, 1, 0.36, 1),
    padding 360ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 220ms ease,
    transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: max-height, padding, opacity, transform;
}

.collection-detail__main-title-area--visible {
  max-height: 96px;
  padding: 24px 0 16px;
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.collection-detail__main-title {
  margin: 0;
  color: var(--Cinza_E, #2f2f2f);
  font-family: "DM Sans", sans-serif;
  font-size: 30px;
  font-weight: 500;
  line-height: 115%;
}

.collection-detail__info-slot {
  display: flex;
  flex: 0 0 338px;
  width: 338px;
  max-width: 338px;
  min-width: 280px;
  height: 100%;
  align-self: stretch;
  box-sizing: border-box;
  transition:
    flex-basis 360ms cubic-bezier(0.22, 1, 0.36, 1),
    width 360ms cubic-bezier(0.22, 1, 0.36, 1),
    max-width 360ms cubic-bezier(0.22, 1, 0.36, 1),
    min-width 360ms cubic-bezier(0.22, 1, 0.36, 1);
}

.collection-detail__info-slot:has(.collection-detail__info-wrapper--closed) {
  flex: 0 0 0;
  width: 0;
  max-width: 0;
  min-width: 0;
  overflow: hidden;
}

.collection-detail__info-wrapper {
  display: flex;
  flex: 1 1 auto;
  width: 100%;
  height: 100%;
  align-self: stretch;
  box-sizing: border-box;
  overflow: hidden;
}

.collection-detail__info-wrapper--closed:not(.collection-detail__info-wrapper--mobile) {
  flex: 0 0 0 !important;
  width: 0 !important;
  max-width: 0 !important;
  min-width: 0 !important;
  pointer-events: none;
}

.collection-detail__info-inner {
  display: flex;
  flex-direction: column;
  width: 338px;
  flex-shrink: 0;
  opacity: 1;
  transform: translateX(0);
  will-change: transform, opacity;
  transition:
    transform 360ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 160ms ease 260ms;
}

.collection-detail__info-wrapper--closed:not(.collection-detail__info-wrapper--mobile)
  .collection-detail__info-inner {
  opacity: 0;
  transform: translateX(100%);
  transition:
    transform 360ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 100ms ease;
}

.collection-detail__info-summary {
  display: flex;
  width: 100%;
  padding: 0 12px;
  flex-direction: column;
  align-items: flex-start;
}

.collection-detail__title {
  align-self: stretch;
  color: var(--Cinza_E, #2F2F2F);
  font-family: "DM Sans";
  font-size: 30px;
  font-style: normal;
  font-weight: 500;
  line-height: 115%; /* 34.5px */
}

.collection-detail__description {
  flex: 1 0 0;
  color: var(--Preto, #1F1F1F);
  font-family: "DM Sans";
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 125%; /* 17.5px */  
  padding-block: 8px;
}

.collection-detail__actor-name-skeleton {
  width: 140px;
  height: 22px;
  border-radius: 6px;
  background: #ececec;
  animation: skeletonPulse 1.8s ease-in-out infinite;
}

@keyframes skeletonPulse {
  0% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}

@media (max-width: 767px) {
  .collection-detail__container {
    min-height: auto;
    padding: 16px;
    display: block;
    overflow-x: clip;
    max-width: 100%;
    box-sizing: border-box;
  }

  .collection-detail__container--mobile .collection-detail__main {
    margin-top: 12px;
    overflow-x: clip;
    height: auto;
    max-width: 100%;
  }

  .collection-detail__row--mobile {
    flex-direction: column;
    gap: 0;
    margin-left: 0;
    margin-right: 0;
    overflow-x: clip;
    max-width: 100%;
    min-height: 100dvh;
  }

  .collection-detail__row--mobile:not(.collection-detail__row--grid-expanded) {
    min-height: 100dvh;
  }

  .collection-detail__info-slot--mobile {
    position: relative;
    flex: 0 0 auto;
    width: 100%;
    max-width: 100%;
    background: var(--Off_white, #faf9f9);
  }

  .collection-detail__mobile-stage {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 0;
    width: 100%;
  }

  .collection-detail__row--mobile:not(.collection-detail__row--grid-expanded)
    .collection-detail__mobile-stage {
    flex: 1 1 auto;
    justify-content: center;
    min-height: 48dvh;
  }

  .collection-detail__row--grid-expanded {
    min-height: auto;
  }

  .collection-detail__row--grid-expanded .collection-detail__mobile-stage {
    flex: none;
    justify-content: flex-start;
    min-height: 0;
  }

  .collection-detail__row--grid-expanded .collection-detail__info-slot--mobile {
    flex: none;
  }

  .collection-detail__mobile-handle {
    flex: 0 0 auto;
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: center;
    align-self: stretch;
    gap: 8px;
    padding: 12px 0;
    margin: 0;
    border: none;
    background: #fff;
    cursor: pointer;
  }

  .collection-detail__mobile-handle-icon {
    display: flex;
    width: 40px;
    height: 40px;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1 / 1;
    transform: rotate(0deg);
    transition: transform 280ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  .collection-detail__mobile-handle-icon--expanded {
    transform: rotate(180deg);
  }

  .collection-detail__image-wrapper--mobile {
    flex: 0 1 auto;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow: hidden;
    box-sizing: border-box;
    transition: max-height 400ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  .collection-detail__image-wrapper--mobile .collection-detail__gallery {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
    overflow: visible;
    height: auto;
  }

  .collection-detail__image-wrapper--grid-collapsed {
    max-height: 38dvh;
  }

  .collection-detail__image-wrapper--grid-expanded {
    max-height: none;
    overflow: visible;
    flex: none;
  }

  .collection-detail__info-wrapper--mobile {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    overflow: visible;
    background: #fff;
  }

  .collection-detail__info-wrapper--mobile .collection-detail__info-inner {
    width: 100%;
    max-width: 100%;
    display: flex;
    flex-direction: column;
    opacity: 1;
    transform: none;
    overflow: visible;
  }

  .collection-detail__container--mobile .collection-detail__title {
    font-size: 24px;
  }

  .collection-detail__info-slot--mobile,
  .collection-detail__info-wrapper--mobile,
  .collection-detail__info-summary,
  .collection-detail__tags-block,
  .collection-detail__periods-block,
  .collection-detail__actors {
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
  }

  .metadata-tags {
    max-width: 100%;
  }
}

@media (min-width: 768px) {
  .collection-detail__mobile-handle {
    display: none;
  }
}

.collection-detail__tags-block {
  display: flex;
  max-width: 600px;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--p, 8px);
  align-self: stretch;
  padding: 0 12px;
}

.collection-detail__tags-heading-row {
  display: flex;
  padding: var(--g, 22px) var(--p, 12px) 8px 0;
  align-items: center;
  gap: var(--p, 12px);
  align-self: stretch;
}

.collection-detail__tags-title {
  margin: 0;
  flex: 1 0 0;
  color: var(--Preto, #1f1f1f);
  font-family: "DM Sans", sans-serif;
  font-size: 20px;
  font-weight: 500;
  line-height: 150%;
}

.collection-detail__help-field {
  width: auto;
}

.collection-detail__help-field :deep(.form-label) {
  display: none;
}

.collection-detail__help-field :deep(.mb-1) {
  margin-bottom: 0 !important;
}

.collection-detail__help-field :deep([data-cy="explain-icon"]) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.collection-detail__help-field :deep([data-cy="explain-icon"] svg) {
  width: 12px;
  height: 12px;
}

.metadata-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  max-width: 395px;
}

.metadata-tags--skeleton {
  width: 100%;
}

.metadata-tags__skeleton {
  display: inline-flex;
  width: 72px;
  height: 34px;
  border-radius: 2px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: collectionTagsSkeletonShimmer 1.5s infinite;
}

.metadata-tags__skeleton:nth-child(2) {
  width: 96px;
}

.metadata-tags__skeleton:nth-child(3) {
  width: 82px;
}

.metadata-tags__skeleton:nth-child(4) {
  width: 110px;
}

.metadata-tags__skeleton:nth-child(5) {
  width: 68px;
}

@keyframes collectionTagsSkeletonShimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

.metadata-tags .btn-tag {
  height: 34px;
  padding: 4px 8px;
  align-items: center;
  gap: 9px;
  display: flex;
  border-radius: 2px;
  border: 1px solid var(--Laranja_E, #AA4F28);
  font-family: "DM Sans";
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 115%;
}

.collection-detail__periods-block {
  display: flex;
  max-width: 600px;
  flex-direction: column;
  align-items: flex-start;
  align-self: stretch;
  padding: 0 12px;
}

.collection-detail__periods-heading-row {
  display: flex;
  padding: var(--g, 24px) var(--p, 12px) 8px 0;
  align-items: center;
  gap: var(--p, 12px);
  align-self: stretch;
}

.collection-detail__periods-title {
  flex: 1 0 0;
  color: var(--Preto, #1F1F1F);
  font-family: "DM Sans";
  font-size: 20px;
  font-style: normal;
  font-weight: 500;
  line-height: 150%;
}

.collection-detail__floating-toolbar {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  z-index: 100;
}

@media (max-width: 767px) {
  .collection-detail__floating-toolbar {
    display: none;
  }
}

.collection-detail__title-skeleton {
  width: 80%;
  height: 34px;
  border-radius: 6px;
  background: #ececec;
  animation: skeletonPulse 1.8s ease-in-out infinite;
}

.collection-detail__description-skeleton {
  width: 100%;
  height: 72px;
  margin-top: 12px;
  border-radius: 6px;
  background: #ececec;
  animation: skeletonPulse 1.8s ease-in-out infinite;
}

</style>