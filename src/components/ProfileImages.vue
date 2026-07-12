<script setup>
import { computed, onBeforeUnmount, onMounted, ref, nextTick, watch } from "vue";
import { RouterLink, useRouter } from "vue-router";
import UiCard from "@/components/ui/UiCard.vue";
import UploadImageBox from "@/components/UploadImageBox.vue";
import DeleteImageModal from "@/components/DeleteImageModal.vue";
import ProfileGridSkeleton from "@/components/ProfileGridSkeleton.vue";
import { useImagesInfiniteQuery } from "@/composables/useImagesInfiniteQuery";
import { useInitialSkeleton } from "@/composables/useInitialSkeleton";
import { useAuthStore } from "@/store/auth";
import { useImageUploadStore } from "@/store/imageUploads";
import { useQueryClient } from "@tanstack/vue-query";
import { api } from "@/services/api";
import { convertFilesIfHeic, isHeicFile } from "@/helpers/convertHeic";

const router = useRouter();
const authStore = useAuthStore();
const uploadStore = useImageUploadStore();
const authHeader = computed(() => authStore.authHeader);
const queryClient = useQueryClient();

const fileInputRef = ref(null);

function openFileDialog() {
  fileInputRef.value?.click();
}

async function handleFileSelect(event) {
  const files = Array.from(event.target.files);
  const filtered = files.filter((f) => f.type.startsWith("image/") || isHeicFile(f));
  event.target.value = null;
  if (!filtered.length) return;

  const converted = await convertFilesIfHeic(filtered);
  const result = await uploadStore.setImages(converted);
  if (!result.success) displayAlert(result.message, "error");
}

const props = defineProps({
  isCurrentUser: { type: Boolean, default: false },
  userData: { type: Object, default: null },
});

const firstName = computed(() => props.userData?.name?.split(" ")[0] ?? "Este usuário");
const userId = computed(() => props.userData?.id ?? null);
const filters = computed(() =>
  userId.value
    ? { userId: userId.value, sortBy: "created_at", sortOrder: "desc", excludeCollectives: true }
    : undefined
);
const shouldFetch = computed(() => !!userId.value);

const { items, hasNextPage, fetchNextPage, isPending, isFetchingNextPage } =
  useImagesInfiniteQuery({ filters, enabled: shouldFetch });

const loading = computed(() => isPending.value || isFetchingNextPage.value);
const { hasLoaded: hasLoadedImages, finishInitialLoad, reset: resetInitialSkeleton } =
  useInitialSkeleton();

const showAlert = ref(false);
const alertMessage = ref("");
const alertType = ref("");
const showDeleteModal = ref(false);
const imageToDelete = ref(null);
const expandedCardId = ref(null);

let loadStartedAt = Date.now();

watch([isPending, shouldFetch], async ([pending, enabled]) => {
  if (!enabled || hasLoadedImages.value) return;
  if (pending) {
    loadStartedAt = Date.now();
    return;
  }
  await finishInitialLoad(loadStartedAt);
}, { immediate: true });

watch(userId, resetInitialSkeleton);

function toggleCardExpanded(itemId) {
  expandedCardId.value = expandedCardId.value === itemId ? null : itemId;
}

function displayAlert(message, type = "error") {
  alertMessage.value = message;
  alertType.value = type;
  showAlert.value = true;
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
    queryClient.setQueriesData({ queryKey: ["images"] }, (oldData) => {
      if (!oldData?.pages) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          items: page.items.filter((item) => item.id !== deletedId),
        })),
      };
    });
    displayAlert("Imagem excluída com sucesso!", "success");
  } catch (error) {
    console.error(error);
    displayAlert("Erro ao excluir imagem. Tente novamente.", "error");
  }
}

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

function handleClickOutside(event) {
  if (expandedCardId.value && !event.target.closest(".profile-grid-card--expanded")) {
    expandedCardId.value = null;
  }
}

function handleScroll() {
  if (window.innerHeight + window.scrollY < document.documentElement.offsetHeight - 1000) return;
  if (hasNextPage.value && !isFetchingNextPage.value) fetchNextPage();
}

onMounted(async () => {
  const uploadSuccess = window.history.state?.uploadSuccess;
  if (uploadSuccess) {
    displayAlert(uploadSuccess, "success");
    // Limpa o state para não reexibir o alerta em refresh/navegação
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
    <div
      v-if="showAlert"
      :class="['alert', 'fs-6', alertType === 'success' ? 'bg-positivo-e' : 'bg-negativo-e', 'text-white', 'mb-3', 'd-flex', 'align-items-center', 'justify-content-between', 'profile-images__alert']"
      role="alert"
    >
      <div class="d-flex align-items-center gap-2">
        <i :class="alertType === 'success' ? 'bi bi-check-all' : 'bi bi-exclamation-triangle-fill'"></i>
        <span>{{ alertMessage }}</span>
      </div>
      <button type="button" class="btn-close text-white" @click="showAlert = false" aria-label="Close" />
    </div>

    <DeleteImageModal v-model="showDeleteModal" :image-data="imageToDelete" @confirm="confirmDelete" />

    <ProfileGridSkeleton v-if="!shouldFetch || !hasLoadedImages" />

    <UploadImageBox
      v-else-if="isCurrentUser && uploadStore.pendingImages.length > 0"
    />

    <UploadImageBox
      v-else-if="hasLoadedImages && !loading && items.length === 0 && isCurrentUser"
    />

    <div
      v-else-if="hasLoadedImages && !loading && items.length === 0"
      class="alert alert-dark bg-off-white alert-light border border-dark border-start-3 d-inline-flex align-items-center px-3 py-2"
      role="alert"
    >
      <i class="bi bi-exclamation-circle-fill text-dark me-2"></i>
      <span>{{ firstName }} ainda não tem imagens no ARQUIGRAFIA.</span>
    </div>

    <div v-else-if="hasLoadedImages && items.length > 0">
      <div class="row g-4">
        <div v-if="isCurrentUser" class="col-6 col-md-3 profile-images__add-col">
          <button
            type="button"
            class="profile-images__add-btn h-100"
            title="Adicionar imagem"
            aria-label="Adicionar imagem"
            @click="openFileDialog"
          >
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
            v-if="isCurrentUser"
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
                    class="ui-card__subtitle"
                    @click.stop="toggleCardExpanded(item.id)"
                  >{{ formatDate(item.dates) || "\u00A0" }}</p>
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
                <p v-if="formatDate(item.dates)" class="ui-card__subtitle">{{ formatDate(item.dates) }}</p>
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

.profile-images__add-col {
  display: flex;
}

.profile-images__add-btn {
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

  svg {
    flex-shrink: 0;
    display: block;
  }

  &:hover {
    background: darken(#faf9f9, 2%);
  }
}

.profile-images__alert {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1050;
  max-width: 90%;
}
</style>
