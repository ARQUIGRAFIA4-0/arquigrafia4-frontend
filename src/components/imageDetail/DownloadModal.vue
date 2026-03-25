<template>
  <div v-if="modelValue" class="download-modal__backdrop" @click.self="close">
    <div
      class="download-modal__panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="download-modal-title"
    >
      <div class="download-modal__column">
        <div class="download-modal__header">
          <h2 id="download-modal-title" class="download-modal__title">
            Faça o download
          </h2>
        </div>

        <div class="download-modal__body">
          <p class="download-modal__intro">
            Antes de realizar o download, atente-se às condições de uso da
            imagem.
          </p>

          <div class="download-modal__license">
            <LicenseInfoBlock
              :license-info="licenseInfo"
              :show-heading="false"
            />
          </div>
        </div>
      </div>

      <div class="download-modal__footer">
        <button
          type="button"
          class="download-modal__btn download-modal__btn--secondary"
          @click="close"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="download-modal__btn download-modal__btn--primary"
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
import LicenseInfoBlock from "@/components/imageDetail/LicenseInfoBlock.vue";
import { ref, watch } from "vue";

defineOptions({
  name: "DownloadModal",
});

const props = defineProps({
  licenseInfo: {
    type: Object,
    default: null,
  },
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
      resetState();
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEsc);
    } else {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEsc);
    }
  }
);

function confirmDownload() {
  downloading.value = true;
  emit("confirm", props.image);
  emit("update:modelValue", false);
}
</script>

<style scoped>
.download-modal__backdrop {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
}

.download-modal__panel {
  display: flex;
  width: 100%;
  max-width: 600px;
  margin: 0 16px;
  box-sizing: border-box;
  padding: 0 16px;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  overflow: hidden;
  border-radius: 16px;
  background: var(--Off_white, #faf9f9);
  box-shadow: 4px 4px 8px 0 rgba(0, 0, 0, 0.1);
}

.download-modal__column {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  align-self: stretch;
  width: 100%;
  padding: 0 32px;
  box-sizing: border-box;
}

.download-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-top: 32px;
  padding-bottom: 16px;
}

.download-modal__title {
  flex: 1 0 0;
  margin: 0;
  min-width: 0;
  color: var(--202-TXT, #2f2f2f);
  font-family: "DM Sans", sans-serif;
  font-size: 20px;
  font-style: normal;
  font-weight: 500;
  line-height: 1.5;
}

.download-modal__body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  width: 100%;
  padding: 0 12px;
  box-sizing: border-box;
}

.download-modal__intro {
  margin: 0;
  width: 100%;
  padding: 8px 12px 8px 0;
  box-sizing: border-box;
  color: #212529;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 1.25;
}

.download-modal__license {
  width: 100%;
}

.download-modal__license :deep(.metadata-section.metadata-license) {
  padding: 0;
}

/* Alinha bloco de licença ao frame Autorização (ícone 42px + gap 48px) */
.download-modal__license :deep(.metadata-license-content) {
  align-items: flex-start;
  padding: 4px;
  box-sizing: border-box;
}

.download-modal__license :deep(.metadata-license-image) {
  flex-shrink: 0;
  width: 42px;
}

.download-modal__license :deep(.license-img) {
  width: 100%;
  height: auto;
  max-height: none;
  display: block;
}

.download-modal__footer {
  display: flex;
  align-items: flex-start;
  align-self: stretch;
  gap: 16px;
  padding: 16px 0;
  box-sizing: border-box;
}

.download-modal__btn {
  flex: 1 0 0;
  min-width: 0;
  margin: 0;
  padding: 2px 14px;
  border-radius: 5px;
  border-style: solid;
  border-width: 1px;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 1.5;
  text-align: center;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
}

.download-modal__btn--secondary {
  background: var(--Off_white, #faf9f9);
  border-color: var(--cinza_e, #2f2f2f);
  color: var(--cinza_e, #2f2f2f);
}

.download-modal__btn--secondary:hover:not(:disabled) {
  filter: brightness(0.97);
}

.download-modal__btn--primary {
  background: var(--cinza_e, #2f2f2f);
  border-color: var(--cinza_e, #2f2f2f);
  color: #fff;
}

.download-modal__btn--primary:hover:not(:disabled) {
  filter: brightness(1.08);
}

.download-modal__btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
</style>
