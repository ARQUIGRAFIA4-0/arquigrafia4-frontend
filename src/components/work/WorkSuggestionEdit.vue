<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import UiField from "@/components/ui/UiField.vue";
import { useWorkForm } from "@/composables/useWorkForm";
import { materializeWorkParts } from "@/composables/useWorkAutocomplete";
import { useAuthStore } from "@/store/auth";
import { api } from "@/services/api";

const props = defineProps({
  work: { type: Object, required: true },
});

const emit = defineEmits(["submitted"]);

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const {
  TITLE_TYPES, titleTypeInput, titleLabelInput, titles, hasPreferredTitle,
  addTitle, removeTitle, titleTypeLabel, titleError,
  AGENT_ROLE_LABELS, agentRoleInput, agentNameInput, agents,
  filteredNameSuggestions, showNameSuggestions, loadContributorNames,
  onAgentNameInput, hideNameSuggestions, addAgent, removeAgent,
  DATE_TYPES, dateTypeInput, dateYearInput, dateYearEndInput, dateIntervalMode,
  dateCirca, dates, dateError, isDateTypeDisabled, addDate, removeDate, dateTypeLabel,
  formatDateChip,
  descriptionInput,
  VOCAB_FIELDS, onVocabInput, addVocabItem, canCreateVocab, createAndAddVocabItem,
  onVocabEnter, onVocabPlusClick, removeVocabItem, hideVocabSuggestions,
  commitPendingInputs, buildDraft, populateFromWork,
} = useWorkForm();

// Justificativa da sugestão — obrigatória, como no fluxo de imagem.
const reason = ref("");
const reasonRef = ref(null);
const reasonTouched = ref(false);
const isReasonInvalid = computed(() => reasonTouched.value && !reason.value.trim());

const isSaving = ref(false);
const isSaved = ref(false);
const alertMessage = ref("");
const alertType = ref("success");
const showAlert = ref(false);

// Só os campos alterados entram no payload; chave ausente significa "não sugerido",
// nunca "limpar o campo".
let initialSnapshot = null;

const snapshot = () => {
  const draft = buildDraft();
  return {
    titles: JSON.stringify(draft.titles),
    agents: JSON.stringify(draft.agents),
    dates: JSON.stringify(draft.dates),
    description: draft.description,
    ...Object.fromEntries(
      api.VRAC_VOCAB_KEYS.map((payloadKey) => {
        const draftKey = api.VRAC_ENTITIES[payloadKey].draftKey;
        return [payloadKey, JSON.stringify(draft[draftKey])];
      })
    ),
  };
};

onMounted(async () => {
  populateFromWork(props.work);
  initialSnapshot = snapshot();
  await loadContributorNames();
});

const showError = (message) => {
  alertMessage.value = message;
  alertType.value = "danger";
  showAlert.value = true;
};

const goBackToWork = () => {
  router.push({ name: "work-detail", params: { id: route.params.id } });
};

const buildPayload = async () => {
  const draft = buildDraft();
  const current = snapshot();
  const authHeader = authStore.authHeader;

  // Materializa só o que o usuário acrescentou: itens vindos da obra já têm `id`
  // e são reaproveitados. Nada de localização aqui — o backend só aceita
  // `location_id` no payload de sugestão e não há como o front produzir um.
  const { titleIds, agentIds, dateIds, vocabIds } = await materializeWorkParts(authHeader, draft);

  const payload = {};
  if (current.titles !== initialSnapshot.titles) payload.titles = titleIds;
  if (current.agents !== initialSnapshot.agents) payload.agents = agentIds;
  if (current.dates !== initialSnapshot.dates) payload.dates = dateIds;
  if (current.description !== initialSnapshot.description) {
    payload.description = draft.description;
  }
  for (const payloadKey of api.VRAC_VOCAB_KEYS) {
    if (current[payloadKey] === initialSnapshot[payloadKey]) continue;
    payload[payloadKey] = vocabIds[api.VRAC_ENTITIES[payloadKey].draftKey];
  }

  return payload;
};

