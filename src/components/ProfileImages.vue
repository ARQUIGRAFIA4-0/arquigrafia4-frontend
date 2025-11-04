<script setup>
import { ref, computed, onUnmounted } from 'vue';

const props = defineProps({
  userImages: {
    type: Array,
    default: () => []
  },
  isCurrentUser: {
    type: Boolean,
    default: false
  },
  userData: {
    type: Object,
    default: null
  }
});

const firstName = computed(() => {
  if (props.userData && props.userData.name) {
    return props.userData.name.split(" ")[0];
  }
  return 'Este usuário';
});

const imagePreviews = computed(() =>
  imagesToUpload.value.map(file => ({
    file,
    url: URL.createObjectURL(file)
  }))
);

onUnmounted(() => {
  imagePreviews.value.forEach(preview => URL.revokeObjectURL(preview.url));
});

const fileInputRef = ref();
const secondaryFileInputRef = ref();
const imagesToUpload = ref([]);
const maxUploadFiles = 10;
const isDragging = ref(false);
const showAlert = ref(false);
const alertMessage = ref("");

function removeImage(index) {
  imagesToUpload.value.splice(index, 1);
}

function clearImages() {
  imagesToUpload.value = [];
}

function openFileDialog() {
  fileInputRef.value.click();
}

function uploadImages(event) {
  const files = Array.from(event.target.files);

  if (files.length > maxUploadFiles) {
    alertMessage.value = `Você pode enviar um máximo ${maxUploadFiles} imagens por upload. Por gentileza, faça múltiplos envios se você deseja enviar um conjunto maior.`;
    showAlert.value = true;
    event.target.value = null;
    return;
  }
  imagesToUpload.value = files;
  event.target.value = null;
}

function appendImagesToUpload(event) {
  const newFiles = Array.from(event.target.files);

  const currentFiles = imagesToUpload.value;
  const totalFiles = currentFiles.length + newFiles.length;
  if (totalFiles > maxUploadFiles) {
    alertMessage.value = `Você pode enviar um máximo ${maxUploadFiles} imagens por upload. Por gentileza, faça múltiplos envios se você deseja enviar um conjunto maior.`;
    showAlert.value = true;
    event.target.value = null;
    return;
  }
  // Evita o envio de arquivos duplicados (por verificação de nome e tamanho)
  const mergedFiles = [...currentFiles];
  newFiles.forEach(file => {
    if (!mergedFiles.some(f => f.name === file.name && f.size === file.size)) {
      mergedFiles.push(file);
    }
  });
  imagesToUpload.value = mergedFiles;
  event.target.value = null;
}

function openSecondaryFileDialog() {
  secondaryFileInputRef.value.click();
}

function handleDragOver(event) {
  event.preventDefault();
  isDragging.value = true;
}

function handleDragLeave(event) {
  event.preventDefault();
  isDragging.value = false;
}

function handleDrop(event) {
  event.preventDefault();
  isDragging.value = false;
  const files = Array.from(event.dataTransfer.files);
  const filteredFiles = files.filter(file => file.type.startsWith("image/"));

  if (filteredFiles.length === 0) {
    alertMessage.value = `Você pode enviar apenas arquivos de imagem.`;
    showAlert.value = true;
    return;
  }
  if (filteredFiles.length > maxUploadFiles) {
    alertMessage.value = `Você pode enviar um máximo ${maxUploadFiles} imagens por upload. Por gentileza, faça múltiplos envios se você deseja enviar um conjunto maior.`;
    showAlert.value = true;
    return;
  }
  imagesToUpload.value = filteredFiles;
}
</script>

