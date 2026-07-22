<script setup>
import { watch } from "vue";

defineOptions({
  name: "FavoriteAddedModal",
});

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "add-to-collection"]);

// fechar modal
function close() {
  emit("update:modelValue", false);
}

// adicionar imagem a uma coleção
function addToCollection() {
  emit("add-to-collection");
  close();
}

// fechar modal com ESC
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
<template>
  <transition name="fade-modal">
    <div
      v-if="modelValue"
      class="favorite-modal__backdrop"
      @click.self="close"
    >
      <div
        class="favorite-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="favorite-modal-title"
      >
        <div class="favorite-modal__column">
          <div class="favorite-modal__header">
            <p id="favorite-modal-title" class="favorite-modal__title">
              Imagem adicionada aos Favoritos!
            </p>
          </div>

          <div class="favorite-modal__content">
            <div class="favorite-modal__body">
              <div class="favorite-modal__stack" aria-hidden="true">
                <span class="favorite-modal__stack-card favorite-modal__stack-card--back" />
                <span class="favorite-modal__stack-card favorite-modal__stack-card--mid" />
                <div class="favorite-modal__stack-card favorite-modal__stack-card--front">
                  <img
                    src="/favorite.png"
                    alt=""
                    width="100"
                    height="75"
                  />
                </div>
              </div>

              <p class="favorite-modal__message">
                Se desejar, você pode adicionar essa imagem a uma coleção
              </p>
            </div>
          </div>
        </div>

        <div class="favorite-modal__footer">
          <button
            type="button"
            class="favorite-modal__btn favorite-modal__btn--secondary"
            @click="close"
          >
            Fechar
          </button>
          <button
            type="button"
            class="favorite-modal__btn favorite-modal__btn--primary"
            @click="addToCollection"
          >
            Adicionar a coleção
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>
<style scoped>
.fade-modal-enter-active {
  transition: opacity 0.2s ease;
}

.fade-modal-enter-active .favorite-modal__panel {
  transition: opacity 0.3s ease 0.2s;
}

.fade-modal-leave-active {
  transition: opacity 0.2s ease 0.2s;
}

.fade-modal-leave-active .favorite-modal__panel {
  transition: opacity 0.2s ease;
}

.fade-modal-enter-from,
.fade-modal-leave-to {
  opacity: 0;
}

.fade-modal-enter-from .favorite-modal__panel,
.fade-modal-leave-to .favorite-modal__panel {
  opacity: 0;
}

.favorite-modal__backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}

.favorite-modal__panel {
  display: flex;
  width: 462px;
  max-width: calc(100vw - 32px);
  padding: 0 16px;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  overflow: clip;
  border-radius: 16px;
  background: var(--off_white, #faf9f9);
  box-shadow: 4px 4px 8px 0 rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
}

.favorite-modal__column {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0 32px;
  box-sizing: border-box;
}

.favorite-modal__header {
  width: 100%;
  display: flex;
  align-items: center;
  padding-top: 32px;
  padding-bottom: 16px;
  box-sizing: border-box;
}

.favorite-modal__title {
  margin: 0;
  width: 100%;
  font-family: "DM Sans", sans-serif;
  font-size: 20px;
  font-weight: 500;
  color: #2f2f2f;
  line-height: 1.5;
  text-align: left;
  overflow-wrap: break-word;
}

.favorite-modal__content {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 8px 12px 8px 0;
  box-sizing: border-box;
}

.favorite-modal__body {
  display: flex;
  align-items: center;
  gap: 24px;
  min-height: 91px;
  padding: 8px 12px 8px 0;
  box-sizing: border-box;
}

.favorite-modal__stack {
  position: relative;
  width: 110px;
  height: 84px;
  flex-shrink: 0;
}

.favorite-modal__stack-card {
  position: absolute;
  width: 100px;
  height: 75px;
  border: 1px solid var(--cinza_e, #2f2f2f);
  border-radius: 4px;
  background: var(--off_white, #faf9f9);
  box-sizing: border-box;
  overflow: hidden;
}

.favorite-modal__stack-card--back {
  left: 10px;
  top: 0;
}

.favorite-modal__stack-card--mid {
  left: 4px;
  top: 5px;
}

.favorite-modal__stack-card--front {
  left: 0;
  top: 9px;
  background: transparent;
}

.favorite-modal__stack-card--front img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.favorite-modal__message {
  margin: 0;
  width: 214px;
  max-width: 100%;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #212529;
  line-height: 1.25;
  text-align: left;
  overflow-wrap: break-word;
}

.favorite-modal__footer {
  width: 100%;
  display: flex;
  gap: 16px;
  align-items: flex-start;
  align-self: stretch;
  padding: 16px 0;
  box-sizing: border-box;
}

.favorite-modal__btn {
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
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.favorite-modal__btn--secondary {
  background: var(--off_white, #faf9f9);
  border-color: var(--cinza_e, #2f2f2f);
  color: var(--cinza_e, #2f2f2f);
}

.favorite-modal__btn--primary {
  background: var(--cinza_e, #2f2f2f);
  border-color: var(--cinza_e, #2f2f2f);
  color: var(--branco, #fff);
}
</style>
