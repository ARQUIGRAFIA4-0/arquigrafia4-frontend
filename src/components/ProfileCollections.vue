<script setup>
  import { ref, computed, onMounted, watch } from "vue";
  import { useAuthStore } from "@/store/auth";
  import { useAlbumsStore } from "@/store/albums";
  import { useInitialSkeleton } from "@/composables/useInitialSkeleton";
  import UploadColectionBox from "@/components/UploadColectionBox.vue";
  import UiCard from "@/components/ui/UiCard.vue";
  import ProfileGridSkeleton from "@/components/ProfileGridSkeleton.vue";
  import TutorialModalCollections from "@/components/TutorialModalCollections.vue";
  import AlbumCoverArt from "@/components/AlbumCoverArt.vue";
  import CollectionCreateModal from "@/components/CollectionCreateModal.vue";
  import CollectionCardLabels from "@/components/CollectionCardLabels.vue";
  import AppToast from "@/components/ui/AppToast.vue";
  import { useToast } from "@/composables/useToast";

  const showCreateModal = ref(false);
  const toast = useToast();

import { useRouter } from "vue-router";
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

const {
  hasLoaded: hasLoadedAlbums,
  finishInitialLoad,
  reset: resetInitialSkeleton,
} = useInitialSkeleton();

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
    albums.value = props.isCurrentUser
      ? await albumsStore.ensureDefaultFavoritesAlbum(
          userAuthHeader.value,
          userId,
          response,
        )
      : response;
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

// Carrega as coleções quando o componente é montado
onMounted(() => {
  fetchAlbums();
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
          class="profile-grid-card__link"
          @click="fetchAlbumData(album.id)"
        >
          <UiCard class="profile-grid-card profile-grid-card--collection">
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
                <CollectionCardLabels
                  :album="album"
                  class="profile-grid-card__labels"
                />
                <button
                  type="button"
                  class="profile-grid-card__go-btn"
                  @click.stop="fetchAlbumData(album.id)"
                >
                  Ir para coleção
                  <i class="bi bi-arrow-right" aria-hidden="true"></i>
                </button>
              </div>
            </div>
          </UiCard>
        </div>
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
