<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import CollectionEditImagesGrid from "@/components/collection/CollectionEditImagesGrid.vue";
import { useAuthStore } from "@/store/auth";
import { useAlbumsStore } from "@/store/albums";
import { api } from "@/services/api";

defineOptions({ name: "CollectionEdit" });

// Stores
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const albumsStore = useAlbumsStore();

const collectionImages = ref([]);
const isLoadingImages = ref(true);

const collectionId = computed(() => route.params.collectionId);

// Carrega as imagens da coleção.
async function loadCollectionImageDetails(imagesFromAlbum = []) {
  const ordered = [...imagesFromAlbum].sort((a, b) => {
    const pa = a?.pivot?.position ?? Number.MAX_SAFE_INTEGER;
    const pb = b?.pivot?.position ?? Number.MAX_SAFE_INTEGER;
    return pa - pb;
  });

  if (!ordered.length) {
    collectionImages.value = [];
    return;
  }

  try {
    collectionImages.value = await Promise.all(
      ordered.map((img) => api.getImageDetails(img.id))
    );
  } catch (error) {
    console.error("Erro ao carregar imagens da coleção:", error);
    collectionImages.value = [];
  }
}

// Carrega as imagens da coleção.
async function fetchCollectionImages() {
  if (!collectionId.value) return;

  isLoadingImages.value = true;

  try {
    const data = await albumsStore.getDataAlbumByAlbumId(
      authStore.authHeader,
      collectionId.value
    );

    await loadCollectionImageDetails(data?.images || []);
  } catch (error) {
    console.error("Erro ao carregar coleção:", error);
    collectionImages.value = [];
  } finally {
    isLoadingImages.value = false;
  }
}

// Cancela a edição da coleção.
function handleCancel() {
  if (!collectionId.value) return;

  router.push({
    name: "my-collection-detail",
    params: {
      collectionId: String(collectionId.value),
      viewMode: String(route.query.viewMode || "grid"),
    },
  });
}

onMounted(() => {
  fetchCollectionImages();
});
</script>

<template>
    <section class="collection-edit" aria-label="Editar coleção">
      <div class="collection-edit__content">
        <div class="collection-edit__grid">
          <!-- Coluna 1: imagens da coleção -->
          <section
            class="collection-edit__images"
            aria-label="Imagens da coleção"
          >
            <CollectionEditImagesGrid
              :images="collectionImages"
              :is-loading="isLoadingImages"
            />
          </section>

          <!-- Coluna 2: abas + formulário -->
          <aside
            class="collection-edit__sidebar"
            aria-label="Edição da coleção"
          >
            <nav class="collection-edit__tabs" aria-label="Seções de edição">
              <ul class="nav nav-underline collection-edit__tab-list">
                <li class="nav-item">
                  <span
                    class="nav-link active"
                    aria-current="page"
                    data-label="Dados da coleção"
                  >
                    Dados da coleção
                  </span>
                </li>
              </ul>
            </nav>

            <div class="collection-edit__panel">
              <!-- formulário de edição -->
            </div>
          </aside>
        </div>
      </div>
  
      <footer class="collection-edit__footer">
        <button
          type="button"
          class="collection-edit__btn collection-edit__btn--cancel"
          @click="handleCancel"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="collection-edit__btn collection-edit__btn--save"
          disabled
          aria-disabled="true"
        >
          Salvar edições
        </button>
      </footer>
    </section>
</template>

<style scoped lang="scss">
.collection-edit {
  display: flex;
  flex-direction: column;
  background: var(--Branco, #fff);
}

.collection-edit__content {
  flex: 1 1 auto;
  padding-bottom: 72px; /* espaço para o footer fixo */
}

.collection-edit__footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--Branco, #fff);
  box-shadow: 2px -2px 5px 2px rgba(0, 0, 0, 0.25);
  box-sizing: border-box;
}

.collection-edit__btn {
  display: flex;
  padding: 2px 14px;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  border-radius: 5px;
  border-width: 1px;
  border-style: solid;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 150%;
  cursor: pointer;
  box-sizing: border-box;
  white-space: nowrap;
}

.collection-edit__btn--cancel {
  border-color: var(--Cinza_E, #2f2f2f);
  background: var(--Off_white, #faf9f9);
  color: var(--Cinza_E, #2f2f2f);
}

.collection-edit__btn--save {
  border-color: var(--Laranja_E, #aa4f28);
  background: var(--Laranja_E, #aa4f28);
  color: var(--Branco, #fff);
  opacity: 0.4;
  cursor: not-allowed;
}

.collection-edit__btn--save:disabled {
  opacity: 0.4;
}

.collection-edit__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
  width: 100%;
  padding: 24px 32px;
  box-sizing: border-box;
}

.collection-edit__images {
  min-width: 0;
  container-type: inline-size;
  container-name: collection-edit-images;
}

.collection-edit__sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  width: 100%;
}

.collection-edit__tabs {
  width: 100%;
}

.collection-edit__tab-list {
  display: flex;
  flex-wrap: nowrap;
  gap: 40px;
  width: 100%;
  margin: 0;
  padding: 0;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  scrollbar-width: thin;
}

.collection-edit__panel {
  min-height: 360px;
  padding: 24px;
  border-radius: 8px;
  background: var(--Cinza_C, #f2f2f2);
  box-sizing: border-box;
}

@media (max-width: 767px) {
  .collection-edit__grid {
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 16px;
  }

  .collection-edit__panel {
    min-height: 240px;
    padding: 16px;
  }
}
</style>