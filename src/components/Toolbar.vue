<template>
  <div id="toolbar" class="toolbar-acervo">
    <!-- Modo: Adicionar à coleção -->
    <div
      v-if="isAddToCollectionMode"
      class="toolbar-acervo__panel toolbar-acervo__panel--collection"
    >
      <button
        type="button"
        class="toolbar-acervo__icon-btn"
        aria-label="Fechar modo adicionar à coleção"
        title="Fechar"
        @click="closeAddToCollectionMode"
      >
        <img
          src="@/assets/icons/toolbar-close.svg"
          alt=""
          width="25"
          height="25"
          class="toolbar-acervo__icon-btn-image"
        />
      </button>

      <button
        type="button"
        class="toolbar-acervo__collection-inner"
        aria-label="Adicionar à coleção"
        title="Adicionar à coleção"
        @click="confirmAddToCollection"
      >
        <img
          src="@/assets/icons/toolbar-gallery.svg"
          alt=""
          width="24"
          height="24"
          class="toolbar-acervo__gallery-icon"
        />

        <span class="toolbar-acervo__collection-label">
          Adicionar à coleção
        </span>

        <span
          class="toolbar-acervo__collection-arrow"
          aria-hidden="true"
        ></span>
      </button>
    </div>

    <!-- Modo normal -->
    <template v-else>
    <div id="view-mode-container" class="toolbar-acervo__panel d-flex align-items-center gap-2">
      <div class="dropdown dropup">
        <button id="view-mode-dropdown" class="btn btn-icon dropdown-toggle caret-right" type="button"
          data-bs-toggle="dropdown" data-bs-offset="0,16" aria-expanded="false">
          <i :class="['bi', viewIconClass]" />
        </button>
        <ul class="dropdown-menu menu-dark mt-3">
          <li v-for="option in viewOptionsList" :key="option.selection">
            <button class="dropdown-item" :class="{ active: currentViewSelection === option.selection }"
              @click="setViewMode(option.mode, option.selection)">
              <i :class="['bi', selectionToViewIcon(option.selection), 'me-2']" />
              {{ option.label }}
            </button>
          </li>
        </ul>
      </div>
      <span v-if="currentViewSubcontrol" class="toolbar-divider" aria-hidden="true" />
      <button v-if="currentViewSubcontrol" :class="[
        'btn btn-icon btn-subcontrol',
        { active: isMapSubcontrolActive },
      ]" type="button" :title="currentViewSubcontrol.label" :aria-label="currentViewSubcontrol.label"
        :aria-pressed="isMapSubcontrolActive" @click="onViewSubcontrol">
        <i :class="['bi', currentViewSubcontrol.icon]" />
      </button>
    </div>
    <div id="search-mode-container" class="toolbar-acervo__panel toolbar-acervo__panel--search d-flex align-items-center gap-3 flex-fill">
      <div class="dropdown dropup">
        <button id="search-mode-dropdown" class="btn btn-icon dropdown-toggle caret-right pe-2" type="button"
          data-bs-toggle="dropdown" data-bs-offset="0,16" aria-expanded="false" :disabled="hasActiveUrlFilter"
          :title="hasActiveUrlFilter ? 'Remova o filtro de busca para alterar o modo' : ''">
          <span class="search-icon-wrapper">
            <i :class="['bi', searchIconClass]" />
            <span v-if="hasActiveUrlFilter" class="search-active-dot" />
          </span>
        </button>
        <ul class="dropdown-menu menu-dark mt-3">
          <li v-for="option in searchOptionsList" :key="option.mode">
            <button class="dropdown-item" :class="{ active: effectiveSearchMode === option.mode }"
              :disabled="option.mode === 'cor'" @click="option.mode !== 'cor' && setSearchMode(option.mode)">
              <i :class="['bi', getSearchIcon(option.mode), 'me-2']" />
              {{ option.label }}
            </button>
          </li>
        </ul>
      </div>

      <!-- Estado avançado derivado da URL (2+ tipos de filtro) -->
      <template v-if="isAdvancedByUrl">
        <span class="toolbar__advanced-label text-preto text-nowrap small">Busca avançada ativa</span>
        <button class="btn btn-sm btn-outline-secondary btn-icon btn-clear-search" type="button" title="Limpar todos os filtros"
          aria-label="Limpar todos os filtros" @click="emit('clear-all-filters')">
          <i class="bi bi-x-lg" style="font-size: 0.75rem;" />
          Limpar
        </button>
        <button class="btn btn-sm btn-secondary btn-icon btn-edit-search" type="button" title="Editar busca avançada"
          aria-label="Editar busca avançada" @click="emit('open-advanced-search')">
          <i class="bi bi-pencil-square" style="font-size: 0.75rem;" />
          Editar
        </button>
      </template>

      <!-- Chips de URL (visíveis quando NÃO em modo avançado derivado) -->
      <div v-else-if="urlChips.length > 0" class="d-flex align-items-center flex-wrap gap-2">
        <button v-for="chip in urlChips" :key="chip.uid" class="btn btn-primary btn-sm btn-tag" type="button">
          <span v-if="chip.label === null" class="spinner-border spinner-border-sm" role="status"
            aria-label="Carregando..." />
          <template v-else>{{ chip.label }}</template>
          <button type="button" class="btn-close ms-1" aria-label="Remover filtro"
            @click.stop="emit('remove-url-chip', chip)" />
        </button>
      </div>

      <!-- Área de entrada da busca -->
      <div class="d-flex align-items-center flex-grow-1">
        <!-- Textual (padrão visível) -->
        <div class="w-100" id="search-input-textual" v-show="currentSearchMode === 'textual' && !hasActiveUrlFilter">
          <input type="text" class="form-control" placeholder="Digite o termo de busca" v-model="textModel"
            @keydown.enter="onConfirm" />
        </div>

        <!-- Avançada -->
        <div class="w-100" id="search-input-avancada" v-show="currentSearchMode === 'avancada'">
          <div class="advanced-filters-container d-flex align-items-center flex-wrap gap-2">
            <template v-if="hasAdvancedFilters">
              <button v-for="chip in visibleAdvancedChips" :key="chip.uid" class="btn btn-info btn-sm btn-tag"
                type="button">
                {{ chip.label }}
                <button type="button" class="btn-close ms-1" aria-label="Remover filtro"
                  @click.stop="emit('remove-chip', chip)" />
              </button>
              <button v-if="advancedChipsOverflow > 0" key="advanced-chips-overflow" class="btn btn-info btn-sm btn-tag"
                type="button">
                +{{ advancedChipsOverflow }}
              </button>
            </template>
          </div>
        </div>

        <!-- Data -->
        <div class="w-100" id="search-input-data" v-show="currentSearchMode === 'data' && !hasActiveUrlFilter">
          <div class="d-flex align-items-center gap-2">
            <span class="text-preto">De</span>
            <input type="number" class="form-control" style="width: 6rem;" v-model="startDateModel" placeholder="1960"
              :min="MIN_YEAR" :max="CURRENT_YEAR"
              @keydown="onYearKeydown" @input="onYearInput('start')"
              @blur="emitDateRange" @keydown.enter="emitDateRange(); onConfirm()" />
            <span class="text-preto">a</span>
            <input type="number" class="form-control" style="width: 6rem;" v-model="endDateModel" placeholder="1973"
              :min="MIN_YEAR" :max="CURRENT_YEAR"
              @keydown="onYearKeydown" @input="onYearInput('end')"
              @blur="emitDateRange" @keydown.enter="emitDateRange(); onConfirm()" />
          </div>
        </div>

        <!-- Cor -->
        <div class="w-100" id="search-input-cor" v-show="currentSearchMode === 'cor'">
          <div class="d-flex align-items-center gap-2">
            <input type="range" class="form-range form-range-sm form-range-hue w-100" style="min-width: 250px" min="0"
              max="360" v-model="hue" :style="{ '--hue': hue }" @input="onHueInput" />
          </div>
        </div>
      </div>

      <button v-show="!hasActiveUrlFilter && !isAdvancedByUrl" id="confirm-search" class="btn btn-sm btn-secondary"
        @click="onPrimaryAction">
        <i :class="['bi', primaryActionIcon]" />
      </button>
    </div>

    <div
      v-if="isGridView && isLoggedIn"
      id="gallery-mode-container"
      class="toolbar-acervo__panel toolbar-acervo__panel--gallery"
    >
      <button
        type="button"
        class="toolbar-acervo__gallery-btn"
        aria-label="Adicionar à coleção"
        title="Adicionar à coleção"
        @click="openAddToCollectionMode"
      >
        <img
          src="@/assets/icons/toolbar-gallery.svg"
          alt=""
          width="24"
          height="24"
          class="toolbar-acervo__gallery-icon"
        />
      </button>
    </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth";
