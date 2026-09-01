<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import { resolveAvatarUrl } from "@/helpers/avatarUrl";

const props = defineProps({
  suggestion: { type: Object, required: true },
  work: { type: Object, required: true },
  // Falso quando o usuário não é contribuidor da obra ou é o autor da própria
  // sugestão — o backend devolve 403 nesse caso, então nem mostramos os botões.
  canDecide: { type: Boolean, default: false },
});

const emit = defineEmits(["applied", "rejected", "error"]);

const authStore = useAuthStore();

const expanded = ref(true);
const isSubmitting = ref(false);
const avatarFailed = ref(false);

// Chave do payload → campo correspondente na obra normalizada (getWorkDetails).
const FIELD_TO_WORK_KEY = {
  titles: "titles",
  agents: "agents",
  dates: "dates",
  style_periods: "stylePeriods",
  cultural_contexts: "culturalContexts",
  work_types: "workTypes",
  techniques: "techniques",
  materials: "materials",
  subjects: "subjects",
};

const FIELD_LABELS = {
  titles: "novos títulos",
  agents: "nova autoria",
  dates: "novas datas",
  description: "uma nova descrição",
  style_periods: "novos aspectos estéticos",
  cultural_contexts: "um novo contexto cultural",
  work_types: "uma nova tipologia",
  techniques: "novas técnicas",
  materials: "novos materiais",
  subjects: "novos assuntos",
};

const DATE_TYPE_LABELS = {
  creation: "Criação",
  renovation: "Reforma",
  demolition: "Demolição",
  design: "Projeto",
  alteration: "Alteração",
  destruction: "Destruição",
  restoration: "Restauro",
};

// `reason` viaja dentro do payload mas não é um campo decidível.
const payloadFields = computed(() =>
  Object.keys(props.suggestion.payload || {}).filter(
    (key) => key === "description" || FIELD_TO_WORK_KEY[key] !== undefined
  )
);

