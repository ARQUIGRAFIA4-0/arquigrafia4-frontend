<script setup>
import { computed, onBeforeUnmount, onMounted, ref, nextTick } from "vue";
import { RouterLink, useRouter } from "vue-router";
import UiCard from "@/components/ui/UiCard.vue";
import UploadImageBox from "@/components/UploadImageBox.vue";
import DeleteImageModal from "@/components/DeleteImageModal.vue";
import { useImagesInfiniteQuery } from "@/composables/useImagesInfiniteQuery";
import { useAuthStore } from "@/store/auth";
import { useQueryClient } from "@tanstack/vue-query";
import { api } from "@/services/api";

const router = useRouter();
const authStore = useAuthStore();
const authHeader = computed(() => authStore.authHeader);
const queryClient = useQueryClient();

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
  return userId.value
    ? { userId: userId.value, sortBy: "created_at", sortOrder: "desc", excludeCollectives: true }
    : undefined;
});

// Só permite fetch quando userId estiver disponível (previne fetch sem filtro)
const shouldFetch = computed(() => !!userId.value);

const { items, hasNextPage, fetchNextPage, isPending, isFetchingNextPage } =
  useImagesInfiniteQuery({ 
    filters,
    enabled: shouldFetch 
  });

const loading = computed(() => isPending.value || isFetchingNextPage.value);

// Alert system
const alertMessage = ref("");
const alertType = ref("");
const showAlert = ref(false);

function displayAlert(message, type = "error") {
  alertMessage.value = message;
  alertType.value = type;
  showAlert.value = true;
}

function closeAlert() {
  showAlert.value = false;
  alertMessage.value = "";
  alertType.value = "";
}

// Modal de deletar
const showDeleteModal = ref(false);
const imageToDelete = ref(null);

// Estado para controlar qual card está expandido (mostra botões de ação)
const expandedCardId = ref(null);

// Função para alternar estado expandido de um card
const toggleCardExpanded = (itemId) => {
  if (expandedCardId.value === itemId) {
    expandedCardId.value = null;
  } else {
    expandedCardId.value = itemId;
  }
};

// Função para abrir modal de confirmação da ação de deletar
const handleDelete = (imageId) => {
  const item = items.value.find(img => img.id === imageId);
  imageToDelete.value = item;
  showDeleteModal.value = true;
  // Fecha o card expandido
  expandedCardId.value = null;
};

// Função para confirmar ação de deletar via modal
const confirmDelete = async () => {
  const deletedId = imageToDelete.value?.id;
  if (!deletedId) return;

  try {
    await api.deleteImage(authHeader.value, deletedId);
    
    // Atualiza o cache do TanStack Query removendo a imagem deletada
    queryClient.setQueriesData(
      { queryKey: ["images"] },
      (oldData) => {
        if (!oldData?.pages) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            items: page.items.filter((item) => item.id !== deletedId),
          })),
        };
      }
    );
    
    displayAlert('Imagem excluída com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao deletar imagem:', error);
    displayAlert('Erro ao excluir imagem. Tente novamente.', 'error');
  }
};

// Função para navegar para página de visualização da imagem
const handleNavigate = (imageId) => {
  router.push(`/explore/dados/image/${imageId}`);
};

// Verifica se um card específico está expandido
const isCardExpanded = (itemId) => {
  return expandedCardId.value === itemId;
};

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

// Função para fechar card expandido ao clicar fora
const handleClickOutside = (event) => {
  if (expandedCardId.value !== null) {
    const expandedCard = event.target.closest('.profile-images__card--expanded');
    if (!expandedCard) {
      expandedCardId.value = null;
    }
  }
};