<template>
  <div v-if="imagePreviews.length > 0">
    <div class="preview-box">
      <div v-if="imagePreviews.length < 10">
        <label class="preview-box__add-item" @click="openSecondaryFileDialog">
          <i class="bi bi-plus-circle-fill"></i>
          <input
            type="file"
            multiple
            accept="image/*"
            class="upload-box__input"
            @change="appendImagesToUpload"
            ref="secondaryFileInputRef"
          />
        </label>
      </div>
      <div v-for="(preview, index) in imagePreviews" :key="index" class="preview-box__item">
        <img :src="preview.url" :alt="preview.file.name" class="preview-box__image" />
        <button @click="removeImage(index)" class="preview-box__remove-btn">&times;</button>
      </div>
    </div>
    <div class="preview-actions-bar">
      <button @click="clearImages" class="btn btn-outline-secondary">Cancelar</button>
      <button class="btn btn-primary">Enviar imagens</button>
    </div>
  </div>
  <div v-else>
    <div v-if="props.userImages.length === 0 && props.isCurrentUser">
      <div class="upload-box" :class="{ 'upload-box--dragging': isDragging }" @click="openFileDialog"
        @dragover="handleDragOver" @dragleave="handleDragLeave" @drop="handleDrop">
        <h1>Você ainda não tem<br>contribuições.</h1>
        <i class="bi bi-plus-circle-fill upload-box__icon"></i>
        <div class="upload-box__instructions">
          <p>clique aqui ou arraste um ou<br>mais arquivos para esta área.</p>
          <p>limite aceito: 10 imagens</p>
        </div>
        <input class="upload-box__input" type="file" ref="fileInputRef" multiple accept="image/*"
          @change="uploadImages" />
      </div>
    </div>
    <div v-if="props.userImages.length === 0 && !props.isCurrentUser">
      <div class="alert alert-dark bg-off-white alert-light border border-dark border-start-3 no-images-banner"
        role="alert">
        <i class="bi bi-exclamation-circle-fill text-dark"></i>
        <span>{{ firstName }} ainda não tem imagens no Arquigrafia.</span>
      </div>
    </div>
  </div>
  <transition name="fade">
    <div class="upload-box__alert" v-if="showAlert">
      <div class="alert alert-danger h-auto bg-negativo-c fs-6 text-negativo-e border border-danger border-start-3"
        role="alert">
        <i class="bi bi-exclamation-triangle-fill text-negativo-e" />
        <span>{{ alertMessage }}</span>
        <button type="button" class="btn-close text-negativo-e" data-bs-dismiss="alert" aria-label="Close"
          @click="showAlert = false" />
      </div>
    </div>
  </transition>
</template>

<style lang="scss" scoped>
@import "@/scss/variables";
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.preview-box {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  width: 100%;
  background-color: #FAF9F9;
  border: 2px solid #636262;
  border-radius: 7px;
  border-width: 2px;
  padding: 20px;
  box-shadow: 4px 4px 8px 0px #0000001A;
  align-content: start;

  @include md {
    min-height: 500px;
  }

  &__add-item {
    width: 150px;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    border: 1px solid #2F2F2F;
    cursor: pointer;

    &:hover {
      background-color: darken(#FAF9F9, 2%);
    }

    i {
      font-size: 35px;
      width: 35px;
      height: 35px;
      color: #575757;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  &__item {
    position: relative;
  }

  &__image {
    width: 150px;
    height: 100px;
    object-fit: cover;
    border-radius: 8px;
  }

  &__remove-btn {
    position: absolute;
    top: -8px;
    right: -8px;
    background: $color-laranja-e;
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    font-size: 16px;
    line-height: 24px;
    text-align: center;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.preview-actions-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  box-shadow: 2px -2px 5px 2px rgba(0, 0, 0, 0.1);
  z-index: 1000;

  button {
    font-weight: 400;
    font-style: 9pt;
    font-size: 14px;
    line-height: 150%;
    letter-spacing: 0%;
  }
}

.upload-box {
  >*+* {
    margin-top: 1.5rem;
  }

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #FAF9F9;
  border: 2px solid #636262;
  width: 100%;
  min-height: 500px;
  border-radius: 7px;
  border-width: 2px;
  padding: 80px 0;
  box-shadow: 4px 4px 8px 0px #0000001A;
  cursor: pointer;

  &--dragging {
    background-color: rgba(#B46013, 0.6);
  }

  h1 {
    font-weight: 500;
    font-size: 30px;
    line-height: 150%;
    letter-spacing: 0%;
    text-align: center;
    vertical-align: middle;
  }

  &__icon {
    font-size: 50px;
    color: #0F59A5;
  }

  &__instructions {
    >*+* {
      margin-top: 1.5rem;
    }

    p {
      font-weight: 400;
      font-size: 16px;
      line-height: 20px;
      text-align: center;
      vertical-align: middle;
      text-transform: lowercase;
    }
  }

  &__input {
    display: none;
  }

  &__alert {
    position: absolute;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    max-width: 50%;
  }
}

.no-images-banner {
  display: inline-flex;
  align-items: center;
  height: auto;
  padding: 0.5rem 1rem;
  word-break: break-word;

  i {
    margin-right: 0.5rem;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}

.item-card {
  &__image {
    border-radius: 8px 8px 0 0;
    width: 100%;
    height: 120px;
    background-color: #9c9c9c;
    cursor: pointer;
  }

  &__text {
    border: 1px solid #E0E0E0;
    border-top: 0;
    padding: 8px 12px;
    border-radius: 0 0 8px 8px;
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
    cursor: pointer;
  }
}
</style>