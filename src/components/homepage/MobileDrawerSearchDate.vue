<template>
  <ui-mobile-drawer
    id="drawer-search-date"
    v-model="open"
    title="Busca por período"
  >
    <div class="p-3 drawer-content">
      <div class="mb-3">
        <div class="h2">Filtrar por</div>
        <div class="d-flex align-items-center gap-4">
          <div class="form-check">
            <input
              class="form-check-input"
              type="radio"
              name="date-filter-type"
              id="filter-creation"
              value="creation"
              v-model="dateFilterType"
            />
            <label class="form-check-label" for="filter-creation"
              >Data de criação</label
            >
          </div>
          <div class="form-check">
            <input
              class="form-check-input"
              type="radio"
              name="date-filter-type"
              id="filter-upload"
              value="upload"
              v-model="dateFilterType"
            />
            <label class="form-check-label" for="filter-upload"
              >Data de upload</label
            >
          </div>
        </div>
      </div>

      <div class="row g-2 align-items-end mb-3">
        <div class="col">
          <label class="form-label">De</label>
          <input v-model="dateFrom" type="date" class="form-control" />
        </div>
        <div class="col">
          <label class="form-label">Até</label>
          <input v-model="dateTo" type="date" class="form-control" />
        </div>
      </div>

      <div class="mb-3">
        <div class="form-range-dual form-range-primary" :style="dualRangeStyle">
          <input
            class="form-range"
            type="range"
            :min="minYearBound"
            :max="maxYearBound"
            step="1"
            v-model.number="yearMin"
            @input="onYearMinInput"
          />
          <input
            class="form-range"
            type="range"
            :min="minYearBound"
            :max="maxYearBound"
            step="1"
            v-model.number="yearMax"
            @input="onYearMaxInput"
          />
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
              isDecadeSelected(d) ? 'btn-dark' : 'btn-outline-secondary',
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
              isCenturySelected(c.code) ? 'btn-dark' : 'btn-outline-secondary',
            ]"
            @click="selectCentury(c.code)"
          >
            {{ c.label }}
          </button>
        </div>
      </div>

      <div class="drawer-actions d-grid gap-2 pt-3">
        <button class="btn btn-outline-secondary" @click="open = false">
          Cancelar
        </button>
        <button class="btn btn-dark" @click="confirm">Buscar</button>
      </div>
    </div>
  </ui-mobile-drawer>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import UiMobileDrawer from "@/components/ui/UiMobileDrawer.vue";
import {
  parseYearFromDateString,
  clampYear,
  setDateYear,
} from "@/helpers/dateUtils";

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
});

const emit = defineEmits([
  "update:modelValue",
  "update:value",
  "confirm",
  "open",
]);

const open = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

// State
const dateFilterType = ref("creation");
const dateFrom = ref(props.value?.start || "");
const dateTo = ref(props.value?.end || "");

watch(
  () => props.value,
  (value) => {
    dateFrom.value = value?.start || "";
    dateTo.value = value?.end || "";
  },
  { immediate: true }
);

const minYearBound = 1800;
const maxYearBound = new Date().getFullYear();
const initialMax = Math.min(2020, maxYearBound);
const initialMin = Math.max(2010, minYearBound);
const yearMin = ref(initialMin);
const yearMax = ref(initialMax);

// Calculate percentage compensating for thumb size
// The thumb is 32px (20px track * 1.6), so we need to account for it
const pct = (y) => {
  const range = maxYearBound - minYearBound;
  const normalized = (y - minYearBound) / range;
  const thumbWidthPx = 32; // calc(20px * 1.6) from CSS

  // For range inputs, the thumb center is positioned at the percentage
  // So we need to offset by half the thumb width on each side
  // This creates the formula: actualPos = thumbHalfWidth + (percentage * (width - thumbWidth))
  // Which simplifies to: percentage in CSS-friendly format
  return `calc(${normalized * 100}% * (100% - ${thumbWidthPx}px) / 100% + ${thumbWidthPx / 2}px)`;
};

