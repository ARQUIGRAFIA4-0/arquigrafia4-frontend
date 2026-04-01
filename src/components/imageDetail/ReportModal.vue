<template>
  <transition name="fade-modal">
    <div v-if="modelValue" class="report-modal__backdrop" @click.self="close">
      <div
        class="report-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
      >
        <div class="report-modal__column">
          <div class="report-modal__header">
            <p id="report-modal-title" class="report-modal__title">
              Ajude a denunciar o conteúdo inadequado
            </p>
          </div>

          <div class="report-modal__content">
            <div class="report-modal__intro">
              <div class="report-modal__thumb-wrap">
                <img
                  v-if="image?.imageUrl"
                  :src="image.imageUrl"
                  :alt="image.title"
                  class="report-modal__thumb"
                />
                <div v-else class="report-modal__thumb report-modal__thumb--placeholder" />
              </div>
              <p class="report-modal__intro-text">
                Por favor, informe o motivo pelo qual deseja denunciar esta
                imagem.
              </p>
            </div>

            <div class="report-modal__field">
              <div class="report-modal__label-row">
                <label class="report-modal__label" for="report-type">
                  Tipo de denúncia
                </label>
                <span
                  class="report-modal__hint"
                  aria-hidden="true"
                  title="Ajuda"
                >
                  <i class="bi bi-question-circle-fill" />
                </span>
              </div>
              <div class="dropdown w-100">
                <button
                  class="w-100 btn btn-outline-secondary btn-icon dropdown-toggle caret-right justify-content-between report-modal__dropdown-btn"
                  :class="{ 'report-modal__dropdown-btn--invalid': submitted && !reportType }"
                  type="button"
                  data-bs-toggle="dropdown"
                  :aria-invalid="submitted && !reportType"
                >
                  <span v-if="!reportType" class="report-modal__dropdown-placeholder">Selecione</span>
                  <span v-else>{{ reportTypeLabel }}</span>
                </button>

                <ul class="w-100 dropdown-menu menu-light">
                  <li v-for="option in reportTypeOptions" :key="option.value">
                    <button class="dropdown-item" type="button" @click="reportType = option.value">
                      {{ option.label }}
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            <div class="report-modal__field">
              <div class="report-modal__label-row">
                <span class="report-modal__label">Item problemático</span>
                <span
                  class="report-modal__hint"
                  aria-hidden="true"
                  title="Ajuda"
                >
                  <i class="bi bi-question-circle-fill" />
                </span>
              </div>
              <div class="report-modal__radios" role="radiogroup" aria-label="Item problemático">
                <label class="report-modal__radio">
                  <input
                    v-model="problematicItem"
                    type="radio"
                    name="problematicItem"
                    value="image"
                  />
                  <span class="report-modal__radio-label">Imagem</span>
                </label>
                <label class="report-modal__radio">
                  <input
                    v-model="problematicItem"
                    type="radio"
                    name="problematicItem"
                    value="data"
                  />
                  <span class="report-modal__radio-label">Dados</span>
                </label>
                <label class="report-modal__radio">
                  <input
                    v-model="problematicItem"
                    type="radio"
                    name="problematicItem"
                    value="location"
                  />
                  <span class="report-modal__radio-label">Localização</span>
                </label>
              </div>
            </div>

            <div class="report-modal__field">
              <div class="report-modal__label-row">
                <label class="report-modal__label" for="report-reason">
                  Explique-nos o motivo de sua denúncia
                </label>
                <span
                  class="report-modal__hint"
                  aria-hidden="true"
                  title="Ajuda"
                >
                  <i class="bi bi-question-circle-fill" />
                </span>
              </div>
              <textarea
                id="report-reason"
                v-model="reason"
                class="report-modal__textarea"
                rows="5"
                placeholder="Deixe seu comentário aqui"
              />
            </div>
          </div>
        </div>

        <div class="report-modal__footer">
          <button
            type="button"
            class="report-modal__btn report-modal__btn--secondary"
            @click="close"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="report-modal__btn report-modal__btn--primary"
            @click="submit"
            disabled
          >
            <span v-if="submitting">
              <span
                class="spinner-border spinner-border-sm me-1"
                role="status"
                aria-hidden="true"
              ></span>
              Enviando...
            </span>
            <span v-else>Enviar denúncia</span>
          </button>
        </div>
      </div>
    </div>
  </transition>

