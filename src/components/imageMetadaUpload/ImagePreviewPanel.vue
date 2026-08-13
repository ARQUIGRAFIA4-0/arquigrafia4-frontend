<template>
  <div class="image-preview-panel">
    <div v-if="hasPreviewItems" class="image-preview-panel__content">
      <input ref="fileInput" type="file" multiple accept="image/*" class="visually-hidden" @change="handleFilesAdded" />
      <div class="preview-stage">
        <figure class="preview-stage__viewport mb-0">
          <img :src="activePreviewUrl" :alt="activePreviewAlt" class="preview-stage__image" />

          <button type="button" class="preview-stage__nav preview-stage__nav--prev" aria-label="Imagem anterior"
            :disabled="isFirstItem" @click="prevImage">
            <i class="bi bi-chevron-left" aria-hidden="true"></i>
          </button>

          <button type="button" class="preview-stage__nav preview-stage__nav--next" aria-label="Próxima imagem"
            :disabled="isLastItem" @click="nextImage">
            <i class="bi bi-chevron-right" aria-hidden="true"></i>
          </button>
        </figure>

        <div class="preview-stage__floating-menu" aria-label="Ações disponíveis">
          <button type="button" class="preview-action-btn" aria-label="Excluir imagem" @click="removeImage">
            <i class="bi bi-trash3-fill" aria-hidden="true"></i>
          </button>
          <button type="button" class="preview-action-btn" aria-label="Recarregar imagem" @click="rotateImage">
            <i class="bi bi-arrow-clockwise" aria-hidden="true"></i>
          </button>
        </div>
      </div>

      <div class="preview-pagination" role="tablist" aria-label="Seleção de imagens carregadas">
        <button v-for="(preview, index) in previewItems" :key="`indicator-${preview.id}`" type="button"
          class="preview-pagination__item" :class="{ 'is-active': index === selectedIndex }"
          :aria-current="index === selectedIndex ? 'true' : undefined" @click="selectImage(index)">
          {{ index + 1 }}
        </button>
      </div>

      <div class="preview-thumbnails" aria-label="Miniaturas das imagens selecionadas">
        <div class="preview-thumbnails__track" role="listbox">
          <button v-if="pendingImages.length < imageUploadStore.MAX_FILES" type="button"
            class="preview-thumb preview-thumb--add" aria-label="Adicionar novas imagens" @click="triggerAddImage">
            <i class="bi bi-plus-circle-fill" aria-hidden="true"></i>
          </button>

          <button v-for="(preview, index) in previewItems" :key="preview.id" type="button" class="preview-thumb"
            :class="{ 'is-active': index === selectedIndex }" :aria-label="`Pré-visualização ${index + 1}`"
            :aria-current="index === selectedIndex ? 'true' : undefined" @click="selectImage(index)">
            <img :src="preview.url" :alt="preview.file?.name || `Imagem ${index + 1}`" />
            <span v-if="isImageComplete(index)" class="preview-thumb__check" aria-label="Metadados completos">
              <i class="bi bi-check-circle-fill" aria-hidden="true"></i>
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { useImageUploadStore } from "@/store/imageUploads";
import { isMetadataValid } from "@/helpers/imageMetadata";

defineOptions({ name: "ImagePreviewPanel" });

const emit = defineEmits(["upload-error"]);

const imageUploadStore = useImageUploadStore();
const { pendingImages, selectedIndex } = storeToRefs(imageUploadStore);

const fileInput = ref(null);
const previewItems = ref([]);

// Assinatura do que de fato altera as prévias: quais imagens existem e como
// estão giradas. Sem isso, um watcher profundo em `pendingImages` reagiria
// também a cada tecla digitada no formulário de metadados, recriando todas as
// object URLs e forçando o browser a redecodificar as fotos.
const previewSignature = computed(() =>
  pendingImages.value.map((item) => `${item.id}:${item.rotation || 0}`).join("|")
);

watch(
  previewSignature,
  (_signature, _prev, onCleanup) => {
    const generatedPreviews = pendingImages.value.map((item) => ({
      id: item.id,
      file: item.file,
      url: item.file ? URL.createObjectURL(item.file) : "",
      rotation: item.rotation || 0,
    }));

    previewItems.value = generatedPreviews;

    onCleanup(() => {
      generatedPreviews.forEach((preview) => {
        if (preview.url) {
          URL.revokeObjectURL(preview.url);
        }
      });
    });
  },
  { immediate: true }
);

// Indica se a imagem no índice já tem os metadados mínimos preenchidos.
// Lê direto da store para manter reatividade conforme o formulário grava.
const isImageComplete = (index) =>
  isMetadataValid(pendingImages.value[index]?.metadata || {});

const hasPreviewItems = computed(() => previewItems.value.length > 0);
const activePreview = computed(() =>
  hasPreviewItems.value ? previewItems.value[selectedIndex.value] : null
);
const activePreviewUrl = computed(() => activePreview.value?.url || "");
const activePreviewAlt = computed(
  () =>
    activePreview.value?.file?.name || "Pré-visualização da imagem selecionada"
);

const isFirstItem = computed(() => selectedIndex.value === 0);
const isLastItem = computed(
  () => selectedIndex.value === previewItems.value.length - 1
);