import hslToHex from "@/helpers/hslToHex";
import hexToHue from "@/helpers/hexToHue";
import createDefaultAdvancedFilters from "@/helpers/createDefaultAdvancedFilters";
import { parseYearFromDateString, setDateYear } from "@/helpers/dateUtils";
import {
  selectionToViewIcon,
  selectionToViewRoute,
  viewOptions,
} from "@/constants/viewModes";
import { getSearchIcon, searchOptions } from "@/constants/searchOptions";
import { useSubjectTerms } from "@/composables/useSubjectTerms";
import {
  useMaterialTerms,
  useTechniqueTerms,
  useStylePeriodTerms,
  useCulturalContextTerms,
  useWorkTypeTerms,
} from "@/composables/useVocabTerms";
import { queryToFilters, hasAnyAdvancedFilter } from "@/helpers/searchQueryMapping";

defineOptions({ name: "AppToolbar" });

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { isLoggedIn } = storeToRefs(authStore);
const { getTermById, loadSubjectTerms, isTermLoaded } = useSubjectTerms();
const { getTermById: getMaterialTerm, isTermLoaded: isMaterialTermLoaded, loadTerms: loadMaterialTerms } = useMaterialTerms();
const { getTermById: getTechniqueTerm, isTermLoaded: isTechniqueTermLoaded, loadTerms: loadTechniqueTerms } = useTechniqueTerms();
const { getTermById: getStylePeriodTerm, isTermLoaded: isStylePeriodTermLoaded, loadTerms: loadStylePeriodTerms } = useStylePeriodTerms();
const { getTermById: getCulturalContextTerm, isTermLoaded: isCulturalContextTermLoaded, loadTerms: loadCulturalContextTerms } = useCulturalContextTerms();
const { getTermById: getWorkTypeTerm, isTermLoaded: isWorkTypeTermLoaded, loadTerms: loadWorkTypeTerms } = useWorkTypeTerms();

