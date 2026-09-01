<template>
  <div>
    <div class="work-metadata__header">
      <h1 class="h1 work-metadata__title">{{ props.work?.title || "Carregando..." }}</h1>

      <!-- Obra não tem dono: toda edição é sugestão, inclusive de quem contribuiu
           com imagens. Deslogado não vê o botão (o backend exige autenticação). -->
      <button v-if="canSuggest" type="button" class="btn edit-btn" title="Sugerir alterações"
        aria-label="Sugerir alterações nesta obra" data-cy="work-suggest-edit" @click="openSuggestModal">
        <i class="bi bi-pencil-square" aria-hidden="true"></i>
      </button>
    </div>

    <SuggestionEditModal v-model="isSuggestModalOpen"
      text="Você gostaria de complementar as informações sobre essa obra ou sugerir alterações nos dados existentes?"
      @confirm="enterSuggestMode" />

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

    <p class="metadata-map-note">
      Encontrou alguma inconsistência ou tem mais informações sobre essa obra?
      <button v-if="canSuggest" type="button" class="metadata-map-note__link" @click="openSuggestModal">
        Faça uma sugestão
      </button>
      <template v-else>Entre na sua conta para sugerir uma correção</template>.
    </p>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import MapLibreMap from "@/components/map/MapLibreMap.vue";
import SuggestionEditModal from "@/components/ui/SuggestionEditModal.vue";
import { useAuthStore } from "@/store/auth";
import { DEFAULT_VIEW_ROUTE } from "@/constants/viewModes";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { loggedUser } = storeToRefs(authStore);

const props = defineProps({
  work: {
    type: Object,
    default: null,
  },
});

const isSuggestModalOpen = ref(false);
const isSuggesting = computed(() => route.query.suggest === "true");
const canSuggest = computed(() => !!loggedUser.value && !isSuggesting.value);

const openSuggestModal = () => {
  isSuggestModalOpen.value = true;
};

const enterSuggestMode = () => {
  router.push({
    name: "work-detail-sugestoes",
    params: { id: props.work?.id ?? route.params.id },
    query: { suggest: "true" },
  });
};

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

// `renovation` e `demolition` são os tipos que o formulário de obra grava; os
// demais vêm do acervo importado. Sem os dois, apareciam crus em inglês na tela.
const DATE_TYPE_LABELS = {
  creation: "Criação",
  renovation: "Reforma",
  demolition: "Demolição",
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
.work-metadata__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.work-metadata__title {
  margin-bottom: 8px;
}

/* Mesmo botão da página da imagem — 40x40, laranja, ícone de lápis. */
.edit-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: 8px;
  background-color: var(--Laranja_E, #aa4f28);
  color: #fff;
  border: none;

  &:hover {
    background-color: color-mix(in srgb, var(--Laranja_M, #e05f2f) 85%, #000);
    color: #fff;
  }
}

.metadata-map-note {
  margin: 0 0 36px;
  color: #495057;
  font-size: 0.875rem;
  line-height: 1.6;
}

.metadata-map-note__link {
  padding: 0;
  border: none;
  background: none;
  color: var(--Laranja_E, #aa4f28);
  text-decoration: underline;
  font: inherit;
  cursor: pointer;
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
