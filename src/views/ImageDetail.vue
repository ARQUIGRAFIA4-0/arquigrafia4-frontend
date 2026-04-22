<template>
  <div class="container-fluid image-detail__container">
    <!-- Image -->
    <div class="row align-items-start gy-4 image-detail__layout">
      <div class="col-12 col-md-7 image-detail__image-box">
        <button type="button" class="btn btn-link p-0 d-inline-flex align-items-center text-decoration-none back-link"
          @click="goBack">
          <i class="bi bi-arrow-left-square back-link__icon" aria-hidden="true"></i>
          <span class="back-link__label">Voltar</span>
        </button>
        <ImageDisplay :image="image" :license-info="licenseInfo" :loading="loading" @load="loading = false"
          @download="handleDownload" @share="handleShare" @report-submit="handleReportSubmit" />
      </div>

      <!-- Metadata -->
      <div class="col-12 col-md-5">
        <div class="col-12 image-detail__navbar">
          <div
            class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-4">
            <ul class="nav nav-underline image-detail__navbar-links">
              <li v-for="tab in tabs" :key="tab.section" class="nav-item">
                <RouterLink class="nav-link" :class="{ active: currentSection === tab.section }" :aria-current="currentSection === tab.section ? 'page' : undefined
                  " :data-label="tab.label" :to="{ name: tab.routeName, params: { id: route.params.id } }">
                  {{ tab.label }}
                </RouterLink>
              </li>
            </ul>
          </div>
        </div>

        <ImageMetadata v-if="currentSection === 'dados'" :image="image" :license-info="licenseInfo" />

        <div v-else-if="currentSection === 'comentarios'">
          <div v-if="loadingComments" class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
          <ImageComments />
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
import { findLicenseByUrl } from "@/constants/creativeCommonsLicenses";
import ImageComments from "@/components/imageDetail/ImageComments.vue";
import ImageDisplay from "@/components/imageDetail/ImageDisplay.vue";
import ImageMetadata from "@/components/imageDetail/ImageMetadata.vue";

defineOptions({ name: "ImageDetail" });

const router = useRouter();
const route = useRoute();
const image = ref(null);
const loading = ref(true);


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
  // {
  //   label: "Imagens relacionadas",
  //   section: "relacionadas",
  //   routeName: "image-detail-relacionadas",
  // },
];

const currentSection = computed(() => route.meta?.section ?? "dados");

const licenseInfo = computed(() => {
  const rightsUrl = image.value?.rights?.[0]?.href;
  if (!rightsUrl) return null;
  return findLicenseByUrl(rightsUrl);
});

const goBack = () => {
  router.push("/explore/acervo/mosaic");
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
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    loading.value = false;
  }
});
</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.image-detail__container {
  @include md {
    padding: 24px 50px;
  }
}

.back-link {
  gap: 0.5rem;
  margin-bottom: 16px;
}

.back-link__icon {
  color: var(--Cinza_M);
}

.back-link__label {
  color: var(--Preto);
  text-decoration: underline;
}

.image-detail__navbar {
  margin-bottom: 16px;

  @include md {
    margin-bottom: 28px;
  }
}

.image-detail__navbar-links {
  z-index: auto;
  gap: 40px;
  display: flex;
  flex-wrap: nowrap;
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  scrollbar-width: thin;
}

.image-detail__navbar-links::-webkit-scrollbar {
  height: 6px;
}

.image-detail__navbar-links::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}

.image-detail__navbar-links::-webkit-scrollbar-track {
  background: transparent;
}

/* Firefox */
.image-detail__navbar-links {
  scrollbar-color: #d1d5db transparent;
  scrollbar-width: thin;
}

.image-detail__layout {
  --bs-gutter-x: 1.5rem;
}

.image-detail__image-box {
  @include md {
    position: sticky;
    top: 20px;
    align-self: flex-start;
  }
}

@media (max-width: 767.98px) {
  .col-md-4 {
    margin-top: 2rem;
  }
}
</style>
