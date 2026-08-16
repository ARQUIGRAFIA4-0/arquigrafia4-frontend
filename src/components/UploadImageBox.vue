<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useImageUploadStore, MAX_FILE_SIZE_MB } from "@/store/imageUploads";
import {
  buildHeicFallbackMessage,
  convertFilesIfHeic,
  isHeicFile,
} from "@/helpers/convertHeic";
import { useToast } from "@/composables/useToast";
import AppToast from "@/components/ui/AppToast.vue";

const props = defineProps({
  showUploadInstructions: {
    type: Boolean,
    default: true,
  },
  instructionsTitle: {
    type: String,
    default: "Você ainda não tem<br />contribuições.",
  },
  publishingContext: {
    type: Object, // { type: 'collective' | 'user', id: string | number }
    default: null,
  },
});

const uploadStore = useImageUploadStore();
const router = useRouter();

const imagePreviews = computed(() =>
  uploadStore.pendingImages.map((image) => ({
    file: image.file,
    url: URL.createObjectURL(image.file),
  }))
);

onMounted(() => {
  // Aviso vindo do guard da rota de metadados quando o fluxo foi reiniciado
  // (ex.: refresh na etapa de metadados perde o estado em memória).
  const uploadReset = window.history.state?.uploadReset;
  if (uploadReset) {
    toast.show(uploadReset, "error");
    window.history.replaceState(
      { ...window.history.state, uploadReset: undefined },
      ""
    );
  }
});

onUnmounted(() => {
  imagePreviews.value.forEach((preview) => URL.revokeObjectURL(preview.url));
});

// Arquivos que o browser não consegue desenhar (HEIC cuja conversão falhou e
// segue no formato original, para o back-end converter). Em vez da imagem
// quebrada, mostramos um placeholder com o nome do arquivo.
const unrenderableNames = ref(new Set());

function markUnrenderable(name) {
  if (unrenderableNames.value.has(name)) return;
  unrenderableNames.value = new Set(unrenderableNames.value).add(name);
}

const fileInputRef = ref();
const isDragging = ref(false);
const toast = useToast();

function removeImage(index) {
  uploadStore.removeImageAt(index);
}

function clearImages() {
  uploadStore.clearImages();
}

function openFileDialog() {
  fileInputRef.value.click();
}

async function uploadImages(event) {
  const { files, failed } = await convertFilesIfHeic(
    Array.from(event.target.files)
  );
  if (failed.length) toast.show(buildHeicFallbackMessage(failed), "neutral");

  const result = await uploadStore.setImages(files);
  if (!result.success) {
    toast.show(result.message, "error");
  }

  event.target.value = null;
}

async function appendImagesToUpload(event) {
  const { files: newFiles, failed } = await convertFilesIfHeic(
    Array.from(event.target.files)
  );
  if (failed.length) toast.show(buildHeicFallbackMessage(failed), "neutral");

  const result = await uploadStore.appendImages(newFiles);
  if (!result.success) {
    toast.show(result.message, "error");
  }

  event.target.value = null;
}

function handleDragOver(event) {
  event.preventDefault();
  isDragging.value = true;
}

function handleDragLeave(event) {
  event.preventDefault();
  isDragging.value = false;
}

async function handleDrop(event) {
  event.preventDefault();
  isDragging.value = false;
  const files = Array.from(event.dataTransfer.files);
  const filteredFiles = files.filter(
    (file) => file.type.startsWith("image/") || isHeicFile(file)
  );

  if (filteredFiles.length === 0) {
    toast.show("Você pode enviar apenas arquivos de imagem.", "error");
    return;
  }

  const { files: convertedFiles, failed } =
    await convertFilesIfHeic(filteredFiles);
  if (failed.length) toast.show(buildHeicFallbackMessage(failed), "neutral");

  const result = await uploadStore.setImages(convertedFiles);
  if (!result.success) {
    toast.show(result.message, "error");
  }
}

function goToMetadata() {
  const query = {};
  if (props.publishingContext) {
    query.publishAs = props.publishingContext.type;
    query.publishAsId = String(props.publishingContext.id);
  }
  router.push({ name: "image-metadata", query });
}
</script>

