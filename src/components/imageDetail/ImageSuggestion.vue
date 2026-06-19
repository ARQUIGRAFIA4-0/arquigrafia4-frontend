<template>
  <div class="image-suggestion">

    <!-- Loading -->
    <div v-if="loading" class="image-suggestion__skeleton">
      <div v-for="i in 3" :key="i" class="image-suggestion__skeleton-card">
        <div class="image-suggestion__skeleton-header">

          <div class="skeleton image-suggestion__skeleton-avatar" style="width: 36px; height: 36px; flex-shrink: 0" />
          <div class="image-suggestion__skeleton-info">
            <div class="skeleton image-suggestion__skeleton-name" />
          </div>
        </div>
        <div class="skeleton image-suggestion__skeleton-content" />
      </div>
    </div>

    <!-- Vazio -->
    <div v-else-if="suggestionCards.length === 0" class="image-suggestion__empty">
      <i class="bi bi-chat-left-text image-suggestion__empty-icon" />
      <p class="image-suggestion__empty-text">Você ainda não tem sugestões para serem avaliadas.</p>
    </div>

    <!-- Cards por sugestão -->
    <div v-else class="image-suggestion__content">
      <h2 class="image-suggestion__title">Analise as sugestões pendentes abaixo</h2>

      <SuggestionFieldCard v-for="card in suggestionCards" :key="card.key" :suggestion-id="card.suggestionId"
        :fields="card.fields" :reason="card.reason" :user-name="card.userName" :user-avatar="card.userAvatar"
        :user-initials="card.userInitials" @accepted="handleAccepted" @rejected="handleRejected"
        @error="showAlert('danger', $event)" />
    </div>

    <!-- Alert -->
    <transition name="fade">
      <div v-if="alert.show" class="alert image-suggestion__alert" :class="alert.type === 'success'
        ? 'alert-success bg-positivo-c text-positivo-e border-success'
        : 'alert-danger bg-negativo-c text-negativo-e border-danger'
        " role="alert">
        <i :class="alert.type === 'success'
          ? 'bi bi-check-circle-fill text-positivo-e'
          : 'bi bi-exclamation-triangle-fill text-negativo-e'
          " />
        <span>{{ alert.message }}</span>
        <button type="button" class="btn-close" @click="alert.show = false" />
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from "vue";
import axios from "@/axios";
import { useAuthStore } from "@/store/auth";
import SuggestionFieldCard from "@/components/imageDetail/suggestions/SuggestionFieldCard.vue";

defineOptions({ name: "ImageSuggestion" });

const props = defineProps({
  image: { type: Object, default: null },
});
const emit = defineEmits(["updated"]);

const authStore = useAuthStore();
const loading = ref(true);
const suggestions = ref([]);
const alert = reactive({ show: false, type: "success", message: "" });

// ─── Campos relevantes do payload ─────────────────────────────────────────────
const PAYLOAD_FIELDS = [
  "title",
  "description",
  "subjects",
  "earliest_date",
  "photographer",
];

// ─── Iniciais do usuário ──────────────────────────────────────────────────────
const getUserInitials = (user) => {
  if (!user?.name) return "?";
  return user.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
};


