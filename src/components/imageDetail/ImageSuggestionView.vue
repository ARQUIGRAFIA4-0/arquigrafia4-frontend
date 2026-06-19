<template>
  <div class="suggestion-view">

    <!-- Loading -->
    <div v-if="loading" class="suggestion-view__loading">
      <div v-for="i in 3" :key="i" class="suggestion-view__skeleton-card">
        <div class="suggestion-view__skeleton-header">
          <div class="suggestion-view__skeleton-avatar" />
          <div class="suggestion-view__skeleton-lines">
            <div class="suggestion-view__skeleton-line suggestion-view__skeleton-line--wide" />
            <div class="suggestion-view__skeleton-line suggestion-view__skeleton-line--narrow" />
          </div>
        </div>
        <div class="suggestion-view__skeleton-body" />
      </div>
    </div>

    <template v-else>
      <!-- Lista de sugestões -->
      <ul v-if="suggestions.length > 0" class="suggestion-view__list">
        <li v-for="suggestion in suggestions" :key="suggestion.id" class="suggestion-view__card">
          <!-- Cabeçalho -->
          <button class="suggestion-view__card-header" :aria-expanded="open.includes(suggestion.id)"
            @click="toggle(suggestion.id)">
            <div class="suggestion-view__card-identity">
              <div v-if="suggestion.user?.avatar" class="suggestion-view__avatar suggestion-view__avatar--image">
                <img :src="suggestion.user.avatar" :alt="suggestion.user?.name" />
              </div>
              <div v-else class="suggestion-view__avatar suggestion-view__avatar--initials">
                {{ initials(suggestion.user) }}
              </div>
              <span class="suggestion-view__card-label">
                <strong>{{ suggestion.user?.name ?? "Usuário" }}</strong>
                {{ suggestionLabel(suggestion) }}
              </span>
            </div>
            <i class="bi" :class="open.includes(suggestion.id) ? 'bi-chevron-up' : 'bi-chevron-down'"
              aria-hidden="true" />
          </button>

          <!-- Conteúdo expandido -->
          <div v-if="open.includes(suggestion.id)" class="suggestion-view__card-body">
            <span class="suggestion-view__timestamp">{{ timeAgo(suggestion.created_at) }}</span>

            <div class="suggestion-view__fields">

              <div v-if="suggestion.payload?.title" class="suggestion-view__field">
                <label class="suggestion-view__field-label">Título sugerido</label>
                <input class="suggestion-view__field-input" type="text" :value="suggestion.payload.title" readonly />
              </div>

              <div v-if="suggestion.payload?.description" class="suggestion-view__field">
                <label class="suggestion-view__field-label">Descrição sugerida</label>
                <textarea class="suggestion-view__field-input suggestion-view__field-input--textarea"
                  :value="suggestion.payload.description" rows="3" readonly />
              </div>

              <div v-if="suggestion.payload?.subjects?.length" class="suggestion-view__field">
                <label class="suggestion-view__field-label">Tags sugeridas</label>
                <div class="suggestion-view__tags">
                  <span v-for="subject in suggestion.payload.subjects" :key="subject" class="suggestion-view__tag">{{
                    subject }}</span>
                </div>
              </div>

              <div v-if="suggestion.payload?.location_label" class="suggestion-view__field">
                <label class="suggestion-view__field-label">Localização sugerida</label>
                <input class="suggestion-view__field-input" type="text" :value="suggestion.payload.location_label"
                  readonly />
              </div>

              <div v-if="suggestion.payload?.earliest_date" class="suggestion-view__field">
                <label class="suggestion-view__field-label">Data sugerida</label>
                <input class="suggestion-view__field-input" type="text" :value="formatDateRange(suggestion.payload)"
                  readonly />
              </div>

              <div v-if="suggestion.payload?.reason" class="suggestion-view__field">
                <label class="suggestion-view__field-label">Motivo</label>
                <p class="suggestion-view__reason">{{ suggestion.payload.reason }}</p>
              </div>
            </div>

            <!-- Status -->
            <div class="suggestion-view__status">
              <span v-if="suggestion.status === 'accepted'"
                class="suggestion-view__status-badge suggestion-view__status-badge--accepted">
                <i class="bi bi-check-circle-fill" aria-hidden="true" />
                A sugestão foi aceita pelo autor
              </span>
              <span v-else-if="suggestion.status === 'partially_accepted'"
                class="suggestion-view__status-badge suggestion-view__status-badge--partial">
                <i class="bi bi-check-circle" aria-hidden="true" />
                Sugestão parcialmente aceita pelo autor
              </span>
              <span v-else-if="suggestion.status === 'rejected'"
                class="suggestion-view__status-badge suggestion-view__status-badge--rejected">
                <i class="bi bi-x-circle-fill" aria-hidden="true" />
                Sugestão recusada
              </span>
              <span v-else class="suggestion-view__status-badge suggestion-view__status-badge--pending">
                <i class="bi bi-clock" aria-hidden="true" />
                Aguardando revisão do autor
              </span>
            </div>
          </div>
        </li>
      </ul>

      <!-- Vazio -->
      <div v-else class="suggestion-view__empty">
        <i class="bi bi-chat-square-text" aria-hidden="true" />
        <p>Nenhuma sugestão enviada ainda para esta imagem.</p>
      </div>

      <!-- Botão enviar sugestão -->
      <button v-if="isLoggedIn" class="suggestion-view__submit-btn" @click="goToSuggest">
        Enviar sugestão
      </button>

      <!-- Bloco informativo -->
      <div class="suggestion-view__info">
        <div class="suggestion-view__info-icon">
          <i class="bi bi-question-circle" aria-hidden="true"></i>
        </div>
        <p class="suggestion-view__info-text">
          A plataforma ARQUIGRAFIA é colaborativa e permite que usuários façam sugestões de modificação nos dados das
          imagens caso identifiquem a possibilidade de melhorias.
        </p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "@/axios";
