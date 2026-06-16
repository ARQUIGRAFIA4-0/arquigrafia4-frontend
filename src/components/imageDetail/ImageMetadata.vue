<template>
  <div>
    <div class="d-flex align-items-start justify-content-between mb-4">
      <h1 class="h1 mb-4">{{ props.image?.title || "Carregando..." }}</h1>
      <button v-if="canEdit" type="button" class="btn edit-btn" title="Editar informações"
        aria-label="Editar informações da imagem" @click="enterEditMode">
        <i class="bi bi-pencil-square" aria-hidden="true"></i>
      </button>
    </div>

    <div v-if="displayName" class="metadata-section">
      <h2 class="h5 metadata-title">Imagem enviada por</h2>
      <div class="metadata-person">
        <div v-if="displayAvatar" class="metadata-person-avatar">
          <img :src="displayAvatar" :alt="`Foto de ${displayName}`" />
        </div>
        <div v-else class="metadata-person-avatar metadata-person-avatar--placeholder">
          <span>{{ displayInitial }}</span>
        </div>
        <RouterLink v-if="collectiveId" :to="`/coletivos/${collectiveId}`" class="metadata-uploader-link">
          {{ displayName }}
        </RouterLink>
        <RouterLink v-else-if="uploaderUserId" :to="`/profile/${uploaderUserId}`" class="metadata-uploader-link">
          {{ displayName }}
        </RouterLink>
        <p v-else class="metadata-text">{{ displayName }}</p>
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
        <button v-for="subject in props.image.subjects" :key="subject.id" type="button"
          class="btn btn-outline-primary btn-sm btn-tag" @click="searchBySubject(subject)">
          {{ subject.term }}
        </button>
      </div>
    </div>

    <div class="metadata-section" v-if="showMap">
      <h2 class="h5 metadata-title">Localização</h2>
      <div class="metadata-map">
        <MapLibreMap :style-url="mapStyleUrl" :center="resolvedMapCenter" :zoom="mapZoom"
          :marker-position="markerPosition" marker-color="#0F89E1" />
      </div>
    </div>

    <LicenseInfoBlock v-if="props.licenseInfo" :license-info="props.licenseInfo" />
  </div>
</template>

<script setup>
import { computed } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import MapLibreMap from "@/components/map/MapLibreMap.vue";
import LicenseInfoBlock from "@/components/imageDetail/LicenseInfoBlock.vue";
import { DEFAULT_VIEW_ROUTE } from "@/constants/viewModes";
import { useAuthStore } from "@/store/auth";
import { storeToRefs } from "pinia";


const authStore = useAuthStore();
const { loggedUser } = storeToRefs(authStore);

const route = useRoute();
const router = useRouter();

const props = defineProps({
  image: {
    type: Object,
    default: null,
  },
  /** Resolvido no pai (`ImageDetail`) a partir de `image.rights` */
  licenseInfo: {
    type: Object,
    default: null,
  },
});

const isOwner = computed(() => {
  return loggedUser.value?.id === props.image?.uploader?.id;
});

const isEditing = computed(() => route.query.edit === "true");

const canEdit = computed(() => {
  return isOwner.value && !isEditing.value;
});

function enterEditMode() {
  router.push({
    query: {
      ...route.query,
      edit: "true",
    },
  });
}

function searchBySubject(subject) {
  const rawSubjects = route.query['subject[]'];
  const existing = rawSubjects
    ? Array.isArray(rawSubjects) ? rawSubjects : [rawSubjects]
    : [];
  const updated = existing.includes(subject.id) ? existing : [...existing, subject.id];
  router.push({
    name: "explore",
    params: { viewMode: DEFAULT_VIEW_ROUTE },
    query: { ...route.query, 'subject[]': updated.length === 1 ? updated[0] : updated },
  });
}

const collectiveId = computed(() => props.image?.collective?.id ?? null);
const uploaderUserId = computed(() => props.image?.uploader?.id ?? null);
const displayName = computed(() =>
  props.image?.collective?.name ?? props.image?.uploader?.name ?? null
);
const API_BASE_URL = import.meta.env.VITE_BASE_REQUEST_URL;
const displayAvatar = computed(() => {
  const entity = props.image?.collective ?? props.image?.uploader;
  const path = entity?.avatar_path;
  return path ? `${API_BASE_URL}/storage/${path}` : null;
});

const displayInitial = computed(() =>
  displayName.value?.trim().charAt(0).toUpperCase() ?? ""
);

const authorsText = computed(() => {
  const authors = props.image?.authors;
  if (!Array.isArray(authors) || authors.length === 0) return "Desconhecida";
  return authors.join(", ");
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
  if (isNaN(lat) || isNaN(lng)) {
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

<style lang="scss" scoped>
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
  cursor: pointer;
}

.metadata-map {
  position: relative;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background-color: #f1f3f5;
  margin-bottom: 36px;
}

.edit-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: var(--Laranja_E);
  color: #fff;
  border: none;
  transition: background-color 0.18s ease, transform 0.12s ease, box-shadow 0.18s ease;

  .bi {
    font-size: 1rem;
    line-height: 1;
  }

  &:hover {
    background-color: color-mix(in srgb, var(--Laranja_M, #e05f2f) 85%, #000);
    color: #fff;
  }

  &:focus-visible {
    outline: none;
  }
}
</style>