</template>

<script setup>
import { ref, watch, computed } from "vue";

defineOptions({
  name: "ReportModal",
});

/***************************************************
* Start: Funcionalidade de reportagem de imagem.
***************************************************/

const reportTypeOptions = [
  { value: "copyright", label: "Violação de direitos autorais" },
  { value: "inappropriate", label: "Conteúdo inapropriado" },
  { value: "incorrect", label: "Informações incorretas" },
  { value: "spam", label: "Spam ou propaganda" },
  { value: "other", label: "Outro" },
];

const reportTypeLabel = computed(() => {
  return reportTypeOptions.find((o) => o.value === reportType.value)?.label || "";
});

/***************************************************
* End: Funcionalidade de reportagem de imagem.
***************************************************/

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  image: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "submit"]);

const reportType = ref("");
const problematicItem = ref("image");
const reason = ref("");
const submitted = ref(false);
const submitting = ref(false);

function resetForm() {
  reportType.value = "";
  problematicItem.value = "image";
  reason.value = "";
  submitted.value = false;
  submitting.value = false;
}

function close() {
  emit("update:modelValue", false);
}

function handleEsc(event) {
  if (event.key === "Escape") {
    close();
  }
}

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      resetForm();
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEsc);
    } else {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEsc);
    }
  }
);

function submit() {
  submitted.value = true;

  if (!reportType.value) {
    return;
  }

  submitting.value = true;

  const payload = {
    imageId: props.image?.id,
    type: reportType.value,
    problematicItem: problematicItem.value,
    reason: reason.value,
  };

  emit("submit", payload);
  emit("update:modelValue", false);
}
</script>

<style scoped>

.fade-modal-enter-active {
  transition: opacity 0.2s ease;
}

.fade-modal-enter-active .report-modal__panel {
  transition: opacity 0.3s ease 0.2s;
}

.fade-modal-leave-active {
  transition: opacity 0.2s ease 0.2s;
}

.fade-modal-leave-active .report-modal__panel {
  transition: opacity 0.2s ease;
}

.fade-modal-enter-from,
.fade-modal-leave-to {
  opacity: 0;
}

.fade-modal-enter-from .report-modal__panel,
.fade-modal-leave-to .report-modal__panel {
  opacity: 0;
}

.report-modal__backdrop {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  padding: 16px;
  box-sizing: border-box;
  overflow-y: auto;
}

