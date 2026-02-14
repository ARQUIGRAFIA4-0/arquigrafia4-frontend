<template>
  <div>
    <h1 class="h1 mb-4">{{ props.image?.title || "Carregando..." }}</h1>

    <div v-if="uploaderName" class="metadata-section">
      <h2 class="h5 metadata-title">Imagem enviada por</h2>
      <div class="metadata-person">
        <div v-if="uploaderAvatar" class="metadata-person-avatar">
          <img :src="uploaderAvatar" :alt="`Foto de ${uploaderName}`" />
        </div>
        <div
          v-else
          class="metadata-person-avatar metadata-person-avatar--placeholder"
        >
          <span>{{ uploaderInitial }}</span>
        </div>
        <RouterLink 
          v-if="uploaderUserId"
          :to="`/profile/${uploaderUserId}`"
          class="metadata-uploader-link"
        >
          {{ uploaderName }}
        </RouterLink>
        <p v-else class="metadata-text">{{ uploaderName }}</p>
      </div>
    </div>

    <div class="metadata-section">
      <h2 class="h5 metadata-title">Descrição</h2>
      <p class="metadata-text">
        {{ props.image?.description || "Sem descrição disponível." }}
      </p>
    </div>

    <div class="metadata-section">
      <h2 class="h5 metadata-title">Autoria da imagem</h2>
      <p class="metadata-text">
        {{ authorsText }}
      </p>
    </div>

    <div class="metadata-section">
      <h2 class="h5 metadata-title">Data da imagem</h2>
      <p class="metadata-text">{{ props.image?.date || "Data não disponível" }}</p>
    </div>

    <div v-if="props.image?.subjects?.length" class="metadata-section">
      <h2 class="h5 metadata-title">Tags da imagem</h2>
      <div class="metadata-tags">
        <button
          v-for="subject in props.image.subjects"
          :key="subject.id"
          type="button"
          class="btn btn-outline-primary btn-sm btn-tag"
        >
          {{ subject.term }}
        </button>
      </div>
    </div>

    <div class="metadata-section" v-if="showMap">
      <h2 class="h5 metadata-title">Localização</h2>
      <div class="metadata-map">
        <MapLibreMap
          :style-url="mapStyleUrl"
          :center="resolvedMapCenter"
          :zoom="mapZoom"
          :marker-position="markerPosition"
          marker-color="#0F89E1"
        />
      </div>
    </div>

    <div v-if="licenseInfo" class="metadata-section metadata-license">
      <h2 class="h5 metadata-title">Permissões de uso da imagem</h2>

      <div class="metadata-license-content">
        <div class="metadata-license-image">
          <img
            :src="licenseImageUrl"
            :alt="`Licença Creative Commons ${licenseInfo.label}`"
            class="license-img"
          />
        </div>

        <div class="metadata-license-text">
          <p class="metadata-text" v-html="licenseText"></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { RouterLink } from "vue-router";
import MapLibreMap from "@/components/map/MapLibreMap.vue";
import { findLicenseByUrl } from "@/constants/creativeCommonsLicenses";

const props = defineProps({
  image: {
    type: Object,
    default: null,
  },
});

const uploaderName = computed(() => props.image?.uploader?.name ?? null);
const uploaderAvatar = computed(() => props.image?.uploader?.avatar ?? null);
const uploaderUserId = computed(() => props.image?.uploader?.id ?? null);
const uploaderInitial = computed(() => {
  if (!uploaderName.value) {
    return "";
  }

  return uploaderName.value.trim().charAt(0).toUpperCase();
});

const authorsText = computed(() => {
  const authors = props.image?.authors;
  
  if (!Array.isArray(authors) || authors.length === 0) {
    return "Desconhecida";
  }
  
  return authors.join(", ");
});

const licenseInfo = computed(() => {
  const rightsUrl = props.image?.rights?.[0]?.href;
  
  if (!rightsUrl) return null;
  
  return findLicenseByUrl(rightsUrl);
});

const licenseImageUrl = computed(() => {
  if (!licenseInfo.value?.image) return null;
  
  return new URL(`../../assets/${licenseInfo.value.image}`, import.meta.url).href;
});

const licenseText = computed(() => {
  return licenseInfo.value?.text || "Informações sobre a licença não disponíveis.";
});

const DEFAULT_CENTER = [-46.633309, -23.55052];
const mapStyleUrl = "https://tiles.openfreemap.org/styles/positron";
const mapZoom = 14;

const mapCenter = computed(() => {
  const coordinates = props.image?.locationCoordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return null;
  }

  const [lat, lng] = coordinates;
  if (typeof lat !== "number" || typeof lng !== "number") {
    return null;
  }

  return [lng, lat];
});

const resolvedMapCenter = computed(() => mapCenter.value ?? DEFAULT_CENTER);
const showMap = computed(() => Boolean(mapCenter.value));

const markerPosition = computed(() => {
  const center = mapCenter.value;
  if (!center) {
    return null;
  }

  const [lng, lat] = center;
  return { lng, lat };
});
</script>

<style scoped>
.metadata-section {
  padding: 1rem 0;
}

.metadata-title {
  margin-bottom: 1rem;
  color: #343a40;
}

.metadata-text {
  margin: 0;
  color: #495057;
  line-height: 1.6;
}

.metadata-person {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.metadata-person-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #495057;
  font-weight: 600;
  text-transform: uppercase;
}

.metadata-person-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.metadata-person-avatar--placeholder {
  border: 1px solid #ced4da;
}

.metadata-uploader-link {
  color: #495057;
  text-decoration: none;
  line-height: 1.6;
  margin: 0;
  cursor: pointer;
  transition: text-decoration 0.2s ease;
}

.metadata-uploader-link:hover {
  text-decoration: underline;
  color: #343a40;
}

.metadata-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.metadata-tags .btn-tag {
  min-height: 36px;
}

.metadata-map {
  position: relative;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background-color: #f1f3f5;
  margin-bottom: 36px;
}

.metadata-license-content {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  align-items: center;
}

.metadata-license-image {
  display: flex;
  align-items: flex-start;
}

.license-img {
  max-height: 120px;
  width: auto;
  display: block;
}

.metadata-license-text {
  flex: 1 1 220px;
  min-width: 220px;
}

@media (max-width: 575.98px) {
  .metadata-license-content {
    flex-direction: column;
    gap: 1rem;
  }

  .metadata-license-image {
    margin-bottom: 0;
  }
}
</style>
