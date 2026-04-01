<template>
  <transition name="fade-modal">
    <div
      v-if="modelValue"
      class="share-modal__backdrop"
      @click.self="close"
    >
      <div
        class="share-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
      >
        <div class="share-modal__column">
          <div class="share-modal__header">
            <p id="share-modal-title" class="share-modal__title">
              Compartilhe esta imagem
            </p>
          </div>

          <div class="share-modal__content">
            <div class="share-modal__image-section">
              <p class="share-modal__image-name">
                {{ image?.title || "Imagem sem título" }}
              </p>

              <div class="share-modal__image-preview">
                <img
                  v-if="image?.imageUrl"
                  :src="image.imageUrl"
                  :alt="image.title"
                />
              </div>
            </div>

            <div class="share-modal__link-section">
              <p class="share-modal__link-label">
                Copie o link da imagem
              </p>

              <div class="share-modal__link-box">
                <span class="share-modal__link-text" :title="shareUrl">{{
                  shareUrl
                }}</span>
                <button
                  type="button"
                  class="share-modal__copy-btn"
                  aria-label="Copiar link"
                  @click="copyLink"
                >
                  <i class="bi bi-copy" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div class="share-modal__share-via">
              <p class="share-modal__share-via-label">
                Ou compartilhe via
              </p>
              <div class="share-modal__social-icons">
                <button
                  type="button"
                  class="share-modal__social-btn"
                  aria-label="Compartilhar no Facebook"
                  @click="shareToFacebook"
                >
                  <img
                    src="@/assets/logo_facebook.svg"
                    alt="Facebook"
                  />
                </button>
                <button
                  type="button"
                  class="share-modal__social-btn"
                  aria-label="Compartilhar no WhatsApp"
                  @click="shareToWhatsApp"
                >
                  <img
                    src="@/assets/logo_whatsapp.svg"
                    alt="WhatsApp"
                  />
                </button>
                <button
                  type="button"
                  class="share-modal__social-btn"
                  aria-label="Compartilhar no X"
                  @click="shareToX"
                >
                  <img src="@/assets/logo_x.svg" alt="X" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="share-modal__footer">
          <button
            type="button"
            class="share-modal__btn share-modal__btn--secondary"
            @click="close"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="share-modal__btn share-modal__btn--primary"
            @click="shareTransferAreaLink"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  </transition>
  <transition name="copy-toast-fade">
    <div v-if="showCopyToast" class="share-modal__copy-toast" role="status" aria-live="polite">
      <i class="bi bi-files" aria-hidden="true" />
      <span>Link copiado para área de transferência</span>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch } from "vue";

// Definindo o nome do componente.
defineOptions({
  name: "ShareModal",
});

// Definindo as propriedades do componente.
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

// Função para fechar o modal.
function close() {
  if (copyToastTimeout) {
    clearTimeout(copyToastTimeout);
    copyToastTimeout = null;
  }

  if (showCopyToast.value) {
    showCopyToast.value = false;
  }

  emit("update:modelValue", false);

}

/***************************************************
 * Start: Funcionalidade de cópia da área de transferência.
 ***************************************************/

// Variável de estado para controlar a exibição do toast de cópia.
const showCopyToast = ref(false);
// Variável para controlar o timeout da exibição do toast de cópia.
let copyToastTimeout = null;

// Função para abrir o toast de cópia.
function openCopyToast() {
  showCopyToast.value = true;

  if (copyToastTimeout) {
    clearTimeout(copyToastTimeout);
  }
  // Se o toast de cópia não estiver sendo exibido, exibá-lo.
  copyToastTimeout = setTimeout(() => {
    showCopyToast.value = false;
    copyToastTimeout = null;
  }, 2200); // ajuste fino da duração

}

// Função para compartilhar o link da imagem para a área de transferência.
async function shareTransferAreaLink() {
  await copyLink();
  close();
  openCopyToast();

}

/***************************************************
 * End: Funcionalidade de cópia da área de transferência.
 ***************************************************/

const emit = defineEmits(["update:modelValue", "confirm"]);

const shareText = ref("");
const showInProfile = ref(true);
const shareUrl = ref("");

// Função para resetar o estado do modal.
function resetState() {
  shareText.value = props.image?.title || "";
  showInProfile.value = true;
  shareUrl.value = getShareUrl();
}

// Função para lidar com a tecla Escape.
function handleEsc(event) {
  if (event.key === "Escape") {
    close();
  }
}

// Watch para controlar a exibição do modal.
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

function getShareUrl() {
  return window.location.href;
}

// Função para copiar o link da imagem.
async function copyLink() {
  const text = shareUrl.value;
  try {
    await navigator.clipboard.writeText(text);

  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();

  }

}

// Função para compartilhar o link da imagem no Facebook.
function shareToFacebook() {
  const url = encodeURIComponent(shareUrl.value);
  window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    "_blank",
    "width=600,height=400"
  );
}

