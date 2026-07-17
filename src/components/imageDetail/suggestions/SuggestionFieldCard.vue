<template>
  <div class="field-card">

    <!-- Cabeçalho -->
    <button class="field-card__header" :aria-expanded="isOpen" @click="isOpen = !isOpen">
      <div class="field-card__identity">

        <div v-if="userAvatar" class="field-card__avatar field-card__avatar--image">
          <img :src="`${API_BASE_URL}${userAvatar}`" :alt="`foto de perfil de ${userName}`" />
        </div>

        <div v-else class="field-card__avatar field-card__avatar--image">
          <img :src="defaultImageUser" :alt="`foto de perfil de ${userName}`" />
        </div>


        <span class="field-card__label">
          {{ capitalizeWords(userName) }}
          está sugerindo {{ fieldsLabel }}
        </span>
      </div>
      <i class="bi field-card__chevron" :class="isOpen ? 'bi-chevron-up' : 'bi-chevron-down'" aria-hidden="true" />
    </button>

    <!-- Conteúdo -->
    <div v-if="isOpen" class="field-card__body">

      <span class="field-card__timestamp">{{ timeAgo(createdAt) }}</span>
      <!-- Um bloco de valor + ações por campo -->
      <div v-for="entry in fieldStates" :key="entry.field" class="field-card__entry">

        <div class="field-card__value">

          <div v-if="entry.field === 'description'">
            <h3 class="field-card__value-title">Descrição</h3>
            <textarea class="field-card__input field-card__input--textarea" :value="entry.value" rows="5" readonly />
          </div>

          <div v-else-if="entry.field === 'subjects'">
            <h3 class="field-card__value-title">Tags</h3>
            <div class="field-card__tags">
              <span v-for="subject in entry.value" :key="subject.id" class="field-card__tag" :class="{
                'field-card__tag--added': subject.status === 'added',
                'field-card__tag--removed': subject.status === 'removed',
              }">
                {{ subject.term }}
              </span>
            </div>
            <div v-if="entry.value.some(t => t.status !== 'kept')" class="field-card__tags-legend">
              <span v-if="entry.value.some(t => t.status === 'added')"
                class="field-card__tags-legend-item field-card__tags-legend-item--added">
                Adicionada
              </span>
              <span v-if="entry.value.some(t => t.status === 'removed')"
                class="field-card__tags-legend-item field-card__tags-legend-item--removed">
                Removida
              </span>
            </div>
          </div>

          <div v-else-if="entry.field === 'earliest_date'">
            <h3 class="field-card__value-title">Data</h3>
            <input class="field-card__input" type="text" :value="displayValue(entry)" readonly />
          </div>

          <div v-else-if="entry.field === 'title'">
            <h3 class="field-card__value-title">Titulo</h3>
            <input class="field-card__input" type="text" :value="displayValue(entry)" readonly />
          </div>

          <div v-else-if="entry.field === 'location'" class="field-card__location">
            <h3 class="field-card__value-title">Localização</h3>
            <input v-if="entry.value.label" class="field-card__input" type="text" :value="entry.value.label" readonly />
            <div v-if="entry.value.lat !== null && entry.value.lng !== null" class="field-card__map">
              <MapLibreMap :style-url="mapStyleUrl" :center="[entry.value.lng, entry.value.lat]" :zoom="14"
                :marker-position="entry.value" marker-color="#2F2F2F" />
            </div>
          </div>

          <!-- <input v-else class="field-card__input" type="text" :value="displayValue(entry)" readonly /> -->
        </div>

        <!-- Motivo (único, da sugestão como um todo) -->
        <div v-if="reason" class="field-card__reason">
          <span>Justificativa:</span>
          <p>{{ reason }}</p>
        </div>

        <!-- Ações deste campo -->
        <div class="field-card__actions">
          <button class="field-card__btn field-card__btn--reject"
            :class="{ 'field-card__btn--active': entry.decision === 'rejected' }" :disabled="entry.processing"
            @click="decideField(entry, 'reject')">
            <span v-if="entry.processing && entry.action === 'reject'" class="field-card__spinner" role="status"
              aria-label="Processando" />
            <i v-else class="bi bi-hand-thumbs-down" aria-hidden="true" />
            Recusar
          </button>
          <button class="field-card__btn field-card__btn--accept"
            :class="{ 'field-card__btn--active': entry.decision === 'accepted' }" :disabled="entry.processing"
            @click="decideField(entry, 'accept')">
            <span v-if="entry.processing && entry.action === 'accept'" class="field-card__spinner" role="status"
              aria-label="Processando" />
            <i v-else class="bi bi-hand-thumbs-up" aria-hidden="true" />
            Aceitar
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from "vue";
import axios from "@/axios";
import { useAuthStore } from "@/store/auth";
import MapLibreMap from "@/components/map/MapLibreMap.vue";
import defaultImageUser from "@/assets/profile_image.png";
import { useImageForm } from "@/composables/useImageForm";