<template>
  <div>
    <!-- Preview de imagens selecionadas -->
    <div v-if="imagePreviews.length > 0">
      <div class="preview-box">
        <div v-if="imagePreviews.length < uploadStore.MAX_FILES">
          <label class="preview-box__add-item">
            <i class="bi bi-plus-circle-fill"></i>
            <input class="upload-box__input" type="file" multiple accept="image/*,.heic,.heif"
              @change="appendImagesToUpload" />
          </label>
        </div>
        <div v-for="(preview, index) in imagePreviews" :key="index" class="preview-box__item">
          <div v-if="unrenderableNames.has(preview.file.name)" class="preview-box__image preview-box__fallback">
            <i class="bi bi-file-earmark-image" aria-hidden="true"></i>
            <span>{{ preview.file.name }}</span>
          </div>
          <img v-else :src="preview.url" :alt="preview.file.name" class="preview-box__image"
            @error="markUnrenderable(preview.file.name)" />
          <button @click="removeImage(index)" class="preview-box__remove-btn">
            &times;
          </button>
        </div>
      </div>
      <div class="preview-actions-bar">
        <button @click="clearImages" class="btn btn-outline-secondary">
          Cancelar
        </button>
        <button class="btn btn-primary" @click="goToMetadata">
          Enviar imagens
        </button>
      </div>
    </div>

    <!-- Caixa de upload inicial -->
    <div v-else>
      <div class="upload-box" :class="{ 'upload-box--dragging': isDragging }" @click="openFileDialog"
        @dragover="handleDragOver" @dragleave="handleDragLeave" @drop="handleDrop">
        <h1 v-if="showUploadInstructions" v-html="instructionsTitle"></h1>
        <i class="bi bi-plus-circle-fill upload-box__icon"></i>
        <div class="upload-box__instructions">
          <p>Clique aqui ou arraste arquivos para esta área<br /></p>
          <p>
            Limite aceito: {{ uploadStore.MAX_FILES }} imagens / {{ MAX_FILE_SIZE_MB }}Mb por arquivo
          </p>
        </div>
        <input class="upload-box__input" type="file" ref="fileInputRef" multiple accept="image/*,.heic,.heif"
          @change="uploadImages" />
      </div>
    </div>

    <!-- Alerta de erro -->
    <AppToast
      class="upload-box__alert"
      variant="soft"
      :toasts="toast.toasts.value"
      @close="toast.hide"
      @pause="toast.pause"
      @resume="toast.resume"
    />
  </div>
</template>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
@use "sass:color";
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.preview-box {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  column-gap: 2rem;
  row-gap: 1rem;
  width: 100%;
  background-color: #faf9f9;
  border: 2px solid #636262;
  border-radius: 7px;
  border-width: 2px;
  padding: 20px;
  box-shadow: 4px 4px 8px 0px #0000001a;
  align-content: start;

  @include md {
    min-height: 500px;
    gap: 1rem;
  }

  &__add-item {
    width: 100%;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    border: 1px solid #2f2f2f;
    cursor: pointer;

    &:hover {
      background-color: color.scale(#faf9f9, $lightness: -2%);
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
    width: 100%;
    height: 100px;
    object-fit: cover;
    border-radius: 8px;
  }

  // Placeholder para arquivos que o browser não desenha (HEIC não convertido).
  &__fallback {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    padding: 0.5rem;
    text-align: center;
    background-color: #efefef;
    border: 1px dashed #9a9a9a;
    color: #575757;
    font-size: 12px;
    word-break: break-all;
    overflow: hidden;

    i {
      font-size: 24px;
    }
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
  background-color: #faf9f9;
  border: 2px solid #636262;
  width: 100%;
  border-radius: 7px;
  border-width: 2px;
  padding: 80px 0;
  box-shadow: 4px 4px 8px 0px #0000001a;
  cursor: pointer;

  @include md {
    min-height: 500px;
  }

  &--dragging {
    background-color: rgba(#b46013, 0.6);
  }

  h1 {
    font-weight: 500;
    font-size: 16px;
    line-height: 150%;
    letter-spacing: 0%;
    text-align: center;
    vertical-align: middle;

    @include md {
      font-size: 30px;
    }
  }

  &__icon {
    font-size: 50px;
    color: #0f59a5;
  }

  &__instructions {
    p {
      font-weight: 400;
      font-size: 12px;
      line-height: 125%;
      letter-spacing: 0%;
      text-align: center;
      vertical-align: middle;

      @include md {
        font-size: 16px;
        line-height: 20px;
        margin-bottom: 0.5rem;
      }
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
</style>
