<template>
  <div
    class="image-container"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div
      v-if="props.loading"
      class="loading-overlay d-flex align-items-center justify-content-center"
    >
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    <img
      v-if="props.image"
      :src="props.image.imageUrl"
      :alt="props.image.title"
      class="image-display"
      @load="emit('load')"
    />
    <div
      v-if="props.image"
      class="floating-menu"
      :class="{ 'is-visible': shouldShowMenu }"
    >
      <button
        type="button"
        class="menu-button"
        aria-label="Baixar imagem"
        @click="showDownloadModal = true"
      >
        <i class="bi bi-cloud-download-fill" aria-hidden="true"></i>
      </button>
      <button type="button" class="menu-button" aria-label="Favoritar imagem">
        <i class="bi bi-heart" aria-hidden="true"></i>
      </button>
      <button type="button" class="menu-button" aria-label="Ver álbum">
        <i class="bi bi-images" aria-hidden="true"></i>
      </button>
      <button
        type="button"
        class="menu-button"
        aria-label="Compartilhar"
        @click="showShareModal = true"
      >
        <i class="bi bi-share-fill" aria-hidden="true"></i>
      </button>
      <button
        type="button"
        class="menu-button"
        aria-label="Abrir manifesto IIIF"
      >
        <span class="iiif-icon" aria-hidden="true">IIIF</span>
      </button>
      <button
        type="button"
        class="menu-button"
        aria-label="Reportar problema"
        @click="showReportModal = true"
      >
        <i class="bi bi-exclamation-circle-fill" aria-hidden="true"></i>
      </button>
      <button type="button" class="menu-button" aria-label="Ampliar imagem">
        <i class="bi bi-zoom-in" aria-hidden="true"></i>
      </button>
    </div>

    <DownloadModal
      v-model="showDownloadModal"
      :image="props.image"
      @confirm="handleDownloadConfirm"
    />

    <ShareModal
      v-model="showShareModal"
      :image="props.image"
      @confirm="handleShareConfirm"
    />

    <ReportModal
      v-model="showReportModal"
      :image="props.image"
      @submit="handleReportSubmit"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import DownloadModal from "./DownloadModal.vue";
import ReportModal from "./ReportModal.vue";
import ShareModal from "./ShareModal.vue";

const props = defineProps({
  image: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["load", "download", "share", "report-submit"]);

const isHovering = ref(false);
const isTouchDevice = ref(false);
const showDownloadModal = ref(false);
const showReportModal = ref(false);
const showShareModal = ref(false);
const shouldShowMenu = computed(() => isHovering.value || isTouchDevice.value);

const handleMouseEnter = () => {
  isHovering.value = true;
};

const handleMouseLeave = () => {
  isHovering.value = false;
};

const updateDeviceCapabilities = () => {
  if (typeof window === "undefined" || !window.matchMedia) {
    isTouchDevice.value = false;
    return;
  }

  const mediaQueries = [
    window.matchMedia("(hover: none)"),
    window.matchMedia("(pointer: coarse)"),
  ];

  isTouchDevice.value = mediaQueries.some((query) => query.matches);
};

onMounted(() => {
  updateDeviceCapabilities();
  window.addEventListener("resize", updateDeviceCapabilities, {
    passive: true,
  });
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateDeviceCapabilities);
});

const handleDownloadConfirm = (image) => {
  emit("download", image);
};

const handleShareConfirm = (shareData) => {
  emit("share", shareData);
};

const handleReportSubmit = (payload) => {
  emit("report-submit", payload);
};
</script>

<style scoped>
.image-display {
  width: 100%;
  height: 100%;
  max-height: 80vh;
  object-fit: contain;
}
.image-container {
  position: relative;
}

.loading-overlay {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.floating-menu {
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
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(2px);
  z-index: 2;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.floating-menu.is-visible {
  opacity: 1;
  pointer-events: auto;
}

.menu-button {
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

.menu-button:hover {
  background-color: rgba(255, 255, 255, 0.16);
  color: #fff;
}

.menu-button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.6);
}

.menu-button .bi {
  font-size: 1.2rem;
}

.iiif-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}
</style>