const props = defineProps({
  searchMode: {
    type: String,
    required: true,
  },
  textQuery: {
    type: String,
    default: "",
  },
  dateRange: {
    type: Object,
    default: () => ({ start: "", end: "" }),
  },
  color: {
    type: String,
    default: "",
  },
  advancedFilters: {
    type: Object,
    default: () => createDefaultAdvancedFilters(),
  },
  viewSelection: {
    type: String,
    default: "grid",
  },
  mapSettings: {
    type: String,
    default: "2d",
  },
  addToCollectionMode: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "confirm",
  "view-change",
  "open-advanced-search",
  "view-subcontrol",
  "search-mode-change",
  "update:text-query",
  "update:date-range",
  "update:color",
  "update:map-settings",
  "remove-chip",
  "remove-url-chip",
  "clear-all-filters",
  "gallery-click",
  "add-to-collection-open",
  "add-to-collection-close",
  "add-to-collection-confirm",
  "update:addToCollectionMode",
]);

// Fase 2: fonte única de verdade para "quais filtros de URL estão ativos" —
// antes cada um dos 3 computeds abaixo reparseava route.query campo a campo,
// e activeFilterTypeCount tinha um bug real: checkAndAdd recebia `count` por
// valor (não por referência) e o incremento era descartado — na prática,
// subject[]/subject_term[]/license[]/material_term[]/technique_term[]/
// aesthetics_term[]/cultural_context_term[]/typology_term[] nunca contavam
// para isAdvancedByUrl, então filtrar só por esses campos nunca acionava o
// banner "Busca avançada ativa".
const activeUrlFilters = computed(() => queryToFilters(route.query));

// Bug corrigido: materials/techniques/stylePeriods/culturalContexts/workTypes
// não tinham chip de bypass (urlChips) nem entravam nessa contagem — sozinhos,
// isAdvancedByUrl ficava false, urlChips ficava vazio, e nenhuma das áreas de
// input batia (nenhuma delas cobre esse estado), deixando a toolbar "fechada"
// (nem banner de avançada, nem chip, nem input nenhum visível). Mesmo
// raciocínio de work_date/characteristics: força modo avançado porque não
// existe representação simples de bypass pra esses campos.
const hasWorkOrCharacteristicsFilter = computed(() => {
  const f = activeUrlFilters.value;
  return (
    f.workStartYear != null ||
    f.workEndYear != null ||
    Object.keys(f.characteristics).length > 0 ||
    f.materials.length > 0 ||
    f.techniques.length > 0 ||
    f.stylePeriods.length > 0 ||
    f.culturalContexts.length > 0 ||
    f.workTypes.length > 0
  );
});

// Detecta se há filtro de URL ativo
const hasActiveUrlFilter = computed(() => hasAnyAdvancedFilter(activeUrlFilters.value));

// Conta tipos de filtro distintos na URL (date_from + date_to = 1 tipo; arrays acumuláveis contam individualmente)
const activeFilterTypeCount = computed(() => {
  const f = activeUrlFilters.value;
  // terms já combina q/title/contributor/subject_term/location — cada um vira
  // 1 item do array, então terms.length já soma "1 por campo escalar presente
  // + N por campo que acumula múltiplos valores", igual à intenção original
  // do checkAndAdd.
  let count = f.terms.length + f.tags.length + f.licenses.length
    + f.materials.length + f.techniques.length + f.stylePeriods.length
    + f.culturalContexts.length + f.workTypes.length;
  if (f.imageStartYear != null || f.imageEndYear != null) count++;
  if (f.workStartYear != null || f.workEndYear != null) count++;
  count += Object.keys(f.characteristics).length;
  return count;
});

