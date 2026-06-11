<script setup>
import { ref, onMounted } from "vue";
import ProfileGridSkeleton from "@/components/ProfileGridSkeleton.vue";
import { useCollectivesStore } from "@/store/collectives";
import fallback01 from "@/assets/image_profile_fallback_01.svg";
import fallback02 from "@/assets/image_profile_fallback_02.svg";
import fallback03 from "@/assets/image_profile_fallback_03.svg";

const FALLBACKS = [fallback01, fallback02, fallback03];

const props = defineProps({
  collectiveId: { type: String, required: true },
});

const emit = defineEmits(["request-approved"]);

const collectivesStore = useCollectivesStore();

/** null = carregando; array = carregado */
const requests = ref(null);
const loadError = ref("");
const actionLoading = ref(null);
const actionError = ref("");

/**
 * Retorna um dos 3 SVGs de fallback de forma determinística com base no userId.
 */
function getFallbackImage(userId) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  return FALLBACKS[Math.abs(hash) % FALLBACKS.length];
}

async function loadRequests() {
  requests.value = null;
  loadError.value = "";
  const result = await collectivesStore.getJoinRequests(props.collectiveId);
  if (result.success) {
    requests.value = result.data;
  } else {
    loadError.value = result.message;
    requests.value = [];
  }
}

async function handleAction(req, action) {
  actionLoading.value = req.id;
  actionError.value = "";
  const result = await collectivesStore.handleJoinRequest(
    props.collectiveId,
    req.user_id,
    action
  );
  actionLoading.value = null;

  if (result.success) {
    requests.value = requests.value.filter((r) => r.id !== req.id);
    if (result.alreadyProcessed) {
      actionError.value = "Esta solicitação não está mais disponível.";
    } else if (action === "approve") {
      emit("request-approved");
    }
  } else {
    actionError.value = result.message;
  }
}

onMounted(loadRequests);
</script>

<template>
  <div>
    <!-- Erro de carregamento -->
    <div
      v-if="loadError"
      class="alert alert-negativo d-flex align-items-center justify-content-between mb-3 fs-6"
      role="alert"
    >
      <div class="d-flex align-items-center gap-2">
        <i class="bi bi-exclamation-triangle-fill"></i>
        <span>{{ loadError }}</span>
      </div>
      <button type="button" class="btn-close" @click="loadError = ''" aria-label="Fechar" />
    </div>

    <!-- Erro de ação (aceitar/recusar) -->
    <div
      v-if="actionError"
      class="alert alert-negativo d-flex align-items-center justify-content-between mb-3 fs-6"
      role="alert"
    >
      <div class="d-flex align-items-center gap-2">
        <i class="bi bi-exclamation-triangle-fill"></i>
        <span>{{ actionError }}</span>
      </div>
      <button type="button" class="btn-close" @click="actionError = ''" aria-label="Fechar" />
    </div>

    <!-- Skeleton -->
    <ProfileGridSkeleton v-if="requests === null" />

    <!-- Estado vazio -->
    <div
      v-else-if="requests.length === 0"
      class="alert alert-dark bg-off-white alert-light border border-dark border-start-3 d-inline-flex align-items-center px-3 py-2"
      role="status"
    >
      <i class="bi bi-check-circle-fill text-dark me-2"></i>
      <span>Não há solicitações pendentes.</span>
    </div>

    <!-- Grid de cards -->
    <div v-else class="row g-3 g-md-4">
      <div v-for="req in requests" :key="req.id" class="col-6 col-md-3">
        <div class="request-card">
          <!-- Foto (sempre fallback — a API não retorna avatar_url) -->
          <div class="request-card__image-wrapper">
            <img
              :src="getFallbackImage(req.user_id)"
              :alt="req.user.name"
              class="request-card__image"
            />
          </div>

          <!-- Nome + Botões -->
          <div class="request-card__body">
            <p class="request-card__name">{{ req.user.name }}</p>

            <div class="request-card__actions">
              <button
                class="request-card__btn request-card__btn--reject"
                type="button"
                :disabled="actionLoading === req.id"
                @click="handleAction(req, 'reject')"
              >
                <span
                  v-if="actionLoading === req.id"
                  class="spinner-border spinner-border-sm me-1"
                  role="status"
                  aria-hidden="true"
                ></span>
                Recusar
              </button>
              <button
                class="request-card__btn request-card__btn--approve"
                type="button"
                :disabled="actionLoading === req.id"
                @click="handleAction(req, 'approve')"
              >
                <span
                  v-if="actionLoading === req.id"
                  class="spinner-border spinner-border-sm me-1"
                  role="status"
                  aria-hidden="true"
                ></span>
                Aceitar
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

.request-card {
  background-color: $color-laranja-c;
  border: 0.25px solid $color-cinza-c;
  border-radius: 5px;
  box-shadow: 1px 1px 3px 2px rgba(0, 0, 0, 0.10);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &__image-wrapper {
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

  &__body {
    padding: 16px 10px 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
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

  &__actions {
    display: flex;
    gap: 8px;
  }

  &__btn {
    flex: 1 0 0;
    min-width: 0;
    padding: 2px 14px;
    border-radius: 5px;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.5;
    cursor: pointer;
    white-space: nowrap;
    transition: opacity 0.15s;

    &--reject {
      background-color: $color-off-white;
      border: 1px solid $color-laranja-e;
      color: $color-laranja-e;
    }

    &--approve {
      background-color: $color-laranja-e;
      border: 1px solid $color-laranja-e;
      color: white;
    }

    &:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }
  }
}
</style>
