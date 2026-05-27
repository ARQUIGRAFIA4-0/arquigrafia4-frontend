<script setup>
import { computed, onBeforeUnmount, onMounted, nextTick, watch } from "vue";
import { RouterLink } from "vue-router";
import UiCard from "@/components/ui/UiCard.vue";
import ProfileGridSkeleton from "@/components/ProfileGridSkeleton.vue";
import UploadImageBox from "@/components/UploadImageBox.vue";
import { useImagesInfiniteQuery } from "@/composables/useImagesInfiniteQuery";
import { useInitialSkeleton } from "@/composables/useInitialSkeleton";

const props = defineProps({
  collectiveId: { type: String, default: null },
  collectiveName: { type: String, default: null },
  isMember: { type: Boolean, default: false },
});

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
  if (items.value.length === 0 && hasNextPage.value) await fetchNextPage();
  window.addEventListener("scroll", handleScroll, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<template>
  <div>
    <ProfileGridSkeleton v-if="!shouldFetch || !hasLoadedImages" />

    <UploadImageBox
      v-else-if="hasLoadedImages && !loading && items.length === 0 && isMember"
      :show-upload-instructions="true"
      instructions-title="Seu coletivo ainda não tem<br />contribuições."
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
        <div v-for="item in items" :key="item.id" class="col-6 col-md-3">
          <RouterLink :to="`/explore/dados/image/${item.id}`" class="profile-grid-card__link">
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
@use "@/scss/variables" as *;
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}
</style>
