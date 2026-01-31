<template>
  <div>
    <div class="row g-4">
      <div v-for="item in items" :key="item.id" class="col-6 col-md-4 col-lg-2">
        <RouterLink
          :to="`/explore/dados/image/${item.id}`"
          class="view-grid__link"
        >
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
              <h3 class="ui-card__title">Grupo Escolar Cachoeira do Vale</h3>
              <p class="ui-card__subtitle">1980-1990</p>
              <div class="ui-card__tags">
                <span v-for="(tag, index) in tags" :key="index" class="ui-card__tag">
                  {{ tag }}
                </span>
              </div>
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

const fallbackImageUrl = "https://picsum.photos/300/200?grayscale&blur=2";

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

<script>
  const tags = [
    "Arquitetura",
    "História",
    "Cultura",
    "Educação",
    "Urbanismo",
    "Patrimônio",
    "Sociedade",
    "Arte",
    "Fotografia",
    "Memória",
  ]
</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.view-grid__link {
  display: block;
  height: 100%;
  text-decoration: none;
  color: inherit;
}

.view-grid__card {
  background: var(--Off_white, #FAF9F9);
  border: 0.25px solid var(--Cinza_C, #A6A6A6);
  box-shadow: 1px 1px 3px 2px #0000001A;
  border-radius: 5px;

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
  padding-top: 100%; // imagem quadrada
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

.ui-card__header {
  padding-bottom: 8px;
}

.ui-card__title {
  @include md {
    font-weight: 700;
    font-size: 14px;
    line-height: 125%;
    letter-spacing: 0%;
    padding-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.ui-card__subtitle {
  @include md {
    font-weight: 400;
    font-size: 14px;
    line-height: 125%;
    letter-spacing: 0%;
    color: var(--Cinza_E);
  }
}

.ui-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;  
  max-height: calc(25px * 2 + 8px); /* 2 linhas de tags (altura da tag * 2 + gap) */
  overflow: hidden;
}

.ui-card__tag {
  @include md {
    height: 25px;
    gap: 9px;
    border-radius: 2px;
    border-width: 1px;
    padding: 4px 8px;
    background: var(--Off_white, #FAF9F9);
    border: 1px solid var(--Cinza_M, #636262);
    color: var(--Cinza_M, #636262);

    span {
      font-weight: 400;
      font-style: 9pt;
      font-size: 12px;
      line-height: 115%;
      letter-spacing: 0%;
      text-align: center;
    }
  }
}
</style>
