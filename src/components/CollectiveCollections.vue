<script setup>
  import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
  import { RouterLink, useRouter } from "vue-router";
  import { useAuthStore } from "@/store/auth";
  import { useAlbumsStore } from "@/store/albums";
  import { useInitialSkeleton } from "@/composables/useInitialSkeleton";
  import UploadColectionBox from "@/components/UploadColectionBox.vue";
  import UiCard from "@/components/ui/UiCard.vue";
  import ProfileGridSkeleton from "@/components/ProfileGridSkeleton.vue";
  import AlbumCoverArt from "@/components/AlbumCoverArt.vue";
  import CollectionCreateModal from "@/components/CollectionCreateModal.vue";
  import TutorialModalCollections from "@/components/TutorialModalCollections.vue";
  import AppToast from "@/components/ui/AppToast.vue";
  import { useToast } from "@/composables/useToast";

// Props
const props = defineProps({
  collectiveId: { type: String, default: null },
  collectiveName: { type: String, default: null },
  // Qualquer membro do coletivo pode gerenciar (criar/excluir) as coleções.
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
const expandedAlbumId = ref(null);

const {
  hasLoaded: hasLoadedAlbums,
  finishInitialLoad,
  reset: resetInitialSkeleton,
} = useInitialSkeleton();

function toggleCardExpanded(albumId) {
  // Apenas membros expandem o card (Excluir/Abrir). Visitantes usam um
  // RouterLink que navega direto para a coleção.
  expandedAlbumId.value = expandedAlbumId.value === albumId ? null : albumId;
}

// Abre o detalhe da coleção (rota canônica pública). Se a coleção estiver
// vazia, exibe o modal de instrução em vez de navegar (mesmo comportamento
// das coleções de usuário).
async function openCollection(albumId) {
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

// Fecha o card expandido ao clicar fora dele
function handleClickOutside(event) {
  if (expandedAlbumId.value === null) return;
  const expandedCard = event.target.closest(".profile-grid-card--expanded");
  if (!expandedCard) {
    expandedAlbumId.value = null;
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

// Exclui uma coleção do coletivo
async function handleDeleteAlbum(albumId) {
  try {
    await albumsStore.deleteAlbum(userAuthHeader.value, albumId);
    albums.value = albums.value.filter((album) => album.id !== albumId);
    if (expandedAlbumId.value === albumId) {
      expandedAlbumId.value = null;
    }
  } catch (error) {
    albumsError.value = error?.message || "Erro ao excluir coleção.";
  }
}

onMounted(() => {
  fetchAlbums();
  nextTick(() => {
    document.addEventListener("click", handleClickOutside);
  });
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
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
        class="col-6 col-md-3 collective-collections__create-col"
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
        class="col-6 col-md-3"
      >
        <div
          v-if="isMember"
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
                    <span class="d-none d-md-inline">Excluir</span>
                  </button>
                  <button
                    type="button"
                    class="btn btn-primary btn-sm btn-icon profile-grid-card__action-btn"
                    title="Abrir coleção"
                    @click.stop="openCollection(album.id)"
                  >
                    <i class="bi bi-arrow-right"></i>
                    <span class="d-none d-md-inline">Abrir</span>
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
      :collective-id="props.collectiveId"
      @created="fetchAlbums({ silent: true })"
    />

    <TutorialModalCollections v-model="showTutorialModal" />
  </section>
</template>

<style lang="scss" scoped>
@use "@/scss/profile-grid-card.scss";

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

  :deep(.upload-collection-box--compact) {
    width: 100%;
    height: 100%;
    min-height: 100%;
  }
}
</style>
