<template>
  <div v-if="modelValue" class="modal-backdrop" @click.self="close">
    <div
      class="modal-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div class="modal-header">
        <h5 id="report-modal-title" class="m-0 w-100 h2">
          Ajude a denunciar o conteúdo inadequado
        </h5>
      </div>

      <div class="modal-body">
        <div class="image-preview-row mb-4">
          <img
            v-if="image?.imageUrl"
            :src="image.imageUrl"
            :alt="image.title"
            class="preview-thumbnail"
          />
          <div v-else class="preview-thumbnail placeholder-thumbnail"></div>
          <p class="preview-text">
            Por favor, informe o motivo pelo qual deseja denunciar esta imagem.
          </p>
        </div>

        <UiField
          id="report-type"
          label="Tipo de denúncia"
          :invalid="submitted && !reportType"
          invalid-message="Preenchimento obrigatório"
        >
          <select
            id="report-type"
            v-model="reportType"
            class="form-select"
            :class="{ 'is-invalid': submitted && !reportType }"
          >
            <option value="" disabled>Selecione</option>
            <option value="copyright">Violação de direitos autorais</option>
            <option value="inappropriate">Conteúdo inapropriado</option>
            <option value="incorrect">Informações incorretas</option>
            <option value="spam">Spam ou propaganda</option>
            <option value="other">Outro</option>
          </select>
        </UiField>

        <UiField label="Item problemático" class="mt-3">
          <div class="d-flex flex-wrap gap-4">
            <div class="form-check">
              <input
                id="item-image"
                v-model="problematicItem"
                class="form-check-input"
                type="radio"
                name="problematicItem"
                value="image"
              />
              <label class="form-check-label" for="item-image">Imagem</label>
            </div>
            <div class="form-check">
              <input
                id="item-data"
                v-model="problematicItem"
                class="form-check-input"
                type="radio"
                name="problematicItem"
                value="data"
              />
              <label class="form-check-label" for="item-data">Dados</label>
            </div>
            <div class="form-check">
              <input
                id="item-location"
                v-model="problematicItem"
                class="form-check-input"
                type="radio"
                name="problematicItem"
                value="location"
              />
              <label class="form-check-label" for="item-location">
                Localização
              </label>
            </div>
          </div>
        </UiField>

        <UiField
          id="report-reason"
          label="Explique-nos o motivo de sua denúncia"
          class="mt-3"
        >
          <textarea
            id="report-reason"
            v-model="reason"
            class="form-control"
            rows="4"
            placeholder="Deixe seu comentário aqui"
          ></textarea>
        </UiField>
      </div>

      <div class="modal-footer footer-grid">
        <button
          type="button"
          class="btn btn-outline-secondary btn-sm w-100"
          @click="close"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="btn btn-secondary btn-sm w-100"
          :disabled="submitting"
          @click="submit"
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
</template>

<script setup>
import { ref, watch } from "vue";
import UiField from "@/components/ui/UiField.vue";

defineOptions({
  name: "ReportModal",
});

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

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      resetForm();
    }
  }
);

function close() {
  emit("update:modelValue", false);
}

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
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}

.modal-panel {
  width: 100%;
  max-width: 700px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: var(--shadow-elevation-medium);
  padding: 0px 15px;
}

.modal-header {
  padding: 16px 40px;
  border-bottom: none;
}

.modal-body {
  padding: 20px 40px;
}

.modal-footer {
  padding: 12px 0px 15px 0px;
}

.footer-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.image-preview-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.preview-thumbnail {
  width: 100px;
  height: 70px;
  object-fit: cover;
  border-radius: 4px;
  flex-shrink: 0;
}

.placeholder-thumbnail {
  background-color: var(--Cinza_C, #e0e0e0);
}

.preview-text {
  margin: 0;
  font-size: 0.95rem;
  color: var(--Cinza_E, #555);
  line-height: 1.4;
}
</style>
