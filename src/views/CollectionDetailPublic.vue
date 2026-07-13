<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth";
import { useAlbumsStore } from "@/store/albums";
import { useCollectivesStore } from "@/store/collectives";
import { useUsersStore } from "@/store/users";
import collectiveImageDefault from "@/assets/collective_image.png";
import defaultProfileImage from "@/assets/profile_image.png";
import CollectionImagesGrid from "@/components/collection/CollectionImagesGrid.vue";
import CollectionImagesMosaic from "@/components/collection/CollectionImagesMosaic.vue";
import CollectionToolbar from "@/components/CollectionToolbar.vue";
import DownloadModal from "@/components/imageDetail/DownloadModal.vue";
import UiField from "@/components/ui/UiField.vue";
import {
  viewRouteToSelection,
  selectionToViewRoute,
  selectionToViewMode,
} from "@/constants/viewModes";
import { api } from "@/services/api";
import { downloadCollectionAsZip } from "@/helpers/downloadCollectionZip";
import { sanitizeDownloadFilename } from "@/helpers/downloadImage";

defineOptions({ name: "CollectionDetailPublic" });

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const albumsStore = useAlbumsStore();
const collectivesStore = useCollectivesStore();
const usersStore = useUsersStore();

const API_BASE_URL = import.meta.env.VITE_BASE_REQUEST_URL;
const MOBILE_BREAKPOINT = 768;

const collectionId = computed(() => route.params.collectionId);

// Para visitantes não logados não enviamos header de autorização.
const userAuthHeader = computed(() =>
  authStore.isLoggedIn ? authStore.authHeader : null
);

const albumData = ref(null);
const collectionImages = ref([]);
const collective = ref(null);
const ownerUser = ref(null);
const isLoadingCollection = ref(true);
const isLoadingOwner = ref(true);
// null = ok | "forbidden" | "notfound" | "error"
const accessState = ref(null);

const isMobile = ref(
  typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT
);

function updateIsMobile() {
  isMobile.value = window.innerWidth < MOBILE_BREAKPOINT;
}

const collectionTitle = computed(() => albumData.value?.title?.trim() || "Sem título");
const collectionDescription = computed(
  () => albumData.value?.description?.trim() || "Sem descrição."
);

// O dono do álbum é polimórfico: coletivo (collective_id) ou usuário (user_id).
const isCollectiveOwned = computed(() => !!albumData.value?.collective_id);

const ownerAvatarSrc = computed(() => {
  const source = isCollectiveOwned.value ? collective.value : ownerUser.value;
  const avatarUrl = source?.avatar_url;
  const avatarPath = source?.avatar_path;
  if (avatarUrl) {
    return avatarUrl.startsWith("http") ? avatarUrl : `${API_BASE_URL}${avatarUrl}`;
  }
  if (avatarPath) {
    return `${API_BASE_URL}/storage/${avatarPath}`;
  }
  return isCollectiveOwned.value ? collectiveImageDefault : defaultProfileImage;
});

const ownerName = computed(() => {
  if (isCollectiveOwned.value) return collective.value?.name?.trim() || "Coletivo";
  return ownerUser.value?.name?.trim() || "Usuário";
});

const ownerTitle = computed(() =>
  isCollectiveOwned.value ? "Coleção do coletivo" : "Coleção criada por"
);

// Quem pode gerenciar (remover imagens): membro (coletivo) ou dono (usuário).
const canManage = computed(() => {
  const user = authStore.loggedUser;
  if (!authStore.isLoggedIn || !user || !albumData.value) return false;
  if (albumData.value.collective_id) {
    return collective.value?.members?.some((m) => m.id === user.id) ?? false;
  }
  return albumData.value.user_id === user.id;
});

// Rota da página do dono (coletivo ou perfil de usuário).
function ownerRoute() {
  if (!albumData.value) return null;
  if (albumData.value.collective_id) {
    return { name: "collective-detail", params: { id: albumData.value.collective_id } };
  }
  if (albumData.value.user_id) {
    return { name: "view-profile", params: { id: albumData.value.user_id } };
  }
  return null;
}

