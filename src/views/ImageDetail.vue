<template>
  <div class="container-fluid image-detail__container">


    <div class="image-detail__wrapper-content">

      <div class="image-detail__image-box">
        <button type="button" class="back-link" @click="goBack">
          <i class="bi bi-arrow-left back__icon" aria-hidden="true"></i>
          <span class="back-link__label">voltar</span>
        </button>

        <div class="image-detail__image-wrapper" :class="{ 'is-loading': loading }">
          <ImageDisplay :image="image" :license-info="licenseInfo" @load="loading = false" @download="handleDownload"
            @share="handleShare" @report-submit="handleReportSubmit" />
          <!-- <ImageDisplay :image="image" :license-info="licenseInfo" :loading="loading" @load="loading = false"
            @download="handleDownload" @share="handleShare" @report-submit="handleReportSubmit" /> -->

          <div v-if="loading" class="image-detail__loading-overlay">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Carregando...</span>
            </div>
          </div>
        </div>
      </div>

      <div class="image-detail__metadata-box">

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

        <!-- Visualização dos dados -->
        <ImageMetadata v-if="currentSection === 'dados' && !isEditing" :image="image" :license-info="licenseInfo" />

        <!-- Edição dos dados -->
        <ImageMetadataEdit v-else-if="currentSection === 'dados' && isEditing" :image="image"
          @updated="fetchImageData" />

        <!-- Comentários -->
        <div v-else-if="currentSection === 'comentarios'">
          <div v-if="loadingComments" class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
          <ImageComments :image-url="image?.imageUrl" />
        </div>

        <!-- Dono gerencia as pendencias -->
        <ImageSuggestion v-else-if="currentSection === 'sugestoes' && isOwner" :image="image"
          @updated="fetchImageData" />

        <!-- Não-dono em modo sugestão (formulário) -->
        <ImageSuggestionEdit v-else-if="currentSection === 'sugestoes' && !isOwner && isSuggesting" :image="image"
          @submitted="fetchImageData" />

        <!-- Não-dono visualizando histórico  -->
        <ImageSuggestionView v-else-if="currentSection === 'sugestoes' && !isOwner && !isSuggesting" :image="image" />

        <ImageInterpretations v-else-if="currentSection === 'interpretacoes'" @submit="handleSpecSubmit"
          :image-id="image?.id" />

        <!-- <div v-else class="text-muted small">
          
        </div> -->
      </div>
    </div>

    <div class="image-detail__related-box">
      <ImageRelated v-if="image?.id" :image-id="image.id" />
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import { storeToRefs } from "pinia";
import { findLicenseByUrl } from "@/constants/creativeCommonsLicenses";
import ImageComments from "@/components/imageDetail/ImageComments.vue";
import ImageDisplay from "@/components/imageDetail/ImageDisplay.vue";
import ImageMetadata from "@/components/imageDetail/ImageMetadata.vue";
import ImageMetadataEdit from "@/components/imageDetail/ImageMetadataEdit.vue";
import ImageSuggestion from "@/components/imageDetail/ImageSuggestion.vue";
import ImageSuggestionEdit from "../components/imageDetail/ImageSuggestionEdit.vue";
import ImageSuggestionView from "../components/imageDetail/ImageSuggestionView.vue";
import ImageInterpretations from "@/components/imageDetail/ImageInterpretations.vue";
import ImageRelated from "@/components/imageDetail/ImageRelated.vue";

defineOptions({ name: "ImageDetail" });

const router = useRouter();
const route = useRoute();
const image = ref(null);
const loading = ref(true);
// const comments = ref([]);
const loadingComments = ref(false);
const authStore = useAuthStore();
const { loggedUser } = storeToRefs(authStore);


const desktopQuery = window.matchMedia("(min-width: 768px)");
const isDesktop = ref(desktopQuery.matches);
const handleDesktopChange = (e) => {
  isDesktop.value = e.matches;
};

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
    label: "Interpretações",
    section: "interpretacoes",
    routeName: "image-detail-interpretacoes",
  },
  {
    label: "Sugestões",
    section: "sugestoes",
    routeName: "image-detail-sugestoes",
  }
];