const fieldsLabel = computed(() => {
  const labels = payloadFields.value.map((f) => FIELD_LABELS[f] || f);
  if (labels.length === 0) return "edições";
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(", ")} e ${labels[labels.length - 1]}`;
});

const userName = computed(() => props.suggestion.user?.name || "Usuário");
const userAvatar = computed(() => resolveAvatarUrl(props.suggestion.user));
// Sem foto, cai nas iniciais — mesmo tratamento da aba de sugestões da imagem.
const userInitials = computed(() => userName.value.charAt(0).toUpperCase() || "?");

const STATUS_BADGES = {
  accepted: { label: "Sugestão aceita", modifier: "accepted" },
  partially_accepted: { label: "Sugestão parcial", modifier: "partial" },
  rejected: { label: "Sugestão recusada", modifier: "rejected" },
};
const statusBadge = computed(
  () => STATUS_BADGES[props.suggestion.status] || { label: "Pendente", modifier: "pending" }
);
const isPending = computed(() => props.suggestion.status === "pending");

const timeAgo = computed(() => {
  const created = props.suggestion.created_at;
  if (!created) return "";
  const diff = Date.now() - new Date(created).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "agora mesmo";
  if (minutes < 60) return `há ${minutes} minuto${minutes > 1 ? "s" : ""}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} hora${hours > 1 ? "s" : ""}`;
  const days = Math.floor(hours / 24);
  return `há ${days} dia${days > 1 ? "s" : ""}`;
});

// ── Diff ─────────────────────────────────────────────────────────────────────
// O bloco `resolved` ainda não existe no backend, e só `subjects` chega hidratado
// (e sobrescrevendo o payload). Então os itens vêm ora como UUID, ora como objeto.
const itemId = (item) => (typeof item === "string" ? item : item?.id ?? null);

const workItemLabel = (field, item) => {
  if (!item) return null;
  if (field === "titles") return item.pref ? `${item.label} (principal)` : item.label;
  if (field === "agents") return [item.name, item.role].filter(Boolean).join(" — ");
  if (field === "dates") {
    const type = DATE_TYPE_LABELS[item.type] || item.type || "";
    const span =
      item.earliestYear && item.latestYear && item.earliestYear !== item.latestYear
        ? `${item.earliestYear}-${item.latestYear}`
        : item.earliestYear || item.latestYear || "";
    return `${type}: ${item.circa ? "c. " : ""}${span}`;
  }
  return item.label ?? item.term ?? null;
};

// Cada entrada: { field, kind: "list"|"scalar", ... }
const fieldStates = reactive([]);

const buildListDiff = async (field) => {
  const workKey = FIELD_TO_WORK_KEY[field];
  const current = props.work?.[workKey] || [];
  const currentById = new Map(current.map((item) => [item.id, item]));

  const suggested = props.suggestion.payload[field] || [];
  const suggestedIds = new Set(suggested.map(itemId).filter(Boolean));

  const chips = [];

  for (const raw of suggested) {
    const id = itemId(raw);
    if (!id) continue;
    const existing = currentById.get(id);
    if (existing) {
      chips.push({ id, label: workItemLabel(field, existing), status: "kept" });
      continue;
    }
    // Item novo: o label não está na obra, então resolve pelo endpoint `show`.
    // Objeto já hidratado (caso de subjects) dispensa a requisição.
    let label = typeof raw === "object" ? raw.term ?? raw.label ?? null : null;
    if (!label) {
      const entity = await api.resolveVracEntity(field, id);
      // Normaliza antes de rotular: o `show` devolve o registro cru, e
      // workItemLabel lê o mesmo formato que a obra usa.
      label = workItemLabel(field, api.normalizeVracEntity(field, entity));
    }
    chips.push({ id, label: label || "(termo não encontrado)", status: "added" });
  }

  for (const item of current) {
    if (!suggestedIds.has(item.id)) {
      chips.push({ id: item.id, label: workItemLabel(field, item), status: "removed" });
    }
  }

  const order = { kept: 0, added: 1, removed: 2 };
  chips.sort((a, b) => order[a.status] - order[b.status]);
  return chips;
};

onMounted(async () => {
  for (const field of payloadFields.value) {
    if (field === "description") {
      fieldStates.push({
        field,
        kind: "scalar",
        current: props.work?.description || "",
        suggested: props.suggestion.payload.description || "",
        decision: null,
      });
      continue;
    }
    fieldStates.push({
      field,
      kind: "list",
      chips: await buildListDiff(field),
      decision: null,
    });
  }
});

const hasLegend = (entry) =>
  entry.kind === "list" && entry.chips.some((c) => c.status !== "kept");

// ── Decisão ──────────────────────────────────────────────────────────────────
// Nada é enviado a cada clique: quando todos os campos têm decisão, sai uma única
// chamada.
const decideField = (entry, decision) => {
  if (!props.canDecide || isSubmitting.value) return;
  entry.decision = decision;
  maybeSubmit();
};

const resetDecisions = () => {
  for (const entry of fieldStates) entry.decision = null;
};

const maybeSubmit = async () => {
  if (fieldStates.some((f) => f.decision === null)) return;

  const accepted = fieldStates.filter((f) => f.decision === "accepted").map((f) => f.field);

  isSubmitting.value = true;
  try {
    if (accepted.length === 0) {
      // Lista vazia em accepted_fields aceitaria TUDO no backend — recusar é /reject.
      await api.rejectWorkSuggestion(authStore.authHeader, props.suggestion.id);
      emit("rejected", props.suggestion.id);
      return;
    }

    // `reason` conta na comparação que decide entre `accepted` e
    // `partially_accepted`, então precisa ir junto quando tudo foi aceito.
    const fields =
      accepted.length === fieldStates.length ? [...accepted, "reason"] : accepted;

    const { work } = await api.acceptWorkSuggestion(
      authStore.authHeader,
      props.suggestion.id,
      fields
    );
    emit("applied", { suggestionId: props.suggestion.id, work });
  } catch (e) {
    const data = e.response?.data;
    // Duplicata a menos de 100m volta com a obra conflitante no corpo.
    if (data?.existing_work) {
      emit("error", {
        message: data.message || "Já existe uma obra com este título neste local.",
        existingWork: data.existing_work,
      });
    } else {
      emit("error", {
        message: data?.message || "Não foi possível registrar a decisão. A sugestão pode não ser mais válida.",
      });
    }
    resetDecisions();
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="suggestion-card" data-cy="work-suggestion-card">
    <button type="button" class="suggestion-card__header" @click="expanded = !expanded">
      <!-- Se a imagem falhar em carregar, cai nas iniciais em vez de deixar o
           espaço quebrado. -->
      <img v-if="userAvatar && !avatarFailed" :src="userAvatar" class="suggestion-card__avatar" alt=""
        @error="avatarFailed = true" />
      <span v-else class="suggestion-card__avatar suggestion-card__avatar--initials" aria-hidden="true">
        {{ userInitials }}
      </span>

      <span class="suggestion-card__summary">
        <strong>{{ userName }}</strong> está sugerindo {{ fieldsLabel }}
      </span>

      <span v-if="!isPending" class="suggestion-card__badge" :class="`suggestion-card__badge--${statusBadge.modifier}`">
        {{ statusBadge.label }}
      </span>

      <i class="bi" :class="expanded ? 'bi-chevron-up' : 'bi-chevron-down'" aria-hidden="true" />
    </button>

    <div v-if="expanded" class="suggestion-card__body">
      <p class="suggestion-card__time">{{ timeAgo }}</p>

      <div v-for="entry in fieldStates" :key="entry.field" class="suggestion-card__field">
        <h3 class="suggestion-card__field-title">{{ FIELD_LABELS[entry.field] }}</h3>

        <!-- Escalares mostram atual → sugerido; o estado atual já está em mãos. -->
        <template v-if="entry.kind === 'scalar'">
          <div class="suggestion-card__scalar">
            <span class="suggestion-card__scalar-label">Atual</span>
            <p class="suggestion-card__scalar-value suggestion-card__scalar-value--old">
              {{ entry.current || "Sem descrição disponível." }}
            </p>
          </div>
          <div class="suggestion-card__scalar">
            <span class="suggestion-card__scalar-label">Sugerido</span>
            <p class="suggestion-card__scalar-value">{{ entry.suggested || "(vazio)" }}</p>
          </div>
        </template>

        <template v-else>
          <div class="suggestion-card__chips">
            <span v-for="chip in entry.chips" :key="chip.id" class="suggestion-card__chip"
              :class="`suggestion-card__chip--${chip.status}`">
              {{ chip.label }}
            </span>
          </div>
          <p v-if="hasLegend(entry)" class="suggestion-card__legend">
            <span class="suggestion-card__legend-item suggestion-card__legend-item--added">Adicionado</span>
            <span class="suggestion-card__legend-item suggestion-card__legend-item--removed">Removido</span>
          </p>
        </template>

        <div v-if="canDecide && isPending" class="suggestion-card__actions">
          <button type="button" class="btn suggestion-card__btn suggestion-card__btn--reject"
            :class="{ 'suggestion-card__btn--active': entry.decision === 'rejected' }" :disabled="isSubmitting"
            @click="decideField(entry, 'rejected')">
            <i class="bi bi-hand-thumbs-down" aria-hidden="true" /> Recusar
          </button>
          <button type="button" class="btn suggestion-card__btn suggestion-card__btn--accept"
            :class="{ 'suggestion-card__btn--active': entry.decision === 'accepted' }" :disabled="isSubmitting"
            data-cy="work-suggestion-accept" @click="decideField(entry, 'accepted')">
            <i class="bi bi-hand-thumbs-up" aria-hidden="true" /> Aceitar
          </button>
        </div>
      </div>

      <!-- Uma vez por card, não repetida a cada campo. -->
      <p v-if="suggestion.payload?.reason" class="suggestion-card__reason">
        <strong>Justificativa:</strong> {{ suggestion.payload.reason }}
      </p>

      <p v-if="!canDecide && isPending" class="suggestion-card__waiting">
        Aguardando revisão da comunidade.
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* Mesmo sistema visual da aba de sugestões da imagem (ImageSuggestionView). */
.suggestion-card {
  background-color: var(--Off_white);
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.suggestion-card__header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
}

.suggestion-card__avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  object-fit: cover;
}

.suggestion-card__avatar--initials {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: var(--Preto);
  color: var(--Branco);
  font-size: 0.75rem;
  font-weight: 700;
}

.suggestion-card__summary {
  flex: 1;
  font-size: 0.875rem;
  line-height: 1.4;
}

.suggestion-card__badge {
  flex-shrink: 0;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

.suggestion-card__badge--accepted { background-color: #d1e7dd; color: #0f5132; }
.suggestion-card__badge--partial  { background-color: #fff3cd; color: #664d03; }
.suggestion-card__badge--rejected { background-color: #f8d7da; color: #842029; }
.suggestion-card__badge--pending  { background-color: var(--Cinza_C, #dcdcdc); color: var(--Preto, #2f2f2f); }

.suggestion-card__body {
  padding: 0 1rem 1rem;
}

.suggestion-card__time {
  display: block;
  text-align: right;
  margin: 0 0 0.75rem;
  color: var(--Cinza_M);
  font-size: 0.75rem;
}

.suggestion-card__field {
  padding: 0.75rem 0;
  border-top: 1px solid var(--Cinza_C, #dcdcdc);
}

.suggestion-card__field-title {
  margin: 0 0 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: capitalize;
}

.suggestion-card__scalar {
  margin-bottom: 0.5rem;
}

.suggestion-card__scalar-label {
  display: block;
  color: var(--Cinza_M, #636262);
  font-size: 0.75rem;
}

.suggestion-card__scalar-value {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
}

.suggestion-card__scalar-value--old {
  color: var(--Cinza_M, #636262);
  text-decoration: line-through;
}

.suggestion-card__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.suggestion-card__chip {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 0.625rem;
  border: 1px solid transparent;
  border-radius: 2px;
  font-size: 0.8125rem;
}

.suggestion-card__chip--kept {
  border-color: var(--Cinza_C, #dcdcdc);
  color: var(--Cinza_M, #636262);
}

.suggestion-card__chip--added {
  background-color: #d1e7dd;
  border-color: #0f5132;
  color: #0f5132;
}

.suggestion-card__chip--removed {
  background-color: #f8d7da;
  border-color: #842029;
  color: #842029;
  text-decoration: line-through;
}

.suggestion-card__legend {
  display: flex;
  gap: 1rem;
  margin: 0.5rem 0 0;
  font-size: 0.75rem;
}

.suggestion-card__legend-item::before {
  content: "";
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 0.25rem;
  border-radius: 2px;
}

.suggestion-card__legend-item--added::before   { background-color: #0f5132; }
.suggestion-card__legend-item--removed::before { background-color: #842029; }

.suggestion-card__actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.suggestion-card__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.75rem;
  border-radius: 5px;
  font-size: 0.8125rem;
  border: 1px solid var(--Cinza_E, #4a4a4a);
  background-color: var(--Off_white, #f7f7f7);
  color: var(--Preto, #2f2f2f);
}

.suggestion-card__btn--accept.suggestion-card__btn--active {
  background-color: #0f5132;
  border-color: #0f5132;
  color: #fff;
}

.suggestion-card__btn--reject.suggestion-card__btn--active {
  background-color: #842029;
  border-color: #842029;
  color: #fff;
}

.suggestion-card__reason {
  margin: 0.75rem 0 0;
  padding-top: 0.75rem;
  border-top: 1px solid var(--Cinza_C, #dcdcdc);
  font-size: 0.8125rem;
  line-height: 1.5;
}

.suggestion-card__waiting {
  margin: 0.75rem 0 0;
  color: var(--Cinza_M, #636262);
  font-size: 0.8125rem;
  font-style: italic;
}
</style>
