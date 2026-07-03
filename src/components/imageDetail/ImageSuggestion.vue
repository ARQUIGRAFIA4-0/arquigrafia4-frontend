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
        :fields="card.fields" :createdAt="card.createdAt" :reason="card.reason" :user-name="card.userName"
        :user-avatar="card.userAvatar" @accepted="handleAccepted" @rejected="handleRejected"
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
import SuggestionFieldCard from "@/components/imageDetail/suggestions/SuggestionFieldCard.vue";
import { useImageForm } from "../../composables/useImageForm";

defineOptions({ name: "ImageSuggestion" });

const props = defineProps({
  image: { type: Object, default: null },
});
const emit = defineEmits(["updated"]);

const { loadFormDependencies, allSubjects } = useImageForm();
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


const suggestionCards = computed(() => {

  const cards = [];

  for (const suggestion of suggestions.value) {

    const fields = [];

    for (const field of PAYLOAD_FIELDS) {
      const value = suggestion.payload?.[field];

      if (value === undefined || value === null) continue;
      // subjects vazio não entra no card
      if (field === "subjects" && (!Array.isArray(value) || value.length === 0)) continue;

      if (field === "subjects") {
        const currentIds = new Set((props.image?.subjects ?? []).map((s) => s.id));

        const currentTagMap = new Map((props.image?.subjects ?? []).map((s) => [s.id, s]));

        // const suggestedIds = new Set(value);


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
          const type = fromImage?.type ?? fromSuggested?.type ?? fromSubjects?.type ?? null;
          const vocab = fromImage?.vocab ?? fromSuggested?.vocab ?? fromSubjects?.vocab ?? null;
          const ref_id = fromImage?.ref_id ?? fromSuggested?.ref_id ?? fromSubjects?.ref_id ?? null;
          const source = fromImage?.source ?? fromSuggested?.source ?? fromSubjects?.source ?? null;

          let status = "kept";
          if (!currentIds.has(uuid)) status = "added";
          if (!suggestedIds.has(uuid)) status = "removed";

          return { id: uuid, term, type, vocab, ref_id, source, status };
        });

        tags.sort((a, b) => {
          const order = { kept: 0, added: 1, removed: 2 };
          return order[a.status] - order[b.status];
        });

        fields.push({ field, value: tags, datePayload: null });
        continue;
      }

      fields.push({
        field,
        value,
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

    if (fields.length === 0) continue;

    cards.push({
      key: suggestion.id,
      suggestionId: suggestion.id,
      fields,
      reason: suggestion.payload?.reason ?? null,
      userName: suggestion.user?.name ?? "Usuário",
      userAvatar: suggestion.user?.avatar_path ?? null,
      createdAt: suggestion.created_at
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
    });

    suggestions.value = data.data ?? [];
  } catch (e) {
    console.error("Erro ao carregar sugestões:", e);
  } finally {
    loading.value = false;
  }
};

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

onMounted(async () => {
  await loadFormDependencies();
  await fetchSuggestions();
});
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
    padding: 0 1rem;
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

    @media (max-width: 768px) {
      font-size: 1.25rem;
    }
  }

  &__empty-text {
    margin: 0;
    color: var(--Preto);
    font-size: .875rem;
    font-style: italic;
    font-weight: 400;
    line-height: 150%;
    justify-self: center;

    @media (max-width: 768px) {
      font-size: .75rem;
    }
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