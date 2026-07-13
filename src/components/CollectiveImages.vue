<script setup>
import { computed, onBeforeUnmount, onMounted, watch, ref, nextTick } from "vue";
import { RouterLink, useRouter } from "vue-router";
import UiCard from "@/components/ui/UiCard.vue";
import ProfileGridSkeleton from "@/components/ProfileGridSkeleton.vue";
import UploadImageBox from "@/components/UploadImageBox.vue";
import DeleteImageModal from "@/components/DeleteImageModal.vue";
import AppToast from "@/components/ui/AppToast.vue";
import { useToast } from "@/composables/useToast";
import { useImagesInfiniteQuery } from "@/composables/useImagesInfiniteQuery";
import { useInitialSkeleton } from "@/composables/useInitialSkeleton";
import { useImageUploadStore } from "@/store/imageUploads";
import { useAuthStore } from "@/store/auth";
import { useQueryClient } from "@tanstack/vue-query";
import { api } from "@/services/api";
import { convertFilesIfHeic, isHeicFile } from "@/helpers/convertHeic";

const props = defineProps({
  collectiveId: { type: String, default: null },
  collectiveName: { type: String, default: null },
  isMember: { type: Boolean, default: false },
});

const router = useRouter();
const uploadStore = useImageUploadStore();
const authStore = useAuthStore();
const authHeader = computed(() => authStore.authHeader);
const queryClient = useQueryClient();
const fileInputRef = ref(null);
const toast = useToast();
const expandedCardId = ref(null);
const showDeleteModal = ref(false);
const imageToDelete = ref(null);

function displayAlert(message, type = "error") {
  toast.show(message, type);
}

function toggleCardExpanded(itemId) {
  expandedCardId.value = expandedCardId.value === itemId ? null : itemId;
}

function handleDelete(imageId) {
  imageToDelete.value = items.value.find((img) => img.id === imageId);
  showDeleteModal.value = true;
  expandedCardId.value = null;
}

async function confirmDelete() {
  const deletedId = imageToDelete.value?.id;
  if (!deletedId) return;

  try {
    await api.deleteImage(authHeader.value, deletedId);
    // Remove a imagem do grid do coletivo e também da listagem global (home),
    // já que uma imagem de coletivo aparece em ambas.
    const removeFromCache = (oldData) => {
      if (!oldData?.pages) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          items: page.items.filter((item) => item.id !== deletedId),
        })),
      };
    };
    queryClient.setQueriesData({ queryKey: ["collective-images"] }, removeFromCache);
    queryClient.setQueriesData({ queryKey: ["images"] }, removeFromCache);
    displayAlert("Imagem excluída com sucesso!", "success");
  } catch (error) {
    console.error(error);
    displayAlert("Erro ao excluir imagem. Tente novamente.", "error");
  }
}

function handleClickOutside(event) {
  if (expandedCardId.value && !event.target.closest(".profile-grid-card--expanded")) {
    expandedCardId.value = null;
  }
}

function openFileDialog() {
  fileInputRef.value?.click();
}

async function handleFileSelect(event) {
  const files = Array.from(event.target.files);
  const filtered = files.filter((f) => f.type.startsWith("image/") || isHeicFile(f));
  if (!filtered.length) return;

  const converted = await convertFilesIfHeic(filtered);
  const result = await uploadStore.setImages(converted);
  event.target.value = null;

  // Não navega direto: ao popular a store, o template exibe o UploadImageBox
  // com o preview das imagens; o usuário confirma ali e só então segue para os
  // metadados (mesmo fluxo do grid do perfil de usuário).
  if (!result.success) {
    displayAlert(result.message, "error");
  }
}

const filters = computed(() =>
  props.collectiveId
    ? { collectiveId: props.collectiveId, sortBy: "created_at", sortOrder: "desc" }
    : undefined
);
const shouldFetch = computed(() => !!props.collectiveId);

const { items, hasNextPage, fetchNextPage, isPending, isFetchingNextPage } =
  useImagesInfiniteQuery({
    filters,
    enabled: shouldFetch,
    queryKey: ["collective-images"],
  });

const loading = computed(() => isPending.value || isFetchingNextPage.value);
const { hasLoaded: hasLoadedImages, finishInitialLoad, reset: resetInitialSkeleton } =
  useInitialSkeleton();

let loadStartedAt = Date.now();

watch([isPending, shouldFetch], async ([pending, enabled]) => {
  if (!enabled || hasLoadedImages.value) return;
  if (pending) {
    loadStartedAt = Date.now();
    return;
  }
  await finishInitialLoad(loadStartedAt);
}, { immediate: true });

