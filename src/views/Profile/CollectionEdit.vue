<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import CollectionEditImagesGrid from "@/components/collection/CollectionEditImagesGrid.vue";
import { useInitialSkeleton } from "@/composables/useInitialSkeleton";
import { useAuthStore } from "@/store/auth";
import { useAlbumsStore } from "@/store/albums";
import { api } from "@/services/api";
import CollectionEditForm from "@/components/collection/CollectionEditForm.vue";

defineOptions({ name: "CollectionEdit" });

// Stores
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const albumsStore = useAlbumsStore();

const collectionImages = ref([]);

const { hasLoaded, finishInitialLoad, reset: resetInitialSkeleton } =
  useInitialSkeleton();

const showSkeleton = computed(() => !hasLoaded.value);

const collectionId = computed(() => route.params.collectionId);

const selectedImageId = ref(null);
const removingImageId = ref(null);
const pendingRemovals = ref([]);
const initialImageOrder = ref([]);

function onCardActivate(item, event) {
  const target = event?.target;
  if (target?.closest?.("button,a")) return;

  selectedImageId.value =
    selectedImageId.value === item.id ? null : item.id;
}

function handleReorder(newImages) {
  collectionImages.value = newImages;
}

function removeImageFromCollection(imageId) {
  if (!imageId) return;

  if (!pendingRemovals.value.includes(imageId)) {
    pendingRemovals.value = [...pendingRemovals.value, imageId];
  }

  collectionImages.value = collectionImages.value.filter(
    (img) => img.id !== imageId
  );

  if (selectedImageId.value === imageId) {
    selectedImageId.value = null;
  }
}

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

  const loadStartedAt = Date.now();

  try {
    const data = await albumsStore.getDataAlbumByAlbumId(
      authStore.authHeader,
      collectionId.value
    );

    collectionTitle.value = data?.title?.trim() || "";
    collectionDescription.value = data?.description?.trim() || "";
    initialTitle.value = collectionTitle.value;
    initialDescription.value = collectionDescription.value;

    await loadCollectionImageDetails(data?.images || []);
    initialImageOrder.value = collectionImages.value.map((img) => img.id);
  } catch (error) {
    console.error("Erro ao carregar coleção:", error);
    collectionImages.value = [];
    collectionTitle.value = "";
    collectionDescription.value = "";
    initialTitle.value = "";
    initialDescription.value = "";
  } finally {
    await finishInitialLoad(loadStartedAt);
  }
}

// Volta para a página da coleção.
function goToCollectionDetail() {
  if (!collectionId.value) return;

  router.push({
    name: "my-collection-detail",
    params: {
      collectionId: String(collectionId.value),
      viewMode: String(route.query.viewMode || "grid"),
    },
  });
}

// Cancela a edição da coleção.
function handleCancel() {
  goToCollectionDetail();
}


/***
 * Start: Formulário de edição da coleção
 */

const collectionTitle = ref("");
const collectionDescription = ref("");
const initialTitle = ref("");
const initialDescription = ref("");
const isSaving = ref(false);

const DESCRIPTION_MAX_LENGTH = 500;

const hasReorder = computed(() => {
  const current = collectionImages.value.map((img) => img.id);
  const initial = initialImageOrder.value.filter(
    (id) => !pendingRemovals.value.includes(id)
  );
  return (
    current.length !== initial.length ||
    current.some((id, i) => id !== initial[i])
  );
});

const hasChanges = computed(() => {
  return (
    collectionTitle.value.trim() !== initialTitle.value ||
    collectionDescription.value.trim() !== initialDescription.value ||
    pendingRemovals.value.length > 0 ||
    hasReorder.value
  );
});

const canSave = computed(() => {
  return (
    hasLoaded.value &&
    collectionTitle.value.trim() &&
    collectionDescription.value.trim().length <= DESCRIPTION_MAX_LENGTH &&
    hasChanges.value &&
    !isSaving.value
  );
});

function buildSavePayload() {
  return {
    title: collectionTitle.value.trim(),
    description: collectionDescription.value.trim(),
  };
}

async function handleSave() {
  if (!canSave.value || !collectionId.value) return;

  const payload = buildSavePayload();

  isSaving.value = true;

  try {
    await albumsStore.updateAlbum(
      authStore.authHeader,
      collectionId.value,
      payload
    );

    if (pendingRemovals.value.length > 0) {
      await albumsStore.removeImagesFromAlbum(
        authStore.authHeader,
        collectionId.value,
        pendingRemovals.value
      );
    }

    // TODO: persistir nova ordem das imagens quando o endpoint da API estiver disponível

    goToCollectionDetail();
  } catch (error) {
    console.error("Erro ao salvar coleção:", error);
  } finally {
    isSaving.value = false;
  }
}

onMounted(() => {
  fetchCollectionImages();
});

