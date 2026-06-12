<template>
  <div class="suggestions-panel">

    <!-- Loading -->
    <div v-if="loading" class="suggestions-panel__skeleton">
      <div v-for="i in 3" :key="i" class="suggestions-panel__skeleton-card">
        <div class="suggestions-panel__skeleton-header">
          <div class="suggestions-panel__skeleton-avatar skeleton" />

          <div class="suggestions-panel__skeleton-info">
            <div class="suggestions-panel__skeleton-title skeleton" />
            <div class="suggestions-panel__skeleton-subtitle skeleton" />
          </div>
        </div>

        <div class="suggestions-panel__skeleton-content skeleton" />
      </div>
    </div>

    <!-- Vazio -->
    <div v-else-if="groupedSuggestions.length === 0" class="suggestions-panel__empty">
      <i class="bi bi-inbox suggestions-panel__empty-icon" />
      <p class="suggestions-panel__empty-text">Nenhuma sugestão pendente para esta imagem.</p>
    </div>

    <!-- Lista agrupada por usuário -->
    <div v-else class="suggestions-panel__content">
      <h2 class="suggestions-panel__title">Analise as sugestões pendentes abaixo</h2>

      <!-- Container por usuário -->
      <div v-for="group in groupedSuggestions" :key="group.userId" class="suggestions-panel__group">
        <!-- Cabeçalho da Container -->
        <div class="suggestions-panel__group-header" role="button" @click="toggleGroup(group.userId)">
          <div class="suggestions-panel__group-user">

            <div class="suggestions-panel__avatar">
              <img :src="getUserAvatar(group.user)" :alt="`Foto de ${group.user?.name ?? 'Usuário'}`"
                class="suggestions-panel__avatar-image" />
            </div>

            <span class="suggestions-panel__user-name">{{ group.user?.name ?? "Usuário" }}

            </span>
            <span class="suggestions-panel__badge">
              {{ group.suggestions.length }}
              {{ group.suggestions.length === 1 ? 'sugestão' : 'sugestões' }}
            </span>
          </div>
          <i class="bi suggestions-panel__group-icon"
            :class="openGroups.includes(group.userId) ? 'bi-chevron-up' : 'bi-chevron-down'" />
        </div>

        <!-- Sugestões do usuário -->
        <div v-if="openGroups.includes(group.userId)">
          <div v-for="(suggestion, index) in group.suggestions" :key="suggestion.id" class="p-3"
            :class="{ 'border-top': index > 0 }">

            <!-- Campos do payload -->
            <div class="suggestions-panel__fields">
              <span class="badge bg-primary mb-2">Sugestão {{ index + 1 }}</span>

              <!-- Título -->
              <div v-if="suggestion.payload?.title !== undefined">
                <label class="form-label fw-semibold mb-1">Título</label>
                <input type="text" class="form-control form-control-sm mb-2" :value="suggestion.payload.title"
                  readonly />
                <div class="d-flex gap-2">
                  <button type="button" class="btn btn-sm flex-grow-1"
                    :class="getFieldState(suggestion.id, 'title') === 'rejected' ? 'btn-danger' : 'btn-outline-secondary'"
                    @click="setFieldState(suggestion.id, 'title', 'rejected')">
                    Recusar
                  </button>
                  <button type="button" class="btn btn-sm flex-grow-1"
                    :class="getFieldState(suggestion.id, 'title') === 'accepted' ? 'btn-success' : 'btn-outline-secondary'"
                    @click="setFieldState(suggestion.id, 'title', 'accepted')">
                    Aceitar
                  </button>
                </div>
              </div>

              <!-- Descrição -->
              <div v-if="suggestion.payload?.description !== undefined">
                <label class="form-label fw-semibold mb-1">Descrição</label>
                <textarea class="form-control form-control-sm mb-2" :value="suggestion.payload.description" rows="4"
                  readonly />
                <div class="d-flex gap-2">
                  <button type="button" class="btn btn-sm flex-grow-1"
                    :class="getFieldState(suggestion.id, 'description') === 'rejected' ? 'btn-danger' : 'btn-outline-secondary'"
                    @click="setFieldState(suggestion.id, 'description', 'rejected')">
                    Recusar
                  </button>
                  <button type="button" class="btn btn-sm flex-grow-1"
                    :class="getFieldState(suggestion.id, 'description') === 'accepted' ? 'btn-success' : 'btn-outline-secondary'"
                    @click="setFieldState(suggestion.id, 'description', 'accepted')">
                    Aceitar
                  </button>
                </div>
              </div>

              <!-- Tags -->
              <div v-if="suggestion.payload?.subjects?.length">
                <label class="form-label fw-semibold mb-1">Tags</label>
                <div class="d-flex flex-wrap gap-2 mb-2">
                  <span v-for="subject in suggestion.payload.subjects" :key="subject"
                    class="badge bg-secondary fw-normal">{{ subject }}</span>
                </div>
                <div class="d-flex gap-2">
                  <button type="button" class="btn btn-sm flex-grow-1"
                    :class="getFieldState(suggestion.id, 'subjects') === 'rejected' ? 'btn-danger' : 'btn-outline-secondary'"
                    @click="setFieldState(suggestion.id, 'subjects', 'rejected')">
                    Recusar
                  </button>
                  <button type="button" class="btn btn-sm flex-grow-1"
                    :class="getFieldState(suggestion.id, 'subjects') === 'accepted' ? 'btn-success' : 'btn-outline-secondary'"
                    @click="setFieldState(suggestion.id, 'subjects', 'accepted')">
                    Aceitar
                  </button>
                </div>
              </div>

              <!-- Localização -->
              <div v-if="suggestion.payload?.location_label !== undefined">
                <label class="form-label fw-semibold mb-1">Localização</label>
                <input type="text" class="form-control form-control-sm mb-2" :value="suggestion.payload.location_label"
                  readonly />
                <div class="d-flex gap-2">
                  <button type="button" class="btn btn-sm flex-grow-1"
                    :class="getFieldState(suggestion.id, 'location_label') === 'rejected' ? 'btn-danger' : 'btn-outline-secondary'"
                    @click="setFieldState(suggestion.id, 'location_label', 'rejected')">
                    Recusar
                  </button>
                  <button type="button" class="btn btn-sm flex-grow-1"
                    :class="getFieldState(suggestion.id, 'location_label') === 'accepted' ? 'btn-success' : 'btn-outline-secondary'"
                    @click="setFieldState(suggestion.id, 'location_label', 'accepted')">
                    Aceitar
                  </button>
                </div>
              </div>

              <!-- Data -->
              <div v-if="suggestion.payload?.earliest_date !== undefined">
                <label class="form-label fw-semibold mb-1">Data</label>
                <input type="text" class="form-control form-control-sm mb-2"
                  :value="formatDateRange(suggestion.payload)" readonly />
                <div class="d-flex gap-2">
                  <button type="button" class="btn btn-sm flex-grow-1"
                    :class="getFieldState(suggestion.id, 'earliest_date') === 'rejected' ? 'btn-danger' : 'btn-outline-secondary'"
                    @click="setFieldState(suggestion.id, 'earliest_date', 'rejected')">
                    Recusar
                  </button>
                  <button type="button" class="btn btn-sm flex-grow-1"
                    :class="getFieldState(suggestion.id, 'earliest_date') === 'accepted' ? 'btn-success' : 'btn-outline-secondary'"
                    @click="setFieldState(suggestion.id, 'earliest_date', 'accepted')">
                    Aceitar
                  </button>
                </div>
              </div>

              <!-- Fotógrafo -->
              <div v-if="suggestion.payload?.photographer !== undefined">
                <label class="form-label fw-semibold mb-1">Fotógrafo</label>
                <input type="text" class="form-control form-control-sm mb-2" :value="suggestion.payload.photographer"
                  readonly />
                <div class="d-flex gap-2">
                  <button type="button" class="btn btn-sm flex-grow-1"
                    :class="getFieldState(suggestion.id, 'photographer') === 'rejected' ? 'btn-danger' : 'btn-outline-secondary'"
                    @click="setFieldState(suggestion.id, 'photographer', 'rejected')">
                    Recusar
                  </button>
                  <button type="button" class="btn btn-sm flex-grow-1"
                    :class="getFieldState(suggestion.id, 'photographer') === 'accepted' ? 'btn-success' : 'btn-outline-secondary'"
                    @click="setFieldState(suggestion.id, 'photographer', 'accepted')">
                    Aceitar
                  </button>
                </div>
              </div>

              <!-- Motivo -->
              <p v-if="suggestion.payload?.reason" class="text-muted small fst-italic mb-0 p-2 border rounded bg-white">
                <i class="bi bi-chat-left-quote me-1" />{{ suggestion.payload.reason }}
              </p>
            </div>

            <!-- Botão submeter -->
            <div class="pt-2 border-top">
              <button class="btn btn-dark btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
                :disabled="processingId === suggestion.id || !hasAnyAccepted(suggestion.id)"
                @click="handleSubmit(suggestion)">
                <span v-if="processingId === suggestion.id" class="spinner-border spinner-border-sm" role="status" />
                <i v-else class="bi bi-check2-circle" />
                Submeter campos aceitos
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>

    <!-- Alert -->
    <transition name="fade">
      <div v-if="alert.show" class="alert mt-4 h-auto fs-6 border border-start-3" :class="alert.type === 'success'
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
import { ref, reactive, computed, onMounted } from "vue";
import axios from "@/axios";
import { useAuthStore } from "@/store/auth";
import userImageDefault from '@/assets/profile_image.png';

