<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import ProfileGridSkeleton from "@/components/ProfileGridSkeleton.vue";
import { useCollectivesStore } from "@/store/collectives";
import fallback01 from "@/assets/image_profile_fallback_01.svg";
import fallback02 from "@/assets/image_profile_fallback_02.svg";
import fallback03 from "@/assets/image_profile_fallback_03.svg";

const FALLBACKS = [fallback01, fallback02, fallback03];

const API_BASE_URL = import.meta.env.VITE_BASE_REQUEST_URL;

const props = defineProps({
  /** Array de membros ou null enquanto collectiveData ainda não carregou */
  members: { type: Array, default: null },
  collectiveId: { type: String, required: true },
  /** "admin" | "member" | null */
  userRole: { type: String, default: null },
  currentUserId: { type: String, default: null },
});

const emit = defineEmits(["update:members"]);

const router = useRouter();
const collectivesStore = useCollectivesStore();

const expandedCardId = ref(null);
const actionLoading = ref(null);
const actionError = ref("");

function getAvatarUrl(member) {
  if (!member.avatar_url) return null;
  return member.avatar_url.startsWith("http")
    ? member.avatar_url
    : `${API_BASE_URL}${member.avatar_url}`;
}

/**
 * Retorna um dos 3 SVGs de fallback de forma determinística com base no id do membro,
 * evitando trocas aleatórias em re-renders.
 */
function getFallbackImage(memberId) {
  let hash = 0;
  for (let i = 0; i < memberId.length; i++) {
    hash = (hash << 5) - hash + memberId.charCodeAt(i);
    hash |= 0;
  }
  return FALLBACKS[Math.abs(hash) % FALLBACKS.length];
}

function toggleExpand(memberId) {
  expandedCardId.value = expandedCardId.value === memberId ? null : memberId;
  actionError.value = "";
}

function handleCardClick(memberId, event) {
  if (event.target.closest(".member-card__dots-btn")) return;
  if (event.target.closest(".member-card__action-btn")) return;
  router.push({ name: "view-profile", params: { id: memberId } });
}

function handleClickOutside(event) {
  if (expandedCardId.value && !event.target.closest(".member-card--expanded")) {
    expandedCardId.value = null;
    actionError.value = "";
  }
}

async function handleRemove(memberId) {
  actionLoading.value = memberId;
  actionError.value = "";
  const result = await collectivesStore.removeMember(props.collectiveId, memberId);
  actionLoading.value = null;
  if (result.success) {
    expandedCardId.value = null;
    emit("update:members", result.data.members);
  } else {
    actionError.value = result.message;
  }
}

async function handlePromote(memberId) {
  actionLoading.value = memberId;
  actionError.value = "";
  const result = await collectivesStore.promoteMemberToAdmin(props.collectiveId, memberId);
  actionLoading.value = null;
  if (result.success) {
    expandedCardId.value = null;
    emit("update:members", result.data.members);
  } else {
    actionError.value = result.message;
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div>
    <!-- Alerta de erro nas ações -->
    <div
      v-if="actionError"
      class="alert alert-danger d-flex align-items-center gap-2 mb-3 fs-6"
      role="alert"
    >
      <i class="bi bi-exclamation-triangle-fill"></i>
      <span>{{ actionError }}</span>
      <button type="button" class="btn-close ms-auto" @click="actionError = ''" aria-label="Fechar" />
    </div>

    <!-- Skeleton enquanto os dados carregam -->
    <ProfileGridSkeleton v-if="members === null" :count="8" />

    <!-- Grid de membros -->
    <div v-else class="row g-3 g-md-4">
      <div v-for="member in members" :key="member.id" class="col-6 col-md-3">
        <div
          class="member-card"
          :class="{ 'member-card--expanded': expandedCardId === member.id }"
          @click="handleCardClick(member.id, $event)"
          role="button"
          :aria-label="`Ver perfil de ${member.name}`"
        >
          <!-- Área da foto -->
          <div class="member-card__image-wrapper">
            <img
              :src="getAvatarUrl(member) || getFallbackImage(member.id)"
              :alt="member.name"
              class="member-card__image"
            />

            <!-- Badge Admin -->
            <div v-if="member.role === 'admin'" class="member-card__admin-badge">
              Admin
            </div>
          </div>

          <!-- Área de texto -->
          <div class="member-card__body">
            <p class="member-card__name">{{ member.name }}</p>

            <!-- Estado normal: ícone de 3 pontos (apenas para admin logado, exceto no próprio card) -->
            <div
              v-if="userRole === 'admin' && member.id !== currentUserId && expandedCardId !== member.id"
              class="member-card__footer"
            >
              <button
                class="member-card__dots-btn"
                type="button"
                :aria-label="`Ações para ${member.name}`"
                @click.stop="toggleExpand(member.id)"
              >
                <i class="bi bi-three-dots"></i>
              </button>
            </div>

            <!-- Estado expandido: botões de ação -->
            <div
              v-else-if="userRole === 'admin' && member.id !== currentUserId && expandedCardId === member.id"
              class="member-card__actions"
            >
              <button
                class="member-card__action-btn member-card__action-btn--remove"
                type="button"
                :disabled="actionLoading === member.id"
                @click.stop="handleRemove(member.id)"
              >
                <span v-if="actionLoading === member.id" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                Remover
              </button>
              <button
                v-if="member.role === 'member'"
                class="member-card__action-btn member-card__action-btn--admin"
                type="button"
                :disabled="actionLoading === member.id"
                @click.stop="handlePromote(member.id)"
              >
                <span v-if="actionLoading === member.id" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                Admin
              </button>
            </div>
          </div>
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

.member-card {
  background-color: $color-off-white;
  border: 0.25px solid $color-cinza-c;
  border-radius: 5px;
  box-shadow: 1px 1px 3px 2px rgba(0, 0, 0, 0.10);
  display: flex;
  flex-direction: column;
  cursor: pointer;
  overflow: hidden;
  transition: background-color 0.15s ease;

  &--expanded {
    background-color: $color-laranja-c;
  }

  &__image-wrapper {
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1;
    overflow: hidden;
    border-radius: 4px 4px 0 0;
  }

  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &__admin-badge {
    position: absolute;
    bottom: 8px;
    right: 8px;
    background-color: rgba(0, 0, 0, 0.55);
    border: 1px solid white;
    border-radius: 2px;
    padding: 6px 8px;
    color: white;
    font-size: 12px;
    font-weight: 400;
    line-height: 1.15;
    white-space: nowrap;
  }

  &__body {
    padding: 16px 10px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__name {
    font-weight: 700;
    font-size: 14px;
    line-height: 1.25;
    color: $color-preto;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    padding-top: 8px;
    padding-right: 4px;
  }

  &__dots-btn {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    color: $color-cinza-m;
    font-size: 20px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      color: $color-preto;
    }
  }

  &__actions {
    display: flex;
    gap: 8px;
    justify-content: center;
    padding-top: 4px;
    padding-bottom: 4px;
  }

  &__action-btn {
    flex: 1 0 0;
    min-width: 0;
    padding: 2px 14px;
    border-radius: 5px;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.5;
    cursor: pointer;
    border: 1px solid $color-laranja-e;
    transition: opacity 0.15s;

    &:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }

    &--remove {
      background-color: $color-off-white;
      color: $color-laranja-e;
    }

    &--admin {
      background-color: $color-laranja-e;
      color: white;
    }
  }
}
</style>
