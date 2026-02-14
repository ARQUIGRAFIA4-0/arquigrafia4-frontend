<script setup>
import { computed, onBeforeUnmount, onMounted } from "vue";
import { RouterLink } from "vue-router";
import UiCard from "@/components/ui/UiCard.vue";
import UploadImageBox from "@/components/UploadImageBox.vue";
import { useImagesInfiniteQuery } from "@/composables/useImagesInfiniteQuery";

const props = defineProps({
  isCurrentUser: {
    type: Boolean,
    default: false,
  },
  userData: {
    type: Object,
    default: null,
  },
});

const firstName = computed(() => {
  if (props.userData && props.userData.name) {
    return props.userData.name.split(" ")[0];
  }
  return "Este usuário";
});

// Extrai o ID do usuário a partir da prop userData
const userId = computed(() => props.userData?.id ?? null);

// Extrai os filtros a partir do userId
const filters = computed(() => {
  return userId.value ? { userId: userId.value } : undefined;
});

const { items, hasNextPage, fetchNextPage, isPending, isFetchingNextPage } =
  useImagesInfiniteQuery({ filters });

const loading = computed(() => isPending.value || isFetchingNextPage.value);

// Função para formatar data com lógica de circa e intervalo
const formatDate = (dates) => {
  if (!dates || dates.length === 0) return null;
  
  const dateInfo = dates.find(d => d.type === 'creation') || dates[0];
  if (!dateInfo) return null;
  
  const earliest = dateInfo.earliest_date ? new Date(dateInfo.earliest_date).getUTCFullYear() : null;
  const latest = dateInfo.latest_date ? new Date(dateInfo.latest_date).getUTCFullYear() : null;
  const circa = dateInfo.circa_earliest_date || dateInfo.circa_latest_date;
  
  if (!earliest) return null;
  
  const prefix = circa ? 'c.' : '';
  
  if (!latest || earliest === latest) {
    return `${prefix}${earliest}`;
  }
  
  return `${prefix}${earliest}-${latest}`;
};

const fallbackImageUrl = "https://picsum.photos/300/300?grayscale&blur=2";

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

<template>
  <div>
    <!-- Carregando imagens -->
    <div v-if="isPending && items.length === 0" class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Carregando...</span>
      </div>
    </div>

    <!-- Perfil privado sem imagens -->
    <UploadImageBox v-else-if="items.length === 0 && props.isCurrentUser && !loading" />

    <!-- Perfil público sem imagens -->
    <div v-else-if="items.length === 0 && !props.isCurrentUser && !loading">
      <div
        class="alert alert-dark bg-off-white alert-light border border-dark border-start-3 no-images-banner"
        role="alert"
      >
        <i class="bi bi-exclamation-circle-fill text-dark"></i>
        <span>{{ firstName }} ainda não tem imagens no ARQUIGRAFIA.</span>
      </div>
    </div>

    <!-- Image grid -->
    <div v-else>
      <div class="row g-4">
        <div v-for="item in items" :key="item.id" class="col-6 col-md-3">
          <RouterLink
            :to="`/explore/dados/image/${item.id}`"
            class="profile-images__link"
          >
            <UiCard class="h-100 profile-images__card">
              <template #image>
                <div class="profile-images__image-wrapper">
                  <img
                    :src="item.imageUrl"
                    class="profile-images__image"
                    :alt="item.title"
                    @error="handleImageError"
                  />
                </div>
              </template>
              <div class="ui-card__header">
                <h3 class="ui-card__title">{{ item.title }}</h3>
                <p v-if="formatDate(item.dates)" class="ui-card__subtitle">
                  {{ formatDate(item.dates) }}
                </p>
              </div>
            </UiCard>
          </RouterLink>
        </div>
      </div>

      <!-- Loading more indicator -->
      <div v-if="loading" class="text-center my-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Carregando mais...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.no-images-banner {
  display: inline-flex;
  align-items: center;
  height: auto;
  padding: 0.5rem 1rem;
  word-break: break-word;

  i {
    margin-right: 0.5rem;
  }
}

.profile-images {
  &__link {
    display: block;
    height: 100%;
    text-decoration: none;
    color: inherit;
  }

  &__card {
    border: 0.25px solid var(--Cinza_C, #A6A6A6);
    box-shadow: 1px 1px 3px 2px #0000001A;
    border-radius: 5px;
    transition: transform 0.3s ease, box-shadow 0.3s ease;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
    }
  }

  &__image-wrapper {
    position: relative;
    padding-top: 100%; // 1:1 aspect ratio
    overflow: hidden;
    background-color: #f8f9fa;
  }

  &__image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
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
</style>
