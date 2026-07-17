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
                <img :src="`${API_BASE_URL}${selectedIdentity.avatar}`" :alt="suggestion.user?.name" />
              </div>

              <div v-else class="suggestion-view__avatar suggestion-view__avatar--image">
                <img :src="defaultImageUser" :alt="suggestion.user?.name" />
              </div>

              <span class="suggestion-view__card-label">
                {{ capitalizeWords(suggestion.user?.name) ?? "Usuário" }} -
                {{ suggestionLabel(suggestion) }}
              </span>
            </div>
            <div class="suggestion-view__status-wrapper">
              <!-- Status -->
              <div class="suggestion-view__status">
                <span v-if="suggestion.status === 'accepted'"
                  class="suggestion-view__status-badge suggestion-view__status-badge--accepted">
                  Sugestão aceita
                </span>
                <span v-else-if="suggestion.status === 'partially_accepted'"
                  class="suggestion-view__status-badge suggestion-view__status-badge--partial">
                  Sugestão parcial
                </span>
                <span v-else-if="suggestion.status === 'rejected'"
                  class="suggestion-view__status-badge suggestion-view__status-badge--rejected">
                  Sugestão recusada
                </span>
                <span v-else class="suggestion-view__status-badge suggestion-view__status-badge--pending">
                  Pendente
                </span>
              </div>
              <i class="bi" :class="open.includes(suggestion.id) ? 'bi-chevron-up' : 'bi-chevron-down'"
                aria-hidden="true" />
            </div>
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
                  <span v-for="subject in resolvedTags(suggestion)" :key="subject.id" class="suggestion-view__tag"
                    :class="{
                      'suggestion-view__tag--added': subject.status === 'added',
                      'suggestion-view__tag--removed': subject.status === 'removed',
                    }">
                    {{ subject.term }}
                  </span>
                </div>

                <div v-if="resolvedTags(suggestion).some(t => t.status !== 'kept')"
                  class="suggestion-view__tags-legend">
                  <span v-if="resolvedTags(suggestion).some(t => t.status === 'added')"
                    class="suggestion-view__tags-legend-item suggestion-view__tags-legend-item--added">
                    Adicionada
                  </span>
                  <span v-if="resolvedTags(suggestion).some(t => t.status === 'removed')"
                    class="suggestion-view__tags-legend-item suggestion-view__tags-legend-item--removed">
                    Removida
                  </span>
                </div>
              </div>

              <div v-if="suggestion.payload?.location_label || hasCoordinates(suggestion)"
                class="suggestion-view__field">
                <label class="suggestion-view__field-label">Localização sugerida</label>
                <input v-if="suggestion.payload?.location_label" class="suggestion-view__field-input" type="text"
                  :value="suggestion.payload.location_label" readonly />
                <div v-if="hasCoordinates(suggestion)" class="suggestion-view__map">
                  <MapLibreMap :style-url="mapStyleUrl"
                    :center="[suggestion.payload.longitude, suggestion.payload.latitude]" :zoom="14"
                    :marker-position="{ lat: suggestion.payload.latitude, lng: suggestion.payload.longitude }"
                    marker-color="#2F2F2F" />
                </div>
              </div>

              <div v-if="suggestion.payload?.earliest_date" class="suggestion-view__field">
                <label class="suggestion-view__field-label">Data sugerida</label>
                <input class="suggestion-view__field-input" type="text" :value="formatDateRange(suggestion.payload)"
                  readonly />
              </div>

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
          <i class="bi bi-question-circle-fill" aria-hidden="true"></i>
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
import { ref, computed, watch } from "vue";
import { useRouter } from "vue-router";
import axios from "@/axios";
import { useAuthStore } from "@/store/auth";
import { storeToRefs } from "pinia";
import defaultImageUser from "@/assets/profile_image.png";
import { useImageForm } from "@/composables/useImageForm";
import MapLibreMap from "@/components/map/MapLibreMap.vue";

const mapStyleUrl = "https://tiles.openfreemap.org/styles/positron";
const API_BASE_URL = import.meta.env.VITE_BASE_REQUEST_URL;
const { capitalizeWords, loadFormDependencies, allSubjects } = useImageForm();

defineOptions({ name: "ImageSuggestionView" });

const props = defineProps({
  image: { type: Object, default: null },
});
console.log("View:", props);


const router = useRouter();
const authStore = useAuthStore();
const { loggedUser } = storeToRefs(authStore);
const isLoggedIn = computed(() => !!loggedUser.value);

const loading = ref(true);
const suggestions = ref([]);
const open = ref([]);

const hasCoordinates = (suggestion) => {
  const { latitude, longitude } = suggestion.payload ?? {};
  return latitude !== undefined && latitude !== null && longitude !== undefined && longitude !== null;
};

