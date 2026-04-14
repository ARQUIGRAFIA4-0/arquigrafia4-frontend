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
      albums.value = response
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
    <div v-if="albumsError" class="profile-collections__state profile-collections__state--error">
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
        <div class="profile-collections__album-content">
          <h3 class="profile-collections__album-title">
            {{ album.title || "Sem título" }}
          </h3>
          <div class="profile-collections__album-actions">
            <button
              type="button"
              class="profile-collections__album-btn profile-collections__album-btn--secondary"
              @click.stop
            >
              Excluir
            </button>
            <button
              type="button"
              class="profile-collections__album-btn profile-collections__album-btn--primary"
              @click.stop
            >
              Editar
            </button>
          </div>          
        </div>
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
  gap: 0;
  width: 220px;
  height: 334px;
  padding-bottom: 8px;
  box-sizing: border-box;
  background: transparent;
  border-radius: 4px;
  border: none;
  transition: background-color 0.25s ease;
  cursor: pointer;
  overflow: hidden;
}

.profile-collections__album-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 8px 0;
  box-sizing: border-box;
  flex: 1;
}

.profile-collections__album-card:hover,
.profile-collections__album-card:focus-within {
  background: #fff;
}

.profile-collections__album-card:hover .profile-collections__album-thumb,
.profile-collections__album-card:focus-within .profile-collections__album-thumb {
  height: 200px;
}

.profile-collections__album-actions {
  display: flex;
  gap: 8px;
  width: 100%;
  padding: 0;
  opacity: 0;
  max-height: 0;
  overflow: hidden;
  transform: translateY(6px);
  pointer-events: none;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease,
    max-height 0.25s ease;
}

.profile-collections__album-card:hover .profile-collections__album-actions,
.profile-collections__album-card:focus-within .profile-collections__album-actions {
  opacity: 1;
  max-height: 40px;
  transform: translateY(0);
  pointer-events: auto;
}

.profile-collections__album-btn {
  flex: 1 0 0;
  min-height: 30px;
  padding: 2px 14px;
  border-radius: 5px;
  border: 1px solid #2f2f2f;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  cursor: pointer;
}
.profile-collections__album-btn--secondary {
  background: #faf9f9;
  color: #2f2f2f;
}
.profile-collections__album-btn--primary {
  background: #2f2f2f;
  color: #fff;
}

.profile-collections__album-thumb {
  width: 220px;
  height: 220px;
  border-radius: 4px;
  overflow: hidden;
  background: #c3de11;
  box-shadow: 1px 1px 3px 0 rgba(0, 0, 0, 0.1);
  transition: height 0.25s ease;
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
  min-height: 63px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  line-clamp: 3;
  text-overflow: ellipsis;
}

.profile-collections__album-card:hover .profile-collections__album-title,
.profile-collections__album-card:focus-within .profile-collections__album-title {
  min-height: 63px;
}

@media (max-width: 767px) {

  .profile-collections__album-actions {
    display: none;
  }
  .profile-collections__album-thumb {
    height: auto;
    aspect-ratio: 1 / 1;
  }

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