const API_BASE_URL = import.meta.env.VITE_BASE_REQUEST_URL;
const { capitalizeWords } = useImageForm();

const props = defineProps({
  suggestionId: { type: String, required: true },
  fields: { type: Array, required: true }, // [{ field, value, datePayload }]
  reason: { type: String, default: null },
  userName: { type: String, default: "Usuário" },
  userAvatar: { type: String, default: null },
  createdAt: { type: String, default: null },
});

const emit = defineEmits(["accepted", "rejected", "error"]);

const authStore = useAuthStore();
const isOpen = ref(false);
const mapStyleUrl = "https://tiles.openfreemap.org/styles/positron";

const FIELD_LABELS = {
  title: "um novo título",
  description: "uma nova descrição",
  subjects: "novas tags",
  location_label: "uma nova localização",
  earliest_date: "uma nova data",
  photographer: "um novo fotógrafo",
  location: "uma nova localização no mapa",
};

const FIELD_TO_PAYLOAD_KEYS = {
  location: ["location_label", "latitude", "longitude"],
  earliest_date: ["earliest_date", "latest_date"],
};

// ─── Estado individual de decisão por campo ───────────────────────────────────
// decision: null | 'accepted' | 'rejected'
const fieldStates = reactive(
  props.fields.map((f) => ({
    ...f,
    decision: null,
    processing: false,
    action: null,
  }))
);