defineOptions({ name: "ImageSuggestion" });

const props = defineProps({
  image: { type: Object, default: null },
});
const API_BASE_URL = import.meta.env.VITE_BASE_REQUEST_URL;

const emit = defineEmits(["updated"]);

const authStore = useAuthStore();

const loading = ref(true);
const suggestions = ref([]);
const openGroups = ref([]);

// { [suggestionId]: { [field]: 'accepted' | 'rejected' | null } }
const fieldStates = reactive({});

const processingId = ref(null);
const alert = reactive({ show: false, type: "success", message: "" });

const getUserAvatar = (user) => {
  return user?.avatar_path
    ? `${API_BASE_URL}${user.avatar_path}`
    : userImageDefault;
};



// ─── Campos relevantes do payload ─────────────────────────────────────────────
const PAYLOAD_FIELDS = [
  "title",
  "description",
  "subjects",
  "location_label",
  "earliest_date",
  "photographer",
];

// ─── Agrupar sugestões por usuário ────────────────────────────────────────────
const groupedSuggestions = computed(() => {
  const map = new Map();
  for (const suggestion of suggestions.value) {
    const userId = suggestion.user_id;
    if (!map.has(userId)) {
      map.set(userId, { userId: userId, user: suggestion.user, suggestions: [] });
    }
    map.get(userId).suggestions.push(suggestion);
  }

  return Array.from(map.values());
});