// Busca os dados da coleção, tratando o acesso (403/404).
async function fetchCollectionData() {
  if (!collectionId.value) return;

  isLoadingCollection.value = true;
  isLoadingOwner.value = true;
  accessState.value = null;

  const result = await albumsStore.getAlbumDetail(userAuthHeader.value, collectionId.value);

  if (!result.success) {
    albumData.value = null;
    collectionImages.value = [];
    collectionTags.value = [];
    isLoadingCollectionTags.value = false;
    isLoadingOwner.value = false;
    if (result.status === 403) {
      accessState.value = "forbidden";
    } else if (result.status === 404) {
      accessState.value = "notfound";
    } else {
      accessState.value = "error";
    }
    isLoadingCollection.value = false;
    return;
  }

  albumData.value = result.data;
  await loadCollectionImageDetails(result.data.images || []);
  loadCollectionTags();
  isLoadingCollection.value = false;

  // Resolve o dono conforme o tipo do álbum.
  if (result.data.collective_id) {
    fetchCollective(result.data.collective_id);
  } else if (result.data.user_id) {
    fetchOwnerUser(result.data.user_id);
  } else {
    isLoadingOwner.value = false;
  }
}

// Busca os dados do coletivo dono (nome, avatar, membros).
async function fetchCollective(id) {
  isLoadingOwner.value = true;
  try {
    const result = await collectivesStore.getCollective(id);
    collective.value = result.success ? result.data : null;
  } finally {
    isLoadingOwner.value = false;
  }
}

// Busca os dados do usuário dono.
async function fetchOwnerUser(userId) {
  isLoadingOwner.value = true;
  try {
    ownerUser.value = await usersStore.getUser(userId);
  } catch (e) {
    ownerUser.value = null;
  } finally {
    isLoadingOwner.value = false;
  }
}

// Carrega os detalhes das imagens, ordenadas pela position do pivot.
async function loadCollectionImageDetails(imagesFromAlbum = []) {
  const ordered = [...imagesFromAlbum].sort((a, b) => {
    const pa = a?.pivot?.position ?? Number.MAX_SAFE_INTEGER;
    const pb = b?.pivot?.position ?? Number.MAX_SAFE_INTEGER;
    return pa - pb;
  });

  if (!ordered.length) {
    collectionImages.value = [];
    return;
  }

  try {
    collectionImages.value = await Promise.all(
      ordered.map((img) => api.getImageDetails(img.id))
    );
  } catch (err) {
    console.error("Erro ao carregar imagens da coleção:", err);
    collectionImages.value = [];
  }
}

/**
 * Remoção de imagem (apenas quem pode gerenciar)
 */
const selectedImageId = ref(null);
const removingImageId = ref(null);

function onCardActivate(item, event) {
  // Só quem gerencia pode selecionar um card (e ver a ação de remover).
  if (!canManage.value) return;
  const target = event?.target;
  if (target?.closest?.("button,a")) return;
  selectedImageId.value = selectedImageId.value === item.id ? null : item.id;
}

async function removeImageFromCollection(imageId) {
  if (!canManage.value || !collectionId.value || !imageId) return;

  removingImageId.value = imageId;
  try {
    await albumsStore.removeImagesFromAlbum(
      authStore.authHeader,
      collectionId.value,
      imageId
    );
    collectionImages.value = collectionImages.value.filter((img) => img.id !== imageId);
    if (selectedImageId.value === imageId) selectedImageId.value = null;
    if (albumData.value?.images?.length) {
      albumData.value.images = albumData.value.images.filter((img) => img.id !== imageId);
    }
  } catch (err) {
    console.error(err);
  } finally {
    removingImageId.value = null;
  }
}

/**
 * Toolbar / modos de visualização
 */
const viewSelection = computed(() => viewRouteToSelection(route.params.viewMode));
const collectionViewMode = computed(() => selectionToViewMode(viewSelection.value));
const isInfoActive = ref(true);

function handleCollectionViewChange({ selection }) {
  if (isMobile.value && selection === "mosaic") return;
  const viewMode = selectionToViewRoute(selection);
  if (viewMode === route.params.viewMode) return;
  router.push({
    name: "collection-detail",
    params: { collectionId: collectionId.value, viewMode },
  });
}

