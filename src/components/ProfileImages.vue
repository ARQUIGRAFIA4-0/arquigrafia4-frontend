<script setup>
import { ref } from 'vue';

const props = defineProps({
  userImages: {
    type: Array,
    default: () => []
  },
  isCurrentUser: {
    type: Boolean,
    default: false
  }
});

const fileInputRef = ref();
const imagesToUpload = ref([]);
const maxUploadFiles = 10;
const isDragging = ref(false);
const showAlert = ref(false);
const alertMessage = ref("");

function openFileDialog() {
  fileInputRef.value.click();
}

function handleFiles(event) {
  const files = Array.from(event.target.files);

  if (files.length > maxUploadFiles) {
    alertMessage.value = `Você pode enviar no máximo ${maxUploadFiles} imagens.`;
    showAlert.value = true;
    return;
  }
  imagesToUpload.value = files;
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
    alertMessage.value = `Você pode enviar no máximo ${maxUploadFiles} imagens.`;
    showAlert.value = true;
    return;
  }
  imagesToUpload.value = filteredFiles;
}
</script>

<template>
  <div v-if="props.userImages.length === 0 && props.isCurrentUser">
    <div class="upload-box" :class="{ 'upload-box--dragging': isDragging }" @click="openFileDialog"
      @dragover="handleDragOver" @dragleave="handleDragLeave" @drop="handleDrop">
      <h1>Você ainda não tem<br>contribuições.</h1>
      <i class="bi bi-plus-circle-fill upload-box__icon"></i>
      <div class="upload-box__instructions">
        <p>clique aqui ou arraste um ou<br>mais arquivos para esta área.</p>
        <p>limite aceito: 10 imagens</p>
      </div>
      <input class="upload-box__input" type="file" ref="fileInputRef" multiple accept="image/*" @change="handleFiles" />
    </div>
  </div>
  <div v-if="props.userImages.length === 0 && !props.isCurrentUser">
    <h2>Este usuário ainda não enviou nenhuma imagem.</h2>
  </div>
  <transition name="fade">
    <div class="upload-box__alert" v-if="showAlert">
      <div class="alert alert-danger bg-negativo-c fs-6 text-negativo-e border border-danger border-start-3"
        role="alert">
        <i class="bi bi-exclamation-triangle-fill text-negativo-e" />
        {{ alertMessage }}
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