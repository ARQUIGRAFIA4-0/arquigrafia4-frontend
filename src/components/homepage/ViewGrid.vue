<template>
  <div>
    <div class="row g-4">
      <div v-for="item in items" :key="item.id" class="col-6 col-md-4 col-lg-2">
        <RouterLink :to="`/image/${item.id}`" class="view-grid__link">
          <UiCard class="h-100 view-grid__card">
            <template #image>
              <div class="view-grid__image-wrapper">
                <img
                  :src="item.imageUrl"
                  class="view-grid__image"
                  :alt="item.title"
                  :data-test-image="item.id"
                  @error="handleImageError"
                />
              </div>
            </template>
            <div class="ui-card__header">
              <h3 class="ui-card__title text-cinza-e">{{ item.title }}</h3>
              <p class="ui-card__subtitle text-cinza-m">Subtítulo</p>
            </div>
          </UiCard>
        </RouterLink>
      </div>
    </div>

    <div v-if="loading" class="text-center my-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted } from "vue";
import { RouterLink } from "vue-router";
import UiCard from "@/components/ui/UiCard.vue";
import { useImagesInfiniteQuery } from "@/composables/useImagesInfiniteQuery";

const { items, hasNextPage, fetchNextPage, isPending, isFetchingNextPage } =
  useImagesInfiniteQuery();

const loading = computed(() => isPending.value || isFetchingNextPage.value);

const fallbackImageUrl = "https://via.placeholder.com/300x200";

const handleImageError = (event) => {
  const target = event?.target;

  if (target && target.tagName === "IMG") {
    target.onerror = null;
    target.src = fallbackImageUrl;
  }
};

const tryFetchNextPage = () => {
  if (!hasNextPage.value || isFetchingNextPage.value) {
    return;
  }

  fetchNextPage();
};

const handleScroll = () => {
  const scrollPosition = window.innerHeight + window.scrollY;
  const pageBottom = document.documentElement.offsetHeight - 1000;

  if (scrollPosition >= pageBottom) {
    tryFetchNextPage();
  }
};

onMounted(async () => {
  if (items.value.length === 0 && hasNextPage.value) {
    await fetchNextPage();
  }

  window.addEventListener("scroll", handleScroll, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<style scoped>
.view-grid__link {
  display: block;
  height: 100%;
  text-decoration: none;
  color: inherit;
}

.view-grid__card {
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.view-grid__card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
}

.view-grid__image-wrapper {
  position: relative;
  padding-top: 75%;
  overflow: hidden;
  background-color: #f8f9fa;
}

.view-grid__image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.view-grid__image-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.85);
  z-index: 1;
}
</style>