const resolvedTags = (suggestion) => {
  const value = suggestion.payload?.subjects;
  if (!Array.isArray(value) || value.length === 0) return [];

  const currentIds = new Set((props.image?.subjects ?? []).map((s) => s.id));
  const currentTagMap = new Map((props.image?.subjects ?? []).map((s) => [s.id, s]));

  const suggestedTagMap = new Map(
    value
      .filter((v) => typeof v === "object" && v !== null)
      .map((v) => [v.id, v])
  );

  const suggestedIds = new Set(
    value.map((v) => (typeof v === "string" ? v : v.id))
  );

  const allTagIds = new Set([...currentIds, ...suggestedIds]);

  const tags = [...allTagIds].map((uuid) => {
    const fromImage = currentTagMap.get(uuid);
    const fromSuggested = suggestedTagMap.get(uuid);
    const fromSubjects = allSubjects.value.find((s) => s.id === uuid);

    const term = fromImage?.term ?? fromSuggested?.term ?? fromSubjects?.term ?? uuid;

    let status = "kept";
    if (!currentIds.has(uuid)) status = "added";
    if (!suggestedIds.has(uuid)) status = "removed";

    return { id: uuid, term, status };
  });

  tags.sort((a, b) => {
    const order = { kept: 0, added: 1, removed: 2 };
    return order[a.status] - order[b.status];
  });

  return tags;
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
    latitude: "sugeriu uma nova localização",
    longitude: "sugeriu uma nova localização",
  };
  if (fields.length === 1 && map[fields[0]]) return map[fields[0]];
  if (fields.every((f) => map[f] === "sugeriu uma nova localização")) return "sugeriu uma nova localização";
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
      // headers: authStore.authHeader ? { Authorization: authStore.authHeader } : {},
    });
    console.log("fetch:", data.data);

    suggestions.value = data.data ?? [];
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

watch(
  () => props.image?.id,
  async (id) => {
    if (id) {
      await loadFormDependencies();
      console.log("allSubjects após load:", allSubjects.value);
      await fetchSuggestions();
    }
  },
  { immediate: true }
);
</script>
<style lang="scss" scoped>
// ─── Bloco: suggestion-view ───────────────────────────────────────────────────
.suggestion-view {

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
    margin: 0 0 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  // ── Card ────────────────────────────────────────────────────────────────────
  &__card {
    background-color: var(--Off_white);
    border-radius: 5px;
    overflow: hidden;
  }

  &__card-header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: .5rem 1rem;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;

    &:hover {
      background-color: var(--Off_white)
    }
  }

  &__card-identity {
    display: flex;
    align-items: center;
    gap: 1rem;
    min-width: 0;
    flex: 1;
    margin-right: 25px;
  }

  &__card-label {
    font-size: .875rem;
    font-weight: 400;
    font-style: italic;
    line-height: 150%;
    color: var(--Preto);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__status-wrapper {
    display: flex;
    gap: 1.875rem;
    justify-content: space-between;
    align-items: center;
  }


  // ── Status ──────────────────────────────────────────────────────────────────
  // &__status {
  //   text-align: right;
  // }

  &__status-badge {
    border-radius: 2px;
    padding: .25rem .5rem;
    font-size: .75rem;
    font-weight: 400;
    line-height: 114%;
    background-color: transparent;

    &--accepted {
      border: 1px solid var(--Positivo_E);
      color: var(--Positivo_E);
    }

    &--partial {
      border: 1px solid var(--Cinza_E);
      color: var(--Cinza_E);
    }

    &--rejected {
      border: 1px solid var(--Negativo_E);
      color: var(--Negativo_E);
    }

    &--pending {
      border: 1px solid var(--Laranja_E);
      color: var(--Laranja_E);
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

  &__map {
    position: relative;
    width: 100%;
    height: 220px;
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid var(--Cinza_C);
    margin-top: 0.25rem;
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

    &--added {
      color: var(--Positivo_E);
      background-color: var(--Positivo_C);
      border: 1px solid var(--Positivo_E);
    }

    &--removed {
      color: var(--Negativo_E);
      background-color: var(--Negativo_C);
      border: 1px solid var(--Negativo_E);
      text-decoration: line-through;
    }
  }

  &__tags-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }

  &__tags-legend-item {
    font-size: 0.6875rem;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    color: var(--Cinza_M);

    &::before {
      content: "";
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 2px;
    }

    &--added::before {
      background-color: var(--Positivo_E);
    }

    &--removed::before {
      background-color: var(--Negativo_E);
    }
  }

  // ── Motivo ──────────────────────────────────────────────────────────────────
  &__reason-wrapper {
    display: flex;
    gap: 4.375rem;
    justify-content: space-between;
    align-items: center;
    flex: 1;
  }

  &__reason {
    border: 1px solid var(--Laranja_E);
    border-radius: 2px;
    padding: .25rem .5rem;
    font-size: .75rem;
    font-weight: 400;
    line-height: 114%;
    color: var(--Laranja_M);
    background-color: transparent;
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
    margin-bottom: .75rem;
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
    gap: 24px;
    align-items: center;
    background: var(--Off_white);
    border: 1px solid var(--Cinza_M);
    border-left: none;
    border-radius: 6px;
    padding: 12px 12px;
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
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