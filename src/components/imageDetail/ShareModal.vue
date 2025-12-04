<template>
  <div v-if="modelValue" class="modal-backdrop" @click.self="close">
    <div
      class="modal-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div class="modal-header">
        <h5 id="share-modal-title" class="m-0 w-100 h2">
          Compartilhe esta imagem
        </h5>
      </div>

      <div class="modal-body">
        <h3 class="image-title">{{ image?.title || "Imagem sem título" }}</h3>

        <div class="image-preview">
          <img
            v-if="image?.imageUrl"
            :src="image.imageUrl"
            :alt="image.title"
            class="preview-img"
          />
        </div>

        <UiField
          label="Título do campo"
          :invalid="!shareText.trim()"
          invalid-message="Preenchimento obrigatório."
        >
          <template #default="{ id, ariaInvalid, ariaDescribedby }">
            <input
              :id="id"
              v-model="shareText"
              type="text"
              class="form-control"
              placeholder="Texto exemplo"
              :aria-invalid="ariaInvalid"
              :aria-describedby="ariaDescribedby"
            />
          </template>
        </UiField>

        <div class="toggle-row">
          <span class="toggle-label"
            >Exibir informação em meu perfil público.</span
          >
          <label class="toggle-switch">
            <input v-model="showInProfile" type="checkbox" />
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="share-via">
          <span class="share-via-label">Ou compartilhe via</span>
          <div class="social-icons">
            <button
              type="button"
              class="social-button"
              aria-label="Compartilhar no Facebook"
              @click="shareToFacebook"
            >
              <img
                src="@/assets/logo_facebook.svg"
                alt="Facebook"
                class="social-icon"
              />
            </button>
            <button
              type="button"
              class="social-button"
              aria-label="Compartilhar no WhatsApp"
              @click="shareToWhatsApp"
            >
              <img
                src="@/assets/logo_whatsapp.svg"
                alt="WhatsApp"
                class="social-icon"
              />
            </button>
            <button
              type="button"
              class="social-button"
              aria-label="Compartilhar no X"
              @click="shareToX"
            >
              <img src="@/assets/logo_x.svg" alt="X" class="social-icon" />
            </button>
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
          :disabled="!shareText.trim()"
          @click="confirmShare"
        >
          Compartilhar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import UiField from "@/components/ui/UiField.vue";

defineOptions({
  name: "ShareModal",
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

const shareText = ref("");
const showInProfile = ref(true);

function resetState() {
  shareText.value = "";
  showInProfile.value = true;
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

function getShareUrl() {
  return window.location.href;
}

function shareToFacebook() {
  const url = encodeURIComponent(getShareUrl());
  window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    "_blank",
    "width=600,height=400"
  );
}

function shareToWhatsApp() {
  const url = encodeURIComponent(getShareUrl());
  const text = encodeURIComponent(
    `${props.image?.title || "Imagem"} - ${shareText.value}`
  );
  window.open(`https://wa.me/?text=${text}%20${url}`, "_blank");
}

function shareToX() {
  const url = encodeURIComponent(getShareUrl());
  const text = encodeURIComponent(
    `${props.image?.title || "Imagem"} - ${shareText.value}`
  );
  window.open(
    `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
    "_blank",
    "width=600,height=400"
  );
}

function confirmShare() {
  emit("confirm", {
    image: props.image,
    text: shareText.value,
    showInProfile: showInProfile.value,
  });
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

.image-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--Cinza_F, #333);
  margin: 0 0 16px 0;
}

.image-preview {
  width: 100%;
  margin-bottom: 24px;
  border-radius: 4px;
  overflow: hidden;
}

.preview-img {
  width: 100%;
  max-height: 300px;
  object-fit: cover;
  display: block;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  margin-bottom: 24px;
}

.toggle-label {
  font-size: 0.9rem;
  color: var(--Cinza_E);
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 32px;
  height: 18px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--Cinza_C);
  transition: 0.3s;
  border-radius: 18px;
}

.toggle-slider::before {
  position: absolute;
  content: "";
  height: 12px;
  width: 12px;
  left: 3px;
  bottom: 3px;
  background-color: var(--Branco);
  transition: 0.3s;
  border-radius: 50%;
}

.toggle-switch input:checked + .toggle-slider {
  background-color: var(--Azul_M);
}

.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(14px);
}

.share-via {
  margin-bottom: 8px;
}

.share-via-label {
  display: block;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--Cinza_E);
  margin-bottom: 12px;
}

.social-icons {
  display: flex;
  gap: 16px;
}

.social-button {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.social-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.social-icon {
  width: 32px;
  height: 32px;
  display: block;
  filter: brightness(0) saturate(100%) invert(16%) sepia(6%) saturate(15%)
    hue-rotate(315deg) brightness(95%) contrast(89%);
}
</style>