// Se 2+ tipos distintos de filtro, considera busca avançada derivada da URL
const isAdvancedByUrl = computed(() => activeFilterTypeCount.value >= 2 || hasWorkOrCharacteristicsFilter.value);

// Modo visual efetivo: avançada se derivado da URL, senão usa o prop
const effectiveSearchMode = computed(() => isAdvancedByUrl.value ? 'avancada' : currentSearchMode.value);

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1;

function sanitizeYearInput(raw) {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return null;
  return Math.min(CURRENT_YEAR, Math.max(MIN_YEAR, n));
}

function onYearKeydown(event) {
  const allowed = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
  if (!allowed.includes(event.key) && !/^\d$/.test(event.key)) {
    event.preventDefault();
  }
}

function onYearInput(which) {
  const modelRef = which === 'start' ? startDateModel : endDateModel;
  if (String(modelRef.value).length > 4) {
    modelRef.value = String(modelRef.value).slice(0, 4);
  }
}

const DEFAULT_HUE = 36;
const hue = ref(DEFAULT_HUE);

watch(
  () => props.color,
  (newColor) => {
    if (typeof newColor === "string" && newColor.length > 0) {
      const nextHue = hexToHue(newColor);
      hue.value = nextHue ?? DEFAULT_HUE;
    }
  },
  { immediate: true }
);

const colorHex = computed(() => hslToHex(Number(hue.value), 100, 50));

const currentSearchMode = computed(() => props.searchMode || "textual");
const currentViewSelection = computed(() => props.viewSelection || "grid");
const isGridView = computed(() => currentViewSelection.value === "grid");

const isAddToCollectionMode = computed({
  get: () => props.addToCollectionMode,
  set: (value) => emit("update:addToCollectionMode", value),
});

function openAddToCollectionMode() {
  if (!isLoggedIn.value) return;
  isAddToCollectionMode.value = true;
  emit("gallery-click");
  emit("add-to-collection-open");
}

function closeAddToCollectionMode() {
  isAddToCollectionMode.value = false;
  emit("add-to-collection-close");
}

function confirmAddToCollection() {
  emit("add-to-collection-confirm");
}

watch(isGridView, (grid) => {
  if (!grid && isAddToCollectionMode.value) {
    closeAddToCollectionMode();
  }
});

watch(isLoggedIn, (loggedIn) => {
  if (!loggedIn && isAddToCollectionMode.value) {
    closeAddToCollectionMode();
  }
});

const viewOptionsList = computed(() => viewOptions());

const currentViewOption = computed(
  () =>
    viewOptionsList.value.find(
      (option) => option.selection === currentViewSelection.value
    ) || null
);

const currentViewSubcontrol = computed(
  () => currentViewOption.value?.subcontrol || null
);

const searchOptionsList = searchOptions();

const viewIconClass = computed(() =>
  selectionToViewIcon(currentViewSelection.value)
);
const searchIconClass = computed(() => getSearchIcon(effectiveSearchMode.value));

watch(
  () => route.query['subject[]'],
  (rawSubjects) => {
    if (rawSubjects) {
      const subjects = Array.isArray(rawSubjects) ? rawSubjects : [rawSubjects];
      if (subjects.length > 0) {
        loadSubjectTerms(subjects);
      }
    }
  },
  { immediate: true }
);

// Carrega os labels dos 5 vocabulários novos (materiais, técnicas, período de
// estilo, contexto cultural, tipo de obra) sempre que os filtros ativos
// mudarem, pra advancedChips já ter o texto pronto ao invés do UUID cru.
watch(
  () => props.advancedFilters?.materials,
  (ids) => { if (Array.isArray(ids) && ids.length > 0) loadMaterialTerms(ids); },
  { immediate: true }
);
watch(
  () => props.advancedFilters?.techniques,
  (ids) => { if (Array.isArray(ids) && ids.length > 0) loadTechniqueTerms(ids); },
  { immediate: true }
);
watch(
  () => props.advancedFilters?.stylePeriods,
  (ids) => { if (Array.isArray(ids) && ids.length > 0) loadStylePeriodTerms(ids); },
  { immediate: true }
);
watch(
  () => props.advancedFilters?.culturalContexts,
  (ids) => { if (Array.isArray(ids) && ids.length > 0) loadCulturalContextTerms(ids); },
  { immediate: true }
);
watch(
  () => props.advancedFilters?.workTypes,
  (ids) => { if (Array.isArray(ids) && ids.length > 0) loadWorkTypeTerms(ids); },
  { immediate: true }
);