// ─── Agrupa os campos de cada sugestão em um único card ──────────────────────
// Uma sugestão com título + descrição vira 1 card com os 2 campos dentro;
// outra sugestão do mesmo usuário com apenas data vira um 2º card separado
const suggestionCards = computed(() => {
  const cards = [];
  for (const suggestion of suggestions.value) {
    const fields = [];
    for (const field of PAYLOAD_FIELDS) {
      const value = suggestion.payload?.[field];
      if (value === undefined || value === null) continue;
      // subjects vazio não entra no card
      if (field === "subjects" && (!Array.isArray(value) || value.length === 0)) continue;

      fields.push({
        field,
        value,
        // Passa o payload completo para o card formatar intervalo de datas
        datePayload: field === "earliest_date" ? suggestion.payload : null,
      });
    }

    const { latitude, longitude, location_label } = suggestion.payload ?? {};
    const hasLocationLabel = location_label !== undefined && location_label !== null;
    const hasCoordinates =
      latitude !== undefined && latitude !== null &&
      longitude !== undefined && longitude !== null;

    if (hasLocationLabel || hasCoordinates) {
      fields.push({
        field: "location",
        value: {
          label: hasLocationLabel ? location_label : null,
          lat: hasCoordinates ? latitude : null,
          lng: hasCoordinates ? longitude : null,
        },
      });
    }

    // Sugestão sem nenhum campo relevante não gera card
    if (fields.length === 0) continue;

    cards.push({
      key: suggestion.id,
      suggestionId: suggestion.id,
      fields,
      reason: suggestion.payload?.reason ?? null,
      userName: suggestion.user?.name ?? "Usuário",
      userAvatar: suggestion.user?.avatar_path ?? null,
      userInitials: getUserInitials(suggestion.user),
    });
  }
  return cards;
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
const fetchSuggestions = async () => {
  if (!props.image?.id) return;
  loading.value = true;
  try {
    const { data } = await axios.get("/api/image-suggestions", {
      params: { image_id: props.image.id, status: "pending" },
      headers: { Authorization: authStore.authHeader },
    });
    suggestions.value = data.suggestions?.data ?? data.suggestions ?? [];
  } catch (e) {
    console.error("Erro ao carregar sugestões:", e);
  } finally {
    loading.value = false;
  }
};

// ─── Quando todos os campos de uma sugestão são decididos ────────────────────
// O card só emite 'accepted'/'rejected' depois que o usuário decidiu (aceitou
// ou recusou) cada campo individualmente — aí sim a sugestão sai da fila
const handleAccepted = ({ suggestionId }) => {
  suggestions.value = suggestions.value.filter((s) => s.id !== suggestionId);
  showAlert("success", "Sugestão aceita com sucesso!");
  emit("updated");
};

// ─── Quando uma sugestão é totalmente recusada ────────────────────────────────
const handleRejected = ({ suggestionId }) => {
  suggestions.value = suggestions.value.filter((s) => s.id !== suggestionId);
  showAlert("success", "Sugestão recusada.");
};

const showAlert = (type, message) => {
  alert.type = type;
  alert.message = message;
  alert.show = true;
  setTimeout(() => { alert.show = false; }, 4000);
};

onMounted(fetchSuggestions);
</script>

<style lang="scss" scoped>
@use "sass:color";

.image-suggestion {
  padding: 1rem 0;

  // ===== CONTENT =====

  &__content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  &__title {
    margin: 0 0 0.5rem;
    font-size: 1.5rem;
    font-weight: 600;
    line-height: 1.3;
  }

  // ===== LOADING =====

  &__skeleton {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  &__skeleton-card {
    padding: 1rem;
    border-radius: 0.5rem;
    background-color: var(--off-white, #f8f9fa);
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  }

  &__skeleton-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }

  &__skeleton-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  &__skeleton-info {
    flex: 1;
  }

  &__skeleton-name {
    width: 55%;
    height: 14px;
  }

  &__skeleton-content {
    width: 100%;
    height: 60px;
  }

  // ===== EMPTY =====

  &__empty {
    // padding: 1rem 0;
    width: 100%;
    height: 57px;
    background-color: var(--Off_white);
    border-radius: 5px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
  }

  &__empty-icon {
    display: block;
    font-size: 1.5rem;
    color: var(--Cinza_M);
  }

  &__empty-text {
    margin: 0;
    color: var(--Preto);
    font-size: .875rem;
    font-style: italic;
    font-weight: 400;
    line-height: 150%;
    justify-self: center;
  }

  // ===== ALERT =====

  &__alert {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 1rem;
    padding: 1rem;
    border-radius: 0.5rem;
    border-left-width: 4px;
    border-left-style: solid;

    &--success {
      background-color: var(--positivo-c);
      color: var(--positivo-e);
      border-color: var(--bs-success);
    }

    &--danger {
      background-color: var(--negativo-c);
      color: var(--negativo-e);
      border-color: var(--bs-danger);
    }
  }

  &__alert-icon {
    flex-shrink: 0;
    font-size: 1rem;
  }

  &__alert-message {
    flex: 1;
  }

  &__alert-close {
    margin-left: auto;
  }
}

// ===== SHIMMER =====

.skeleton {
  position: relative;
  overflow: hidden;
  background: #e9ecef;
  border-radius: 4px;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    transform: translateX(-100%);
    background: linear-gradient(90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.5) 50%,
        transparent 100%);
    animation: skeleton-shimmer 1.4s infinite;
  }
}

@keyframes skeleton-shimmer {
  100% {
    transform: translateX(100%);
  }
}
</style>