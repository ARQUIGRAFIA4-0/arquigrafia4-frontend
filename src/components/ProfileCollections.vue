<script setup>
  import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
  import { useAuthStore } from "@/store/auth";
  import { useAlbumsStore } from "@/store/albums";
  import { useInitialSkeleton } from "@/composables/useInitialSkeleton";
  import UploadColectionBox from "@/components/UploadColectionBox.vue";
  import UiCard from "@/components/ui/UiCard.vue";
  import ProfileGridSkeleton from "@/components/ProfileGridSkeleton.vue";
  import TutorialModalCollections from "@/components/TutorialModalCollections.vue";
  import AlbumCoverArt from "@/components/AlbumCoverArt.vue";
  import CollectionCreateModal from "@/components/CollectionCreateModal.vue";
  import AppToast from "@/components/ui/AppToast.vue";
  import { useToast } from "@/composables/useToast";

  const showCreateModal = ref(false);
  const toast = useToast();
  const openCollectionToast = (message, type = "success") => toast.show(message, type);

import { RouterLink, useRouter } from "vue-router";
const router = useRouter();

// Props
const props = defineProps({
  isCurrentUser: { type: Boolean, default: false },
  userData: { type: Object, default: null },
});
const authStore = useAuthStore();
const albumsStore = useAlbumsStore();

const userAuthHeader = computed(() => authStore.authHeader);

const albums = ref([]);
const isLoadingAlbums = ref(false);
const albumsError = ref(null);

// Para visitantes (perfil público) só exibimos coleções públicas.
// O próprio dono continua vendo todas as suas coleções.
const visibleAlbums = computed(() =>
  props.isCurrentUser
    ? albums.value
    : albums.value.filter((album) => !album.is_private),
);

const showTutorialModal = ref(false);
const expandedAlbumId = ref(null);

const {
  hasLoaded: hasLoadedAlbums,
  finishInitialLoad,
  reset: resetInitialSkeleton,
} = useInitialSkeleton();

function toggleCardExpanded(albumId) {
  expandedAlbumId.value = expandedAlbumId.value === albumId ? null : albumId;
}

// Função para fechar o card expandido ao clicar fora do card
function handleClickOutside(event) {
  if (expandedAlbumId.value === null) return;
  const expandedCard = event.target.closest(".profile-grid-card--expanded");
  if (!expandedCard) {
    expandedAlbumId.value = null;
  }
}

// Acesso aos dados do álbum selecionado
async function fetchAlbumData(albumId) {
  // Visitante (perfil público): abre a visualização pública da coleção.
  if (!props.isCurrentUser) {
    router.push({
      name: "collection-detail",
      params: { collectionId: albumId, viewMode: "grid" },
    });
    return;
  }

  try {
    const albumData = await albumsStore.getDataAlbumByAlbumId(
      userAuthHeader.value,
      albumId,
    );

    if (albumData.images.length === 0) {
      showTutorialModal.value = true;
      return;
    } else {
      router.push({
        name: "collection-detail",
        params: {
          collectionId: albumId,
          viewMode: "grid", // Padrão de visualização da coleção
        },
      });
    }
  } catch (e) {
    console.error(e);
    albumsError.value =
      e?.message || "Não foi possível carregar os dados do álbum.";
  }
}

// Função para buscar as coleções do usuário
async function fetchAlbums(options = {}) {
  // options: { silent: true } para buscar as coleções sem atualizar o estado. Evita piscar a tela.
  const { silent = false } = options;
  const shouldHoldInitialSkeleton = !hasLoadedAlbums.value;
  const requestStartedAt = Date.now();
  const userId = props.userData?.id ?? null;
  if (!userId) {
    albums.value = [];
    return;
  }

  try {
    if (!silent) {
      isLoadingAlbums.value = true;
    }
    albumsError.value = "";

    // busca as coleções do usuário
    const response = await albumsStore.getUserAlbums(
      userAuthHeader.value,
      userId,
    );
    albums.value = response;
  } catch (error) {
    albumsError.value =
      error?.message || "Não foi possível carregar as coleções.";
    albums.value = [];
  } finally {
    if (shouldHoldInitialSkeleton) {
      await finishInitialLoad(requestStartedAt);
    }
    if (!silent) {
      isLoadingAlbums.value = false;
    }
  }
}

// Função para excluir uma coleção
async function handleDeleteAlbum(albumId) {
  try {
    const deletedAlbum = await albumsStore.deleteAlbum(
      userAuthHeader.value,
      albumId,
    );
    albums.value = albums.value.filter((album) => album.id !== albumId); // remove o álbum deletado da lista, controle de estado.
    if (expandedAlbumId.value === albumId) {
      expandedAlbumId.value = null;
    }
    openCollectionToast(
      "Coleção excluída com sucesso!",
      "success",
      deletedAlbum?.title,
    );
  } catch (error) {
    openCollectionToast(error.message || "Erro ao excluir coleção.", "error");
  }
}

// Carrega as coleções quando o componente é montado
onMounted(() => {
  fetchAlbums();
  nextTick(() => {
    document.addEventListener("click", handleClickOutside);
  });
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});

