<script setup>
  import { ref, computed, onMounted, watch } from "vue";
  import { useRouter } from "vue-router";
  import { useAuthStore } from "@/store/auth";
  import { useAlbumsStore } from "@/store/albums";
  import { useInitialSkeleton } from "@/composables/useInitialSkeleton";
  import UploadColectionBox from "@/components/UploadColectionBox.vue";
  import UiCard from "@/components/ui/UiCard.vue";
  import ProfileGridSkeleton from "@/components/ProfileGridSkeleton.vue";
  import AlbumCoverArt from "@/components/AlbumCoverArt.vue";
  import CollectionCreateModal from "@/components/CollectionCreateModal.vue";
  import CollectionCardLabels from "@/components/CollectionCardLabels.vue";
  import TutorialModalCollections from "@/components/TutorialModalCollections.vue";
  import AppToast from "@/components/ui/AppToast.vue";
  import { useToast } from "@/composables/useToast";

// Props
const props = defineProps({
  collectiveId: { type: String, default: null },
  collectiveName: { type: String, default: null },
  // Qualquer membro do coletivo pode criar coleções.
  isMember: { type: Boolean, default: false },
});

  const toast = useToast();

  const authStore = useAuthStore();
  const albumsStore = useAlbumsStore();
  const router = useRouter();

// Para visitantes não logados não enviamos header de autorização
// (authStore.authHeader resolve para "Bearer null" sem token).
const userAuthHeader = computed(() =>
  authStore.isLoggedIn ? authStore.authHeader : null,
);

const albums = ref([]);
const isLoadingAlbums = ref(false);
const albumsError = ref("");

// Membros veem todas as coleções (públicas e privadas); visitantes/não-membros
// veem apenas as públicas. O backend já filtra, mas mantemos o filtro no
// cliente como camada de UX (evita exibir dado que não deveria aparecer).
const visibleAlbums = computed(() =>
  props.isMember
    ? albums.value
    : albums.value.filter((album) => !album.is_private),
);
const showCreateModal = ref(false);
const showTutorialModal = ref(false);

const {
  hasLoaded: hasLoadedAlbums,
  finishInitialLoad,
  reset: resetInitialSkeleton,
} = useInitialSkeleton();

// Abre o detalhe da coleção (rota canônica pública). Para membros, se a
// coleção estiver vazia, exibe o modal de instrução em vez de navegar (mesmo
// comportamento das coleções de usuário).
async function openCollection(albumId) {
  if (!props.isMember) {
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
    }

    router.push({
      name: "collection-detail",
      params: {
        collectionId: albumId,
        viewMode: "grid",
      },
    });
  } catch (error) {
    albumsError.value =
      error?.message || "Não foi possível carregar os dados da coleção.";
  }
}

// Busca as coleções do coletivo
async function fetchAlbums(options = {}) {
  const { silent = false } = options;
  const shouldHoldInitialSkeleton = !hasLoadedAlbums.value;
  const requestStartedAt = Date.now();
  if (!props.collectiveId) {
    albums.value = [];
    return;
  }

  try {
    if (!silent) {
      isLoadingAlbums.value = true;
    }
    albumsError.value = "";

    const response = await albumsStore.getCollectiveAlbums(
      userAuthHeader.value,
      props.collectiveId,
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

onMounted(() => {
  fetchAlbums();
});

// Se trocar de coletivo, recarrega
watch(
  () => props.collectiveId,
  () => {
    resetInitialSkeleton();
    fetchAlbums();
  },
);
</script>

<template>
  <section class="collective-collections">
    <AppToast
      class="collective-collections__alert"
      variant="solid"
      :toasts="toast.toasts.value"
      @close="toast.hide"
      @pause="toast.pause"
      @resume="toast.resume"
    />

    <div v-if="albumsError" class="collective-collections__state collective-collections__state--error">
      {{ albumsError }}
    </div>

    <ProfileGridSkeleton v-else-if="!hasLoadedAlbums" />

    <!-- Coletivo sem coleções: membro vê a caixa de criar a primeira coleção -->
    <UploadColectionBox
      v-else-if="
        hasLoadedAlbums &&
        !isLoadingAlbums &&
        visibleAlbums.length === 0 &&
        isMember
      "
      instructions-title="Seu coletivo ainda não<br />tem coleções."
      variant="empty"
      @open-create="showCreateModal = true"
    />

    <!-- Coletivo sem coleções: não-membro vê apenas um aviso -->
    <div
      v-else-if="
        hasLoadedAlbums && !isLoadingAlbums && visibleAlbums.length === 0
      "
      class="alert alert-dark bg-off-white alert-light border border-dark border-start-3 d-inline-flex align-items-center px-3 py-2"
      role="status"
    >
      <i class="bi bi-exclamation-circle-fill text-dark me-2"></i>
      <span>{{ collectiveName }} ainda não tem coleções no ARQUIGRAFIA.</span>
    </div>

    <!-- Coletivo com coleções: grid de cards -->
    <div v-else class="row g-4">
      <div
        v-if="isMember"
        class="col-6 profile-grid-col collective-collections__create-col"
      >
        <UploadColectionBox
          key="create-album-card"
          class="collective-collections__create-strip h-100"
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
          @click="openCollection(album.id)"
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
                  @click.stop="openCollection(album.id)"
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
      :collective-id="props.collectiveId"
      @created="fetchAlbums({ silent: true })"
    />

    <TutorialModalCollections v-model="showTutorialModal" />
  </section>
</template>

<style lang="scss" scoped>
@use "@/scss/profile-grid-card.scss";
@use "@/scss/profile-grid-cols.scss";

.collective-collections {
  width: 100%;
}

.collective-collections__alert {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1050;
  max-width: 90%;
}

.collective-collections__state {
  padding: 16px;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: #2f2f2f;
}

.collective-collections__state--error {
  color: #7a1c1c;
}

.collective-collections__create-col {
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
