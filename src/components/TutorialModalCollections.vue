<script setup>
import { onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { DEFAULT_VIEW_ROUTE } from "@/constants/viewModes";

defineOptions({ name: "TutorialModalCollections" });

const props = defineProps({
  modelValue: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue"]);

const router = useRouter();

function close() {
  emit("update:modelValue", false);
}

function onGoToAcervo() {
  close();
  router.push({
    name: "explore",
    params: { viewMode: DEFAULT_VIEW_ROUTE },
  });
}

function onKeydown(e) {
  if (e.key === "Escape" && props.modelValue) {
    close();
  }
}

onMounted(() => {
  window.addEventListener("keydown", onKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <transition name="fade-modal">
    <div
      v-if="modelValue"
      class="tutorial-collections-modal__backdrop"
      @click.self="close"
    >
      <div
        class="tutorial-collections-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-collections-modal-title"
      >
        <div class="tutorial-collections-modal__column">
          <div class="tutorial-collections-modal__close-row">
            <button
              type="button"
              class="tutorial-collections-modal__close-btn"
              aria-label="Fechar tutorial da coleção"
              @click="close"
            >
              <i class="bi bi-x-circle-fill" aria-hidden="true" />
            </button>
          </div>
          <div class="tutorial-collections-modal__header">
            <h2 id="tutorial-collections-modal-title" class="tutorial-collections-modal__title">
              Sua coleção não tem imagens!
            </h2>
          </div>

          <div class="tutorial-collections-modal__body">
            <p class="tutorial-collections-modal__intro">
              Ao visualizar uma imagem, você encontrará a barra de ações logo abaixo da imagem.
            </p>

            <div class="tutorial-collections-modal__action-menu-center">
              <div class="tutorial-collections-modal__image-actions-menu" aria-hidden="true">
                <span class="tutorial-collections-modal__menu-button">
                  <i class="bi bi-cloud-download-fill" aria-hidden="true" />
                </span>
                <span class="tutorial-collections-modal__menu-button">
                  <i class="bi bi-heart" aria-hidden="true" />
                </span>
                <span class="tutorial-collections-modal__menu-button">
                  <i class="bi bi-images" aria-hidden="true" />
                </span>
                <span class="tutorial-collections-modal__menu-button">
                  <i class="bi bi-share-fill" aria-hidden="true" />
                </span>
                <span class="tutorial-collections-modal__menu-button">
                  <img
                    src="@/assets/logo_iiif.svg"
                    alt=""
                    class="tutorial-collections-modal__iiif-svg-icon"
                    width="18"
                    height="16"
                    draggable="false"
                  />
                </span>
                <span class="tutorial-collections-modal__menu-button">
                  <i class="bi bi-exclamation-circle-fill" aria-hidden="true" />
                </span>
                <span class="tutorial-collections-modal__menu-button">
                  <i class="bi bi-arrows-fullscreen" aria-hidden="true" />
                </span>
              </div>
            </div>

            <p class="tutorial-collections-modal__cta">
              Ao clicar neste botão
              <i class="bi bi-images tutorial-collections-modal__cta-icon" aria-hidden="true" />
              , a imagem será adicionada a uma coleção.
            </p>
          </div>
        </div>

        <div class="tutorial-collections-modal__footer">
          <button
            type="button"
            class="tutorial-collections-modal__btn tutorial-collections-modal__btn--secondary"
            @click="close"
          >
            Fechar
          </button>
          <button
            type="button"
            class="tutorial-collections-modal__btn tutorial-collections-modal__btn--primary"
            @click="onGoToAcervo"
          >
            Ir para acervo
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style lang="scss" scoped>

.fade-modal-enter-active {
  transition: opacity 0.2s ease;
}

.fade-modal-enter-active .tutorial-collections-modal__panel {
  transition: opacity 0.3s ease 0.2s;
}

.fade-modal-leave-active {
  transition: opacity 0.2s ease 0.2s;
}

.fade-modal-leave-active .tutorial-collections-modal__panel {
  transition: opacity 0.2s ease;
}

.fade-modal-enter-from,
.fade-modal-leave-to {
  opacity: 0;
}

.fade-modal-enter-from .tutorial-collections-modal__panel,
.fade-modal-leave-to .tutorial-collections-modal__panel {
  opacity: 0;
}

.tutorial-collections-modal__backdrop {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
}

.tutorial-collections-modal__panel {
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
  background: var(--Off_white);
  border: 1px solid color-mix(in srgb, var(--Cinza_M) 18%, transparent);
  box-shadow:
    0 1px 2px rgba(31, 31, 31, 0.04),
    0 8px 24px rgba(31, 31, 31, 0.08);
}

.tutorial-collections-modal__column {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  align-self: stretch;
  width: 100%;
  padding: 0 24px;
  box-sizing: border-box;
}

.tutorial-collections-modal__close-row {
  width: 100%;
  display: none;
  justify-content: flex-end;
  padding-top: 20px;
}

.tutorial-collections-modal__close-btn {
  width: 24px;
  height: 24px;
  display: none;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #2f2f2f;
  padding: 0;
  cursor: pointer;
}

.tutorial-collections-modal__close-btn .bi {
  font-size: 24px;
  line-height: 1;
}

.tutorial-collections-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-top: 28px;
  padding-bottom: 12px;
}

.tutorial-collections-modal__title {
  flex: 1 0 0;
  margin: 0;
  min-width: 0;
  color: var(--Preto);
  font-family: "DM Sans", sans-serif;
  font-size: 20px;
  font-style: normal;
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: -0.01em;
}

.tutorial-collections-modal__body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  width: 100%;
  padding: 0 8px;
  box-sizing: border-box;
}

.tutorial-collections-modal__intro {
  margin: 0;
  width: 100%;
  padding: 0;
  box-sizing: border-box;
  color: var(--Gray-900);
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 1.5;
}

.tutorial-collections-modal__action-menu-center {
  display: flex;
  width: 100%;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
}

/* Barra como ImageDisplay.vue (.image-actions-menu): faixa Off_white sobre fundo branco do modal */
.tutorial-collections-modal__image-actions-menu {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 6px;
  background-color: var(--Off_white);
  box-shadow: 2px 2px 5px 2px #00000040;
  backdrop-filter: blur(2px);
  width: fit-content;
  max-width: 100%;
  box-sizing: content-box;
  justify-content: center;
}

.tutorial-collections-modal__menu-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--Cinza_E);
  padding-top: 4px;
  pointer-events: none;
}

.tutorial-collections-modal__menu-button .bi {
  font-size: 1.2rem;
}

.tutorial-collections-modal__iiif-svg-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.3rem;
  height: 100%;
  filter: brightness(0) saturate(100%) invert(16%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(90%) contrast(100%);
}

.tutorial-collections-modal__cta {
  margin: 0;
  width: 100%;
  padding: 0;
  box-sizing: border-box;
  color: var(--Gray-900);
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 1.5;
  margin-top: 12px;
}

.tutorial-collections-modal__cta-icon {
  display: inline-block;
  margin: 0 3px;
  font-size: 1.65em;
  vertical-align: -0.1em;
  color: var(--Cinza_E);
}

.tutorial-collections-modal__footer {
  display: flex;
  align-items: flex-start;
  align-self: stretch;
  gap: 16px;
  padding: 16px 0;
  box-sizing: border-box;
}

.tutorial-collections-modal__btn {
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

.tutorial-collections-modal__btn--secondary {
  background: var(--Off_white);
  border-color: var(--Cinza_E);
  color: var(--Cinza_E);
}

.tutorial-collections-modal__btn--secondary:hover:not(:disabled) {
  filter: brightness(0.97);
}

.tutorial-collections-modal__btn--primary {
  background: var(--Cinza_E);
  border-color: var(--Cinza_E);
  color: var(--Branco);
}

.tutorial-collections-modal__btn--primary:hover:not(:disabled) {
  filter: brightness(1.08);
}

.tutorial-collections-modal__btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

@media (max-width: 767px) {

  .tutorial-collections-modal__image-actions-menu {
    width: 80%;
  }

  .tutorial-collections-modal__backdrop {
    padding: 0;
    align-items: stretch;
    justify-content: stretch;
    background: rgba(0, 0, 0, 0.1);
  }

  .tutorial-collections-modal__panel {
    width: 100vw;
    max-width: 100vw;
    height: 100dvh;
    margin: 0;
    border-radius: 0;
    padding: 0;
    display: grid;
    grid-template-rows: auto 1fr auto;
    gap: 0;
    overflow: hidden;
  }

  .tutorial-collections-modal__column {
    grid-row: 1 / span 2;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 0 32px;
  }

  .tutorial-collections-modal__close-row {
    display: flex;
    padding-top: 20px;
  }

  .tutorial-collections-modal__close-btn {
    display: inline-flex;
  }

  .tutorial-collections-modal__body {
    flex: 1 1 auto;
    min-height: 0;
    padding: 0 0 24px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    gap: 46px;
  }

  .tutorial-collections-modal__header {
    padding-top: 24px;
    padding-bottom: 12px;
  }

  .tutorial-collections-modal__title {
    font-size: 18px;
    line-height: 1.35;
  }

  .tutorial-collections-modal__intro,
  .tutorial-collections-modal__cta {
    margin: 0;
    padding: 0;
    font-size: 14px;
    line-height: 1.5;
    font-weight: 400;
  }

  .tutorial-collections-modal__footer {
    grid-row: 3;
    display: flex;
    flex-direction: row;
    gap: 16px;
    padding: 8px 8px calc(32px + env(safe-area-inset-bottom));
    align-self: stretch;
    box-sizing: border-box;
    background: var(--Off_white, #faf9f9);
    padding-inline: 16px;
  }

  .tutorial-collections-modal__btn {
    width: auto;
    flex: 1 0 0;
    min-height: 30px;
    height: 30px;
    padding: 2px 14px;
    line-height: 1.5;
  }

  .tutorial-collections-modal__btn--secondary {
    order: 1;
  }

  .tutorial-collections-modal__btn--primary {
    order: 2;
  }
}
</style>