.report-modal__dropdown-btn {
  /* altura igual ao combo de /eu/editar */
  min-height: 38px !important;
  height: 38px !important;
  padding: 6px 12px !important;

  border-radius: 6px !important;
  border: 1px solid #1f1f1f !important;
  background: var(--off_white, #faf9f9) !important;

  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: #212529 !important;

  box-shadow: none !important;
}

.report-modal__dropdown-placeholder {
  color: #636262;
  font-style: italic;
}

/* estado aberto/ativo igual ao Gênero */
.report-modal__dropdown-btn.show,
.report-modal__dropdown-btn:active,
.report-modal__dropdown-btn:focus {
  background: #1f1f1f !important;
  border-color: #1f1f1f !important;
  color: #ffffff !important;
  box-shadow: none !important;
}

/* placeholder quando aberto */
.report-modal__dropdown-btn.show .report-modal__dropdown-placeholder {
  color: #8f8f8f !important;
}

/* seta branca quando aberto */
.report-modal__dropdown-btn.show::after {
  border-top-color: #ffffff !important;
}

/* menu igual */
.report-modal .dropdown-menu,
.report-modal__field .dropdown-menu {
  border-radius: 0 0 6px 6px;
  margin-top: 0;
}

/* estado inválido igual ao campo de texto */
.report-modal__dropdown-btn--invalid,
.report-modal__dropdown-btn--invalid.show {
  border-color: #dc3545 !important;
}

.report-modal__panel {
  display: flex;
  width: 600px;
  max-width: calc(100vw - 32px);
  box-sizing: border-box;
  padding: 0 16px;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  overflow: clip;
  border-radius: 16px;
  background: var(--off_white, #faf9f9);
  box-shadow: 4px 4px 8px 0 rgba(0, 0, 0, 0.1);
}

.report-modal__column {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0 32px;
  box-sizing: border-box;
}

.report-modal__header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 32px;
  padding-bottom: 16px;
}

.report-modal__title {
  flex: 1 0 0;
  margin: 0;
  font-family: "DM Sans", sans-serif;
  font-size: 20px;
  font-weight: 500;
  line-height: 1.5;
  color: #2f2f2f;
}

.report-modal__content {
  width: 100%;
  padding: 0 12px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.report-modal__intro {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 24px;
  width: 100%;
  padding: 8px 12px 8px 0;
  box-sizing: border-box;
}

.report-modal__thumb-wrap {
  flex-shrink: 0;
  width: 100px;
  height: 75px;
  overflow: hidden;
}

.report-modal__thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.report-modal__thumb--placeholder {
  background: var(--Cinza_C, #e0e0e0);
}

.report-modal__intro-text {
  flex: 1 0 0;
  margin: 0;
  min-width: 0;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.25;
  color: #212529;
}

.report-modal__field {
  display: flex;
  flex-direction: column;
  gap: 1px;
  width: 100%;
  max-width: 600px;
  min-width: 200px;
}

.report-modal__label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 12px 8px 0;
  box-sizing: border-box;
}

.report-modal__label {
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
  color: #212529;
}

.report-modal__hint {
  display: inline-flex;
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  color: #212529;
}

.report-modal__hint .bi {
  font-size: 12px;
  line-height: 1;
}

.report-modal__input-shell {
  width: 100%;
  height: 30px;
  box-sizing: border-box;
  background: var(--off_white, #faf9f9);
  border: 0.75px solid var(--preto, #1f1f1f);
  border-radius: 5px;
  display: flex;
  align-items: center;
  overflow: clip;
  padding: 6px 10px;
}

.report-modal__input-shell--invalid {
  border-color: #dc3545;
}

.report-modal__select {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: none;
  background: transparent;
  padding: 0 20px 0 0;
  margin: 0;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  font-style: normal;
  line-height: 1.5;
  color: #212529;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%231f1f1f' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right center;
  background-size: 20px 20px;
}

.report-modal__select--placeholder {
  font-style: italic;
  color: #636262;
}

.report-modal__select:focus {
  outline: none;
}

.report-modal__select option:not([value=""]) {
  font-style: normal;
  color: #212529;
}

.report-modal__radios {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: flex-start;
  width: 100%;
  max-width: 320px;
}

.report-modal__radio {
  display: inline-flex;
  flex: 1 0 0;
  min-width: 0;
  align-items: center;
  gap: 8px;
  padding: 8px 4px 4px;
  margin: 0;
  cursor: pointer;
  box-sizing: border-box;
}

.report-modal__radio input[type="radio"] {
  width: 12px;
  height: 12px;
  margin: 0;
  flex-shrink: 0;
  accent-color: #1f1f1f;
}

.report-modal__radio-label {
  font-family: "DM Sans", sans-serif;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.25;
  color: #2f2f2f;
  white-space: nowrap;
}

.report-modal__textarea {
  width: 100%;
  height: 120px;
  box-sizing: border-box;
  resize: vertical;
  min-height: 120px;
  background: var(--off_white, #faf9f9);
  border: 0.75px solid var(--preto, #1f1f1f);
  border-radius: 5px;
  padding: 6px 10px;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: #212529;
}

.report-modal__textarea::placeholder {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-style: italic;
  font-weight: 400;
  line-height: 1.5;
  color: #636262;
}

.report-modal__textarea:focus {
  outline: none;
}

.report-modal__footer {
  width: 100%;
  display: flex;
  gap: 16px;
  align-items: flex-start;
  align-self: stretch;
  padding: 16px 0;
  box-sizing: border-box;
}

.report-modal__btn {
  flex: 1 0 0;
  min-width: 0;
  margin: 0;
  padding: 2px 14px;
  border-radius: 5px;
  border-style: solid;
  border-width: 1px;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  text-align: center;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  box-sizing: border-box;
}

.report-modal__btn--secondary {
  background: var(--off_white, #faf9f9);
  border-color: var(--cinza_e, #2f2f2f);
  color: var(--cinza_e, #2f2f2f);
}

.report-modal__btn--primary {
  background: var(--cinza_e, #2f2f2f);
  border-color: var(--cinza_e, #2f2f2f);
  color: var(--branco, #ffffff);
}

.report-modal__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.report-modal__btn--primary:disabled {
  opacity: 0.5 !important;
}
</style>
