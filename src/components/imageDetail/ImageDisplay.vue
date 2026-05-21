<script setup>
import { ref, computed, nextTick, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/store/auth";
import { useAlbumsStore } from "@/store/albums";
import DownloadModal from "./DownloadModal.vue";
import ReportModal from "./ReportModal.vue";
import ShareModal from "./ShareModal.vue";
import AlbumPickerModal from "./AlbumPickerModal.vue";
import CollectionCreateModal from "../CollectionCreateModal.vue";
import { downloadImageFile } from "@/helpers/downloadImage";

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
  await downloadImageFile(image);
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
    loadedAlbums.value = list;
    showAlbumPicker.value = true;

  } catch (e) {
    console.error("Erro ao buscar álbuns:", e);
    showAlbumPicker.value = false;

  }

}

// Toast após salvar alterações nas coleções da imagem
const showAddToAlbumToast = ref(false);
const addToAlbumToastMessage = ref("");
let addToAlbumToastTimeout = null;

function labelColecao(n) {
  return n === 1 ? "coleção" : "coleções";
}

// Mostrar toast após salvar alterações nas coleções da imagem
function showCollectionsUpdatedToast(addedCount, removedCount) {
  if (addToAlbumToastTimeout) {
    clearTimeout(addToAlbumToastTimeout);
  }

  if (addedCount > 0 && removedCount === 0) {
    addToAlbumToastMessage.value =
      "A imagem foi adicionada nas coleções selecionadas.";
  } else if (removedCount > 0 && addedCount === 0) {
    addToAlbumToastMessage.value =
      "A imagem foi removida nas coleções desmarcadas.";
  } else {
    addToAlbumToastMessage.value =
      `A imagem foi adicionada a ${addedCount} ${labelColecao(addedCount)}, ne removida em ${removedCount} ${labelColecao(removedCount)}.`;
  }

  showAddToAlbumToast.value = true;

  addToAlbumToastTimeout = setTimeout(() => {
    showAddToAlbumToast.value = false;
    addToAlbumToastTimeout = null;

  }, 4400);

}

// Limpar timeout do toast
onUnmounted(() => {
  if (addToAlbumToastTimeout) {
    clearTimeout(addToAlbumToastTimeout);
  }
});

// Confirmar adicionar imagem ao álbum
async function onAlbumPickerConfirmAdd({ albumIds }) {
  if (!Array.isArray(albumIds) || !props.image?.id) return;
  const imageId = props.image.id;

  const antes = new Set(preselectedAlbumIds.value);
  const depois = new Set(albumIds);

  const paraAdicionar = [...depois].filter((id) => !antes.has(id));
  const paraRemover = [...antes].filter((id) => !depois.has(id));

  if (!paraAdicionar.length && !paraRemover.length) return;

  try {

    // adiciona e remove as imagens dos álbuns
    await Promise.all([
      ...paraAdicionar.map((albumId) =>
        albumsStore.addImageToAlbum(authHeader.value, albumId, imageId)
      ),
      ...paraRemover.map((albumId) =>
        albumsStore.removeImagesFromAlbum(authHeader.value, albumId, imageId)
      ),
    ]);

    // recarrega coleções do usuário para atualizar a lista de álbuns
    await loadMyAlbums();

    // fecha o modal de seleção de álbuns
    showAlbumPicker.value = false;

    showCollectionsUpdatedToast(paraAdicionar.length, paraRemover.length);

  } catch (error) {
    console.error("Erro ao atualizar coleções da imagem:", error);
    
  }

}

// Pre-selecionar os álbuns que já contêm a imagem
const preselectedAlbumIds = computed(() => {

  if (!props.image?.id) return [];

  // álbuns que já contêm esta imagem
  return loadedAlbums.value
    .filter((album) =>
      album.images.some( // filtra os álbuns que contêm a imagem
        (img) => img.id === props.image?.id
      )
    )
    .map((album) => album.id);

});

/**
 * End: Adicionar imagem a coleção
 */

/**
  * Start: Criar coleção
  */
const showCollectionCreateModal = ref(false);

function onCollectionCreateModalOpen() {
  // Evita sobreposição de backdrops e garante abertura consistente
  // do modal de criação acima do picker.
  showAlbumPicker.value = false;
  nextTick(() => {
    showCollectionCreateModal.value = true;
  });
}

// Após criar coleção, buscar os álbuns do usuário
async function onCollectionCreated() {
  // fecha modal de criação (nome correto da ref)
  showCollectionCreateModal.value = false;

  // recarrega coleções do usuário
  await loadMyAlbums();

  // mantém/abre o picker de coleção
  showAlbumPicker.value = true;

}

/**
 * End: Criar coleção
 */

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
        :preselected-album-ids="preselectedAlbumIds"
        @open-create-collection="onCollectionCreateModalOpen"
        @confirm-add="onAlbumPickerConfirmAdd"
      />

      <CollectionCreateModal
        v-model="showCollectionCreateModal"
        :user-data="loggedUser"
        @created="onCollectionCreated"
      />

      <transition name="copy-toast-fade">
        <div
          v-if="showAddToAlbumToast"
          class="image-display__toast"
          role="status"
          aria-live="polite"
        >
          <i class="bi bi-check-all" aria-hidden="true" />
          <span class="image-display__toast-text">{{ addToAlbumToastMessage }}</span>
        </div>
      </transition>
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

.image-display__toast {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1300;
  display: inline-flex;
  align-items: flex-start;
  gap: 16px;
  width: max-content;
  max-width: min(520px, calc(100vw - 32px));
  box-sizing: border-box;
  padding: 12px 12px 12px 16px;
  border-radius: 4px;
  background: #356407;
  color: var(--branco, #fff);
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
}

.image-display__toast .bi {
  font-size: 16px;
  line-height: 1;
  flex-shrink: 0;
  margin-top: 2px;
}

.image-display__toast-text {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.45;
  white-space: pre-line;
  text-align: left;
  min-width: 0;
  max-width: 100%;
}

.copy-toast-fade-enter-active,
.copy-toast-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.copy-toast-fade-enter-from,
.copy-toast-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-4px);
}

@media (max-width: 767px) {
  .image-display__toast {
    top: max(12px, env(safe-area-inset-top, 0px));
    left: 50%;
    transform: translateX(-50%);
    width: calc(100vw - 20px);
    max-width: calc(100vw - 20px);
    gap: 12px;
    padding: 12px 14px;
    font-size: 14px;
    box-sizing: border-box;
  }

  .image-display__toast-text {
    font-size: 14px;
    line-height: 1.5;
  }
}

@media (max-width: 380px) {
  .image-display__toast {
    width: calc(100vw - 16px);
    max-width: calc(100vw - 16px);
    padding: 10px 12px;
    gap: 10px;
  }

  .image-display__toast-text {
    font-size: 13px;
  }
}
</style>
