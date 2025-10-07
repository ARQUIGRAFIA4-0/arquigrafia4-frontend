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
        @click="emit('open-view-menu')"
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
        class="btn btn-icon"
        type="button"
        aria-label="Buscar por texto"
        @click="emit('open-search-text')"
      >
        <i class="bi bi-search" />
      </button>
      <button
        id="search-color-button"
        class="btn btn-icon"
        type="button"
        aria-label="Buscar por cor"
        @click="emit('open-search-color')"
      >
        <i class="bi bi-palette" />
      </button>
      <button
        id="search-date-button"
        class="btn btn-icon"
        type="button"
        aria-label="Buscar por data"
        @click="emit('open-search-date')"
      >
        <i class="bi bi-calendar2-week" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

defineOptions({ name: "ToolbarMobile" });

const emit = defineEmits([
  "open-view-menu",
  "open-search-text",
  "open-search-color",
  "open-search-date",
]);

const props = defineProps({
  currentView: {
    type: String,
    default: "grid",
  },
});

const viewIconClass = computed(() => {
  switch (props.currentView) {
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
</script>

<style scoped>
#toolbar-mobile .toolbar-group {
  box-shadow: var(--shadow-elevation-medium);
}
</style>