watch(() => props.collectiveId, resetInitialSkeleton);

function formatDate(dates) {
  if (!dates?.length) return null;
  const dateInfo = dates.find((d) => d.type === "creation") || dates[0];
  if (!dateInfo) return null;

  const earliest = dateInfo.earliest_date
    ? new Date(dateInfo.earliest_date).getUTCFullYear()
    : null;
  const latest = dateInfo.latest_date
    ? new Date(dateInfo.latest_date).getUTCFullYear()
    : null;
  const circa = dateInfo.circa_earliest_date || dateInfo.circa_latest_date;
  if (!earliest) return null;

  const prefix = circa ? "c." : "";
  if (!latest || earliest === latest) return `${prefix}${earliest}`;
  return `${prefix}${earliest}-${latest}`;
}

function handleImageError(event) {
  const target = event?.target;
  if (target?.tagName === "IMG") {
    target.onerror = null;
    target.src = "https://picsum.photos/300/300?grayscale&blur=2";
  }
}

function handleScroll() {
  if (window.innerHeight + window.scrollY < document.documentElement.offsetHeight - 1000) return;
  if (hasNextPage.value && !isFetchingNextPage.value) fetchNextPage();
}

onMounted(async () => {
  // Alerta de sucesso vindo do redirect pós-upload (publicação como coletivo).
  const uploadSuccess = window.history.state?.uploadSuccess;
  if (uploadSuccess) {
    displayAlert(uploadSuccess, "success");
    // Limpa o state para não reexibir o alerta em refresh/navegação.
    window.history.replaceState(
      { ...window.history.state, uploadSuccess: undefined },
      ""
    );
  }

  if (items.value.length === 0 && hasNextPage.value) await fetchNextPage();
  window.addEventListener("scroll", handleScroll, { passive: true });
  nextTick(() => document.addEventListener("click", handleClickOutside));
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", handleScroll);
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div>
    <AppToast
      class="collective-images__alert"
      variant="solid"
      :toasts="toast.toasts.value"
      @close="toast.hide"
      @pause="toast.pause"
      @resume="toast.resume"
    />

    <DeleteImageModal v-model="showDeleteModal" :image-data="imageToDelete" @confirm="confirmDelete" />

    <ProfileGridSkeleton v-if="!shouldFetch || !hasLoadedImages" />

    <UploadImageBox
      v-else-if="isMember && uploadStore.pendingImages.length > 0"
      :publishing-context="{ type: 'collective', id: collectiveId }"
    />

    <UploadImageBox
      v-else-if="hasLoadedImages && !loading && items.length === 0 && isMember"
      :show-upload-instructions="true"
      instructions-title="Seu coletivo ainda não tem<br />contribuições."
      :publishing-context="{ type: 'collective', id: collectiveId }"
    />

    <div
      v-else-if="hasLoadedImages && !loading && items.length === 0"
      class="alert alert-dark bg-off-white alert-light border border-dark border-start-3 d-inline-flex align-items-center px-3 py-2"
      role="status"
    >
      <i class="bi bi-exclamation-circle-fill text-dark me-2"></i>
      <span>{{ collectiveName }} ainda não tem contribuições no ARQUIGRAFIA.</span>
    </div>

    <div v-else-if="hasLoadedImages && items.length > 0">
      <div class="row g-4">
        <div v-if="isMember" class="col-6 col-md-3 collective-images__add-col">
          <button
            type="button"
            class="collective-images__add-btn h-100"
            @click="openFileDialog"
          >
            <span class="collective-images__add-inner">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="50"
                height="50"
                viewBox="0 0 50 50"
                fill="none"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M50 25C50 31.6304 47.3661 37.9893 42.6777 42.6777C37.9893 47.3661 31.6304 50 25 50C18.3696 50 12.0107 47.3661 7.32233 42.6777C2.63392 37.9893 0 31.6304 0 25C0 18.3696 2.63392 12.0107 7.32233 7.32233C12.0107 2.63392 18.3696 0 25 0C31.6304 0 37.9893 2.63392 42.6777 7.32233C47.3661 12.0107 50 18.3696 50 25ZM26.5625 14.0625C26.5625 13.6481 26.3979 13.2507 26.1049 12.9576C25.8118 12.6646 25.4144 12.5 25 12.5C24.5856 12.5 24.1882 12.6646 23.8951 12.9576C23.6021 13.2507 23.4375 13.6481 23.4375 14.0625V23.4375H14.0625C13.6481 23.4375 13.2507 23.6021 12.9576 23.8951C12.6646 24.1882 12.5 24.5856 12.5 25C12.5 25.4144 12.6646 25.8118 12.9576 26.1049C13.2507 26.3979 13.6481 26.5625 14.0625 26.5625H23.4375V35.9375C23.4375 36.3519 23.6021 36.7493 23.8951 37.0424C24.1882 37.3354 24.5856 37.5 25 37.5C25.4144 37.5 25.8118 37.3354 26.1049 37.0424C26.3979 36.7493 26.5625 36.3519 26.5625 35.9375V26.5625H35.9375C36.3519 26.5625 36.7493 26.3979 37.0424 26.1049C37.3354 25.8118 37.5 25.4144 37.5 25C37.5 24.5856 37.3354 24.1882 37.0424 23.8951C36.7493 23.6021 36.3519 23.4375 35.9375 23.4375H26.5625V14.0625Z"
                  fill="#636262"
                />
              </svg>
              <span class="collective-images__add-label">Adicionar imagem</span>
            </span>
          </button>
          <input
            ref="fileInputRef"
            type="file"
            multiple
            accept="image/*,.heic,.heif"
            class="d-none"
            @change="handleFileSelect"
          />
        </div>

        <div v-for="item in items" :key="item.id" class="col-6 col-md-3">
          <div
            v-if="isMember"
            class="profile-grid-card__link"
            @click="toggleCardExpanded(item.id)"
          >
            <UiCard
              class="h-100 profile-grid-card"
              :class="{ 'profile-grid-card--expanded': expandedCardId === item.id }"
            >
              <template #image>
                <div class="profile-grid-card__image-wrapper">
                  <img
                    :src="item.imageUrl"
                    class="profile-grid-card__image"
                    :alt="item.title"
                    @error="handleImageError"
                  />
                </div>
              </template>
              <div class="ui-card__header">
                <h3 class="ui-card__title">{{ item.title }}</h3>
                <div class="profile-grid-card__meta">
                  <p
                    v-if="expandedCardId !== item.id"
                    class="profile-grid-card__date"
                    @click.stop="toggleCardExpanded(item.id)"
                  >{{ formatDate(item.dates) || " " }}</p>
                  <div v-else class="profile-grid-card__actions">
                    <button
                      type="button"
                      class="btn btn-outline-primary btn-sm btn-icon profile-grid-card__action-btn profile-grid-card__action-btn--delete"
                      @click.stop="handleDelete(item.id)"
                    >
                      <i class="bi bi-trash"></i>
                      <span class="d-none d-md-inline">Apagar</span>
                    </button>
                    <button
                      type="button"
                      class="btn btn-primary btn-sm btn-icon profile-grid-card__action-btn"
                      @click.stop="router.push(`/explore/dados/image/${item.id}`)"
                    >
                      <i class="bi bi-arrow-right"></i>
                      <span class="d-none d-md-inline">Ver</span>
                    </button>
                  </div>
                </div>
              </div>
            </UiCard>
          </div>

          <RouterLink v-else :to="`/explore/dados/image/${item.id}`" class="profile-grid-card__link">
            <UiCard class="h-100 profile-grid-card">
              <template #image>
                <div class="profile-grid-card__image-wrapper">
                  <img
                    :src="item.imageUrl"
                    class="profile-grid-card__image"
                    :alt="item.title"
                    @error="handleImageError"
                  />
                </div>
              </template>
              <div class="ui-card__header">
                <h3 class="ui-card__title">{{ item.title }}</h3>
                <div class="profile-grid-card__meta">
                  <p v-if="formatDate(item.dates)" class="profile-grid-card__date">{{ formatDate(item.dates) }}</p>
                </div>
              </div>
            </UiCard>
          </RouterLink>
        </div>
      </div>

      <div v-if="isFetchingNextPage" class="text-center my-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Carregando mais...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "@/scss/profile-grid-card.scss";
@use "@/scss/variables" as *;
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.collective-images__add-col {
  display: flex;
}

.collective-images__alert {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1050;
  max-width: 90%;
}

.collective-images__add-btn {
  width: 100%;
  // Sem altura fixa: a coluna (flex) estica o botão até a altura exata dos
  // cards vizinhos, então o botão nunca deforma a linha do grid.
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0.3px solid #636262;
  border-radius: 5px;
  background: #faf9f9;
  box-shadow: 1px 1px 3px 0 rgba(0, 0, 0, 0.1);
  cursor: pointer;
  padding: 20px 16px;
  box-sizing: border-box;

  &:hover {
    background: darken(#faf9f9, 2%);
  }
}

.collective-images__add-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.collective-images__add-label {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.3;
  color: #636262;
  text-align: center;
}
</style>