function handleToggleCollectionInfo() {
  if (isMobile.value) return;
  isInfoActive.value = !isInfoActive.value;
}

/**
 * Tags (tolerante a falha — visitantes podem não ter acesso)
 */
const collectionTags = ref([]);
const isLoadingCollectionTags = ref(true);

function normalizeCollectionTags(tags = []) {
  return tags.map((tag) => tag.term).slice(0, 8);
}

async function loadCollectionTags() {
  if (!collectionId.value) {
    collectionTags.value = [];
    isLoadingCollectionTags.value = false;
    return;
  }
  isLoadingCollectionTags.value = true;
  try {
    const data = await albumsStore.getTagsByAlbumId(userAuthHeader.value, collectionId.value);
    collectionTags.value = normalizeCollectionTags(data.tags ?? data);
  } catch (error) {
    collectionTags.value = [];
  } finally {
    isLoadingCollectionTags.value = false;
  }
}

/**
 * Download
 */
const showDownloadModal = ref(false);
const downloadingCollection = ref(false);

function handleDownloadCollection() {
  if (!collectionImages.value.length) return;
  showDownloadModal.value = true;
}

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

// "Voltar": retorna à página anterior se houver histórico interno;
// senão, cai na página do dono (coletivo/perfil) derivada do álbum.
function goBack() {
  if (window.history.state?.back) {
    router.back();
    return;
  }
  const target = ownerRoute();
  if (target) router.push(target);
  else router.push("/");
}

// Link explícito para a página do dono (clique no nome).
function goToOwner() {
  const target = ownerRoute();
  if (target) router.push(target);
}

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
  () => fetchCollectionData()
);

// Mosaico não é suportado no mobile: força grid.
watch(
  [isMobile, () => route.params.viewMode],
  ([mobile, viewMode]) => {
    if (!mobile || viewMode !== "mosaic" || !collectionId.value) return;
    router.replace({
      name: "collection-detail",
      params: { collectionId: collectionId.value, viewMode: "grid" },
    });
  },
  { immediate: true }
);
</script>

