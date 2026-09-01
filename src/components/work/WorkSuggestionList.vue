<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import WorkSuggestionCard from "@/components/work/WorkSuggestionCard.vue";
import { useAuthStore } from "@/store/auth";
import { api } from "@/services/api";

const props = defineProps({
  work: { type: Object, required: true },
});

const emit = defineEmits(["applied"]);

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { loggedUser } = storeToRefs(authStore);

const suggestions = ref([]);
const loading = ref(true);
const loadError = ref("");
const actionAlert = ref(null); // { message, existingWork? }

// Quem pode julgar: contribuiu com alguma imagem da obra. Calculado no cliente
// porque GET /api/vrac-works/{id} ainda não devolve `can_review`.
const isContributor = ref(false);

// Por card, não por obra: o autor não pode julgar a própria sugestão (403).
const canDecide = (suggestion) =>
  isContributor.value && suggestion.user_id !== loggedUser.value?.id;

const pendingCount = computed(
  () => suggestions.value.filter((s) => s.status === "pending").length
);

const load = async () => {
  loading.value = true;
  loadError.value = "";
  try {
    const result = await api.getWorkSuggestions(props.work.id);
    suggestions.value = result.items;
  } catch (e) {
    loadError.value = e.response?.data?.message || "Não foi possível carregar as sugestões.";
  } finally {
    loading.value = false;
  }

  // Fora do try da listagem, e depois dela: saber se posso revisar é acessório —
  // se essa checagem falhar, as sugestões continuam aparecendo, só sem os botões.
  if (loggedUser.value) {
    isContributor.value = await api.isWorkContributor(props.work.id, loggedUser.value.id);
  }
};

onMounted(load);

const goToSuggest = () => {
  router.push({
    name: "work-detail-sugestoes",
    params: { id: route.params.id },
    query: { suggest: "true" },
  });
};

const handleApplied = ({ suggestionId, work }) => {
  suggestions.value = suggestions.value.filter((s) => s.id !== suggestionId);
  actionAlert.value = null;
  emit("applied", work);
};

const handleRejected = (suggestionId) => {
  suggestions.value = suggestions.value.filter((s) => s.id !== suggestionId);
  actionAlert.value = null;
};

const handleError = (payload) => {
  actionAlert.value = payload;
};
</script>

<template>
  <div class="work-suggestions" data-cy="work-suggestion-list">
    <!-- Loading: mesmo skeleton da aba de sugestões da imagem. -->
    <div v-if="loading" class="work-suggestions__loading">
      <div v-for="i in 3" :key="i" class="work-suggestions__skeleton-card">
        <div class="work-suggestions__skeleton-header">
          <div class="work-suggestions__skeleton-avatar" />
          <div class="work-suggestions__skeleton-lines">
            <div class="work-suggestions__skeleton-line work-suggestions__skeleton-line--wide" />
            <div class="work-suggestions__skeleton-line work-suggestions__skeleton-line--narrow" />
          </div>
        </div>
        <div class="work-suggestions__skeleton-body" />
      </div>
    </div>

    <template v-else>
      <div v-if="loadError" class="alert alert-warning" role="alert">{{ loadError }}</div>

      <h2 v-if="isContributor && pendingCount" class="work-suggestions__title">
        Analise as sugestões pendentes abaixo
      </h2>

      <div v-if="actionAlert" class="alert alert-warning" role="alert">
        {{ actionAlert.message }}
        <RouterLink v-if="actionAlert.existingWork"
          :to="{ name: 'work-detail', params: { id: actionAlert.existingWork.id } }">
          Abrir a obra existente
        </RouterLink>
      </div>

      <ul v-if="suggestions.length" class="work-suggestions__list">
        <li v-for="suggestion in suggestions" :key="suggestion.id">
          <WorkSuggestionCard :suggestion="suggestion" :work="props.work"
            :can-decide="canDecide(suggestion)" @applied="handleApplied" @rejected="handleRejected"
            @error="handleError" />
        </li>
      </ul>

      <!-- Vazio -->
      <div v-else-if="!loadError" class="work-suggestions__empty">
        <i class="bi bi-chat-square-text" aria-hidden="true" />
        <p>Nenhuma sugestão enviada ainda para esta obra.</p>
      </div>

      <button v-if="loggedUser" class="work-suggestions__submit-btn" @click="goToSuggest">
        Enviar sugestão
      </button>

      <!-- Bloco informativo -->
      <div class="work-suggestions__info">
        <div class="work-suggestions__info-icon">
          <i class="bi bi-question-circle-fill" aria-hidden="true"></i>
        </div>
        <p class="work-suggestions__info-text">
          Obras são descritas de forma colaborativa: qualquer usuário pode sugerir
          alterações e quem já enviou imagens desta obra revisa as sugestões — menos
          a própria.
        </p>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.work-suggestions {
  // ── Loading skeleton ────────────────────────────────────────────────────────
  &__loading {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  &__skeleton-card {
    background-color: var(--Off_white);
    border-radius: 8px;
    padding: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }

  &__skeleton-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  &__skeleton-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background-color: var(--Cinza_C);
    flex-shrink: 0;
    animation: skeleton-pulse 1.4s ease infinite;
  }

  &__skeleton-lines {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  &__skeleton-line {
    height: 12px;
    border-radius: 4px;
    background-color: var(--Cinza_C);
    animation: skeleton-pulse 1.4s ease infinite;

    &--wide {
      width: 70%;
    }

    &--narrow {
      width: 40%;
    }
  }

  &__skeleton-body {
    height: 60px;
    border-radius: 6px;
    background-color: var(--Cinza_C);
    animation: skeleton-pulse 1.4s ease infinite;
  }

  &__title {
    font-size: 1rem;
    font-weight: 500;
    margin-bottom: 1rem;
  }

  &__list {
    list-style: none;
    margin: 0 0 0.75rem;
    padding: 0;
  }

  // ── Vazio ───────────────────────────────────────────────────────────────────
  &__empty {
    text-align: center;
    padding: 2rem 0;
    color: var(--Cinza_M);

    i {
      font-size: 2rem;
      display: block;
      margin-bottom: 0.5rem;
      opacity: 0.4;
    }

    p {
      font-size: 0.85rem;
      margin: 0;
    }
  }

  // ── Botão enviar sugestão ───────────────────────────────────────────────────
  &__submit-btn {
    display: block;
    width: 100%;
    padding: 0.3125rem 0.875rem;
    margin-bottom: 0.75rem;
    font-size: 0.875rem;
    font-weight: 400;
    line-height: 150%;
    color: var(--Branco);
    background-color: var(--Preto);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: var(--Preto);
    }
  }

  // ── Bloco informativo ───────────────────────────────────────────────────────
  &__info {
    display: flex;
    gap: 24px;
    align-items: center;
    background: var(--Off_white);
    border: 1px solid var(--Cinza_M);
    border-left: none;
    border-radius: 6px;
    padding: 12px 12px;
    position: relative;
    overflow: hidden;
    margin-bottom: 36px;

    &::before {
      content: "";
      position: absolute;
      left: 0px;
      display: block;
      width: 4px;
      height: 100%;
      background: var(--Preto);
    }
  }

  &__info-icon {
    color: var(--Preto, #1a1a1a);
    flex-shrink: 0;

    .bi {
      font-size: 1rem;
    }
  }

  &__info-text {
    font-size: 0.75rem;
    color: var(--Cinza_e);
    line-height: 1.5;
    margin: 0;
  }
}

// ─── Animação skeleton ────────────────────────────────────────────────────────
@keyframes skeleton-pulse {
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
  }

  100% {
    opacity: 1;
  }
}
</style>