const hasAdvancedFilters = computed(() => {
  const filters = props.advancedFilters || {};
  return (
    (filters.terms && filters.terms.length > 0) ||
    (filters.tags && filters.tags.length > 0) ||
    (filters.materials && filters.materials.length > 0) ||
    (filters.techniques && filters.techniques.length > 0) ||
    (filters.stylePeriods && filters.stylePeriods.length > 0) ||
    (filters.culturalContexts && filters.culturalContexts.length > 0) ||
    (filters.workTypes && filters.workTypes.length > 0)
  );
});

// Chips criados diretamente dos parâmetros da URL (bypass searchMode)
const urlChips = computed(() => {
  const chips = [];

  // Chip para ?q= (busca textual direta)
  if (route.query.q) {
    chips.push({
      uid: `q-${route.query.q}`,
      type: "q",
      value: route.query.q,
      label: `Termo: ${route.query.q}`,
    });
  }

  // Chip para ?date_from= e ?date_to= (filtro por período)
  if (route.query.date_from || route.query.date_to) {
    const fromYear = route.query.date_from ? route.query.date_from.substring(0, 4) : null;
    const toYear = route.query.date_to ? route.query.date_to.substring(0, 4) : null;
    let dateLabel;
    if (fromYear && toYear) {
      dateLabel = `${fromYear} - ${toYear}`;
    } else if (fromYear) {
      dateLabel = `A partir de ${fromYear}`;
    } else {
      dateLabel = `Até ${toYear}`;
    }
    chips.push({
      uid: `date-${route.query.date_from || ''}-${route.query.date_to || ''}`,
      type: "date_range",
      value: { date_from: route.query.date_from, date_to: route.query.date_to },
      label: dateLabel,
    });
  }

// Chips para ?subject[]= (tags de assunto por ID, com lookup assíncrono)
  const rawSubjects = route.query['subject[]'];
  const activeSubjects = rawSubjects
    ? (Array.isArray(rawSubjects) ? rawSubjects : [rawSubjects])
    : [];
  activeSubjects.forEach((id) => {
    chips.push({
      uid: `subject-url-${id}`,
      type: 'subject_url',
      subjectId: id,
      label: isTermLoaded(id) ? getTermById(id) : null,
    });
  });

  // Chips para ?subject_term[]= (termos de assunto, label direta sem lookup)
  const rawSubjectTerms = route.query['subject_term[]'];
  const activeSubjectTerms = rawSubjectTerms
    ? (Array.isArray(rawSubjectTerms) ? rawSubjectTerms : [rawSubjectTerms])
    : [];
  activeSubjectTerms.forEach((term) => {
    chips.push({
      uid: `subject-term-${term}`,
      type: 'subject_term',
      termValue: term,
      label: `Tag: ${term}`,
    });
  });

  // Chip para ?title=
  if (route.query.title) {
    chips.push({
      uid: `title-${route.query.title}`,
      type: 'title',
      value: route.query.title,
      label: `Título: ${route.query.title}`,
    });
  }

  // Chip para ?contributor=
  if (route.query.contributor) {
    chips.push({
      uid: `contributor-${route.query.contributor}`,
      type: 'contributor',
      value: route.query.contributor,
      label: `Autoria: ${route.query.contributor}`,
    });
  }

  // Chip para ?location=
  if (route.query.location) {
    chips.push({
      uid: `location-url-${route.query.location}`,
      type: 'location_url',
      value: route.query.location,
      label: `Localização: ${route.query.location}`,
    });
  }

  // Chips para ?license[]= (licenças CC, label direta)
  const rawLicenses = route.query['license[]'];
  const activeLicenses = rawLicenses
    ? (Array.isArray(rawLicenses) ? rawLicenses : [rawLicenses])
    : [];
  activeLicenses.forEach((licenseValue) => {
    chips.push({
      uid: `license-${licenseValue}`,
      type: 'license',
      licenseValue,
      label: `Licença: ${licenseValue}`,
    });
  });

  // Nota: materiais/técnicas/período de estilo/contexto cultural/tipo de obra
  // não têm chip aqui — são arrays de UUID (precisam resolver label via
  // composable, como advancedChips já faz) e, na prática, sempre forçam
  // isAdvancedByUrl=true (ver hasWorkOrCharacteristicsFilter), então o
  // template mostra o banner de busca avançada em vez de urlChips quando
  // qualquer um deles está ativo — este bloco nunca seria alcançado.

  return chips;
});