// ─── Estado por campo ─────────────────────────────────────────────────────────
const initFieldStates = (suggestion) => {
  if (!fieldStates[suggestion.id]) {
    fieldStates[suggestion.id] = {};
    PAYLOAD_FIELDS.forEach((f) => {
      if (suggestion.payload?.[f] !== undefined) {
        fieldStates[suggestion.id][f] = null;
      }
    });
  }
};

const getFieldState = (suggestionId, field) =>
  fieldStates[suggestionId]?.[field] ?? null;

// Toggle: clicar no mesmo estado ativo volta para null
const setFieldState = (suggestionId, field, state) => {
  if (!fieldStates[suggestionId]) fieldStates[suggestionId] = {};
  fieldStates[suggestionId][field] =
    fieldStates[suggestionId][field] === state ? null : state;
};

const hasAnyAccepted = (suggestionId) =>
  Object.values(fieldStates[suggestionId] ?? {}).some((s) => s === "accepted");

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDateRange = (payload) => {
  const start = payload.earliest_date
    ? new Date(payload.earliest_date).getUTCFullYear()
    : null;
  const end = payload.latest_date
    ? new Date(payload.latest_date).getUTCFullYear()
    : null;
  if (start && end && start !== end) return `${start} – ${end}`;
  return start ? String(start) : "";
};

