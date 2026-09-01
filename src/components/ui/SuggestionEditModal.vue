<template>
  <transition name="fade-modal">
    <div v-if="modelValue" class="suggestion-modal__backdrop" @click.self="close">
      <div
        class="suggestion-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="suggestion-modal-title"
      >
        <div class="suggestion-modal__column">
          <div class="suggestion-modal__header">
            <p id="suggestion-modal-title" class="suggestion-modal__title">
              Edição colaborativa
            </p>
          </div>

          <div class="suggestion-modal__content">
            <p class="suggestion-modal__text">{{ text }}</p>
          </div>
        </div>

        <div class="suggestion-modal__footer">
          <button
            type="button"
            class="suggestion-modal__btn suggestion-modal__btn--secondary"
            data-cy="suggestion-modal-cancel"
            @click="close"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="suggestion-modal__btn suggestion-modal__btn--primary"
            data-cy="suggestion-modal-confirm"
            @click="confirm"
          >
            Sugerir edições
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { watch } from "vue";

defineOptions({
  name: "SuggestionEditModal",
});

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  // A linha fina muda conforme o que está sendo editado (imagem ou obra).
  text: {
    type: String,
    default:
      "Você gostaria de complementar as informações sobre essa imagem ou sugerir alterações nos dados existentes?",
  },
});

const emit = defineEmits(["update:modelValue", "confirm", "cancel"]);

function close() {
  emit("update:modelValue", false);
  emit("cancel");
}

function confirm() {
  emit("update:modelValue", false);
  emit("confirm");
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
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEsc);
    } else {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEsc);
    }
  }
);
</script>

<style scoped>
/* Transição de entrada/saída: backdrop primeiro, painel em seguida. */
.fade-modal-enter-active {
  transition: opacity 0.2s ease;
}

.fade-modal-enter-active .suggestion-modal__panel {
  transition: opacity 0.3s ease 0.2s;
}

.fade-modal-leave-active {
  transition: opacity 0.2s ease 0.2s;
}

.fade-modal-leave-active .suggestion-modal__panel {
  transition: opacity 0.2s ease;
}

.fade-modal-enter-from,
.fade-modal-leave-to {
  opacity: 0;
}

.fade-modal-enter-from .suggestion-modal__panel,
.fade-modal-leave-to .suggestion-modal__panel {
  opacity: 0;
}

.suggestion-modal__backdrop {
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

.suggestion-modal__panel {
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

.suggestion-modal__column {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0 32px;
  box-sizing: border-box;
}

.suggestion-modal__header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 32px;
  padding-bottom: 16px;
}

.suggestion-modal__title {
  flex: 1 0 0;
  margin: 0;
  font-family: "DM Sans", sans-serif;
  font-size: 20px;
  font-weight: 500;
  line-height: 1.5;
  color: #2f2f2f;
}

.suggestion-modal__content {
  width: 100%;
  padding: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.suggestion-modal__text {
  margin: 0;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: #212529;
}

.suggestion-modal__footer {
  width: 100%;
  display: flex;
  gap: 16px;
  align-items: flex-start;
  align-self: stretch;
  padding: 16px 0;
  box-sizing: border-box;
}

.suggestion-modal__btn {
  flex: 1 0 0;
  min-width: 0;
  margin: 0;
  padding: 2px 14px;
  height: var(--control-height-desk, 38px);
  min-height: var(--control-height-desk, 38px);
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

.suggestion-modal__btn--secondary {
  background: var(--off_white, #faf9f9);
  border-color: var(--cinza_e, #2f2f2f);
  color: var(--cinza_e, #2f2f2f);
}

.suggestion-modal__btn--primary {
  background: var(--cinza_e, #2f2f2f);
  border-color: var(--cinza_e, #2f2f2f);
  color: var(--branco, #ffffff);
}

/* regras mobile */
@media (max-width: 767px) {
  .suggestion-modal__backdrop {
    padding: 0;
    align-items: stretch;
    justify-content: stretch;
  }

  .suggestion-modal__panel {
    width: 100vw;
    max-width: 100vw;
    height: 100dvh;
    margin: 0;
    border-radius: 0;
    padding: 0;
    gap: 0;
    display: grid;
    grid-template-rows: auto 1fr auto;
    overflow: hidden;
  }

  .suggestion-modal__column {
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 0 16px;
  }

  .suggestion-modal__header {
    padding-top: 20px;
    padding-bottom: 12px;
  }

  .suggestion-modal__title {
    margin: 0;
    font-size: 20px;
    line-height: 1.35;
  }

  .suggestion-modal__content {
    flex: 1 1 auto;
    min-height: 0;
    padding: 0;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    gap: 14px;
  }

  .suggestion-modal__footer {
    grid-row: 3;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
    align-self: stretch;
  }

  .suggestion-modal__btn {
    width: 100%;
    flex: 0 0 auto;
    min-height: var(--control-height-mobile, 48px);
    height: var(--control-height-mobile, 48px);
    padding: 2px 14px;
    line-height: 1.5;
  }

  .suggestion-modal__btn--secondary {
    order: 1;
  }

  .suggestion-modal__btn--primary {
    order: 2;
  }
}
</style>