const dualRangeStyle = computed(() => ({
  "--min": pct(yearMin.value),
  "--max": pct(yearMax.value),
}));

const onYearMinInput = () => {
  if (yearMin.value > yearMax.value) yearMin.value = yearMax.value;
};
const onYearMaxInput = () => {
  if (yearMax.value < yearMin.value) yearMax.value = yearMin.value;
};

const isSyncing = ref(false);
const clampYearLocal = (y) => clampYear(y, minYearBound, maxYearBound);
const parseYearLocal = (dateStr) => {
  const y = parseYearFromDateString(dateStr);
  return y !== null ? clampYearLocal(y) : null;
};
const ensureYearOrder = () => {
  if (yearMin.value > yearMax.value) yearMax.value = yearMin.value;
};
const updateDatesFromYears = () => {
  dateFrom.value = setDateYear(dateFrom.value, yearMin.value, true);
  dateTo.value = setDateYear(dateTo.value, yearMax.value, false);
  emit("update:value", { start: dateFrom.value, end: dateTo.value });
};

// Initialize dates to reflect initial slider values
updateDatesFromYears();

// Watchers to keep everything in sync
watch([yearMin, yearMax], () => {
  if (isSyncing.value) return;
  isSyncing.value = true;
  ensureYearOrder();
  updateDatesFromYears();
  isSyncing.value = false;
});
watch(dateFrom, () => {
  if (isSyncing.value) return;
  const y = parseYearLocal(dateFrom.value);
  if (y === null) return;
  isSyncing.value = true;
  yearMin.value = clampYearLocal(y);
  ensureYearOrder();
  // Normalize to whole-year boundaries
  updateDatesFromYears();
  isSyncing.value = false;
});
watch(dateTo, () => {
  if (isSyncing.value) return;
  const y = parseYearLocal(dateTo.value);
  if (y === null) return;
  isSyncing.value = true;
  yearMax.value = clampYearLocal(y);
  ensureYearOrder();
  // Normalize to whole-year boundaries
  updateDatesFromYears();
  isSyncing.value = false;
});

const decadeOptions = ref([1960, 1970, 1980, 1990, 2000, 2010, 2020]);
const isDecadeSelected = (d) =>
  yearMin.value === d && yearMax.value === Math.min(d + 9, maxYearBound);
const selectDecade = (d) => {
  yearMin.value = d;
  yearMax.value = Math.min(d + 9, maxYearBound);
};

const centuryOptions = ref([
  { code: "XIX", label: "XIX", start: 1800, end: 1899 },
  { code: "XX", label: "XX", start: 1900, end: 1999 },
  { code: "XXI", label: "XXI", start: 2000, end: 2099 },
]);
const isCenturySelected = (code) => {
  const c = centuryOptions.value.find((x) => x.code === code);
  if (!c) return false;
  return (
    yearMin.value === Math.max(c.start, minYearBound) &&
    yearMax.value === Math.min(c.end, maxYearBound)
  );
};
const selectCentury = (code) => {
  const c = centuryOptions.value.find((x) => x.code === code);
  if (!c) return;
  yearMin.value = Math.max(c.start, minYearBound);
  yearMax.value = Math.min(c.end, maxYearBound);
};

function confirm() {
  const payload = {
    start: dateFrom.value,
    end: dateTo.value,
  };
  emit("confirm", payload);
  open.value = false;
}

watch(
  () => props.modelValue,
  (isOpen, wasOpen) => {
    if (isOpen && !wasOpen) {
      emit("open");
    }
    if (!isOpen && wasOpen) {
      dateFilterType.value = "creation";
    }
  }
);
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
</style>
<style scoped>
.drawer-content .drawer-actions {
  grid-template-columns: 1fr 1fr;
}
.drawer-content .drawer-actions > .btn {
  width: 100%;
}
</style>
