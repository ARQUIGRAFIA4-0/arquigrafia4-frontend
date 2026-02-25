<template>
  <ui-mobile-drawer
    id="drawer-search-date"
    v-model="open"
    title=""
  >
    <div class="p-3 drawer-content">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <div class="h2 m-0">Busca por período</div>
        <button
          type="button"
          class="drawer-close-btn"
          aria-label="Fechar"
          @click="open = false"
        >
          <i class="bi bi-x" />
        </button>
      </div>

      <div v-if="hasActiveFilter" class="mb-3">
        <button type="button" class="btn btn-primary btn-sm btn-tag">
          Ativado: {{ activeFilterLabel }}
          <button type="button" class="btn-close ms-1" aria-label="Limpar filtro" @click="emit('clear')" />
        </button>
      </div>

      <div class="row g-2 align-items-end mb-3">
        <div class="col">
          <label class="form-label">De</label>
          <input v-model="yearMin" type="number" class="form-control" placeholder="Ex: 1960"
            :min="minYearBound" :max="maxYearBound"
            @keydown="onYearKeydown" @input="onYearInputClamp('min')" />
        </div>
        <div class="col">
          <label class="form-label">Até</label>
          <input v-model="yearMax" type="number" class="form-control" placeholder="Ex: 1980"
            :min="minYearBound" :max="maxYearBound"
            @keydown="onYearKeydown" @input="onYearInputClamp('max')" />
        </div>
      </div>

      <div class="mb-3">
        <div class="h2">Década</div>
        <div class="d-flex flex-wrap gap-2">
          <button
            v-for="d in decadeOptions"
            :key="d"
            type="button"
            :class="[
              'btn btn-sm',
              isDecadeSelected(d) ? 'btn-primary' : 'btn-outline-secondary',
            ]"
            @click="selectDecade(d)"
          >
            {{ d }}
          </button>
        </div>
      </div>

      <div class="mb-4">
        <div class="h2">Século</div>
        <div class="d-flex flex-wrap gap-2">
          <button
            v-for="c in centuryOptions"
            :key="c.code"
            type="button"
            :class="[
              'btn btn-sm',
              isCenturySelected(c.code) ? 'btn-primary' : 'btn-outline-secondary',
            ]"
            @click="selectCentury(c.code)"
          >
            {{ c.label }}
          </button>
        </div>
      </div>

      <div class="drawer-actions d-grid gap-2 pt-3">
        <button class="btn btn-outline-secondary" @click="hasActiveFilter ? emit('clear') : open = false">
          {{ hasActiveFilter ? 'Limpar busca' : 'Cancelar' }}
        </button>
        <button class="btn btn-dark" @click="confirm">Buscar</button>
      </div>
    </div>
  </ui-mobile-drawer>
</template>

<script setup>
import { computed, onUnmounted, ref, watch } from "vue";
import UiMobileDrawer from "@/components/ui/UiMobileDrawer.vue";


defineOptions({ name: "MobileDrawerSearchDate" });

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  value: {
    type: Object,
    default: () => ({ start: "", end: "" }),
  },
  activeRange: {
    type: Object,
    default: () => ({ from: "", to: "" }),
  },
});

const emit = defineEmits([
  "update:modelValue",
  "update:value",
  "confirm",
  "open",
  "clear",
]);

const open = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const hasActiveFilter = computed(() =>
  Boolean(props.activeRange?.from || props.activeRange?.to)
);

const activeFilterLabel = computed(() => {
  const from = props.activeRange?.from?.substring(0, 4) || null;
  const to = props.activeRange?.to?.substring(0, 4) || null;
  if (from && to) return `${from} – ${to}`;
  if (from) return `A partir de ${from}`;
  if (to) return `Até ${to}`;
  return null;
});

const minYearBound = 1800;
const maxYearBound = new Date().getFullYear();
const yearMin = ref("");
const yearMax = ref("");

// Hydrate inputs from props.value (set on drawer open via handleDrawerDateOpen)
watch(
  () => props.value,
  (value) => {
    yearMin.value = value?.start ? value.start.substring(0, 4) : "";
    yearMax.value = value?.end ? value.end.substring(0, 4) : "";
  },
  { immediate: true }
);

function onYearKeydown(event) {
  const allowed = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
  if (!allowed.includes(event.key) && !/^\d$/.test(event.key)) {
    event.preventDefault();
  }
}

function onYearInputClamp(which) {
  const modelRef = which === 'min' ? yearMin : yearMax;
  if (modelRef.value.length > 4) {
    modelRef.value = modelRef.value.slice(0, 4);
  }
}

const decadeOptions = ref([1960, 1970, 1980, 1990, 2000, 2010, 2020]);
const isDecadeSelected = (d) =>
  Number(yearMin.value) === d && Number(yearMax.value) === Math.min(d + 9, maxYearBound);
const selectDecade = (d) => {
  yearMin.value = String(d);
  yearMax.value = String(Math.min(d + 9, maxYearBound));
};

const centuryOptions = ref([
  { code: "XIX", label: "XIX", start: 1801, end: 1900 },
  { code: "XX", label: "XX", start: 1901, end: 2000 },
  { code: "XXI", label: "XXI", start: 2001, end: 2100 },
]);
const isCenturySelected = (code) => {
  const c = centuryOptions.value.find((x) => x.code === code);
  if (!c) return false;
  return (
    Number(yearMin.value) === Math.max(c.start, minYearBound) &&
    Number(yearMax.value) === Math.min(c.end, maxYearBound)
  );
};
const selectCentury = (code) => {
  const c = centuryOptions.value.find((x) => x.code === code);
  if (!c) return;
  yearMin.value = String(Math.max(c.start, minYearBound));
  yearMax.value = String(Math.min(c.end, maxYearBound));
};

function confirm() {
  let minY = parseInt(yearMin.value, 10);
  let maxY = parseInt(yearMax.value, 10);
  if (Number.isFinite(minY)) minY = Math.min(Math.max(minY, minYearBound), maxYearBound);
  if (Number.isFinite(maxY)) maxY = Math.min(Math.max(maxY, minYearBound), maxYearBound);
  if (Number.isFinite(minY) && Number.isFinite(maxY) && maxY < minY) maxY = minY;
  const payload = {
    start: Number.isFinite(minY) ? `${minY}-01-01` : "",
    end: Number.isFinite(maxY) ? `${maxY}-12-31` : "",
  };
  emit("confirm", payload);
  open.value = false;
}

watch(
  () => props.modelValue,
  (isOpen, wasOpen) => {
    if (isOpen && !wasOpen) {
      emit("open");
      document.body.style.overflow = "hidden";
    }
    if (!isOpen && wasOpen) {
      document.body.style.overflow = "";
    }
  }
);

onUnmounted(() => {
  document.body.style.overflow = "";
});
</script>

<style scoped>
.drawer-content .btn.btn-sm,
.drawer-content .badge,
.drawer-content .form-select,
.drawer-content.btn {
  border-radius: 2px !important;
}

.drawer-content .d-flex > .btn.flex-fill {
  min-width: 0;
}

.drawer-close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  min-width: 24px;
  border-radius: 50%;
  background-color: #000;
  color: #fff;
  border: none;
  padding: 0;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
}
</style>
<style scoped>
.drawer-content .drawer-actions {
  grid-template-columns: 1fr 1fr;
}
.drawer-content .drawer-actions > .btn {
  width: 100%;
}
</style>
