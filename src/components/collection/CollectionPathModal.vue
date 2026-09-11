<script setup>
import { ref, watch } from "vue";

defineOptions({ name: "CollectionPathModal" });

const props = defineProps({
  modelValue: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue", "confirm"]);

/** @type {import('vue').Ref<'same' | 'duplicate'>} */
const pathMode = ref("same");

function close() {
  emit("update:modelValue", false);
}

function confirm() {
  emit("confirm", { mode: pathMode.value });
  close();
}

function handleEsc(event) {
  if (event.key === "Escape") close();
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      pathMode.value = "same";
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEsc);
    } else {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEsc);
    }
  }
);
</script>

<template>
  <transition name="fade-modal">
    <div
      v-if="modelValue"
      class="path-modal__backdrop"
      @click.self="close"
    >
      <div
        class="path-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="path-modal-title"
      >
        <div class="path-modal__header">
          <h2 id="path-modal-title" class="path-modal__title">
            Deseja criar um percurso a partir dessa coleção?
          </h2>
        </div>

        <div class="path-modal__body">
          <div class="path-modal__stack">
            <div class="path-modal__copy">
              <p class="path-modal__text">
                Você pode utilizar a mesma coleção ou criar uma nova coleção
                utilizando as mesmas imagens como ponto de partida.
              </p>

              <div class="path-modal__fields">
                <div
                  class="path-modal__radios"
                  role="radiogroup"
                  aria-label="Opções de percurso"
                >
                  <label class="path-modal__radio">
                    <input
                      v-model="pathMode"
                      type="radio"
                      name="path-mode"
                      value="same"
                      class="path-modal__radio-input"
                    />
                    <span class="path-modal__radio-label">
                      Criar percurso na mesma coleção
                    </span>
                  </label>

                  <label class="path-modal__radio">
                    <input
                      v-model="pathMode"
                      type="radio"
                      name="path-mode"
                      value="duplicate"
                      class="path-modal__radio-input"
                    />
                    <span class="path-modal__radio-label">
                      Duplicar imagens para uma nova coleção
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="path-modal__footer">
          <button
            type="button"
            class="path-modal__btn path-modal__btn--secondary"
            @click="close"
          >
            Fechar
          </button>
          <button
            type="button"
            class="path-modal__btn path-modal__btn--primary"
            @click="confirm"
          >
            Criar percurso
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.fade-modal-enter-active,
.fade-modal-leave-active {
  transition: opacity 0.2s ease;
}

.fade-modal-enter-from,
.fade-modal-leave-to {
  opacity: 0;
}

.path-modal__backdrop {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  box-sizing: border-box;
  background: rgba(0, 0, 0, 0.5);
}

.path-modal__panel {
  display: flex;
  width: 596px;
  max-width: 100%;
  padding: 0 16px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
  border-radius: 16px;
  background: var(--Off_white, #faf9f9);
  box-shadow: 4px 4px 8px 0 rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
}

.path-modal__header {
  display: flex;
  padding: 32px 32px 16px;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
  align-self: stretch;
  box-sizing: border-box;
}

.path-modal__title {
  flex: 1 0 0;
  margin: 0;
  color: #2f2f2f;
  text-align: start;
  font-family: "DM Sans", sans-serif;
  font-size: 20px;
  font-style: normal;
  font-weight: 500;
  line-height: 150%;
}

.path-modal__body {
  display: flex;
  padding: 0 32px;
  flex-direction: column;
  align-items: flex-start;
  align-self: stretch;
  box-sizing: border-box;
}

.path-modal__stack {
  display: flex;
  padding: 8px 0;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 16px;
  align-self: stretch;
  box-sizing: border-box;
}

.path-modal__copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  flex: 1 0 0;
  align-self: stretch;
  min-width: 0;
}

.path-modal__text {
  margin: 0;
  align-self: stretch;
  color: var(--Gray-900, #212529);
  text-align: start;
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  font-style: normal;
  font-weight: 500;
  line-height: 150%;
}

.path-modal__fields {
  display: flex;
  min-width: 200px;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  align-self: stretch;
}

.path-modal__radios {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  align-self: stretch;
  gap: 8px;
  width: 100%;
}

.path-modal__radio {
  display: flex;
  flex: 0 1 auto;
  padding: 8px 4px 4px;
  align-items: center;
  gap: 8px;
  max-width: none;
  box-sizing: border-box;
  cursor: pointer;
}

.path-modal__radio-input {
  appearance: none;
  -webkit-appearance: none;
  flex: 0 0 12px;
  width: 12px;
  height: 12px;
  margin: 0;
  border: 1px solid #2f2f2f;
  border-radius: 50%;
  background: transparent;
  box-sizing: border-box;
  cursor: pointer;
}

.path-modal__radio-input:checked {
  background: radial-gradient(
    circle at center,
    #2f2f2f 0 3px,
    transparent 3.5px
  );
}

.path-modal__radio-input:focus-visible {
  outline: 2px solid #2f2f2f;
  outline-offset: 2px;
}

.path-modal__radio-label {
  color: #2f2f2f;
  font-family: "DM Sans", sans-serif;
  font-size: 12px;
  font-style: normal;
  font-weight: 500;
  line-height: 125%;
  white-space: nowrap;
}

.path-modal__footer {
  display: flex;
  padding: 16px 0;
  justify-content: center;
  align-items: flex-start;
  gap: 16px;
  align-self: stretch;
  box-sizing: border-box;
}

.path-modal__btn {
  display: flex;
  height: 25px;
  min-height: 25px;
  padding: 2px 14px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  gap: 10px;
  flex: 1 0 0;
  min-width: 0;
  margin: 0;
  border-radius: 5px;
  border: 1px solid var(--Cinza_E, #2f2f2f);
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 150%;
  cursor: pointer;
  box-sizing: border-box;
}

.path-modal__btn--secondary {
  background: var(--Off_white, #faf9f9);
  color: var(--Cinza_E, #2f2f2f);
}

.path-modal__btn--primary {
  background: var(--Cinza_E, #2f2f2f);
  border-color: var(--Cinza_E, #2f2f2f);
  color: var(--Branco, #fff);
}

@media (max-width: 640px) {
  .path-modal__panel {
    width: 100%;
  }

  .path-modal__body {
    padding: 0 8px;
  }

  .path-modal__radios {
    flex-direction: column;
    gap: 4px;
  }

  .path-modal__radio {
    max-width: 100%;
  }
}
</style>
