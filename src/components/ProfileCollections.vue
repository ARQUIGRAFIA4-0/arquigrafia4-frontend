<script setup>
  import { ref, computed, onMounted, watch } from "vue";
  import { useAuthStore } from "@/store/auth";
  import { useAlbumsStore } from "@/store/albums";
  import UploadColectionBox from "@/components/UploadColectionBox.vue";

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
  async function fetchAlbums() {
    const userId = props.userData?.id ?? null;
    if (!userId) {
      albums.value = [];
      return;
    }

    try {
      isLoadingAlbums.value = true;
      albumsError.value = "";
      const response = await albumsStore.getUserAlbums(userAuthHeader.value, userId);
      albums.value = normalizeAlbumsResponse(response);
      console.log(albums.value);
    } catch (error) {
      albumsError.value = error?.message || "Não foi possível carregar as coleções.";
      albums.value = [];

    } finally {
      isLoadingAlbums.value = false;

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

      <UploadColectionBox
        :is-current-user="props.isCurrentUser"
        :user-data="props.userData"
        @open-create="showCreateModal = true"
      />
      
      <CollectionCreateModal
        v-model="showCreateModal"
        :user-data="props.userData"
        @created="fetchAlbums"
      />
      
  </section>
</template>

<style scoped>
.profile-collections {
  width: 100%;
}
</style>