const isOwner = computed(() => {
  return loggedUser.value?.id === image.value?.uploader?.id;
});
const isLoggedIn = computed(() => !!loggedUser.value);
const isEditing = computed(
  () => route.query.edit === "true" && isOwner.value);
const isSuggesting = computed(
  () => route.query.suggest === "true" && isLoggedIn.value && !isOwner.value
);

const currentSection = computed(() => route.meta?.section ?? "dados");

const licenseInfo = computed(() => {
  const rightsUrl = image.value?.rights?.[0]?.href;
  if (!rightsUrl) return null;
  return findLicenseByUrl(rightsUrl);
});

// ─── Data ─────────────────────────────────────────────────────────────────────
const fetchImageData = async () => {
  try {
    loading.value = true;
    image.value = await api.getImageDetails(route.params.id);
  } catch (error) {
    console.error("Erro ao carregar imagem:", error);
  } finally {
    loading.value = false;
  }
};

watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      fetchImageData();
    }
  }
);

// ─── Handlers ─────────────────────────────────────────────────────────────────
const goBack = () => router.back();
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


// const loadComments = async (imageId) => {
//   loadingComments.value = true;
//   try {
//     comments.value = await api.getImageComments(imageId);
//   } catch (error) {
//     console.error("Error loading comments:", error);
//   } finally {
//     loadingComments.value = false;
//   }
// };

onMounted(async () => {
  desktopQuery.addEventListener("change", handleDesktopChange);
  await fetchImageData();
});
onBeforeUnmount(() => {
  desktopQuery.removeEventListener("change", handleDesktopChange);
});
</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-sm: 768px;
$breakpoint-md: 1024px;
$breakpoint-lg: 1440px;


@mixin sm {
  @media (min-width: #{$breakpoint-sm}) {
    @content;
  }
}

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

@mixin lg {
  @media (min-width: #{$breakpoint-lg}) {
    @content;
  }
}

.image-detail__container {
  // box-sizing: border-box;
  width: 100%;

  @include sm {
    padding: 24px 50px;
  }
}

.image-detail__wrapper-content {
  display: flex;
  flex-direction: column;
  gap: 1.875rem;

  @include md {
    flex-direction: row;
    justify-content: center;
  }
}

.image-detail__image-box {
  width: 100%;

  .back-link {
    width: 87px;
    height: 25px;
    background-color: var(--Off_white);
    border: 1px solid var(--Cinza_E);
    border-radius: 5px;
    padding: 2px 14px;
    gap: .4375rem;
    margin-bottom: 16px;
    display: flex;
    align-items: center;

    &:hover {
      background-color: var(--Branco);
    }

    & .bi {
      font-size: .875rem;
    }

    &__label {
      font-weight: 400;
      font-size: .875rem;
      line-height: 150%;
    }
  }

  @include md {
    width: 100%;
    max-width: 807px;
    position: sticky;
    top: 20px;
    align-self: flex-start;
  }
}

.image-detail__image-wrapper {
  position: relative;

  :deep(img) {
    transition: opacity 0.25s ease;
  }

  &.is-loading :deep(img) {
    opacity: 0.4;
  }
}

.image-detail__loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

.image-detail__metadata-box {
  width: 100%;

  @include md {
    max-width: 576px;
  }
}

.image-detail__related-box {
  grid-area: related;
  width: 100%;
  // Evita que a remontagem assíncrona do mosaico de relacionadas ancore o
  // scroll do navegador na posição do card clicado ao trocar de imagem.
  overflow-anchor: none;
}

.image-detail__navbar {
  margin-bottom: 16px;

  @include md {
    margin-bottom: 28px;
  }
}

/* Em telas pequenas, fonte 14px e espaçamento de 12px; em telas grandes (≥1425px), aumenta para 20px e gap de 40px */
$breakpoint-desk: 1425px;

.image-detail__navbar-links {
  z-index: auto;
  gap: 12px;
  display: flex;
  flex-wrap: nowrap;
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  scrollbar-width: thin;
  scrollbar-color: #d1d5db transparent;

  @media (min-width: #{$breakpoint-desk}) {
    gap: 40px;
  }

  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }
}
</style>