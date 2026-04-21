<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/store/auth";
import { useAlbumsStore } from "@/store/albums";
import DownloadModal from "./DownloadModal.vue";
import ReportModal from "./ReportModal.vue";
import ShareModal from "./ShareModal.vue";
import AlbumPickerModal from "./AlbumPickerModal.vue";
import CollectionCreateModal from "../CollectionCreateModal.vue";

const router = useRouter();
const authStore = useAuthStore();
const albumsStore = useAlbumsStore();
const { isLoggedIn, authHeader, loggedUser } = storeToRefs(authStore);

const props = defineProps({
  image: {
    type: Object,
    default: null,
  },
  /** Resolvido no pai (`ImageDetail`) a partir de image.rights */
  licenseInfo: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["load", "download", "share", "report-submit"]);

const showDownloadModal = ref(false);
const showReportModal = ref(false);
const showShareModal = ref(false);

const handleDownloadConfirm = async (image) => {
  const url = image.fullUrl || `https://api-dev.arquigrafia.org.br/iiif/${image.id}/full/max/0/default.jpg`;
  const filename = `${image.title || image.id}.jpg`;

  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, "_blank");
  }

  emit("download", image);
};

const handleShareConfirm = (shareData) => {
  emit("share", shareData);
};

const handleReportSubmit = (payload) => {
  emit("report-submit", payload);
};

function openIiifManifest() {
  window.open(`https://api-dev.arquigrafia.org.br/iiif/${props.image.id}/manifest`, "_blank");
}

/**
 * Start: Adicionar imagem a coleção
 */
const showAlbumPicker = ref(false);
const loadedAlbums = ref([]);

// Função para buscar os álbuns do usuário
async function loadMyAlbums() {
  const userId = loggedUser.value?.id;
  if (!isLoggedIn.value || !userId) {
    console.warn("Sem usuário logado ou sem id:", { isLoggedIn: isLoggedIn.value, loggedUser: loggedUser.value });
    return;
  }

  try {
    const response = await albumsStore.getUserAlbums(authHeader.value, userId);
    const list = Array.isArray(response) ? response : response?.data ?? [];
    console.log("list", list);
    loadedAlbums.value = list;
    showAlbumPicker.value = true;

  } catch (e) {
    console.error("Erro ao buscar álbuns:", e);
    showAlbumPicker.value = false;

  }

}

function onAlbumPickerAddCollection() {
  showAlbumPicker.value = false;
  router.push({ name: "my-profile" });
}

// Confirmar adicionar imagem ao álbum
async function onAlbumPickerConfirmAdd({albumId}) {
  if (!albumId || !props.image?.id) return;

  try {

    await albumsStore.addImageToAlbum(
      authHeader.value,
      albumId,
      props.image.id
    );

    // opcional: toast/sucesso
    console.log("Imagem adicionada com sucesso ao álbum:", albumId);

  } catch (error) {
    console.error("Erro ao adicionar imagem ao álbum:", error);

  }
}

/**
 * End: Adicionar imagem a coleção
 */

/**
  * Start: Criar coleção
  */
const showCollectionCreateModal = ref(false);

function onCollectionCreateModalOpen() {
  showCollectionCreateModal.value = true;
}

// Após criar coleção, buscar os álbuns do usuário
async function onCollectionCreated(createdAlbum) {
  // fecha modal de criação (nome correto da ref)
  showCollectionCreateModal.value = false;

  // recarrega coleções do usuário
  await loadMyAlbums();

  // mantém/abre o picker de coleção
  showAlbumPicker.value = true;

}

</script>

<template>
  <div class="image-display-wrapper">
    <div class="image-container">
      <div
        v-if="props.loading"
        class="loading-overlay d-flex align-items-center justify-content-center"
      >
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
      <img
        v-if="props.image"
        :src="props.image.imageUrl"
        :alt="props.image.title"
        class="image-display"
        @load="emit('load')"
      />
    </div>
    <div v-if="props.image" class="image-actions-menu">
      <button
        type="button"
        class="menu-button"
        aria-label="Baixar imagem"
        @click="showDownloadModal = true"
      >
        <i class="bi bi-cloud-download-fill" aria-hidden="true"></i>
      </button>
      <button
        type="button"
        class="menu-button"
        aria-label="Adicionar aos favoritos"
      >
        <i class="bi bi-heart" aria-hidden="true" />
      </button>
      <button
        type="button"
        class="menu-button"
        aria-label="Adicionar a coleção"
        @click="loadMyAlbums"
      >
        <i class="bi bi-images" aria-hidden="true" />
      </button>      
      <button
        type="button"
        class="menu-button"
        aria-label="Compartilhar"
        @click="showShareModal = true"
      >
        <i class="bi bi-share-fill" aria-hidden="true"></i>
      </button>
      <button
        type="button"
        class="menu-button"
        aria-label="Abrir manifesto IIIF"
        @click="openIiifManifest"
      >
        <img src="@/assets/logo_iiif.svg" alt="IIIF logo" class="iiif-svg-icon" width="18" height="16" draggable="false" />
      </button>
      <button
        type="button"
        class="menu-button"
        aria-label="Reportar problema"
        @click="showReportModal = true"
      >
        <i class="bi bi-exclamation-circle-fill" aria-hidden="true"></i>
      </button>
      <button type="button" class="menu-button" aria-label="Modo tela cheia">
        <i class="bi bi-arrows-fullscreen"></i>
      </button>
    </div>

    <Teleport to="body">
      <DownloadModal
        v-model="showDownloadModal"
        :image="props.image"
        :license-info="licenseInfo"
        @confirm="handleDownloadConfirm"
      />

      <ShareModal
        v-model="showShareModal"
        :image="props.image"
        @confirm="handleShareConfirm"
      />

      <ReportModal
        v-model="showReportModal"
        :image="props.image"
        @submit="handleReportSubmit"
      />

      <AlbumPickerModal
        v-model="showAlbumPicker"
        :albums="loadedAlbums"
        @open-create-collection="onCollectionCreateModalOpen"
        @confirm-add="onAlbumPickerConfirmAdd"
      />

      <CollectionCreateModal
        v-model="showCollectionCreateModal"
        :user-data="loggedUser"
        @created="onCollectionCreated"
      />
    </Teleport>

  </div>
</template>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.image-display-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.image-display {
  width: 100%;
  height: auto;
  max-width: 100%;
  max-height: calc(100vh - 280px);
  max-height: calc(100dvh - 280px);
  object-fit: contain;
  display: block;
}

.image-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  max-height: calc(100vh - 280px);
  max-height: calc(100dvh - 280px);
  overflow: hidden;
  width: 100%;
  background-color: var(--Off_white);
}

.loading-overlay {
  width: 100%;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-actions-menu {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 6px;
  background-color: var(--Off_white);
  box-shadow: 2px 2px 5px 2px #00000040;
  backdrop-filter: blur(2px);
  width: 100%;
  box-sizing: border-box;
  justify-content: space-between;

  @include md {
    width: fit-content;
    box-sizing: content-box;
    justify-content: center;
  }
}

.menu-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--Cinza_E);
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
  padding-top: 4px !important;
}

.menu-button:hover {
  background-color: var(--Laranja_C);
  color: var(--Cinza_E);
}

.menu-button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.6);
}

.menu-button .bi {
  font-size: 1.2rem;
}

.iiif-svg-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.3rem;
  height: 100%;
  filter: brightness(0) saturate(100%) invert(16%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(90%) contrast(100%);
}   
</style>