const advancedChips = computed(() => {
  const filters = props.advancedFilters || {};
  const chips = [];

  (filters.terms || []).forEach((term, index) => {
    chips.push({
      uid: `term-${index}-${term.value}`,
      type: "term",
      index,
      label: term.label || term.value,
    });
  });

  // Fase 3.1: tags é o campo canônico (mapeia para subject[]/subject no
  // backend) — antes havia dois geradores redundantes aqui: um lendo
  // filters.tags mas mostrando o UUID cru (sem resolver label), e outro lendo
  // filters.subjects (campo morto, sempre []) que resolvia o label certo via
  // getTermById mas nunca disparava. Consolidado no único que funciona de
  // ponta a ponta.
  (filters.tags || []).forEach((id, index) => {
    chips.push({
      uid: `tag-${index}-${id}`,
      type: "tag",
      index,
      label: isTermLoaded(id) ? `Tag: ${getTermById(id)}` : null,
    });
  });

  (filters.materials || []).forEach((id, index) => {
    chips.push({
      uid: `material-${index}-${id}`,
      type: "material",
      index,
      label: isMaterialTermLoaded(id) ? `Material: ${getMaterialTerm(id)}` : null,
    });
  });

  (filters.techniques || []).forEach((id, index) => {
    chips.push({
      uid: `technique-${index}-${id}`,
      type: "technique",
      index,
      label: isTechniqueTermLoaded(id) ? `Técnica: ${getTechniqueTerm(id)}` : null,
    });
  });

  (filters.stylePeriods || []).forEach((id, index) => {
    chips.push({
      uid: `style-period-${index}-${id}`,
      type: "stylePeriod",
      index,
      label: isStylePeriodTermLoaded(id) ? `Período de estilo: ${getStylePeriodTerm(id)}` : null,
    });
  });

  (filters.culturalContexts || []).forEach((id, index) => {
    chips.push({
      uid: `cultural-context-${index}-${id}`,
      type: "culturalContext",
      index,
      label: isCulturalContextTermLoaded(id) ? `Contexto cultural: ${getCulturalContextTerm(id)}` : null,
    });
  });

  (filters.workTypes || []).forEach((id, index) => {
    chips.push({
      uid: `work-type-${index}-${id}`,
      type: "workType",
      index,
      label: isWorkTypeTermLoaded(id) ? `Tipo de obra: ${getWorkTypeTerm(id)}` : null,
    });
  });

  return chips;
});

const MAX_VISIBLE_ADVANCED_CHIPS = 2;

const visibleAdvancedChips = computed(() =>
  advancedChips.value.slice(0, MAX_VISIBLE_ADVANCED_CHIPS)
);

const advancedChipsOverflow = computed(() =>
  Math.max(advancedChips.value.length - MAX_VISIBLE_ADVANCED_CHIPS, 0)
);

const textModel = computed({
  get: () => props.textQuery ?? "",
  set: (value) => emit("update:text-query", value),
});

const dateRangeValue = computed(() => ({
  start: props.dateRange?.start ?? "",
  end: props.dateRange?.end ?? "",
}));

const startDateModel = ref("");
const endDateModel = ref("");

watch(
  dateRangeValue,
  (val) => {
    const startYear = parseYearFromDateString(val.start);
    const endYear = parseYearFromDateString(val.end);
    const sanitizedStart = startYear !== null ? sanitizeYearInput(startYear) : null;
    const sanitizedEnd = endYear !== null ? sanitizeYearInput(endYear) : null;
    if (sanitizedStart !== null) startDateModel.value = String(sanitizedStart);
    else if (!val.start) startDateModel.value = "";
    if (sanitizedEnd !== null) endDateModel.value = String(sanitizedEnd);
    else if (!val.end) endDateModel.value = "";
  },
  { immediate: true }
);

function emitDateRange() {
  let startYear = sanitizeYearInput(startDateModel.value);
  let endYear = sanitizeYearInput(endDateModel.value);
  if (startYear !== null && endYear !== null && endYear < startYear) {
    endYear = startYear;
  }
  const start = startYear !== null ? setDateYear("", startYear, true) : "";
  const end = endYear !== null ? setDateYear("", endYear, false) : "";
  emit("update:date-range", { start, end });
}

const isAdvancedMode = computed(() => currentSearchMode.value === "avancada");

const isMapSubcontrolActive = computed(() => props.mapSettings === "3d");

const primaryActionIcon = computed(() =>
  isAdvancedMode.value ? "bi-pencil-square" : "bi-arrow-right"
);

function onHueInput() {
  const nextColor = hslToHex(Number(hue.value), 100, 50);
  emit("update:color", nextColor);
}

