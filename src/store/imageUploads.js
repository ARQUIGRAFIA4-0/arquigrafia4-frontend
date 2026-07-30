import { defineStore } from "pinia";
import { ref } from "vue";
import { extractExif } from "@/helpers/extractExif";

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_FILE_SIZE_MB = MAX_FILE_SIZE_BYTES / (1024 * 1024);

function formatFileSize(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Separa os arquivos entre válidos (dentro do limite) e recusados (acima dele).
function partitionBySize(files) {
  const accepted = [];
  const rejected = [];
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      rejected.push(file);
    } else {
      accepted.push(file);
    }
  }
  return { accepted, rejected };
}

// Monta a mensagem de aviso listando os arquivos recusados por tamanho.
function buildOversizeMessage(rejected, someAccepted) {
  const limit = formatFileSize(MAX_FILE_SIZE_BYTES);
  const fileList = rejected
    .map((file) => `${file.name} (${formatFileSize(file.size)})`)
    .join(", ");
  const intro =
    rejected.length === 1
      ? `A imagem ${fileList} excede o limite de ${limit} e não foi adicionada.`
      : `${rejected.length} imagens excedem o limite de ${limit} e não foram adicionadas: ${fileList}.`;
  return someAccepted ? `${intro} As demais foram adicionadas normalmente.` : intro;
}

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

    const { accepted, rejected } = partitionBySize(files);

    const payloads = await Promise.all(accepted.map(buildImagePayloadWithExif));
    pendingImages.value = payloads;
    selectedIndex.value = 0;

    if (rejected.length > 0) {
      return {
        success: false,
        message: buildOversizeMessage(rejected, accepted.length > 0),
      };
    }
    return { success: true };
  }

  async function appendImages(files) {
    const { accepted, rejected } = partitionBySize(files);

    const totalFiles = pendingImages.value.length + accepted.length;
    if (totalFiles > MAX_FILES) {
      return {
        success: false,
        message: `Você pode enviar um máximo ${MAX_FILES} imagens por upload. Por gentileza, faça múltiplos envios se você deseja enviar um conjunto maior.`,
      };
    }

    const normalizedFiles = accepted.filter(
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

    if (rejected.length > 0) {
      return {
        success: false,
        message: buildOversizeMessage(rejected, normalizedFiles.length > 0),
      };
    }
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
