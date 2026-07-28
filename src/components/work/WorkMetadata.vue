<template>
  <div>
    <h1 class="h1 work-metadata__title">{{ props.work?.title || "Carregando..." }}</h1>

    <!-- Títulos alternativos logo abaixo do título, separados por um quadrado laranja.
         O separador é interposto, então nunca aparece antes do primeiro título. -->
    <p v-if="otherTitles.length" class="work-metadata__alt-titles">
      <template v-for="(title, index) in otherTitles" :key="title.key">
        <span v-if="index > 0" class="work-metadata__alt-separator" aria-hidden="true"></span>
        <span class="work-metadata__alt-title">{{ title.label }}</span>
      </template>
    </p>

    <!-- `description` ainda não existe na API (migration pendente no backend). -->
    <div class="metadata-section">
      <h2 class="h5 metadata-title">Descrição</h2>
      <p class="metadata-text">
        {{ props.work?.description || "Sem descrição disponível." }}
      </p>
    </div>

    <div class="metadata-section">
      <h2 class="h5 metadata-title">Autoria da obra</h2>
      <p v-if="!agents.length" class="metadata-text">Desconhecida</p>
      <p v-for="agent in agents" :key="agent.id" class="metadata-text mb-2">
        {{ agent.name }}
        <span v-if="agent.detail" class="metadata-detail">{{ agent.detail }}</span>
      </p>
    </div>

    <div class="metadata-section">
      <h2 class="h5 metadata-title">Datas</h2>
      <p v-if="!dates.length" class="metadata-text">Data não disponível</p>
      <p v-for="date in dates" :key="date.id" class="metadata-text mb-2">
        <span v-if="date.typeLabel" class="metadata-detail">{{ date.typeLabel }}: </span>{{ date.range }}
      </p>
    </div>

    <div v-if="props.work?.location?.label" class="metadata-section">
      <h2 class="h5 metadata-title">Endereço</h2>
      <p class="metadata-text">{{ props.work.location.label }}</p>
    </div>

    <!-- Vocabulários VRAC: só renderizam quando a obra tem termos. -->
    <div v-for="group in vocabGroups" :key="group.key" class="metadata-section">
      <h2 class="h5 metadata-title">{{ group.label }}</h2>
      <div class="metadata-tags">
        <span v-for="term in group.terms" :key="term.id" class="work-tag">
          {{ term.label }}
        </span>
      </div>
    </div>

    <div v-if="subjects.length" class="metadata-section">
      <h2 class="h5 metadata-title">Assuntos</h2>
      <div class="metadata-tags">
        <button v-for="subject in subjects" :key="subject.id" type="button"
          class="work-tag" @click="searchBySubject(subject)">
          {{ subject.label }}
        </button>
      </div>
    </div>

    <div v-if="showMap" class="metadata-section">
      <h2 class="h5 metadata-title">Localização</h2>
      <div class="metadata-map">
        <MapLibreMap :style-url="mapStyleUrl" :center="mapCenter" :zoom="mapZoom" :marker-position="markerPosition"
          marker-color="#2F2F2F" marker-variant="building" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import MapLibreMap from "@/components/map/MapLibreMap.vue";
import { DEFAULT_VIEW_ROUTE } from "@/constants/viewModes";

const route = useRoute();
const router = useRouter();

const props = defineProps({
  work: {
    type: Object,
    default: null,
  },
});

const otherTitles = computed(() =>
  (props.work?.titles || [])
    .filter((title) => title.label && title.label !== props.work?.title)
    .map((title, index) => ({ key: `${title.label}-${index}`, label: title.label }))
);

// Papéis vêm de vocabulário livre (há inconsistência de caixa/número no acervo),
// então só normalizamos a exibição — nunca comparamos por string.
const agents = computed(() =>
  (props.work?.agents || [])
    .filter((agent) => agent.name)
    .map((agent) => {
      const parts = [agent.role, agent.attribution].filter(Boolean);
      return {
        id: agent.id,
        name: agent.name,
        detail: parts.length ? `(${parts.join(", ")})` : null,
      };
    })
);

const DATE_TYPE_LABELS = {
  creation: "Criação",
  design: "Projeto",
  alteration: "Alteração",
  destruction: "Destruição",
  restoration: "Restauro",
};

// Mesma formatação de VRACDate::formattedDateRange() no backend: "c. 1951-1966".
const dates = computed(() =>
  (props.work?.dates || [])
    .filter((date) => date.earliestYear || date.latestYear)
    .map((date) => {
      const { earliestYear, latestYear } = date;
      const span =
        earliestYear && latestYear && earliestYear !== latestYear
          ? `${earliestYear}-${latestYear}`
          : earliestYear || latestYear;
      return {
        id: date.id,
        typeLabel: date.type ? DATE_TYPE_LABELS[date.type] || date.type : null,
        range: `${date.circa ? "c. " : ""}${span}`,
      };
    })
);

const vocabGroups = computed(() =>
  [
    { key: "workTypes", label: "Tipo de obra", terms: props.work?.workTypes },
    { key: "stylePeriods", label: "Período/estilo", terms: props.work?.stylePeriods },
    { key: "culturalContexts", label: "Contexto cultural", terms: props.work?.culturalContexts },
    { key: "materials", label: "Materiais", terms: props.work?.materials },
    { key: "techniques", label: "Técnicas", terms: props.work?.techniques },
  ].filter((group) => group.terms?.length)
);

const subjects = computed(() => props.work?.subjects || []);

// Assuntos da obra levam à busca do acervo, como as tags da imagem.
function searchBySubject(subject) {
  const rawSubjects = route.query["subject[]"];
  const existing = rawSubjects
    ? Array.isArray(rawSubjects) ? rawSubjects : [rawSubjects]
    : [];
  const updated = existing.includes(subject.id) ? existing : [...existing, subject.id];
  router.push({
    name: "explore",
    params: { viewMode: DEFAULT_VIEW_ROUTE },
    query: { ...route.query, "subject[]": updated.length === 1 ? updated[0] : updated },
  });
}

const mapStyleUrl = "https://tiles.openfreemap.org/styles/positron";
const mapZoom = 14;

const mapCenter = computed(() => {
  const location = props.work?.location;
  if (!location) return null;
  const { latitude, longitude } = location;
  if (typeof latitude !== "number" || typeof longitude !== "number") return null;
  if (isNaN(latitude) || isNaN(longitude)) return null;
  return [longitude, latitude];
});

const showMap = computed(() => Boolean(mapCenter.value));

const markerPosition = computed(() => {
  const center = mapCenter.value;
  if (!center) return null;
  const [lng, lat] = center;
  return { lng, lat };
});
</script>

<style lang="scss" scoped>
.work-metadata__title {
  margin-bottom: 8px;
}

.work-metadata__alt-titles {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.work-metadata__alt-title {
  color: var(--Cinza_M, #636262);
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 150%;
}

.work-metadata__alt-separator {
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  background: var(--Laranja_E, #aa4f28);
}

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

.metadata-detail {
  color: #6c757d;
  font-size: 0.875rem;
}

.metadata-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.work-tag {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  padding: 0 0.75rem;
  border: 1px solid var(--Laranja_E, #aa4f28);
  border-radius: 2px;
  background-color: var(--Laranja_E, #aa4f28);
  color: #fff;
  font-family: inherit;
  font-size: 0.875rem;
  line-height: 1.6;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.work-tag:hover {
  background-color: #fff;
  color: var(--Laranja_E, #aa4f28);
}

button.work-tag {
  cursor: pointer;
}

.metadata-map {
  position: relative;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background-color: #f1f3f5;
  margin-bottom: 36px;
}
</style>