onMounted(async () => {
  if (items.value.length === 0 && hasNextPage.value) {
    await fetchNextPage();
  }
  window.addEventListener("scroll", handleScroll, { passive: true });
  
  // Adiciona listener para click fora do card após um tick para evitar fechamento imediato
  nextTick(() => {
    document.addEventListener("click", handleClickOutside);
  });
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", handleScroll);
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div>
    <!-- Alerta de sucesso/erro -->
    <div 
      v-if="showAlert" 
      :class="[
        'alert', 
        'fs-6', 
        alertType === 'success' ? 'bg-positivo-e' : 'bg-negativo-e', 
        'text-white', 
        'mb-3', 
        'd-flex', 
        'align-items-center', 
        'justify-content-between', 
        'profile-images__alert'
      ]"
      role="alert"
    >
      <div class="d-flex align-items-center gap-2">
        <i :class="alertType === 'success' ? 'bi bi-check-all' : 'bi bi-exclamation-triangle-fill'"></i>
        <span>{{ alertMessage }}</span>
      </div>
      <button
        type="button"
        class="btn-close text-white"
        @click="closeAlert"
        aria-label="Close"
      ></button>
    </div>

    <!-- Modal de confirmação da ação de deletar -->
    <DeleteImageModal 
      v-model="showDeleteModal" 
      :image-data="imageToDelete" 
      @confirm="confirmDelete" 
    />

    <!-- Loading: skeleton cards durante carregamento inicial -->
    <div v-if="!shouldFetch || (isPending && items.length === 0)">
      <!-- <div v-if="true"> -->
      <div class="row g-4">
        <div v-for="n in 12" :key="`skeleton-${n}`" class="col-6 col-md-3">
          <div class="profile-images__card profile-images__card--skeleton">
            <div class="profile-images__image-wrapper">
              <div class="profile-images__skeleton-image"></div>
            </div>
            <div class="ui-card__header--skeleton">
              <div class="profile-images__skeleton-title"></div>
              <div class="profile-images__skeleton-subtitle"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state: perfil privado sem imagens -->
    <UploadImageBox 
      v-else-if="shouldFetch && !loading && items.length === 0 && props.isCurrentUser" 
    />

    <!-- Empty state: perfil público sem imagens -->
    <div v-else-if="shouldFetch && !loading && items.length === 0 && !props.isCurrentUser">
      <div
        class="alert alert-dark bg-off-white alert-light border border-dark border-start-3 no-images-banner"
        role="alert"
      >
        <i class="bi bi-exclamation-circle-fill text-dark"></i>
        <span>{{ firstName }} ainda não tem imagens no ARQUIGRAFIA.</span>
      </div>
    </div>

    <!-- Image grid: só renderiza quando shouldFetch é true e há items -->
    <div v-else-if="shouldFetch && items.length > 0">
      <div class="row g-4">
        <div v-for="item in items" :key="item.id" class="col-6 col-md-3">
          
          <!-- Card do próprio usuário: clicável para expandir e mostrar ações -->
          <div
            v-if="props.isCurrentUser"
            class="profile-images__link profile-images__link--clickable"
            @click="toggleCardExpanded(item.id)"
          >
            <UiCard 
              class="h-100 profile-images__card" 
              :class="{ 'profile-images__card--expanded': isCardExpanded(item.id) }"
            >
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
                
                <!-- Data sempre visível (garante altura consistente) -->
                <p class="ui-card__subtitle">
                  {{ formatDate(item.dates) || '\u00A0' }}
                </p>
                
                <!-- Botões de ação como overlay sobre a área de metadados -->
                <div 
                  v-if="isCardExpanded(item.id)" 
                  class="profile-images__actions"
                >
                  <button 
                    @click.stop="handleDelete(item.id)" 
                    class="btn btn-outline-primary btn-sm profile-images__action-btn profile-images__action-btn--delete"
                    title="Excluir imagem"
                  >
                    <i class="bi bi-trash"></i>
                    <span class="d-none d-md-inline">Apagar</span>
                  </button>
                  <button 
                    @click.stop="handleNavigate(item.id)" 
                    class="btn btn-primary btn-sm profile-images__action-btn profile-images__action-btn--view"
                    title="Visualizar imagem"
                  >
                    <i class="bi bi-arrow-right"></i>
                    <span class="d-none d-md-inline">Ver</span>
                  </button>
                </div>
              </div>
            </UiCard>
          </div>

          <!-- Card de outros usuários: visualização direta -->
          <RouterLink
            v-else
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
      <div v-if="isFetchingNextPage" class="text-center my-4">
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
  &__alert {
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1050;
    width: auto;
    max-width: 90%;
    height: auto;
  }

  &__link {
    display: block;
    height: 100%;
    text-decoration: none;
    color: inherit;

    &--clickable {
      cursor: pointer;
    }
  }

  &__card {
    border: 0.25px solid var(--Cinza_C, #A6A6A6);
    box-shadow: 1px 1px 3px 2px rgba(0, 0, 0, 0.1);
    border-radius: 5px;
    transition: transform 0.3s ease, box-shadow 0.3s ease;

    &:deep(.ui-card__content) {
      flex: 1;
    }

    &:deep(.ui-card__body) {
      flex: 1;
    }

    @media (hover: hover) {
      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
      }
    }

    &--skeleton {
      pointer-events: none;
      
      &:hover {
        transform: none;
        box-shadow: 1px 1px 3px 2px rgba(0, 0, 0, 0.1);
      }
    }

    &--expanded {
      transform: translateY(-4px);
      border-color: var(--Laranja_E, #AA4F28);
      box-shadow: 0 4px 12px rgba(170, 79, 40, 0.2);
    }
  }

  &__actions {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    gap: 8px;
    padding: 8px 0px 8px 0px;
    background: white;
    z-index: 1;
  }

  &__action-btn {
    width: calc(50% - 4px);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
    font-size: 14px;
    word-wrap: break-word;
    white-space: normal;
    text-align: center;
    min-width: 0;
    gap: 6px;
    padding: 8px;

    @include md {
      padding: 8px 14px;
    }

    &:active {
      transform: translateY(0);
    }

    &--delete {
      &:hover {
        background-color: #dc3545;
        color: white;
      }
    }

    i {
      font-size: 14px;
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

  &__skeleton-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      #f0f0f0 25%,
      #e0e0e0 50%,
      #f0f0f0 75%
    );
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
  }

  &__skeleton-title {
    height: 14px;
    background: linear-gradient(
      90deg,
      #f0f0f0 25%,
      #e0e0e0 50%,
      #f0f0f0 75%
    );
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
    border-radius: 4px;
    margin-bottom: 16px;
    width: 80%;
  }

  &__skeleton-subtitle {
    height: 12px;
    background: linear-gradient(
      90deg,
      #f0f0f0 25%,
      #e0e0e0 50%,
      #f0f0f0 75%
    );
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
    border-radius: 4px;
    width: 50%;
  }
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.ui-card__header {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  padding-bottom: 8px;

  &--skeleton {
    padding: 16px 16px 24px 16px;
  }
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
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  
  @include md {
    font-weight: 400;
    font-size: 14px;
    line-height: 125%;
    letter-spacing: 0%;
    color: var(--Cinza_E);
  }
}
</style>
