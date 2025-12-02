<template>
  <div id="toolbar" class="d-flex flex-row justify-content-between gap-4">
    <div
      id="view-mode-container"
      class="d-flex align-items-center rounded-3 bg-white gap-2"
    >
      <div class="dropdown dropup">
        <button
          id="view-mode-dropdown"
          class="btn btn-icon dropdown-toggle caret-right"
          type="button"
          data-bs-toggle="dropdown"
          data-bs-offset="0,16"
          aria-expanded="false"
        >
          <i :class="['bi', viewIconClass]" />
        </button>
        <ul class="dropdown-menu menu-dark mt-3">
          <li v-for="option in viewOptionsList" :key="option.selection">
            <button
              class="dropdown-item"
              :class="{ active: currentViewSelection === option.selection }"
              @click="setViewMode(option.mode, option.selection)"
            >
              <i
                :class="['bi', selectionToViewIcon(option.selection), 'me-2']"
              />
              {{ option.label }}
            </button>
          </li>
        </ul>
      </div>
      <span
        v-if="currentViewSubcontrol"
        class="toolbar-divider"
        aria-hidden="true"
      />
      <button
        v-if="currentViewSubcontrol"
        :class="[
          'btn btn-icon btn-subcontrol',
          { active: isMapSubcontrolActive },
        ]"
        type="button"
        :title="currentViewSubcontrol.label"
        :aria-label="currentViewSubcontrol.label"
        :aria-pressed="isMapSubcontrolActive"
        @click="onViewSubcontrol"
      >
        <i :class="['bi', currentViewSubcontrol.icon]" />
      </button>
    </div>
    <div
      id="search-mode-container"
      class="d-flex align-items-center p-2 px-3 rounded-3 gap-3 flex-fill bg-white"
    >
      <div class="dropdown dropup">
        <button
          id="search-mode-dropdown"
          class="btn btn-icon dropdown-toggle caret-right"
          type="button"
          data-bs-toggle="dropdown"
          data-bs-offset="0,16"
          aria-expanded="false"
        >
          <i :class="['bi', searchIconClass]" />
        </button>
        <ul class="dropdown-menu menu-dark mt-3">
          <li v-for="option in searchOptionsList" :key="option.mode">
            <button
              class="dropdown-item"
              :class="{ active: currentSearchMode === option.mode }"
              @click="setSearchMode(option.mode)"
            >
              <i :class="['bi', getSearchIcon(option.mode), 'me-2']" />
              {{ option.label }}
            </button>
          </li>
        </ul>
      </div>

      <!-- Área de entrada da busca -->
      <div class="d-flex align-items-center flex-grow-1">
        <!-- Textual (padrão visível) -->
        <div
          class="w-100"
          id="search-input-textual"
          v-show="currentSearchMode === 'textual'"
        >
          <input
            type="text"
            class="form-control"
            placeholder="Digite o termo de busca"
            v-model="textModel"
          />
        </div>

        <!-- Avançada -->
        <div
          class="w-100"
          id="search-input-avancada"
          v-show="currentSearchMode === 'avancada'"
        >
          <div
            class="advanced-filters-container d-flex align-items-center flex-wrap gap-2"
          >
            <template v-if="hasAdvancedFilters">
              <button
                v-for="chip in visibleAdvancedChips"
                :key="chip.uid"
                class="btn btn-info btn-sm btn-tag"
                type="button"
              >
                {{ chip.label }}
              </button>
              <button
                v-if="advancedChipsOverflow > 0"
                key="advanced-chips-overflow"
                class="btn btn-info btn-sm btn-tag"
                type="button"
              >
                +{{ advancedChipsOverflow }}
              </button>
            </template>
          </div>
        </div>

        <!-- Data -->
        <div
          class="w-100"
          id="search-input-data"
          v-show="currentSearchMode === 'data'"
        >
          <div class="d-flex align-items-center gap-2">
            <input type="date" class="form-control" v-model="startDateModel" />
            <span class="text-branco">a</span>
            <input type="date" class="form-control" v-model="endDateModel" />
          </div>
        </div>

        <!-- Cor -->
        <div
          class="w-100"
          id="search-input-cor"
          v-show="currentSearchMode === 'cor'"
        >
          <div class="d-flex align-items-center gap-2">
            <input
              type="range"
              class="form-range form-range-sm form-range-hue w-100"
              style="min-width: 250px"
              min="0"
              max="360"
              v-model="hue"
              :style="{ '--hue': hue }"
              @input="onHueInput"
            />
          </div>
        </div>
      </div>

      <button
        id="confirm-search"
        class="btn btn-sm btn-secondary"
        @click="onPrimaryAction"
      >
        <i :class="['bi', primaryActionIcon]" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import hslToHex from "@/helpers/hslToHex";