// ─── Label combinado do cabeçalho ──────────────────────────────────────────────
// 1 campo: "está sugerindo um novo título"
// 2+ campos: "está sugerindo um novo título e uma nova descrição"
const fieldsLabel = computed(() => {
  const labels = fieldStates.map((f) => FIELD_LABELS[f.field] ?? "novas edições");
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(", ")} e ${labels[labels.length - 1]}`;
});

const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "agora mesmo";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} minuto(s)`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} hora(s)`;
  return `há ${Math.floor(diff / 86400)} dia(s)`;
};

const displayValue = (entry) => {
  if (entry.field === "earliest_date" && entry.datePayload) {
    const start = entry.datePayload.earliest_date
      ? new Date(entry.datePayload.earliest_date).getUTCFullYear()
      : null;
    const end = entry.datePayload.latest_date
      ? new Date(entry.datePayload.latest_date).getUTCFullYear()
      : null;
    if (start && end && start !== end) return `${start} – ${end}`;
    return start ? String(start) : "";
  }
  return entry.value;
};

// ─── Decide um campo (aceitar ou recusar) ─────────────────────────────────────
// Não chama a API a cada clique: só marca a decisão local. A submissão real
// (accept/reject) só acontece quando TODOS os campos já têm uma decisão.
const decideField = (entry, decision) => {
  entry.decision = decision === "accept" ? "accepted" : "rejected";
  maybeSubmit();
};

// ─── Verifica se todos os campos já foram decididos e então submete ──────────
const maybeSubmit = async () => {
  const allDecided = fieldStates.every((f) => f.decision !== null);
  if (!allDecided) return;

  const acceptedFields = fieldStates
    .filter((f) => f.decision === "accepted")
    .flatMap((f) => FIELD_TO_PAYLOAD_KEYS[f.field] ?? [f.field]);

  const rejectedFields = fieldStates
    .filter((f) => f.decision === "rejected")
    .flatMap((f) => FIELD_TO_PAYLOAD_KEYS[f.field] ?? [f.field]);

  if (acceptedFields.length > 0) {
    acceptedFields.push("reason");
  }

  fieldStates.forEach((f) => {
    f.processing = true;
    f.action = f.decision === "accepted" ? "accept" : "reject";
  });

  try {
    if (acceptedFields.length > 0) {
      // Existe ao menos um campo aceito: sugestão é aceita (parcial ou total)
      await axios.post(
        `/api/image-suggestions/${props.suggestionId}/accept`,
        { accepted_fields: acceptedFields },
        { headers: { Authorization: authStore.authHeader } }
      );
      emit("accepted", { suggestionId: props.suggestionId, acceptedFields, rejectedFields });
      console.log("aceito:", acceptedFields);

    } else {
      // Nenhum campo aceito: todos foram recusados, sugestão inteira é recusada
      await axios.post(
        `/api/image-suggestions/${props.suggestionId}/reject`,
        {},
        { headers: { Authorization: authStore.authHeader } }
      );
      emit("rejected", { suggestionId: props.suggestionId });
    }
  } catch (e) {
    emit("error", e.response?.data?.message ?? "Erro ao processar sugestão.");
    // Em caso de erro, libera os campos para nova tentativa
    fieldStates.forEach((f) => {
      f.decision = null;
    });
    console.log(e.response?.data?.message);

  } finally {
    fieldStates.forEach((f) => {
      f.processing = false;
      f.action = null;
    });
  }
};
</script>

<style lang="scss" scoped>
@use "sass:color";

.field-card {
  background-color: var(--Off_white);
  border-radius: 8px;
  overflow: hidden;

  // ── Cabeçalho ──────────────────────────────────────────────────────────────
  &__header {
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
    transition: background-color 0.2s ease;

    &:hover {
      background-color: var(--Off_white);
    }
  }

  &__identity {
    display: flex;
    align-items: center;
    gap: 1rem;
    min-width: 0;
    flex: 1;
  }

  &__label {
    font-size: .875rem;
    font-style: italic;
    font-weight: 400;
    line-height: 150%;
    color: var(--Preto);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__chevron {
    flex-shrink: 0;
    color: var(--Cinza_M);
  }

  // ── Avatar ──────────────────────────────────────────────────────────────────
  &__avatar {
    width: 40px;
    height: 40px;
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

  // ── Corpo ───────────────────────────────────────────────────────────────────
  &__body {
    padding: 0 1rem 1rem;
  }

  &__timestamp {
    display: block;
    text-align: right;
    font-size: 0.75rem;
    color: var(--Preto);
    margin-bottom: 0.75rem;
  }

  // ── Entrada de campo (1 valor + ações) ─────────────────────────────────────
  &__entry {
    &+& {
      margin-top: 1.5rem;
      // padding-top: 1rem;
    }
  }

  // ── Valor sugerido ──────────────────────────────────────────────────────────
  &__value {
    margin-bottom: 1rem;

    &-title {
      font-size: 1rem;
      font-weight: 500;
      line-height: 150%;
      color: var(--Preto);
      margin-bottom: .5625rem;
    }
  }

  &__input {
    width: 100%;
    padding: 0.375rem 0.625rem;
    font-size: 0.875rem;
    color: var(--Cinza_E);
    background-color: var(--Branco);
    border: 1px solid var(--Cinza_C);
    border-radius: 4px;
    outline: none;
    resize: none;

    &--textarea {
      min-height: 100px;
    }
  }

  // ── Tags ────────────────────────────────────────────────────────────────────
  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  }

  &__tag {
    display: inline-flex;
    align-items: center;
    padding: .3125rem .5rem;
    gap: .75rem;
    font-weight: 400;
    font-size: .75rem;
    line-height: 114%;
    border: 1px solid var(--Cinza_M);
    color: var(--Cinza_M);
    border-radius: 2px;
    background-color: var(--Off_white);

    &--added {
      background-color: transparent;
      color: var(--Positivo_E);
      background-color: var(--Positivo_C);
      border: 1px solid var(--Positivo_E);
    }

    &--removed {
      background-color: transparent;
      color: var(--Negativo_E);
      border: 1px solid var(--Negativo_E);
      background-color: var(--Negativo_C);
      text-decoration: line-through;
    }
  }

  // ── Legenda do diff de tags ──────────────────────────────────────────────────
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
      background-color: var(--Positivo_E, #1a7a4a);
    }

    &--removed::before {
      background-color: var(--Negativo_E, #c0392b);
    }
  }

  &__map {
    position: relative;
    width: 100%;
    height: 220px;
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid var(--Cinza_C);
  }

  &__location {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  // ── Motivo ──────────────────────────────────────────────────────────────────
  &__reason {
    margin: 1rem 0;
    font-size: .875rem;

    span {
      color: var(--Laranja_M);
      font-weight: 500;
      margin-bottom: .5rem;
    }

    p {
      font-weight: 400;
      font-style: italic;
      color: var(--Cinza_M);
    }

  }

  // ── Ações ───────────────────────────────────────────────────────────────────
  &__actions {
    display: flex;
    gap: 0.5rem;
  }

  &__btn {
    flex: 1;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: .5rem;
    padding: .2813rem .875rem;
    font-size: .875rem;
    font-weight: 400;
    line-height: 150%;
    border-radius: 5px;
    border: 1px solid;
    cursor: pointer;
    transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .bi {
      font-size: .875rem;
    }

    &--reject {
      color: var(--Cinza_E);
      background-color: var(--Off_white);
      border-color: var(--Cinza_E);

      &.field-card__btn--active {
        background-color: var(--Laranja_E);
        border-color: var(--Laranja_E);
        color: var(--Branco);
      }
    }

    &--accept {
      color: var(--Branco);
      background-color: var(--Preto);
      border-color: var(--Preto);

      &.field-card__btn--active {
        background-color: var(--Positivo_E);
        border-color: var(--Positivo_E);
      }
    }
  }

  // ── Spinner ─────────────────────────────────────────────────────────────────
  &__spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: field-card-spin 0.3s linear infinite;
  }
}

@keyframes field-card-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>