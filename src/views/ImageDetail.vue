<template>
  <div class="container py-4">
    <div class="row align-items-start gy-4 image-detail__layout">
      <div class="col-12 col-md-8 order-1 order-md-2">
        <ImageDisplay
          :image="image"
          :loading="loading"
          @load="loading = false"
          @download="handleDownload"
          @share="handleShare"
          @report-submit="handleReportSubmit"
        />
      </div>

      <div class="col-12 order-2 order-md-1">
        <div
          class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3"
        >
          <button
            type="button"
            class="btn btn-link p-0 d-inline-flex align-items-center text-decoration-none back-link"
            @click="goBack"
          >
            <i
              class="bi bi-arrow-left-square back-link__icon"
              aria-hidden="true"
            ></i>
            <span class="back-link__label">Voltar</span>
          </button>
          <ul class="nav nav-underline">
            <li v-for="tab in tabs" :key="tab.section" class="nav-item">
              <RouterLink
                class="nav-link"
                :class="{ active: currentSection === tab.section }"
                :aria-current="
                  currentSection === tab.section ? 'page' : undefined
                "
                :data-label="tab.label"
                :to="{ name: tab.routeName, params: { id: route.params.id } }"
              >
                {{ tab.label }}
              </RouterLink>
            </li>
          </ul>
        </div>
      </div>

      <div class="col-12 col-md-4 order-3 order-md-3">
        <ImageMetadata v-if="currentSection === 'dados'" :image="image" />

        <div v-else-if="currentSection === 'comentarios'">
          <div v-if="loadingComments" class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
          <ImageComments v-else :comments="comments" />
        </div>

        <div v-else class="text-muted small">
          <!--  -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { api } from "@/services/api";
import ImageComments from "@/components/imageDetail/ImageComments.vue";
import ImageDisplay from "@/components/imageDetail/ImageDisplay.vue";
import ImageMetadata from "@/components/imageDetail/ImageMetadata.vue";

defineOptions({ name: "ImageDetail" });

const router = useRouter();
const route = useRoute();
const image = ref(null);
const loading = ref(true);
const comments = ref([]);
const loadingComments = ref(false);

const tabs = [
  {
    label: "Dados",
    section: "dados",
    routeName: "image-detail-dados",
  },
  {
    label: "Comentários",
    section: "comentarios",
    routeName: "image-detail-comentarios",
  },
  {
    label: "Imagens relacionadas",
    section: "relacionadas",
    routeName: "image-detail-relacionadas",
  },
];

const currentSection = computed(() => route.meta?.section ?? "dados");

const loadComments = async (imageId) => {
  loadingComments.value = true;
  try {
    comments.value = await api.getImageComments(imageId);
  } catch (error) {
    console.error("Error loading comments:", error);
  } finally {
    loadingComments.value = false;
  }
};

const goBack = () => {
  router.push({ name: "explore", params: { viewMode: "mosaic" } });
};

const handleDownload = () => {
  console.log("Download clicked", image.value);
  // TODO: implementar lógica de download
};

const handleShare = () => {
  console.log("Share clicked", image.value);
  // TODO: implementar lógica de compartilhamento
};

const handleReportSubmit = (payload) => {
  console.log("Report submitted", payload);
  // TODO: enviar denúncia para a API
};

onMounted(async () => {
  try {
    const imageId = route.params.id;
    image.value = await api.getImageDetails(imageId);
    await loadComments(imageId);
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.back-link {
  gap: 0.5rem;
}

.back-link__icon {
  color: var(--Cinza_M);
}

.back-link__label {
  color: var(--Preto);
  text-decoration: underline;
}

.image-detail__layout {
  --bs-gutter-x: 1.5rem;
}

@media (min-width: 768px) {
  .image-detail__layout {
    --bs-gutter-x: 3rem;
  }
}

@media (max-width: 767.98px) {
  .col-md-4 {
    margin-top: 2rem;
  }
}
</style>