watch(collectionId, () => {
  resetInitialSkeleton();
  collectionImages.value = [];
  selectedImageId.value = null;
  removingImageId.value = null;
  pendingRemovals.value = [];
  initialImageOrder.value = [];
  collectionTitle.value = "";
  collectionDescription.value = "";
  initialTitle.value = "";
  initialDescription.value = "";
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
              :is-loading="showSkeleton"
              :selected-image-id="selectedImageId"
              :removing-image-id="removingImageId"
              @activate="onCardActivate"
              @remove="removeImageFromCollection"
              @reorder="handleReorder"
            />
          </section>

          <!-- Coluna 2: abas + formulário -->
          <aside
            class="collection-edit__sidebar"
            aria-label="Edição da coleção"
          >
            <template v-if="showSkeleton">
              <div
                class="collection-edit__tab-skeleton"
                aria-hidden="true"
              />
              <div class="collection-edit__panel">
                <div
                  class="collection-edit__form-skeleton"
                  role="status"
                  aria-label="Carregando formulário"
                >
                  <div class="collection-edit__form-skeleton-heading" />

                  <div class="collection-edit__form-skeleton-fields">
                    <div class="collection-edit__form-skeleton-field">
                      <div class="collection-edit__form-skeleton-label-row">
                        <span class="collection-edit__form-skeleton-label" />
                        <span class="collection-edit__form-skeleton-icon" />
                      </div>
                      <div class="collection-edit__form-skeleton-input" />
                    </div>

                    <div class="collection-edit__form-skeleton-field">
                      <div class="collection-edit__form-skeleton-label-row">
                        <span class="collection-edit__form-skeleton-label collection-edit__form-skeleton-label--wide" />
                        <span class="collection-edit__form-skeleton-icon" />
                      </div>
                      <div class="collection-edit__form-skeleton-textarea" />
                      <div class="collection-edit__form-skeleton-hint" />
                    </div>
                  </div>

                  <div class="collection-edit__form-skeleton-required" />
                  <span class="visually-hidden">Carregando formulário...</span>
                </div>
              </div>
            </template>

            <template v-else>
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
                <CollectionEditForm
                  v-model:title="collectionTitle"
                  v-model:description="collectionDescription"
                  :disabled="isSaving"
                />
              </div>
            </template>
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
          :disabled="!canSave"
          :aria-disabled="!canSave"
          @click="handleSave"
        >
          <span class="collection-edit__btn-label collection-edit__btn-label--desktop">
            {{ isSaving ? "Salvando..." : "Salvar edições" }}
          </span>
          <span class="collection-edit__btn-label collection-edit__btn-label--mobile">
            {{ isSaving ? "Salvando..." : "Salvar" }}
          </span>
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

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.collection-edit__btn-label--mobile {
  display: none;
}

.collection-edit__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
  width: 100%;
  padding: 24px 52px;
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
  width: 100%;
  min-height: 0;
  padding: 0;
  border-radius: 0;
  background: transparent;
  box-sizing: border-box;
  padding: 24px;
}

.collection-edit__tab-skeleton {
  width: 200px;
  height: 30px;
  border-radius: 4px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: collection-edit-shimmer 1.5s infinite;
}

.collection-edit__form-skeleton {
  display: flex;
  width: 100%;
  padding: var(--pp, 8px) var(--p, 12px);
  flex-direction: column;
  justify-content: center;
  align-items: stretch;
  gap: var(--ppp, 4px);
  border-radius: 5px;
  background: var(--Off_white, #faf9f9);
  box-shadow: 1px 1px 4px rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
  pointer-events: none;
}

.collection-edit__form-skeleton-heading {
  align-self: stretch;
  padding-top: var(--p, 12px);
  width: 64px;
  height: 30px;
  border-radius: 4px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: collection-edit-shimmer 1.5s infinite;
}

.collection-edit__form-skeleton-fields {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 42px;
  width: 100%;
  padding: 12px;
  box-sizing: border-box;
}

.collection-edit__form-skeleton-field {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  align-self: stretch;
}

.collection-edit__form-skeleton-label-row {
  display: flex;
  padding: 8px var(--p, 12px) 8px 0;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
  box-sizing: border-box;
}

.collection-edit__form-skeleton-label {
  display: block;
  width: 120px;
  height: 14px;
  border-radius: 4px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: collection-edit-shimmer 1.5s infinite;
}

.collection-edit__form-skeleton-label--wide {
  width: 148px;
}

.collection-edit__form-skeleton-icon {
  display: block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: collection-edit-shimmer 1.5s infinite;
}

.collection-edit__form-skeleton-input {
  width: 100%;
  height: 30px;
  border-radius: 5px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: collection-edit-shimmer 1.5s infinite;
}

.collection-edit__form-skeleton-textarea {
  width: 100%;
  min-height: 120px;
  border-radius: 5px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: collection-edit-shimmer 1.5s infinite;
}

.collection-edit__form-skeleton-hint {
  align-self: flex-end;
  width: 132px;
  height: 10px;
  border-radius: 4px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: collection-edit-shimmer 1.5s infinite;
}

.collection-edit__form-skeleton-required {
  align-self: flex-end;
  width: 168px;
  height: 18px;
  border-radius: 4px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: collection-edit-shimmer 1.5s infinite;
}

@keyframes collection-edit-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (max-width: 767px) {
  .collection-edit__content {
    padding-bottom: 0;
  }

  .collection-edit__grid {
    grid-template-columns: 1fr;
    gap: 24px;
    padding: 16px;
  }

  .collection-edit__sidebar {
    gap: 12px;
  }

  .collection-edit__tab-list {
    gap: 24px;
  }

  .collection-edit__panel {
    min-height: 0;
    padding: 0;
  }

  .collection-edit__footer {
    position: static;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 16px;
    box-shadow: none;
  }

  .collection-edit__btn--save {
    order: -1;
  }

  .collection-edit__btn {
    width: 100%;
    align-items: center;
    justify-content: center;
    padding: 8px 14px;
  }

  .collection-edit__btn-label--desktop {
    display: none;
  }

  .collection-edit__btn-label--mobile {
    display: inline;
  }
}
</style>