// ─── Toggle gaveta ────────────────────────────────────────────────────────────
const toggleGroup = (userId) => {
  const idx = openGroups.value.indexOf(userId);
  if (idx === -1) {
    openGroups.value.push(userId);
    const group = groupedSuggestions.value.find((g) => g.userId === userId);
    group?.suggestions.forEach(initFieldStates);
  } else {
    openGroups.value.splice(idx, 1);
  }
};

// ─── Fetch ────────────────────────────────────────────────────────────────────
const fetchSuggestions = async () => {
  if (!props.image?.id) return;
  loading.value = true;
  try {
    const { data } = await axios.get("/api/image-suggestions", {
      params: { image_id: props.image.id, status: "pending" }
    });
    suggestions.value = data.suggestions?.data ?? data.suggestions ?? [];
  } catch (e) {
    console.error("Erro ao carregar sugestões:", e);
  } finally {
    loading.value = false;
  }
};

// ─── Submeter apenas campos aceitos ──────────────────────────────────────────
const handleSubmit = async (suggestion) => {
  const acceptedFields = Object.entries(fieldStates[suggestion.id] ?? {})
    .filter(([, state]) => state === "accepted")
    .map(([field]) => field);

  if (!acceptedFields.length) return;

  processingId.value = suggestion.id;
  try {
    await axios.post(
      `/api/image-suggestions/${suggestion.id}/accept`,
      { accepted_fields: acceptedFields },
      { headers: { Authorization: authStore.authHeader } }
    );
    showAlert("success", "Sugestão processada com sucesso!");
    suggestions.value = suggestions.value.filter((s) => s.id !== suggestion.id);
    emit("updated");
  } catch (e) {
    showAlert("danger", e.response?.data?.message ?? "Erro ao processar sugestão.");
  } finally {
    processingId.value = null;
  }
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
@use "@/scss/variables" as *;
$breakpoint-md: 768px;

.suggestions-panel {
  padding: 1rem 0;

  &__skeleton {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  &__skeleton-card {
    padding: 1rem;
    border-radius: 0.5rem;
    background-color: var(--White);
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  }

  &__skeleton-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  &__skeleton-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  &__skeleton-info {
    flex: 1;
  }

  &__skeleton-title {
    width: 60%;
    height: 16px;
    margin-bottom: 0.5rem;
  }

  &__skeleton-subtitle {
    width: 30%;
    height: 12px;
  }

  &__skeleton-content {
    width: 100%;
    height: 80px;
  }

  // Vazio

  &__empty {
    padding: 3rem 0;
    text-align: center;
    color: var(--Cinza_M);
  }

  &__empty-icon {
    display: block;
    margin-bottom: 1rem;
    font-size: 2.5rem;
    opacity: 0.5;
  }

  &__empty-text {
    margin: 0;
  }

  // Lista
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

  // Container por usuário
  &__group {
    overflow: hidden;
    border: 1px solid #dee2e6;
    border-radius: 0.5rem;
    background-color: var(--White);
  }

  &__group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    cursor: pointer;
    background-color: var(--Off-white);
    transition: background-color 0.2s ease;

    &:hover {
      background-color: #f1f3f5;
    }
  }

  &__group-user {
    display: flex;
    align-items: center;
    gap: 1rem;
    min-width: 0;
  }

  &__avatar {
    width: 40px;
    height: 40px;
    overflow: hidden;
    border-radius: 50%;
    flex-shrink: 0;

    &-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  }

  &__user-name {
    font-weight: 400;
    font-style: italic;
    color: var(--Preto);
    font-size: 0.875rem;
  }

  &__badge {
    margin-left: 0.25rem;
    padding: 0.25rem 0.5rem;
    border-radius: 5px;
    background-color: var(--Preto);
    color: var(--Branco);
    font-size: 0.75rem;
    font-weight: 400;
    white-space: nowrap;
  }

  &__group-icon {
    flex-shrink: 0;
    font-size: 1rem;
    color: #6c757d;
    transition: transform 0.2s ease;
  }

  // Sugestões do usuário
  &__fields {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-bottom: 1rem;
  }
}

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
    animation: skeleton-shimmer 1.5s infinite;
  }
}

@keyframes skeleton-shimmer {
  100% {
    transform: translateX(100%);
  }
}
</style>