<template>
  <section class="ccd__container" :class="{ 'ccd__container--mobile': isMobile }">
    <CollectionToolbar
      v-if="!isMobile && !accessState"
      class="ccd__floating-toolbar"
      :view-selection="viewSelection"
      :is-info-active="isInfoActive"
      :allowed-views="['grid', 'mosaic']"
      @view-change="handleCollectionViewChange"
      @toggle-info="handleToggleCollectionInfo"
      @download="handleDownloadCollection"
    />

    <DownloadModal
      v-model="showDownloadModal"
      :collection-count="collectionImages.length"
      :busy="downloadingCollection"
      @confirm="handleCollectionDownloadConfirm"
    />

    <header class="ccd__header">
      <button
        type="button"
        class="ccd__back-btn"
        aria-label="Voltar"
        @click="goBack"
      >
        <i class="bi bi-arrow-left" aria-hidden="true"></i>
        <span class="ccd__back-text">voltar</span>
      </button>
    </header>

    <!-- Estados de acesso -->
    <div
      v-if="accessState === 'forbidden'"
      class="ccd__state alert alert-dark bg-off-white alert-light border border-dark border-start-3 d-inline-flex align-items-center px-3 py-2"
      role="status"
    >
      <i class="bi bi-lock-fill text-dark me-2"></i>
      <span>Esta coleção é privada e você não tem permissão para visualizá-la.</span>
    </div>

    <div
      v-else-if="accessState === 'notfound'"
      class="ccd__state alert alert-dark bg-off-white alert-light border border-dark border-start-3 d-inline-flex align-items-center px-3 py-2"
      role="status"
    >
      <i class="bi bi-exclamation-circle-fill text-dark me-2"></i>
      <span>Coleção não encontrada.</span>
    </div>

    <div
      v-else-if="accessState === 'error'"
      class="ccd__state ccd__state--error"
      role="alert"
    >
      Não foi possível carregar a coleção. Tente novamente.
    </div>

    <main v-else class="ccd__main">
      <div class="ccd__layout" :class="{ 'ccd__layout--mobile': isMobile }">
        <!-- Galeria -->
        <section class="ccd__gallery">
          <CollectionImagesGrid
            v-if="collectionViewMode === 'grid'"
            :images="collectionImages"
            :is-loading="isLoadingCollection"
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

        <!-- Painel de informações -->
        <aside
          v-if="isMobile || isInfoActive"
          class="ccd__info"
          aria-label="Informações da coleção"
        >
          <div v-if="isLoadingCollection" class="ccd__info-summary">
            <div class="ccd__title-skeleton" />
            <div class="ccd__description-skeleton" />
          </div>
          <div v-else class="ccd__info-summary">
            <h1 class="ccd__title">{{ collectionTitle }}</h1>
            <p class="ccd__description">{{ collectionDescription }}</p>
          </div>

          <section class="ccd__owner">
            <h2 class="ccd__owner-title">{{ ownerTitle }}</h2>
            <div class="ccd__owner-row">
              <div class="ccd__owner-avatar-area">
                <div
                  v-if="isLoadingOwner"
                  class="ccd__owner-avatar-skeleton"
                  aria-hidden="true"
                />
                <img
                  v-else
                  :src="ownerAvatarSrc"
                  :alt="`Avatar de ${ownerName}`"
                  class="ccd__owner-avatar"
                />
              </div>
              <div v-if="isLoadingOwner" class="ccd__owner-name-skeleton" aria-hidden="true" />
              <button
                v-else
                type="button"
                class="ccd__owner-name ccd__owner-name--visible"
                @click="goToOwner"
              >
                {{ ownerName }}
              </button>
            </div>
          </section>

          <section class="ccd__tags" aria-labelledby="ccd-tags-heading">
            <div class="ccd__tags-heading-row">
              <h2 id="ccd-tags-heading" class="ccd__tags-title">Tags na coleção</h2>
              <UiField
                id="ccd-tags-help"
                class="ccd__help-field"
                label="Ajuda"
                explain="Estas etiquetas são coletadas de cada imagem presente na coleção."
              />
            </div>
            <div v-if="isLoadingCollectionTags" class="ccd__tags-list ccd__tags-list--skeleton">
              <span v-for="n in 5" :key="`tag-skeleton-${n}`" class="ccd__tag-skeleton" aria-hidden="true" />
            </div>
            <div v-else-if="collectionTags.length" class="ccd__tags-list">
              <button
                v-for="(tag, index) in collectionTags"
                :key="`${tag}-${index}`"
                type="button"
                class="btn btn-outline-primary btn-sm ccd__tag"
              >
                {{ tag }}
              </button>
            </div>
            <p v-else class="ccd__tags-empty">Sem tags.</p>
          </section>
        </aside>
      </div>
    </main>
  </section>
</template>

<style scoped>
.ccd__container {
  width: 100%;
  padding: 26px 52px 0;
  display: flex;
  flex-direction: column;
}