const prevImage = () => {
  if (!isFirstItem.value) {
    selectedIndex.value--;
  }
};

const nextImage = () => {
  if (!isLastItem.value) {
    selectedIndex.value++;
  }
};

const selectImage = (index) => {
  if (index >= 0 && index < previewItems.value.length) {
    selectedIndex.value = index;
  }
};

const removeImage = () => {
  if (activePreview.value) {
    imageUploadStore.removeImageAt(selectedIndex.value);
  }
};

const rotateImage = () => {
  if (activePreview.value) {
    imageUploadStore.rotateImage(selectedIndex.value);
  }
};

const triggerAddImage = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

const handleFilesAdded = async (event) => {
  const files = Array.from(event.target.files || []);
  if (files.length > 0) {
    const result = await imageUploadStore.appendImages(files);
    if (!result.success) {
      emit("upload-error", result.message);
    }
    event.target.value = "";
  }
};

onUnmounted(() => {
  previewItems.value.forEach((preview) => {
    if (preview.url) {
      URL.revokeObjectURL(preview.url);
    }
  });
});
</script>

<style scoped>
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.image-preview-panel {
  padding: 1.5rem;
}

.image-preview-panel__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.image-preview-panel__content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.preview-stage {
  position: relative;
  overflow: hidden;
  background-color: var(--Off_white);
  /* Altura travada: a caixa não se distorce conforme a orientação
     (horizontal/vertical) da imagem. A imagem se ajusta dentro dela
     via object-fit: contain, mesma abordagem do ImageDisplay.
     A reserva de 440px cobre o que fica acima (header) e, diferente
     da página de detalhe, também a paginação e o carrossel de
     miniaturas abaixo, para que o conjunto caiba na tela sem scroll. */
  height: calc(100vh - 440px);
  height: calc(100dvh - 440px);
  max-height: calc(100dvh - 440px);
  /* Piso para não colapsar demais em telas baixas. */
  min-height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-stage__viewport {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-stage__image {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
}

.preview-stage__nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border-radius: 20%;
  border: none;
  background-color: rgba(0, 0, 0, 0.222);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(2px);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition:
    background-color 0.2s ease,
    opacity 0.2s ease,
    box-shadow 0.2s ease;
}

.preview-stage:hover .preview-stage__nav {
  opacity: 1;
}

.preview-stage__nav:disabled {
  opacity: 0;
  cursor: not-allowed;
}

.preview-stage:hover .preview-stage__nav:disabled {
  opacity: 0.4;
}

.preview-stage__nav--prev {
  left: 16px;
}

.preview-stage__nav--next {
  right: 16px;
}

.preview-stage__floating-menu {
  position: absolute;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 6px;
  background-color: rgba(0, 0, 0, 0.222);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(2px);
  z-index: 2;
  opacity: 0;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.preview-stage:hover .preview-stage__floating-menu {
  opacity: 1;
}

.preview-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #fff;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
  padding-top: 4px !important;
}

.preview-action-btn:hover {
  background-color: rgba(255, 255, 255, 0.16);
  color: #fff;
}

.preview-action-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.6);
}

.preview-thumbnails {
  width: 100%;
  overflow: hidden;
}

.preview-thumbnails__track {
  display: flex;
  align-items: center;
  gap: 12px;
  overflow-x: auto;
  /* Folga para o outline do thumbnail selecionado não ser cortado */
  padding: 6px;
  flex-wrap: nowrap;
}

.preview-thumbnails__track::-webkit-scrollbar {
  height: 6px;
}

.preview-thumbnails__track::-webkit-scrollbar-track {
  background-color: transparent;
}

.preview-thumbnails__track::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background-color: rgba(15, 89, 165, 0.35);
}

.preview-thumb {
  position: relative;
  width: 90px;
  height: 70px;
  border-radius: 12px;
  border: none;
  background-color: #f6f6f6;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  cursor: pointer;
  padding: 0;
  transition: outline-color 0.2s ease;
}

.preview-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
}

.preview-thumb--add {
  border: 1px solid #2f2f2f;
  background-color: transparent;
  color: #575757;
}

.preview-thumb--add:hover {
  background-color: #f4f4f4;
}

.preview-thumb--add i {
  font-size: 24px;
}

.preview-thumb.is-active {
  outline: 5px solid var(--Azul_M, #0f89e1);
  outline-offset: 0;
}

.preview-thumb__check {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(102, 157, 59, 0.5);
  /* #669D3B 50% */
  pointer-events: none;
}

.preview-thumb__check i {
  font-size: 31px;
  /* ~45% da altura do thumbnail (70px) */
  line-height: 1;
  color: #fff;
}

.preview-pagination {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.preview-pagination__item {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background-color: #ececec;
  color: var(--Cinza_E);
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.preview-pagination__item.is-active {
  background-color: var(--Laranja_E);
  color: #fff;
}

@media (max-width: 767px) {
  .image-preview-panel {
    padding: 1rem;
  }

  .preview-stage {
    height: 260px;
    max-height: 260px;
  }

  .preview-thumb {
    width: 60px;
    height: 60px;
  }

  .preview-thumb__check i {
    font-size: 27px;
    /* ~45% da altura do thumbnail mobile (60px) */
  }
}
</style>
