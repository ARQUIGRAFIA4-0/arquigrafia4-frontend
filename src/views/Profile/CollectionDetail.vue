<script setup>
import { computed, ref, onMounted, watch } from "vue";
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
const isLoadingCollectionImages = ref(false);

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
  isLoadingCollectionImages.value = true;  
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
    ownerUser.value = null;
    isLoadingOwner.value = false;

  } finally {
    isLoadingCollection.value = false;
    isLoadingCollectionImages.value = false;

  }

}

const collectionTags = computed(() =>
  ["Fruição urbana", "Modernismo", "Paisagem", "Coletivo", "Espaço público"]
  //collectionTagsFromDescription(albumData.value?.description ?? "")
);

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

  // Carrega as imagens detalhadas
  isLoadingCollectionImages.value = true;

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

// Muda o modo de visualização da coleção
function handleCollectionViewChange({ selection }) {
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
  isGridReflowing.value = true;

  window.setTimeout(() => {
    isInfoActive.value = !isInfoActive.value;
    window.setTimeout(() => {
      isGridReflowing.value = false;

    }, 220);

  }, 120);

}

function handleDownloadCollection() {
  console.log("TODO: implementar download da coleção");
}
/*
 * End: Toolbar
*/

onMounted(fetchCollectionData);

watch(
  () => route.params.collectionId,
  () => {
    fetchCollectionData();
  }
);

</script>

<template>
  <section
    class="collection-detail__container"
    :class="{ 'collection-detail__container--info-open': isInfoActive }"
  >
    <CollectionToolbar
      class="collection-detail__floating-toolbar"
      :view-selection="viewSelection"
      :is-info-active="isInfoActive"
      :allowed-views="['grid', 'mosaic']"
      @view-change="handleCollectionViewChange"
      @toggle-info="handleToggleCollectionInfo"
      @download="handleDownloadCollection"
    />
    <header class="collection-detail__header">
        <button
            type="button"
            class="collection-detail__back-btn"
            aria-label="Voltar"
            @click="router.push({ name: 'my-profile' })"
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
      <div class="row g-0 collection-detail__row">
        <div class="collection-detail__image-wrapper">
          <section class="collection-detail__gallery">
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
              v-if="collectionTags.length"
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
              <div class="metadata-tags">
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
}

.collection-detail__info-wrapper {
  display: flex;
  flex: 0 0 338px;
  width: 338px;
  max-width: 338px;
  min-width: 280px;
  height: 100%;
  align-self: stretch;
  box-sizing: border-box;
  overflow: hidden;
  transition:
    flex-basis 350ms ease,
    width 350ms ease,
    max-width 350ms ease,
    min-width 350ms ease;
}

.collection-detail__info-wrapper--closed {
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
    transform 350ms ease,
    opacity 1ms linear 350ms;
}

.collection-detail__info-wrapper--closed .collection-detail__info-inner {
  opacity: 0;
  transform: translateX(100%);
  transition:
    transform 350ms ease,
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
    padding: 16px;
  }

  .collection-detail__row {
    flex-direction: column;
    gap: 12px;
  }

  .collection-detail__image-wrapper,
  .collection-detail__info-wrapper {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    flex: 1 1 auto;
  }

  .collection-detail__gallery {
    min-height: 240px;
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
    bottom: 16px;
  }
  .collection-detail__container {
    padding-bottom: 88px;
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