.ccd__header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.ccd__back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 14px;
  border-radius: 5px;
  border: 1px solid var(--Cinza_E, #2f2f2f);
  background: var(--Off_white, #faf9f9);
  cursor: pointer;
}

.ccd__back-text {
  color: var(--Cinza_E, #2f2f2f);
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 150%;
}

.ccd__state {
  margin-top: 8px;
}

.ccd__state--error {
  color: #7a1c1c;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
}

.ccd__main {
  width: 100%;
}

.ccd__layout {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  width: 100%;
}

.ccd__layout--mobile {
  flex-direction: column;
  gap: 16px;
}

.ccd__gallery {
  flex: 1 1 0;
  min-width: 0;
  min-height: 320px;
  border-radius: 8px;
  background: #fff;
}

.ccd__info {
  flex: 0 0 338px;
  width: 338px;
  max-width: 338px;
  display: flex;
  flex-direction: column;
}

.ccd__layout--mobile .ccd__info {
  flex: none;
  width: 100%;
  max-width: 100%;
}

.ccd__info-summary {
  display: flex;
  flex-direction: column;
  padding: 0 12px;
}

.ccd__title {
  color: var(--Cinza_E, #2f2f2f);
  font-family: "DM Sans", sans-serif;
  font-size: 30px;
  font-weight: 500;
  line-height: 115%;
  margin: 0;
}

.ccd__description {
  color: var(--Preto, #1f1f1f);
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 125%;
  padding-block: 8px;
  margin: 0;
}

.ccd__owner {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 12px 0;
}

.ccd__owner-title {
  color: var(--Preto, #1f1f1f);
  font-family: "DM Sans", sans-serif;
  font-size: 20px;
  font-weight: 500;
  line-height: 150%;
  margin: 0;
}

.ccd__owner-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.ccd__owner-avatar-area {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 50%;
  background-color: var(--Cinza_C, #a6a6a6);
  overflow: hidden;
}

.ccd__owner-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  opacity: 0;
  animation: ccdActorFadeIn 220ms ease forwards;
}

@keyframes ccdActorFadeIn {
  to { opacity: 1; }
}

.ccd__owner-avatar-skeleton {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #e8e8e8;
  animation: ccdPulse 1.8s ease-in-out infinite;
}

.ccd__owner-name-skeleton {
  width: 140px;
  height: 22px;
  border-radius: 6px;
  background: #ececec;
  animation: ccdPulse 1.8s ease-in-out infinite;
}

.ccd__owner-name {
  border: none;
  background: transparent;
  padding: 0;
  color: var(--Preto, #1f1f1f);
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 150%;
  cursor: pointer;
  text-align: left;
  opacity: 0;
  transform: translateY(2px);
  transition: opacity 220ms ease, transform 220ms ease;
}

.ccd__owner-name--visible {
  opacity: 1;
  transform: translateY(0);
}

.ccd__owner-name:hover {
  text-decoration: underline;
}

.ccd__tags {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 22px 12px 0;
  max-width: 600px;
}

.ccd__tags-heading-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ccd__tags-title {
  flex: 1 0 0;
  color: var(--Preto, #1f1f1f);
  font-family: "DM Sans", sans-serif;
  font-size: 20px;
  font-weight: 500;
  line-height: 150%;
  margin: 0;
}

.ccd__help-field {
  width: auto;
}

.ccd__help-field :deep(.form-label) {
  display: none;
}

.ccd__help-field :deep(.mb-1) {
  margin-bottom: 0 !important;
}

.ccd__tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.ccd__tag {
  height: 34px;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  border-radius: 2px;
  border: 1px solid var(--Laranja_E, #aa4f28);
  font-family: "DM Sans", sans-serif;
  font-size: 12px;
  font-weight: 400;
  line-height: 115%;
}

.ccd__tag-skeleton {
  display: inline-flex;
  width: 72px;
  height: 34px;
  border-radius: 2px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: ccdShimmer 1.5s infinite;
}

.ccd__tag-skeleton:nth-child(2) { width: 96px; }
.ccd__tag-skeleton:nth-child(3) { width: 82px; }
.ccd__tag-skeleton:nth-child(4) { width: 110px; }
.ccd__tag-skeleton:nth-child(5) { width: 68px; }

@keyframes ccdShimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.ccd__tags-empty {
  color: #636262;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  margin: 0;
}

.ccd__title-skeleton {
  width: 80%;
  height: 34px;
  border-radius: 6px;
  background: #ececec;
  animation: ccdPulse 1.8s ease-in-out infinite;
}

.ccd__description-skeleton {
  width: 100%;
  height: 72px;
  margin-top: 12px;
  border-radius: 6px;
  background: #ececec;
  animation: ccdPulse 1.8s ease-in-out infinite;
}

@keyframes ccdPulse {
  0% { opacity: 0.6; }
  100% { opacity: 1; }
}

.ccd__floating-toolbar {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  z-index: 100;
}

@media (max-width: 767px) {
  .ccd__container {
    padding: 16px;
  }

  .ccd__floating-toolbar {
    display: none;
  }

  .ccd__title {
    font-size: 24px;
  }
}
</style>
