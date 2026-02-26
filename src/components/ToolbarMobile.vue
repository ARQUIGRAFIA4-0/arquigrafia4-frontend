<template>
  <div
    id="toolbar-mobile"
    class="d-flex flex-row justify-content-between gap-3"
  >
    <div
      id="view-group"
      class="d-flex align-items-center bg-white rounded-3 p-2 toolbar-group"
    >
      <button
        id="view-mode-button"
        class="btn btn-icon"
        type="button"
        aria-label="Selecionar modo de visualização"
        @click="openViewMenu"
      >
        <i :class="['bi', viewIconClass]" />
      </button>
    </div>

    <div
      id="search-group"
      class="d-flex align-items-center bg-white rounded-3 p-2 toolbar-group gap-1"
    >
      <button
        id="search-text-button"
        :class="searchButtonClasses('textual')"
        type="button"
        aria-label="Buscar por texto"
        @click="handleSearchButton('textual', 'open-search-text')"
      >
        <span class="search-icon-wrapper">
        <i class="bi bi-search" />
          <span v-if="hasActiveTextFilter" class="search-active-dot" />
        </span>
      </button>
      <!-- <button
        id="search-color-button"
        :class="searchButtonClasses('cor')"
        type="button"
        aria-label="Buscar por cor"
        @click="handleSearchButton('cor', 'open-search-color')"
      >
        <i class="bi bi-palette" />
      </button> -->
      <button
        id="search-date-button"
        :class="searchButtonClasses('data')"
        type="button"
        aria-label="Buscar por data"
        @click="handleSearchButton('data', 'open-search-date')"
      >
        <span class="search-icon-wrapper">
          <i class="bi bi-calendar2-week" />
          <span v-if="hasActiveDateFilter" class="search-active-dot" />
        </span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

defineOptions({ name: "ToolbarMobile" });

const route = useRoute();

const hasActiveDateFilter = computed(() => Boolean(
  route.query.date_from || route.query.date_to
));

const hasActiveTextFilter = computed(() => Boolean(
  route.query.q ||
  route.query.title ||
  route.query.contributor ||
  route.query['subject_term[]'] ||
  route.query['subject[]']
));

const props = defineProps({
  viewSelection: {
    type: String,
    default: "grid",
  },
  searchMode: {
    type: String,
    default: "textual",
  },
});

const emit = defineEmits([
  "open-view-menu",
  "open-search-text",
  "open-search-color",
  "open-search-date",
  "search-mode-change",
]);

const viewIconClass = computed(() => {
  switch (props.viewSelection) {
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
});

const isSearchModeActive = (mode) => props.searchMode === mode;

function handleSearchButton(mode, eventName) {
  if (props.searchMode !== mode) {
    emit("search-mode-change", mode);
  }
  emit(eventName);
}

const searchButtonClasses = (mode) => [
  "btn",
  "btn-icon",
  { active: isSearchModeActive(mode) },
];

function openViewMenu() {
  emit("open-view-menu");
}
</script>

<style scoped>
#toolbar-mobile .toolbar-group {
  box-shadow: var(--shadow-elevation-medium);
}

.btn.active {
  border: 0px;
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
</style>