import hexToHue from "@/helpers/hexToHue";
import createDefaultAdvancedFilters from "@/helpers/createDefaultAdvancedFilters";
import {
  selectionToViewIcon,
  selectionToViewRoute,
  viewOptions,
} from "@/constants/viewModes";
import { getSearchIcon, searchOptions } from "@/constants/searchOptions";

defineOptions({ name: "AppToolbar" });

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
]);

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
const searchIconClass = computed(() => getSearchIcon(currentSearchMode.value));

const hasAdvancedFilters = computed(() => {
  const filters = props.advancedFilters || {};
  return (
    (filters.terms && filters.terms.length > 0) ||
    (filters.locations && filters.locations.length > 0) ||
    (filters.tags && filters.tags.length > 0) ||
    Boolean(filters.use)
  );
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

  (filters.locations || []).forEach((location, index) => {
    chips.push({
      uid: `location-${index}-${location}`,
      type: "location",
      index,
      label: `Localização: ${location}`,
    });
  });

  (filters.tags || []).forEach((tag, index) => {
    chips.push({
      uid: `tag-${index}-${tag}`,
      type: "tag",
      index,
      label: `Tag: ${tag}`,
    });
  });

  if (filters.use) {
    chips.push({
      uid: `use-${filters.use}`,
      type: "use",
      label:
        filters.use === "commercial"
          ? "Uso: Permite uso comercial"
          : "Uso: Não permite uso comercial",
    });
  }

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

const startDateModel = computed({
  get: () => dateRangeValue.value.start,
  set: (value) => {
    emit("update:date-range", { ...dateRangeValue.value, start: value });
  },
});

const endDateModel = computed({
  get: () => dateRangeValue.value.end,
  set: (value) => {
    emit("update:date-range", { ...dateRangeValue.value, end: value });
  },
});

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
  if (currentSearchMode.value === mode) {
    if (mode === "avancada") {
      emit("open-advanced-search");
    }
    return;
  }

  emit("search-mode-change", mode);

  if (mode === "avancada") {
    emit("open-advanced-search");
  }
}

function setSearchMode(mode) {
  handleSearchModeChange(mode);
}

function resolveConfirmValue() {
  switch (currentSearchMode.value) {
    case "data":
      return {
        start: dateRangeValue.value.start || null,
        end: dateRangeValue.value.end || null,
      };
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

<style scoped>
#toolbar #view-mode-container,
#toolbar #search-mode-container {
  box-shadow: var(--shadow-elevation-medium);
  padding: 12px;
}

#toolbar #confirm-search {
  width: 32px;
  height: 32px;
  min-width: 32px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
  min-height: 36px;
}

.toolbar-divider {
  display: inline-block;
  width: 1px;
  height: 24px;
  background-color: var(--cinza-400, rgba(0, 0, 0, 1));
}

#toolbar .btn-subcontrol {
  width: 40px;
  height: 40px;
  min-width: 40px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

#toolbar .btn-subcontrol.active {
  background-color: var(--Laranja_E);
  color: var(--Branco);
  border: none;
}

#toolbar .btn-subcontrol.active > .bi,
#toolbar .btn-subcontrol.active > i[class^="bi"] {
  color: currentColor;
}
</style>
