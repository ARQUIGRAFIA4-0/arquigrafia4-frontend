<template>
  <div id="toolbar" class="d-flex flex-row justify-content-between gap-4">
    <div id="view-mode-container" class="d-flex align-items-center rounded-3">
      <div class="dropdown dropup">
        <button
          id="view-mode-dropdown"
          class="btn btn-icon dropdown-toggle caret-right"
          type="button"
          data-bs-toggle="dropdown"
          data-bs-offset="0,16"
          aria-expanded="false"
        >
          <i class="bi bi-grid" />
        </button>
        <ul class="dropdown-menu menu-dark mt-3">
          <li>
            <button class="dropdown-item" @click="setViewMode('grid')">
              <i class="bi bi-image me-2" /> Mar de imagens
            </button>
          </li>
          <li>
            <button class="dropdown-item" @click="setViewMode('map')">
              <i class="bi bi-geo-alt me-2" /> Mapa
            </button>
          </li>
          <li>
            <button class="dropdown-item" @click="setViewMode('grid')">
              <i class="bi bi-grid-3x3-gap me-2" /> Grade
            </button>
          </li>
          <li>
            <button class="dropdown-item" @click="setViewMode('mosaic')">
              <i class="bi bi-layout-text-window-reverse me-2" /> Mosaico
            </button>
          </li>
        </ul>
      </div>
    </div>
    <div
      id="search-mode-container"
      class="d-flex align-items-center p-2 px-3 rounded-3 gap-3 flex-fill"
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
          <i class="bi bi-search" />
        </button>
        <ul class="dropdown-menu menu-dark mt-3">
          <li>
            <button
              class="dropdown-item"
              :class="{ active: currentSearchMode === 'avancada' }"
              @click="setSearchMode('avancada')"
            >
              <i class="bi bi-sliders me-2" /> Busca avançada
            </button>
          </li>
          <li>
            <button
              class="dropdown-item"
              :class="{ active: currentSearchMode === 'textual' }"
              @click="setSearchMode('textual')"
            >
              <i class="bi bi-type me-2" /> Busca textual
            </button>
          </li>
          <li>
            <button
              class="dropdown-item"
              :class="{ active: currentSearchMode === 'data' }"
              @click="setSearchMode('data')"
            >
              <i class="bi bi-calendar3 me-2" /> Busca por data
            </button>
          </li>
          <li>
            <button
              class="dropdown-item"
              :class="{ active: currentSearchMode === 'cor' }"
              @click="setSearchMode('cor')"
            >
              <i class="bi bi-palette me-2" /> Busca por cor
            </button>
          </li>
        </ul>
      </div>

      <!-- Área de entrada da busca (apenas layout; alternância será implementada depois) -->
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

        <!-- Avançada (placeholder – oculto por padrão) -->
        <div
          class="w-100"
          id="search-input-avancada"
          v-show="currentSearchMode === 'avancada'"
        >
          <input
            type="text"
            class="form-control"
            placeholder="Configurar filtros avançados"
            disabled
          />
        </div>

        <!-- Data (intervalo – oculto por padrão) -->
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

        <!-- Cor (oculto por padrão) -->
        <div
          class="w-100"
          id="search-input-cor"
          v-show="currentSearchMode === 'cor'"
        >
          <div class="d-flex align-items-center gap-2">
            <input
              type="range"
              class="form-range form-range-sm form-range-hue w-100"
              style="min-width: 250px;"
              min="0"
              max="360"
              v-model="hue"
              :style="{ '--hue': hue }"
            />
          </div>
        </div>
      </div>

      <button id="confirm-search" class="btn btn-sm btn-secondary" @click="onConfirm">
        <i class="bi bi-arrow-right" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

defineOptions({ name: "AppToolbar" });

const currentSearchMode = ref("textual");
const textQuery = ref("");
const startDate = ref("");
const endDate = ref("");
const hue = ref(36);

function hslToHex(h, s, l) {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const k = n => (n + h / 30) % 12;
  const a = sNorm * Math.min(lNorm, 1 - lNorm);
  const f = n => lNorm - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = x => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

const colorHex = computed(() => hslToHex(Number(hue.value), 100, 50));

const emit = defineEmits(["confirm", "view-change"]);

function setSearchMode(mode) {
  currentSearchMode.value = mode;
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
      value = null;
      break;
    case "textual":
    default:
      value = textQuery.value || null;
  }
  emit("confirm", { mode: currentSearchMode.value, value });
}

function setViewMode(mode) {
  emit("view-change", mode);
}
</script>

<style scoped>
#toolbar #view-mode-container,
#toolbar #search-mode-container {
  box-shadow: var(--shadow-elevation-medium);
  padding: 12px;
}

/* Botão de confirmação: quadrado e levemente menor */
#toolbar #confirm-search {
  width: 32px;
  height: 32px;
  min-width: 32px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Mais afastamento entre toggle e menu, e garantindo z-index adequado */
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
</style>