const handleSubmit = async () => {
  if (isSaving.value) return;

  // Aproveita o que ficou digitado sem virar chip, em vez de descartar em silêncio.
  commitPendingInputs();

  reasonTouched.value = true;
  if (!reason.value.trim()) {
    reasonRef.value?.focus();
    reasonRef.value?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  // O backend só valida o payload no aceite, então o que der para checar aqui
  // evita que o erro apareça na cara de quem for revisar.
  if (!hasPreferredTitle.value) {
    showError("A obra precisa de exatamente um título principal.");
    return;
  }

  isSaving.value = true;
  showAlert.value = false;
  try {
    const payload = await buildPayload();

    if (Object.keys(payload).length === 0) {
      showError("Nenhuma alteração para sugerir.");
      return;
    }

    payload.reason = reason.value.trim();
    await api.createWorkSuggestion(authStore.authHeader, props.work.id, payload);

    alertMessage.value = "Sugestão enviada com sucesso!";
    alertType.value = "success";
    showAlert.value = true;
    isSaved.value = true;
    setTimeout(() => emit("submitted"), 1500);
  } catch (e) {
    showError(e.response?.data?.message || "Não foi possível enviar a sugestão.");
  } finally {
    isSaving.value = false;
  }
};
</script>

<template>
  <div class="work-suggestion-edit" data-cy="work-suggestion-edit">
    <h1 class="h1 work-suggestion-edit__title">{{ props.work?.title }}</h1>
    <p class="work-suggestion-edit__lead">
      Suas alterações entram como sugestão e passam por revisão de quem já enviou
      imagens desta obra.
    </p>

    <!-- Títulos -->
    <div class="mb-3">
      <UiField label="Título da obra" explain="Adicione ao menos um título principal">
        <div class="input-group work-modal__combo">
          <button class="btn btn-primary dropdown-toggle bg-cinza-m border-preto fw-normal rounded-end-0" type="button"
            data-bs-toggle="dropdown" aria-expanded="false">
            {{ titleTypeLabel(titleTypeInput) }}
          </button>
          <ul class="dropdown-menu menu-light">
            <li v-for="t in TITLE_TYPES" :key="t.value">
              <button class="dropdown-item" :disabled="t.value === 'other' && hasPreferredTitle"
                @click.prevent="titleTypeInput = t.value">
                {{ t.label }}
              </button>
            </li>
          </ul>
          <input v-model="titleLabelInput" type="text" class="form-control border-preto border-end-0"
            placeholder="Título" @keydown.enter.prevent="addTitle" />
          <button type="button" class="btn btn-light border-preto border-start-0 bg-transparent btn-enlarge-40"
            aria-label="Adicionar título" @click="addTitle">
            <i class="bi bi-plus-square-fill" />
          </button>
        </div>
        <p v-if="titleError" class="text-danger small mt-1 mb-0">{{ titleError }}</p>
        <p v-else-if="!hasPreferredTitle" class="text-muted small fst-italic mt-1 mb-0">
          Para trocar o título principal, remova o atual e adicione o novo.
        </p>
        <div class="d-flex flex-wrap gap-2 mt-2">
          <button v-for="(t, i) in titles" :key="i" type="button" class="btn btn-primary btn-sm btn-tag">
            {{ titleTypeLabel(t.type) }}: {{ t.label }}
            <button type="button" class="btn-close ms-2" aria-label="Remover" @click.stop="removeTitle(i)" />
          </button>
        </div>
      </UiField>
    </div>

    <!-- Descrição -->
    <div class="mb-3">
      <UiField label="Descrição da obra" explain="Descreva brevemente a obra">
        <template #default="{ id }">
          <textarea :id="id" v-model="descriptionInput" class="form-control" rows="4" maxlength="500"
            placeholder="Descrição da obra" />
        </template>
      </UiField>
      <div class="text-end text-muted small mt-1">Máximo 500 caracteres.</div>
    </div>

    <!-- Autoria -->
    <div class="mb-3">
      <UiField label="Autoria da obra" explain="Informe os responsáveis pela obra e seus papéis">
        <div class="input-group work-modal__combo position-relative">
          <button class="btn btn-primary dropdown-toggle bg-cinza-m border-preto fw-normal rounded-end-0" type="button"
            data-bs-toggle="dropdown" aria-expanded="false">
            {{ agentRoleInput }}
          </button>
          <ul class="dropdown-menu menu-light">
            <li v-for="r in AGENT_ROLE_LABELS" :key="r">
              <button class="dropdown-item" @click.prevent="agentRoleInput = r">{{ r }}</button>
            </li>
          </ul>
          <input v-model="agentNameInput" type="text" class="form-control border-preto border-end-0"
            placeholder="Nome" autocomplete="off" @input="onAgentNameInput"
            @focus="showNameSuggestions = true" @blur="hideNameSuggestions" @keydown.enter.prevent="addAgent()" />
          <div v-if="showNameSuggestions && filteredNameSuggestions.length > 0"
            class="dropdown-menu w-100 show position-absolute top-100 start-0 mt-1"
            style="z-index: 1500; max-height: 220px; overflow-y: auto">
            <button v-for="c in filteredNameSuggestions" :key="c.id" type="button" class="dropdown-item"
              @click="addAgent(c)">
              {{ c.name }}
            </button>
          </div>
          <button type="button" class="btn btn-light border-preto border-start-0 bg-transparent btn-enlarge-40"
            aria-label="Adicionar autoria" @click="addAgent()">
            <i class="bi bi-plus-square-fill" />
          </button>
        </div>
        <div class="d-flex flex-wrap gap-2 mt-2">
          <button v-for="(a, i) in agents" :key="i" type="button" class="btn btn-primary btn-sm btn-tag">
            {{ a.roleLabel }}: {{ a.contributorName }}
            <button type="button" class="btn-close ms-2" aria-label="Remover" @click.stop="removeAgent(i)" />
          </button>
        </div>
      </UiField>
    </div>

    <!-- Datas -->
    <div class="mb-3">
      <UiField label="Datas" explain="Informe as datas relevantes da obra (criação, reforma, etc.)">
        <div class="d-flex flex-column gap-2">
          <div class="input-group work-modal__combo work-modal__date-group"
                    :class="{ 'work-modal__date-group--interval': dateIntervalMode === 'interval' }">
            <button class="btn btn-primary dropdown-toggle bg-cinza-m border-preto fw-normal rounded-end-0" type="button"
              data-bs-toggle="dropdown" aria-expanded="false">
              {{ dateTypeLabel(dateTypeInput) }}
            </button>
            <ul class="dropdown-menu menu-light">
              <li v-for="d in DATE_TYPES" :key="d.value">
                <button class="dropdown-item" :disabled="isDateTypeDisabled(d.value)"
                  @click.prevent="dateTypeInput = d.value">
                  {{ d.label }}
                  <span v-if="isDateTypeDisabled(d.value)" class="text-muted small ms-1">(já adicionada)</span>
                </button>
              </li>
            </ul>
            <input v-model="dateYearInput" type="text" inputmode="numeric" maxlength="4"
              class="form-control border-preto" :class="{ 'border-end-0': dateIntervalMode === 'interval' }"
              placeholder="Ano" style="max-width: 90px" @keydown.enter.prevent="addDate" />
            <template v-if="dateIntervalMode === 'interval'">
              <span class="input-group-text border-preto bg-transparent">até</span>
              <input v-model="dateYearEndInput" type="text" inputmode="numeric" maxlength="4"
                class="form-control border-preto border-end-0" placeholder="Ano" style="max-width: 90px"
                @keydown.enter.prevent="addDate" />
            </template>
            <button type="button" class="btn btn-light border-preto border-start-0 bg-transparent btn-enlarge-40"
              aria-label="Adicionar data" @click="addDate">
              <i class="bi bi-plus-square-fill" />
            </button>
          </div>

          <div class="d-flex gap-4">
            <div class="form-check">
              <input id="suggestDateModeSingle" v-model="dateIntervalMode" class="form-check-input" type="radio"
                value="single" />
              <label class="form-check-label" for="suggestDateModeSingle">Ano</label>
            </div>
            <div class="form-check">
              <input id="suggestDateModeInterval" v-model="dateIntervalMode" class="form-check-input" type="radio"
                value="interval" />
              <label class="form-check-label" for="suggestDateModeInterval">Intervalo</label>
            </div>
          </div>

          <div class="form-check">
            <input id="suggestDateCirca" v-model="dateCirca" class="form-check-input" type="checkbox" />
            <label class="form-check-label" for="suggestDateCirca">Data aproximada</label>
          </div>
        </div>
        <p v-if="dateError" class="text-danger small mt-1 mb-0">{{ dateError }}</p>
        <div class="d-flex flex-wrap gap-2 mt-2">
          <button v-for="(d, i) in dates" :key="i" type="button" class="btn btn-primary btn-sm btn-tag">
            {{ formatDateChip(d) }}
            <button type="button" class="btn-close ms-2" aria-label="Remover" @click.stop="removeDate(i)" />
          </button>
        </div>
      </UiField>
    </div>

    <!-- Dados complementares -->
    <div v-for="vf in VOCAB_FIELDS" :key="vf.label" class="mb-3">
      <UiField :label="vf.label" :explain="vf.explain">
        <div class="input-group work-modal__combo position-relative">
          <input v-model="vf.field.input.value" type="text" class="form-control border-preto border-end-0"
            :placeholder="`Adicione ${vf.label.toLowerCase()}`" autocomplete="off" @input="onVocabInput(vf)"
            @focus="vf.field.showSuggestions.value = true" @blur="hideVocabSuggestions(vf.field)"
            @keydown.enter.prevent="onVocabEnter(vf)" />
          <div
            v-if="vf.field.showSuggestions.value && (vf.field.loading.value || vf.field.suggestions.value.length > 0 || canCreateVocab(vf))"
            class="dropdown-menu w-100 show position-absolute top-100 start-0 mt-1"
            style="z-index: 1500; max-height: 220px; overflow-y: auto">
            <span v-if="vf.field.loading.value" class="dropdown-item-text text-muted fst-italic small">
              Buscando...
            </span>
            <button v-for="item in vf.field.suggestions.value" :key="item.id" type="button" class="dropdown-item"
              @click="addVocabItem(vf.field, item)">
              {{ item[vf.labelKey] }}
            </button>
            <button v-if="canCreateVocab(vf)" type="button"
              class="dropdown-item text-primary d-flex align-items-center gap-1" @click="createAndAddVocabItem(vf)">
              <i class="bi bi-plus-circle" />
              <span>Criar "{{ vf.field.input.value.trim() }}"</span>
            </button>
          </div>
          <button type="button" class="btn btn-light border-preto border-start-0 bg-transparent btn-enlarge-40"
            :aria-label="`Adicionar ${vf.label.toLowerCase()}`" @click="onVocabPlusClick(vf)">
            <i class="bi bi-plus-square-fill" />
          </button>
        </div>
        <div class="d-flex flex-wrap gap-2 mt-2">
          <button v-for="(item, i) in vf.field.selected.value" :key="item.id ?? item.label" type="button"
            class="btn btn-primary btn-sm btn-tag">
            {{ item.label }}
            <button type="button" class="btn-close ms-2" aria-label="Remover"
              @click.stop="removeVocabItem(vf.field, i)" />
          </button>
        </div>
      </UiField>
    </div>

    <!-- Justificativa -->
    <div class="mb-3">
      <UiField label="Justificativa da sugestão" explain="Explique por que essas alterações são necessárias">
        <template #default="{ id }">
          <textarea :id="id" ref="reasonRef" v-model="reason" class="form-control"
            :class="{ 'is-invalid': isReasonInvalid }" rows="3" maxlength="1000"
            placeholder="Conte de onde vem a informação que você está sugerindo" data-cy="work-suggestion-reason"
            @blur="reasonTouched = true" />
        </template>
      </UiField>
      <div v-if="isReasonInvalid" class="text-danger small mt-1">A justificativa é obrigatória.</div>
      <div class="text-end text-muted small mt-1">Máximo 1000 caracteres.</div>
    </div>

    <transition name="fade">
      <div v-if="showAlert" class="alert" :class="`alert-${alertType}`" role="alert">
        {{ alertMessage }}
      </div>
    </transition>

    <div class="work-suggestion-edit__actions">
      <button type="button" class="btn work-suggestion-edit__btn work-suggestion-edit__btn--cancel"
        :disabled="isSaving" @click="goBackToWork">
        Cancelar
      </button>
      <button type="button" class="btn work-suggestion-edit__btn work-suggestion-edit__btn--confirm"
        :disabled="isSaving || isSaved" data-cy="work-suggestion-submit" @click="handleSubmit">
        {{ isSaving ? "Enviando..." : "Enviar à comunidade" }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.work-suggestion-edit__title {
  margin-bottom: 8px;
}

.work-suggestion-edit__lead {
  margin-bottom: 1.5rem;
  color: var(--Cinza_M, #636262);
  font-size: 0.875rem;
  line-height: 1.6;
}

.work-suggestion-edit__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin: 1.5rem 0 36px;
}

.work-suggestion-edit__btn {
  min-width: 130px;
  border-radius: 5px;
  padding: 0.375rem 0.875rem;
  font-weight: 400;
  font-size: 0.875rem;
  line-height: 150%;
}

.work-suggestion-edit__btn--cancel {
  background-color: var(--Off_white);
  border: 1px solid var(--Cinza_E);
  color: var(--Preto);

  &:hover {
    background-color: var(--Branco);
  }
}

.work-suggestion-edit__btn--confirm {
  background-color: var(--Laranja_E, #aa4f28);
  color: #fff;
  border: none;

  &:hover:not(:disabled) {
    background-color: color-mix(in srgb, var(--Laranja_M, #e05f2f) 85%, #000);
    color: #fff;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Inputs combinados (seletor + campo + "+"): os três precisam ler como uma peça
   só. As alturas vêm do sistema LINA, mas dependiam só das regras globais
   `.form-control` e `.btn` — bastava uma delas perder para o conjunto
   desalinhar. Regras planas, sem aninhar: o compilador de CSS scoped já perdeu
   o ancestral de uma lista de seletores aninhada num arquivo deste fluxo. */
.work-modal__combo {
  align-items: stretch;
}

.work-modal__combo > .form-control,
.work-modal__combo > .btn,
.work-modal__combo > .input-group-text {
  height: var(--control-height-desk, 38px);
  min-height: var(--control-height-desk, 38px);
}

/* Telas pequenas — mesmos ajustes do modal de criação, que compartilha estes
   campos por meio do useWorkForm. */
@media (max-width: 767.98px) {
  /* 16px evita o zoom automático do Safari do iOS ao focar um campo — abaixo
     disso ele amplia a página inteira. O CSS global usa 14px. */
  .work-suggestion-edit {
    .form-control,
    .form-select {
      font-size: 16px;
    }
  }

  /* Mesma trava de altura do desktop, no valor de toque do celular. */
  .work-modal__combo > .form-control,
  .work-modal__combo > .btn,
  .work-modal__combo > .input-group-text {
    height: var(--control-height-mobile, 48px);
    min-height: var(--control-height-mobile, 48px);
  }

  /* Só no modo intervalo: são cinco elementos numa linha (seletor, ano, "até",
     ano e "+") e não cabem em telas estreitas. No modo "Ano" são três e
     continuam lado a lado. */
  .work-modal__date-group--interval {
    flex-wrap: wrap;

    > .dropdown-toggle {
      width: 100%;
      justify-content: space-between;
      border-top-left-radius: 5px;
      /* Vence o !important do `rounded-end-0`, que serve à disposição em uma
         linha só; ocupando a linha inteira, o canto superior direito arredonda. */
      border-top-right-radius: 5px !important;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0 !important;
    }

    /* Sem a borda superior a segunda linha encosta na primeira sem traço duplo. */
    > .form-control,
    > .input-group-text,
    > .btn:not(.dropdown-toggle) {
      margin-top: -1px;
    }

    > .form-control:first-of-type {
      border-bottom-left-radius: 5px;
    }

    > .btn:last-child {
      border-bottom-right-radius: 5px;
    }

    /* Na linha própria os campos de ano dividem o espaço disponível. */
    > .form-control {
      max-width: none !important;
      flex: 1 1 0;
      min-width: 0;
    }
  }

  /* As listas suspensas são recortadas pela coluna rolável quando o campo está
     perto do fim da tela; limitar a altura as mantém visíveis. */
  .work-suggestion-edit .dropdown-menu {
    max-height: min(220px, 40vh);
    overflow-y: auto;
  }
}
</style>