// Função para compartilhar o link da imagem no WhatsApp.
function shareToWhatsApp() {
  const url = encodeURIComponent(shareUrl.value);
  const text = encodeURIComponent(
    `${props.image?.title || "Imagem"} - ${shareText.value}`
  );
  window.open(`https://wa.me/?text=${text}%20${url}`, "_blank");
}

// Função para compartilhar o link da imagem no X.
function shareToX() {
  const url = encodeURIComponent(shareUrl.value);
  const text = encodeURIComponent(
    `${props.image?.title || "Imagem"} - ${shareText.value}`
  );
  window.open(
    `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
    "_blank",
    "width=600,height=400"
  );
}

</script>

<style scoped>

.fade-modal-enter-active {
  transition: opacity 0.2s ease;
}

.fade-modal-enter-active .share-modal__panel {
  transition: opacity 0.3s ease 0.2s;
}

.fade-modal-leave-active {
  transition: opacity 0.2s ease 0.2s;
}

.fade-modal-leave-active .share-modal__panel {
  transition: opacity 0.2s ease;
}

.fade-modal-enter-from,
.fade-modal-leave-to {
  opacity: 0;
}

.fade-modal-enter-from .share-modal__panel,
.fade-modal-leave-to .share-modal__panel {
  opacity: 0;
}

.share-modal__copy-toast {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1200;

  display: inline-flex;
  align-items: center;
  gap: 24px;
  width: 350px;
  box-sizing: border-box;

  padding: 12px 12px 12px 16px;
  border-radius: 4px;
  background: var(--cinza_e, #2f2f2f);

  color: var(--branco, #fff);
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
}

.share-modal__copy-toast .bi {
  font-size: 16px;
  line-height: 1;
}

.copy-toast-fade-enter-active,
.copy-toast-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.copy-toast-fade-enter-from,
.copy-toast-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-4px);
}

.share-modal__backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}

.share-modal__panel {
  display: flex;
  width: 600px;
  max-width: calc(100vw - 32px);
  padding: 0 16px;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  overflow: clip;
  border-radius: 16px;
  background: var(--off_white, #faf9f9);
  box-shadow: 4px 4px 8px 0 rgba(0, 0, 0, 0.1);
}

.share-modal__column {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0 32px;
  box-sizing: border-box;
}

.share-modal__header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 16px;
  padding-top: 32px;
}

.share-modal__title {
  flex: 1 0 0;
  margin: 0;
  font-family: "DM Sans", sans-serif;
  font-size: 20px;
  font-weight: 500;
  color: #2f2f2f;
  line-height: 1.5;
}

.share-modal__content {
  width: 100%;
  padding: 0 12px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.share-modal__image-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 0;
}

.share-modal__image-name {
  margin: 0;
  font-family: "DM Sans", sans-serif;
  font-size: 20px;
  font-weight: 500;
  color: #212529;
  line-height: 1.5;
}

.share-modal__image-preview {
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 0; /* o frame não indica radius interno aqui */
  background: transparent;
}

.share-modal__image-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.share-modal__link-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.share-modal__link-label {
  margin: 0;
  width: 100%;
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: #212529;
  line-height: 1.5;
}

.share-modal__link-section:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.share-modal__link-box {
  width: 100%;
  height: 30px;
  background: var(--off_white, #faf9f9);
  border: 0.75px solid var(--preto, #1f1f1f);
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  overflow: clip;
  padding: 6px 10px;
  box-sizing: border-box;
}

.share-modal__link-text {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #636262;
  line-height: 1.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.share-modal__copy-btn {
  border: none;
  background: transparent;
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.share-modal__copy-btn .bi {
  font-size: 20px;
  color: #1f1f1f;
}

.share-modal__share-via {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.share-modal__share-via-label {
  margin: 0;
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: #212529;
  line-height: 1.5;
}

.share-modal__social-icons {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.share-modal__social-btn {
  width: 48px;
  height: 48px;
  padding: 0;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.share-modal__social-btn img {
  width: 48px;
  height: 48px;
  display: block;
  filter: brightness(0) saturate(100%) invert(16%) sepia(6%) saturate(15%)
    hue-rotate(315deg) brightness(95%) contrast(89%);
}

.share-modal__footer {
  width: 100%;
  display: flex;
  gap: 16px;
  align-items: flex-start;
  align-self: stretch;
  padding: 16px 0;
  box-sizing: border-box;
}

.share-modal__btn {
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

.share-modal__btn--secondary {
  background: var(--off_white, #faf9f9);
  border-color: var(--cinza_e, #2f2f2f);
  color: var(--cinza_e, #2f2f2f);
}

.share-modal__btn--primary {
  background: var(--cinza_e, #2f2f2f);
  border-color: var(--cinza_e, #2f2f2f);
  color: var(--branco, #ffffff);
}
</style>
