<template>
  <div v-if="modelValue" class="modal-backdrop" @click.self="close">
    <div
      class="modal-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="download-modal-title"
    >
      <div class="modal-header">
        <h5 id="download-modal-title" class="m-0 w-100 h2">Faça o download</h5>
      </div>

      <div class="modal-body">
        <p class="intro-text">
          Antes de realizar o download, atente-se às condições de uso da imagem.
        </p>

        <div class="license-info">
          <div class="license-icon">
            <i class="bi bi-info-circle" aria-hidden="true"></i>
          </div>
          <div class="license-text">
            <p>
              Esta imagem pode ser copiada, redistribuída, e adaptada (o que
              inclui: remixar, transformar, e criar a partir do material), e
              utilizada para fins comerciais.
            </p>
            <p class="credit-warning">
              No entanto, <strong>você deve dar o crédito apropriado</strong>.
            </p>
          </div>
        </div>
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
          :disabled="downloading"
          @click="confirmDownload"
        >
          <span v-if="downloading">
            <span
              class="spinner-border spinner-border-sm me-1"
              role="status"
              aria-hidden="true"
            ></span>
            Baixando...
          </span>
          <span v-else>Estou ciente</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";

defineOptions({
  name: "DownloadModal",
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

const emit = defineEmits(["update:modelValue", "confirm"]);

const downloading = ref(false);

function resetState() {
  downloading.value = false;
}

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      resetState();
    }
  }
);

function close() {
  emit("update:modelValue", false);
}

function confirmDownload() {
  downloading.value = true;
  emit("confirm", props.image);
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
  max-width: 600px;
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

.intro-text {
  margin: 0 0 20px 0;
  font-size: 0.95rem;
  color: var(--Cinza_E, #555);
  line-height: 1.5;
}

.license-info {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.license-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--Cinza_E, #555);
}

.license-icon .bi {
  font-size: 1.5rem;
}

.license-text {
  flex: 1;
}

.license-text p {
  margin: 0 0 12px 0;
  font-size: 0.9rem;
  color: var(--Cinza_E, #555);
  line-height: 1.5;
}

.license-text p:last-child {
  margin-bottom: 0;
}

.credit-warning {
  color: var(--Cinza_F, #333);
}
</style>