// se trocar usuário logado/perfil, recarrega
watch(
  () => props.userData?.id,
  () => {
    resetInitialSkeleton();
    fetchAlbums();
  },
);
</script>

<template>
  <section class="profile-collections">
    <AppToast
      class="profile-collections__alert"
      variant="solid"
      :toasts="toast.toasts.value"
      @close="toast.hide"
      @pause="toast.pause"
      @resume="toast.resume"
    />

    <div v-if="albumsError" class="profile-collections__state profile-collections__state--error">
      {{ albumsError }}
    </div>

    <ProfileGridSkeleton v-else-if="!hasLoadedAlbums" />

    <div
      v-else-if="
        !props.isCurrentUser &&
        hasLoadedAlbums &&
        !isLoadingAlbums &&
        visibleAlbums.length === 0
      "
      class="profile-collections__state"
    >
      Este usuário ainda não tem coleções públicas.
    </div>

    <UploadColectionBox
      v-else-if="
        hasLoadedAlbums && !isLoadingAlbums && visibleAlbums.length === 0
      "
      :is-current-user="props.isCurrentUser"
      :user-data="props.userData"
      variant="empty"
      @open-create="showCreateModal = true"
    />

    <div v-else class="row g-4">
      <div
        v-if="props.isCurrentUser"
        class="col-6 profile-grid-col profile-collections__create-col"
      >
        <UploadColectionBox
          key="create-album-card"
          class="profile-collections__create-strip h-100"
          :is-current-user="props.isCurrentUser"
          :user-data="props.userData"
          variant="compact"
          @open-create="showCreateModal = true"
        />
      </div>

      <div
        v-for="album in visibleAlbums"
        :key="album.id"
        class="col-6 profile-grid-col"
      >
        <div
          v-if="props.isCurrentUser"
          class="profile-grid-card__link"
          @click="toggleCardExpanded(album.id)"
        >
          <UiCard
            class="h-100 profile-grid-card"
            :class="{
              'profile-grid-card--expanded': expandedAlbumId === album.id,
            }"
          >
            <template #image>
              <div class="profile-grid-card__image-wrapper">
                <AlbumCoverArt
                  :album="album"
                  class="profile-grid-card__image"
                />
              </div>
            </template>

            <div class="ui-card__header">
              <h3 class="ui-card__title">
                {{ album.title || "Sem título" }}
              </h3>
              <div class="profile-grid-card__meta">
                <div
                  v-if="expandedAlbumId !== album.id"
                  class="profile-grid-card__collapsed"
                  @click.stop="toggleCardExpanded(album.id)"
                >
                  <span
                    v-if="album.is_private"
                    class="profile-grid-card__lock"
                    title="Coleção privada"
                    aria-label="Coleção privada"
                  >
                    <i class="bi bi-lock-fill" aria-hidden="true"></i>
                  </span>
                </div>
                <div v-else class="profile-grid-card__actions">
                  <button
                    type="button"
                    class="btn btn-outline-primary btn-sm btn-icon profile-grid-card__action-btn profile-grid-card__action-btn--delete"
                    title="Excluir coleção"
                    @click.stop="handleDeleteAlbum(album.id)"
                  >
                    <i class="bi bi-trash"></i>
                    <span class="d-none d-xl-inline">Excluir</span>
                  </button>
                  <button
                    type="button"
                    class="btn btn-primary btn-sm btn-icon profile-grid-card__action-btn"
                    title="Abrir coleção"
                    @click.stop="fetchAlbumData(album.id)"
                  >
                    <i class="bi bi-arrow-right"></i>
                    <span class="d-none d-xl-inline">Abrir</span>
                  </button>
                </div>
              </div>
            </div>
          </UiCard>
        </div>

        <RouterLink
          v-else
          class="profile-grid-card__link"
          :to="{
            name: 'collection-detail',
            params: { collectionId: album.id, viewMode: 'grid' },
          }"
        >
          <UiCard class="h-100 profile-grid-card">
            <template #image>
              <div class="profile-grid-card__image-wrapper">
                <AlbumCoverArt
                  :album="album"
                  class="profile-grid-card__image"
                />
              </div>
            </template>
            <div class="ui-card__header">
              <h3 class="ui-card__title">{{ album.title || "Sem título" }}</h3>
            </div>
          </UiCard>
        </RouterLink>
      </div>
    </div>

    <CollectionCreateModal
      v-model="showCreateModal"
      :user-data="props.userData"
      @created="fetchAlbums({ silent: true })"
    />

    <TutorialModalCollections v-model="showTutorialModal" />
  </section>
</template>

<style lang="scss" scoped>
@use "@/scss/profile-grid-card.scss";
@use "@/scss/profile-grid-cols.scss";

.profile-collections {
  width: 100%;
}

.profile-collections__alert {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1050;
  max-width: 90%;
}

.profile-collections__state {
  padding: 16px;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: #2f2f2f;
}

.profile-collections__state--error {
  color: #7a1c1c;
}

.profile-collections__create-col {
  display: flex;
  min-width: 0;

  :deep(.upload-collection-box--compact) {
    width: 100%;
    max-width: 100%;
    height: 100%;
    min-height: 0;
  }
}
</style>