async function handleSearchModeChange(mode) {
  // Avançada: apenas abre o modal, sem escrever searchMode na URL
  if (mode === "avancada") {
    emit("open-advanced-search");
    return;
  }

  if (currentSearchMode.value === mode) {
    return;
  }

  emit("search-mode-change", mode);
}

function setSearchMode(mode) {
  handleSearchModeChange(mode);
}

function resolveConfirmValue() {
  switch (currentSearchMode.value) {
    case "data": {
      let startYear = sanitizeYearInput(startDateModel.value);
      let endYear = sanitizeYearInput(endDateModel.value);
      if (startYear !== null && endYear !== null && endYear < startYear) endYear = startYear;
      const start = startYear !== null ? setDateYear("", startYear, true) : "";
      const end = endYear !== null ? setDateYear("", endYear, false) : "";
      return { start, end };
    }
    case "cor":
      return props.color || colorHex.value || null;
    case "avancada":
      return props.advancedFilters || null;
    case "textual":
    default:
      return textModel.value || null;
  }
}

function onConfirm() {
  // Bypass: se modo textual, navega diretamente com ?q= em vez de usar searchMode
  if (currentSearchMode.value === 'textual') {
    const query = textModel.value.trim();
    if (query) {
      router.push({ query: { ...route.query, q: query } });
    }
    return;
  }

  // Bypass: se modo data, navega diretamente com ?date_from= e ?date_to=
  if (currentSearchMode.value === 'data') {
    let startYear = sanitizeYearInput(startDateModel.value);
    let endYear = sanitizeYearInput(endDateModel.value);
    if (startYear !== null && endYear !== null && endYear < startYear) endYear = startYear;
    const newQuery = { ...route.query };
    if (startYear !== null) {
      newQuery.date_from = `${startYear}-01-01`;
    }
    if (endYear !== null) {
      newQuery.date_to = `${endYear}-12-31`;
    }
    if (newQuery.date_from || newQuery.date_to) {
      router.push({ query: newQuery });
    }
    return;
  }

  const value = resolveConfirmValue();
  emit("confirm", { mode: currentSearchMode.value, value });
}

function setViewMode(mode, selection = mode) {
  if (currentViewSelection.value === selection) {
    return;
  }

  emit("view-change", {
    selection,
    mode,
    route: selectionToViewRoute(selection),
  });
}

function onPrimaryAction() {
  if (isAdvancedMode.value) {
    emit("open-advanced-search");
    return;
  }
  onConfirm();
}

function onViewSubcontrol() {
  const subcontrol = currentViewSubcontrol.value;
  if (!subcontrol) {
    return;
  }

  const nextValue = isMapSubcontrolActive.value ? "2d" : "3d";
  emit("update:map-settings", nextValue);
  emit("view-subcontrol", {
    selection: currentViewSelection.value,
    mode: currentViewOption.value?.mode || null,
    subcontrol: subcontrol.id || null,
    value: nextValue,
  });
}
</script>

<style lang="scss" scoped>
.toolbar-acervo {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 20px;
}

.toolbar-acervo__panel {
  display: flex;
  min-height: 62px;
  height: auto;
  padding: var(--p, 12px) var(--m, 16px);
  align-items: center;
  gap: var(--m, 16px);
  border-radius: 6px;
  background: var(--Off_white, #faf9f9);
  box-shadow: 4px 4px 20px 4px rgba(0, 0, 0, 0.2);
  box-sizing: border-box;

  .btn {
    border: none;
  }
  
  .btn-clear-search, .btn-edit-search {
    width: auto !important;
  }
}

.toolbar-acervo__panel--search {
  padding: var(--ppp, 4px) var(--pp, 8px);
  min-width: 0;
}

.toolbar-acervo__panel--gallery {
  flex: 0 0 auto;
  justify-content: center;
  padding: var(--p, 12px) var(--m, 16px);
}

.toolbar-acervo__gallery-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.toolbar-acervo__gallery-btn:hover {
  opacity: 0.85;
}

.toolbar-acervo__gallery-btn:focus-visible {
  outline: 2px solid var(--Laranja_E, #aa4f28);
  outline-offset: 2px;
  border-radius: 4px;
}

.toolbar-acervo__gallery-icon {
  display: block;
  width: 24px;
  height: 24px;
}

#toolbar #confirm-search {
  width: var(--control-height-desk, 38px);
  height: var(--control-height-desk, 38px);
  min-width: var(--control-height-desk, 38px);
  min-height: var(--control-height-desk, 38px);
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

@media (max-width: 767.98px) {
  #toolbar #confirm-search {
    width: var(--control-height-mobile, 48px);
    height: var(--control-height-mobile, 48px);
    min-width: var(--control-height-mobile, 48px);
    min-height: var(--control-height-mobile, 48px);
  }
}

#toolbar .dropdown-menu {
  margin-top: 14px !important;
}

