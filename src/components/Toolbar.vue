<template>
  <div id="toolbar" class="d-flex flex-row justify-content-between gap-4">
    <div
      id="view-mode-container"
      class="d-flex align-items-center rounded-3 bg-white"
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
          <li v-for="option in viewOptions" :key="option.selection">
            <button
              class="dropdown-item"
              :class="{ active: currentViewSelection === option.selection }"
              @click="setViewMode(option.mode, option.selection)"
            >
              <i :class="['bi', getViewIcon(option.selection), 'me-2']" />
              {{ option.label }}
            </button>
          </li>
        </ul>
      </div>
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
          <li v-for="option in searchOptions" :key="option.mode">
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
            v-model="textQuery"
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
            <input type="date" class="form-control" v-model="startDate" />
            <span class="text-branco">a</span>
            <input type="date" class="form-control" v-model="endDate" />
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
import { ref, computed } from "vue";

defineOptions({ name: "AppToolbar" });

const props = defineProps({
  advancedFilters: {
    type: Object,
    default: () => ({
      terms: [],
      locations: [],
      tags: [],
      use: null,
    }),
  },
});

const currentViewSelection = ref("grid");
const currentSearchMode = ref("textual");
const textQuery = ref("");
const startDate = ref("");
const endDate = ref("");
const hue = ref(36);

function hslToHex(h, s, l) {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const k = (n) => (n + h / 30) % 12;
  const a = sNorm * Math.min(lNorm, 1 - lNorm);
  const f = (n) =>
    lNorm - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x) =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

const colorHex = computed(() => hslToHex(Number(hue.value), 100, 50));

const emit = defineEmits(["confirm", "view-change", "open-advanced-search"]);

const viewOptions = [
  { selection: "mar", label: "Mar de imagens", mode: "grid" },
  { selection: "map", label: "Mapa", mode: "map" },
  { selection: "grid", label: "Grade", mode: "grid" },
  { selection: "mosaic", label: "Mosaico", mode: "mosaic" },
];

const searchOptions = [
  { mode: "avancada", label: "Busca avançada" },
  { mode: "textual", label: "Busca textual" },
  { mode: "data", label: "Busca por data" },
  { mode: "cor", label: "Busca por cor" },
];

function getViewIcon(selection) {
  switch (selection) {
    case "mar":
      return "bi-image";
    case "map":
      return "bi-map";
    case "mosaic":
      return "bi-grid-1x2";
    case "grid":
    default:
      return "bi-grid";
  }
}

function getSearchIcon(mode) {
  switch (mode) {
    case "avancada":
      return "bi-gear";
    case "data":
      return "bi-calendar2-week";
    case "cor":
      return "bi-palette";
    case "textual":
    default:
      return "bi-search";
  }
}

const viewIconClass = computed(() => getViewIcon(currentViewSelection.value));

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

const isAdvancedMode = computed(() => currentSearchMode.value === "avancada");

const primaryActionIcon = computed(() =>
  isAdvancedMode.value ? "bi-pencil-square" : "bi-arrow-right"
);

function setSearchMode(mode) {
  currentSearchMode.value = mode;
  if (mode === "avancada") {
    emit("open-advanced-search");
  }
}

function onConfirm() {
  let value;
  switch (currentSearchMode.value) {
    case "data":
      value = { start: startDate.value || null, end: endDate.value || null };
      break;
    case "cor":
      value = colorHex.value || null;
      break;
    case "avancada":
      value = props.advancedFilters || null;
      break;
    case "textual":
    default:
      value = textQuery.value || null;
  }
  emit("confirm", { mode: currentSearchMode.value, value });
}

function setViewMode(mode, selection = mode) {
  currentViewSelection.value = selection;
  emit("view-change", mode);
}

function onPrimaryAction() {
  if (isAdvancedMode.value) {
    emit("open-advanced-search");
    return;
  }
  onConfirm();
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
</style>