import { useAuthStore } from "@/store/auth";
import { storeToRefs } from "pinia";

defineOptions({ name: "ImageSuggestionView" });

const props = defineProps({
  image: { type: Object, default: null },
});

const router = useRouter();
const authStore = useAuthStore();
const { loggedUser } = storeToRefs(authStore);
const isLoggedIn = computed(() => !!loggedUser.value);

const loading = ref(true);
const suggestions = ref([]);
const open = ref([]);

const initials = (user) => {
  if (!user?.name) return "?";
  return user.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
};

const suggestionLabel = (suggestion) => {
  const fields = Object.keys(suggestion.payload || {}).filter((k) => k !== "reason");
  const map = {
    title: "sugeriu um novo título",
    description: "sugeriu uma nova descrição",
    subjects: "sugeriu novas tags",
    location_label: "sugeriu uma nova localização",
    earliest_date: "sugeriu uma nova data",
    photographer: "sugeriu um novo fotógrafo",
  };
  if (fields.length === 1 && map[fields[0]]) return map[fields[0]];
  return "sugeriu novas edições";
};

const formatDateRange = (payload) => {
  const start = payload.earliest_date ? new Date(payload.earliest_date).getUTCFullYear() : null;
  const end = payload.latest_date ? new Date(payload.latest_date).getUTCFullYear() : null;
  if (start && end && start !== end) return `${start} – ${end}`;
  return start ? String(start) : "";
};

const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "agora mesmo";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} minuto(s)`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} hora(s)`;
  return `há ${Math.floor(diff / 86400)} dia(s)`;
};

const toggle = (id) => {
  const idx = open.value.indexOf(id);
  if (idx === -1) open.value.push(id);
  else open.value.splice(idx, 1);
};

const fetchSuggestions = async () => {
  if (!props.image?.id) return;
  loading.value = true;
  try {
    const { data } = await axios.get("/api/image-suggestions", {
      params: { image_id: props.image.id },
      headers: authStore.authHeader ? { Authorization: authStore.authHeader } : {},
    });
    suggestions.value = data.suggestions?.data ?? data.suggestions ?? [];
  } catch (e) {
    console.error("Erro ao carregar sugestões:", e);
  } finally {
    loading.value = false;
  }
};

