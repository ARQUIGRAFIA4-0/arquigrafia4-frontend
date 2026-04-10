<script setup>
  import { ref, computed, onMounted, watch } from "vue";
  import { useAuthStore } from "@/store/auth";
  import { useAlbumsStore } from "@/store/albums";
  import UploadColectionBox from "@/components/UploadColectionBox.vue";
  import albumDefaultImage from "@/assets/album-default.png";

  import CollectionCreateModal from "@/components/CollectionCreateModal.vue";

  const showCreateModal = ref(false);

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

  function normalizeAlbumsResponse(raw) {
    // cobre formatos comuns: [] | { data: [] } | { albums: [] }
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.albums)) return raw.albums;
    return [];
  }

  // Função para buscar as coleções do usuário
  async function fetchAlbums(options = {}) {
    const { silent = false } = options;
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
      const response = await albumsStore.getUserAlbums(userAuthHeader.value, userId);
      albums.value = normalizeAlbumsResponse(response);
      console.log(albums.value);
    } catch (error) {
      albumsError.value = error?.message || "Não foi possível carregar as coleções.";
      albums.value = [];

    } finally {
      if (!silent) {
        isLoadingAlbums.value = false;
      }

    }

  }

  // Carrega as coleções quando o componente é montado
  onMounted(fetchAlbums);

  // se trocar usuário logado/perfil, recarrega
  watch(
    () => props.userData?.id,
    () => {
      fetchAlbums();
    }
  );

</script>

<template>
  <section class="profile-collections">
    <div v-if="isLoadingAlbums" class="profile-collections__state">
      Carregando coleções...
    </div>

    <div v-else-if="albumsError" class="profile-collections__state profile-collections__state--error">
      {{ albumsError }}
    </div>

    <UploadColectionBox
      v-else-if="albums.length === 0"
      :is-current-user="props.isCurrentUser"
      :user-data="props.userData"
      variant="empty"
      @open-create="showCreateModal = true"
    />

    <transition-group
      v-else
      name="album-card"
      tag="div"
      class="profile-collections__grid"
    >
      <UploadColectionBox
        key="create-album-card"
        :is-current-user="props.isCurrentUser"
        :user-data="props.userData"
        variant="compact"
        @open-create="showCreateModal = true"
      />

      <article
        v-for="album in albums"
        :key="album.id"
        class="profile-collections__album-card"
      >
        <div class="profile-collections__album-thumb">
          <img
            :src="album.cover_url || album.cover || album.thumbnail || albumDefaultImage"
            :alt="album.title || 'Capa da coleção'"
          />
        </div>
        <h3 class="profile-collections__album-title">
          {{ album.title || "Sem título" }}
        </h3>
      </article>
    </transition-group>

    <CollectionCreateModal
      v-model="showCreateModal"
      :user-data="props.userData"
      @created="fetchAlbums({ silent: true })"
    />
  </section>
</template>

<style scoped>
.profile-collections {
  width: 100%;
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

.profile-collections__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 220px);
  column-gap: 18px;
  row-gap: 16px;
  align-items: start;
  justify-content: flex-start;
}

.profile-collections__album-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 220px;
}

.profile-collections__album-thumb {
  width: 220px;
  height: 220px;
  border: 0.3px solid #636262;
  border-radius: 4px;
  overflow: hidden;
  background: #c3de11;
  box-shadow: 1px 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.profile-collections__album-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.profile-collections__album-title {
  margin: 0;
  font-family: "DM Sans", sans-serif;
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
  color: #000;
}

@media (max-width: 767px) {
  .profile-collections__grid {
    grid-template-columns: repeat(2, minmax(150px, 1fr));
    gap: 12px;
  }

  .profile-collections__album-card {
    width: 100%;
  }

  .profile-collections__album-thumb {
    width: 100%;
    height: auto;
    aspect-ratio: 1 / 1;
  }

  .profile-collections__album-title {
    font-size: 16px;
    line-height: 1.15;
  }
}

.album-card-enter-active,
.album-card-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.album-card-enter-from,
.album-card-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}

.album-card-move {
  transition: transform 0.3s ease;
}
</style>