.dropdown-menu.menu-dark .dropdown-item {
  position: relative;
  padding-left: 2rem;
}

.dropdown-menu.menu-dark .dropdown-item.active::before {
  content: "";
  display: inline-block;
  width: 1rem;
  height: 1rem;
  position: absolute;
  left: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background-color: currentColor;
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M13.485 1.929a1.25 1.25 0 0 1 0 1.768l-7.071 7.07a1.25 1.25 0 0 1-1.768 0L.515 7.676A1.25 1.25 0 0 1 2.283 5.91l2.121 2.12 6.187-6.187a1.25 1.25 0 0 1 1.768 0z'/%3E%3C/svg%3E");
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M13.485 1.929a1.25 1.25 0 0 1 0 1.768l-7.071 7.07a1.25 1.25 0 0 1-1.768 0L.515 7.676A1.25 1.25 0 0 1 2.283 5.91l2.121 2.12 6.187-6.187a1.25 1.25 0 0 1 1.768 0z'/%3E%3C/svg%3E");
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  -webkit-mask-size: contain;
  mask-size: contain;
}

.advanced-filters-container {
  min-height: var(--control-height-desk, 38px);
}

.toolbar-divider {
  display: inline-block;
  width: 1px;
  height: 24px;
  background-color: var(--cinza-400, rgba(0, 0, 0, 1));
}

#toolbar .btn-subcontrol {
  width: var(--control-height-desk, 38px);
  height: var(--control-height-desk, 38px);
  min-width: var(--control-height-desk, 38px);
  min-height: var(--control-height-desk, 38px);
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

@media (max-width: 767.98px) {
  #toolbar .btn-subcontrol {
    width: var(--control-height-mobile, 48px);
    height: var(--control-height-mobile, 48px);
    min-width: var(--control-height-mobile, 48px);
    min-height: var(--control-height-mobile, 48px);
  }
}

#toolbar .btn-subcontrol.active {
  background-color: var(--Laranja_E);
  color: var(--Branco);
  border: none;
}

#toolbar .btn-subcontrol.active>.bi,
#toolbar .btn-subcontrol.active>i[class^="bi"] {
  color: currentColor;
}

/* Remove borda do dropdown quando disabled */
.btn-icon.dropdown-toggle:disabled {
  border-color: transparent;
  opacity: 0.65;
}

.toolbar__advanced-label {
  font-weight: 400;
  font-style: italic;
  font-size: 14px;
  line-height: 150%;
  letter-spacing: 0%;
}

.search-icon-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.search-active-dot {
  position: absolute;
  top: 0px;
  right: -3px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #D27D30;
  pointer-events: none;
  border: 2px solid var(--Branco);
}

.toolbar-acervo__panel--collection {
  gap: 20px;
  width: 100%;
  max-width: fit-content;
}

.toolbar-acervo__collection-inner {
  display: flex;
  padding: var(--ppp, 4px) var(--pp, 8px);
  align-items: center;
  gap: var(--m, 16px);
  border-radius: 6px;
  border: 0;
  background: var(--Off_white, #faf9f9);
  cursor: pointer;
}

.toolbar-acervo__collection-inner:hover {
  opacity: 0.9;
}

.toolbar-acervo__collection-inner:focus-visible {
  outline: 2px solid var(--Laranja_E, #aa4f28);
  outline-offset: 2px;
}

.toolbar-acervo__collection-arrow {
  display: block;
  flex-shrink: 0;
  width: 22px;
  height: 15px;
  background-color: var(--Laranja_E, #aa4f28);
  -webkit-mask: url("@/assets/icons/toolbar-arrow-next.svg") no-repeat center / contain;
  mask: url("@/assets/icons/toolbar-arrow-next.svg") no-repeat center / contain;
}

.toolbar-acervo__collection-label {
  color: var(--Laranja_E, #aa4f28);
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  font-style: normal;
  font-weight: 500;
  line-height: 150%;
  white-space: nowrap;
}

.toolbar-acervo__icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 25px;
  height: 25px;
  aspect-ratio: 1 / 1;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
}

.toolbar-acervo__icon-btn--arrow {
  width: auto;
  height: auto;
  aspect-ratio: auto;
}

.toolbar-acervo__icon-btn:hover {
  opacity: 0.85;
}

.toolbar-acervo__icon-btn:focus-visible {
  outline: 2px solid var(--Laranja_E, #aa4f28);
  outline-offset: 2px;
  border-radius: 4px;
}

.toolbar-acervo__icon-btn-image {
  display: block;
  width: 25px;
  height: 25px;
}
</style>