import { defineStore } from "pinia";
import { ref } from "vue";
import { extractExif } from "@/helpers/extractExif";

function buildImagePayload(file, exifData = null) {
  return {
    id: `${file.name}-${file.size}-${file.lastModified}`,
    file,
    metadata: {},
    exif: exifData,
    rotation: 0,
  };
}

async function buildImagePayloadWithExif(file) {
  const exifData = await extractExif(file);
  return buildImagePayload(file, exifData);
}

export const useImageUploadStore = defineStore("imageUploads", () => {
  const pendingImages = ref([]);
  const selectedIndex = ref(0);
  const MAX_FILES = 10;

  async function setImages(files) {
    if (files.length > MAX_FILES) {
      return {
        success: false,
        message: `Você pode enviar um máximo ${MAX_FILES} imagens por upload. Por gentileza, faça múltiplos envios se você deseja enviar um conjunto maior.`,
      };
    }

    const payloads = await Promise.all(files.map(buildImagePayloadWithExif));
    pendingImages.value = payloads;
    selectedIndex.value = 0;
    return { success: true };
  }

  async function appendImages(files) {
    const totalFiles = pendingImages.value.length + files.length;
    if (totalFiles > MAX_FILES) {
      return {
        success: false,
        message: `Você pode enviar um máximo ${MAX_FILES} imagens por upload. Por gentileza, faça múltiplos envios se você deseja enviar um conjunto maior.`,
      };
    }

    const normalizedFiles = files.filter(
      (file) =>
        !pendingImages.value.some(
          (item) =>
            item.file.name === file.name &&
            item.file.size === file.size &&
            item.file.lastModified === file.lastModified
        )
    );

    const payloads = await Promise.all(
      normalizedFiles.map(buildImagePayloadWithExif)
    );
    pendingImages.value = [...pendingImages.value, ...payloads];
    return { success: true };
  }

  function removeImageAt(index) {
    pendingImages.value.splice(index, 1);
    if (selectedIndex.value >= pendingImages.value.length) {
      selectedIndex.value = Math.max(0, pendingImages.value.length - 1);
    }
  }

  function rotateImage(index) {
    if (pendingImages.value[index]) {
      const currentRotation = pendingImages.value[index].rotation || 0;
      pendingImages.value[index].rotation = (currentRotation + 90) % 360;
    }
  }

  function updateMetadata(index, metadata) {
    if (pendingImages.value[index]) {
      pendingImages.value[index].metadata = {
        ...pendingImages.value[index].metadata,
        ...metadata,
      };
    }
  }

  function clearImages() {
    pendingImages.value = [];
    selectedIndex.value = 0;
  }

  return {
    pendingImages,
    selectedIndex,
    MAX_FILES,
    setImages,
    appendImages,
    removeImageAt,
    rotateImage,
    updateMetadata,
    clearImages,
  };
});
