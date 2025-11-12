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
        <p class="metadata-text">{{ uploaderName }}</p>
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
        {{ props.image?.author || "Desconhecida" }}
      </p>
    </div>

    <div class="metadata-section">
      <h2 class="h5 metadata-title">Data da imagem</h2>
      <p class="metadata-text">{{ formattedDate }}</p>
    </div>

    <div v-if="props.image?.tags?.length" class="metadata-section">
      <h2 class="h5 metadata-title">Tags da imagem</h2>
      <div class="metadata-tags">
        <button
          v-for="tag in props.image.tags"
          :key="tag"
          type="button"
          class="btn btn-outline-primary btn-sm btn-tag"
        >
          {{ tag }}
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
        />
      </div>
    </div>

    <div class="metadata-section metadata-license">
      <h2 class="h5 metadata-title">Permissões de uso da imagem</h2>

      <div class="metadata-license-content">
        <div class="metadata-license-icons" aria-hidden="true">
          <span class="metadata-license-icon">CC</span>
          <span class="metadata-license-icon">BY</span>
        </div>

        <div class="metadata-license-text">
          <p class="metadata-text">
            Esta imagem pode ser copiada, redistribuída e adaptada (o que inclui
            remixar, transformar e criar a partir do material), no entanto, você
            deve dar o crédito apropriado, prover um link para a licença e
            indicar se mudanças foram feitas.
          </p>
          <p class="metadata-text metadata-license-highlight">
            Esta imagem não pode ser utilizada para fins comerciais.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import MapLibreMap from "@/components/map/MapLibreMap.vue";

const props = defineProps({
  image: {
    type: Object,
    default: null,
  },
});

const uploaderName = computed(() => props.image?.uploader?.name ?? null);
const uploaderAvatar = computed(() => props.image?.uploader?.avatar ?? null);
const uploaderInitial = computed(() => {
  if (!uploaderName.value) {
    return "";
  }

  return uploaderName.value.trim().charAt(0).toUpperCase();
});

const formatDateValue = (value) => {
  if (!value) {
    return "Data não disponível";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

const formattedDate = computed(() => formatDateValue(props.image?.date));

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
  height: 240px;

  overflow: hidden;
  background-color: #f1f3f5;
}

.metadata-license {
  border-top: 1px solid #e9ecef;
}

.metadata-license-content {
  display: flex;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.metadata-license-icons {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.metadata-license-text {
  flex: 1 1 220px;
  min-width: 220px;
}

.metadata-license-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f8f9fa;
  border: 1px solid #ced4da;
  font-weight: 600;
  color: #343a40;
  font-size: 0.875rem;
  text-transform: uppercase;
}

.metadata-license-highlight {
  color: #c92a2a;
  font-weight: 600;
  margin-top: 0.75rem;
}

@media (max-width: 575.98px) {
  .metadata-license-content {
    flex-direction: column;
    gap: 1rem;
  }

  .metadata-license-icons {
    margin-bottom: 0;
  }
}
</style>
