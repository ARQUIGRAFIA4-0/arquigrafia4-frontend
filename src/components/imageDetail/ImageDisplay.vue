<script setup>
import { ref, computed, nextTick, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/store/auth";
import { useAlbumsStore } from "@/store/albums";
import DownloadModal from "./DownloadModal.vue";
import ReportModal from "./ReportModal.vue";
import ShareModal from "./ShareModal.vue";
import FavoriteAddedModal from "./FavoriteAddedModal.vue";
import AlbumPickerModal from "./AlbumPickerModal.vue";
import CollectionCreateModal from "../CollectionCreateModal.vue";
import { downloadImageFile } from "@/helpers/downloadImage";

const authStore = useAuthStore();
const albumsStore = useAlbumsStore();
const { isLoggedIn, authHeader, loggedUser } = storeToRefs(authStore);

const API_BASE_URL = import.meta.env.VITE_BASE_REQUEST_URL;

const getInitials = (name) => name?.charAt(0).toUpperCase() || "?";

const resolveAvatarUrl = (entity) => {
  if (!entity) return null;
  if (entity.avatar_url) {
    return entity.avatar_url.startsWith("http")
      ? entity.avatar_url
      : `${API_BASE_URL}${entity.avatar_url}`;
  }
  if (entity.avatar_path) {
    return `${API_BASE_URL}/storage/${entity.avatar_path}`;
  }
  return null;
};

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
const showFavoriteModal = ref(false);

/**
 * Start: Lightbox (visualização em tamanho grande)
 * Placeholder até a futura implementação de viewer IIIF.
 */
const showLightbox = ref(false);

function onLightboxKeydown(event) {
  if (event.key === "Escape") {
    closeLightbox();
  }
}

function openLightbox() {
  if (!props.image) return;
  showLightbox.value = true;
  document.addEventListener("keydown", onLightboxKeydown);
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  showLightbox.value = false;
  document.removeEventListener("keydown", onLightboxKeydown);
  document.body.style.overflow = "";
}
/**
 * End: Lightbox
 */

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
const loadingAlbums = ref(false);

// Escopos de coleção: o usuário + os coletivos dos quais ele faz parte
const collectionScopes = computed(() => {
  if (!loggedUser.value) return [];
  const u = loggedUser.value;
  const scopes = [
    {
      id: u.id,
      type: "user",
      name: u.name || u.username,
      avatar: resolveAvatarUrl(u),
      initials: u.initials || getInitials(u.name || u.username),
    },
  ];
  for (const c of u.collectives ?? []) {
    scopes.push({
      id: c.id,
      type: "collective",
      name: c.name,
      avatar: resolveAvatarUrl(c),
      initials: getInitials(c.name),
    });
  }
  return scopes;
});

const selectedScopeId = ref(null);
const selectedScope = computed(
  () =>
    collectionScopes.value.find((s) => s.id === selectedScopeId.value) ??
    collectionScopes.value[0] ??
    null
);

// Busca os álbuns do escopo (usuário ou coletivo)
async function loadAlbumsForScope(scope) {
  if (!scope) return;
  loadingAlbums.value = true;
  try {
    const response =
      scope.type === "collective"
        ? await albumsStore.getCollectiveAlbums(authHeader.value, scope.id)
        : await albumsStore.getUserAlbums(authHeader.value, scope.id);
    loadedAlbums.value = Array.isArray(response) ? response : response?.data ?? [];
  } catch (e) {
    console.error("Erro ao buscar álbuns:", e);
    loadedAlbums.value = [];
  } finally {
    loadingAlbums.value = false;
  }
}

/**
 * Start: Adicionar imagem a coleção de Favoritos
 */
const FAVORITES_COLLECTION_TITLE = "Favoritos";

// Normaliza o título para comparação case-insensitive.
const normalizeAlbumTitle = (title) => String(title || "").trim().toLocaleLowerCase("pt-BR");

// Verifica se o álbum já contém a imagem atual.
const albumContainsImage = (album, imageId) => Array.isArray(album?.images) && album.images.some((img) => img?.id === imageId);

// Garante a coleção "Favoritos" e adiciona a imagem nela.
// Retorna: "created" / "added" / "exists" / null
async function addImageToFavoritesCollection() {

  // verifica se o usuário está logado
  if (!isLoggedIn.value || !loggedUser.value?.id) {
    console.warn("Sem usuário logado ou sem id:", {
      isLoggedIn: isLoggedIn.value,
      loggedUser: loggedUser.value,
    });

    return null;

  }

  if (!props.image?.id) return null;

  const imageId = props.image.id;
  const userId = loggedUser.value.id;

  try {
    selectedScopeId.value = collectionScopes.value[0]?.id ?? userId;
    await loadAlbumsForScope(selectedScope.value);

    // verifica se a coleção de Favoritos existe
    let favoritesAlbum = loadedAlbums.value.find(
      (album) => normalizeAlbumTitle(album.title) === normalizeAlbumTitle(FAVORITES_COLLECTION_TITLE)
    );

    let created = false;

    // cria a coleção de Favoritos se não existir
    if (!favoritesAlbum) {
      favoritesAlbum = await albumsStore.createAlbum(authHeader.value, {
        title: FAVORITES_COLLECTION_TITLE,
        description: "",
        is_private: false,
      });
      created = true;

      // recarrega as coleções do escopo atual para atualizar a lista de álbuns
      await loadAlbumsForScope(selectedScope.value);

      favoritesAlbum =
        loadedAlbums.value.find(
          (album) => normalizeAlbumTitle(album.title) === normalizeAlbumTitle(FAVORITES_COLLECTION_TITLE)
        ) ?? favoritesAlbum;
    }

    // obtém o id da coleção de Favoritos 
    const albumId = favoritesAlbum?.id;

    // verifica se a coleção de Favoritos existe
    if (!albumId) {
      throw new Error("Não foi possível obter a coleção Favoritos.");
    }

    if (albumContainsImage(favoritesAlbum, imageId)) {
      return "exists";
    }

    await albumsStore.addImageToAlbum(authHeader.value, albumId, imageId);
    await loadAlbumsForScope(selectedScope.value);

    return created ? "created" : "added";
  } catch (error) {
    console.error("Erro ao adicionar imagem aos Favoritos:", error);
    return null;
  }
}

// Clique no botão do modal: cria/usa Favoritos e adiciona a imagem.
async function onFavoriteAddToCollection() {
  const result = await addImageToFavoritesCollection();
  if (!result) return;

  if (addToAlbumToastTimeout) {
    clearTimeout(addToAlbumToastTimeout);
  }

  if (result === "exists") {
    addToAlbumToastMessage.value =
      "A imagem já está na coleção Favoritos.";
  } else {
    addToAlbumToastMessage.value =
      "A imagem foi adicionada à coleção Favoritos.";
  }

  showAddToAlbumToast.value = true;
  addToAlbumToastTimeout = setTimeout(() => {
    showAddToAlbumToast.value = false;
    addToAlbumToastTimeout = null;
  }, 4400);
}

/**
 * End: Adicionar imagem a coleção de Favoritos
 */

// Abre o seletor de coleção no escopo do usuário
async function openAlbumPicker() {
  if (!isLoggedIn.value || !loggedUser.value?.id) {
    console.warn("Sem usuário logado ou sem id:", { isLoggedIn: isLoggedIn.value, loggedUser: loggedUser.value });
    return;
  }
  selectedScopeId.value = collectionScopes.value[0]?.id ?? null;
  await loadAlbumsForScope(selectedScope.value);
  showAlbumPicker.value = true;
}

// Troca o escopo selecionado e recarrega os álbuns
async function onScopeChange(scope) {
  if (!scope) return;
  selectedScopeId.value = scope.id;
  await loadAlbumsForScope(scope);
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
  document.removeEventListener("keydown", onLightboxKeydown);
  document.body.style.overflow = "";
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

    // recarrega coleções do escopo atual para atualizar a lista de álbuns
    await loadAlbumsForScope(selectedScope.value);

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

// Após criar coleção, buscar os álbuns do escopo atual
async function onCollectionCreated() {
  // fecha modal de criação (nome correto da ref)
  showCollectionCreateModal.value = false;

  // recarrega coleções do escopo atual
  await loadAlbumsForScope(selectedScope.value);

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
        @click="showFavoriteModal = true"
      >
        <i class="bi bi-heart" aria-hidden="true" />
      </button>
      <button
        type="button"
        class="menu-button"
        aria-label="Adicionar a coleção"
        @click="openAlbumPicker"
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
      <button
        type="button"
        class="menu-button"
        aria-label="Ver imagem em tamanho grande"
        @click="openLightbox"
      >
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

      <FavoriteAddedModal
        v-model="showFavoriteModal"
        @add-to-collection="onFavoriteAddToCollection"
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
        :scopes="collectionScopes"
        :selected-scope-id="selectedScope?.id"
        :loading-albums="loadingAlbums"
        @change-scope="onScopeChange"
        @open-create-collection="onCollectionCreateModalOpen"
        @confirm-add="onAlbumPickerConfirmAdd"
      />

      <CollectionCreateModal
        v-model="showCollectionCreateModal"
        :user-data="selectedScope?.type === 'user' ? loggedUser : null"
        :collective-id="selectedScope?.type === 'collective' ? selectedScope.id : null"
        @created="onCollectionCreated"
      />

      <transition name="lightbox-fade">
        <div
          v-if="showLightbox && props.image"
          class="image-lightbox"
          role="dialog"
          aria-modal="true"
          :aria-label="props.image.title || 'Imagem em tamanho grande'"
          @click.self="closeLightbox"
        >
          <button
            type="button"
            class="image-lightbox__close"
            aria-label="Fechar"
            @click="closeLightbox"
          >
            <i class="bi bi-x-circle-fill" aria-hidden="true"></i>
          </button>
          <img
            :src="props.image.imageUrl"
            :alt="props.image.title"
            class="image-lightbox__img"
          />
        </div>
      </transition>

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

.image-lightbox {
  position: fixed;
  inset: 0;
  z-index: 1400;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: rgba(0, 0, 0, 0.85);
  cursor: zoom-out;
}

.image-lightbox__img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
  cursor: default;
}

.image-lightbox__close {
  position: absolute;
  top: 16px;
  right: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--Branco, #fff);
  cursor: pointer;
  line-height: 1;
}

.image-lightbox__close .bi {
  font-size: 2rem;
}

.image-lightbox__close:focus-visible {
  outline: 2px solid var(--Branco, #fff);
  outline-offset: 2px;
  border-radius: 50%;
}

.lightbox-fade-enter-active,
.lightbox-fade-leave-active {
  transition: opacity 0.2s ease;
}

.lightbox-fade-enter-from,
.lightbox-fade-leave-to {
  opacity: 0;
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