const goToSuggest = () => {
  router.push({
    name: "image-detail-sugestoes",
    params: { id: props.image.id },
    query: { suggest: "true" },
  });
};

onMounted(fetchSuggestions);
</script>
<style lang="scss" scoped>
// ─── Bloco: suggestion-view ───────────────────────────────────────────────────
.suggestion-view {
  padding-top: 1.5rem;
  padding-bottom: 1.5rem;

  // ── Loading skeleton ────────────────────────────────────────────────────────
  &__loading {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  &__skeleton-card {
    background-color: var(--var(--Off_white));
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
      width: 55%;
    }

    &--narrow {
      width: 25%;
    }
  }

  &__skeleton-body {
    height: 60px;
    border-radius: 4px;
    background-color: var(--Cinza_C);
    animation: skeleton-pulse 1.4s ease infinite;
  }

  // ── Lista ───────────────────────────────────────────────────────────────────
  &__list {
    list-style: none;
    padding: 0;
    margin: 0 0 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  // ── Card ────────────────────────────────────────────────────────────────────
  &__card {
    background-color: var(--var(--Off_white));
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    overflow: hidden;
  }

  &__card-header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;

    &:hover {
      background-color: --var(--Off_white)
    }
  }

  &__card-identity {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
    flex: 1;
  }

  &__card-label {
    font-size: 0.85rem;
    color: var(--Cinza_M);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    strong {
      color: var(--Cinza_E);
      font-weight: 600;
    }
  }

  &__card-body {
    padding: 0 1rem 1rem;
  }

  // ── Avatar ──────────────────────────────────────────────────────────────────
  &__avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    flex-shrink: 0;
    overflow: hidden;

    &--image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    &--initials {
      background-color: var(--Preto);
      color: var(--Branco);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
    }
  }

  // ── Timestamp ───────────────────────────────────────────────────────────────
  &__timestamp {
    display: block;
    text-align: right;
    font-size: 0.75rem;
    color: var(--Cinza_M);
    margin-bottom: 0.75rem;
  }

  // ── Campos ──────────────────────────────────────────────────────────────────
  &__fields {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  &__field-label {
    font-size: 0.75rem;
    color: var(--Cinza_M);
    font-style: italic;
    margin: 0;
  }

  &__field-input {
    width: 100%;
    padding: 0.375rem 0.625rem;
    font-size: 0.875rem;
    color: var(--Cinza_E);
    background-color: var(--Branco);
    border: 1px solid var(--Cinza_C);
    border-radius: 4px;
    resize: none;
    outline: none;

    &--textarea {
      min-height: 80px;
    }
  }

  // ── Tags ────────────────────────────────────────────────────────────────────
  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  }

  &__tag {
    display: inline-block;
    padding: 0.2rem 0.5rem;
    font-size: 0.75rem;
    background-color: var(--Cinza_E);
    color: var(--Branco);
    border-radius: 4px;
  }

  // ── Motivo ──────────────────────────────────────────────────────────────────
  &__reason {
    font-size: 0.8rem;
    color: var(--Cinza_M);
    font-style: italic;
    margin: 0;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--Cinza_C);
    border-radius: 4px;
    background-color: var(--Branco);
  }

  // ── Status ──────────────────────────────────────────────────────────────────
  &__status {
    text-align: right;
  }

  &__status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.8rem;

    &--accepted {
      color: var(--Positivo_E);
    }

    &--partial {
      color: var(--Laranja_M);
    }

    &--rejected {
      color: var(--Negativo_E);
    }

    &--pending {
      color: var(--Cinza_M);
      font-style: italic;
    }
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
    padding: .3125rem .875rem;
    margin-bottom: 1rem;
    font-size: .875rem;
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
    gap: 12px;
    align-items: flex-start;
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    padding: 14px 16px;
  }

  &__info-icon {
    font-size: 1rem;
    color: var(--Cinza_M, #6c757d);
    flex-shrink: 0;
    margin-top: 2px;
  }

  &__info-text {
    font-size: 0.8125rem; // 13px
    color: var(--Cinza_M, #6c757d);
    line-height: 1.55;
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