<template>
  <ui-mobile-drawer
    id="drawer-search-color"
    v-model="open"
    title="Busca por cor"
  >
    <div class="p-3">
      <div class="mb-4">
        <div class="d-flex align-items-center gap-3">
          <div
            class="color-preview"
            :style="{ backgroundColor: selectedColor }"
            aria-hidden="true"
          ></div>
          <input
            class="form-range form-range-hue flex-fill"
            type="range"
            min="0"
            max="360"
            step="1"
            v-model.number="hue"
            @input="onHueInput"
            :style="{ '--hue': hue }"
            aria-label="Selecionar matiz"
          />
        </div>
      </div>

      <!-- Suggestions grid -->
      <div class="mb-2">
        <div class="h2">Sugestões</div>
      </div>
      <div class="d-flex flex-wrap gap-3 mb-4">
        <button
          v-for="color in suggestions"
          :key="color"
          type="button"
          class="swatch"
          :style="{
            backgroundColor: color,
            outline: selectedColor === color ? '3px solid #111' : 'none',
          }"
          @click="select(color)"
          :aria-label="`Escolher cor ${color}`"
        />
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
import { ref, computed, watch } from "vue";
import hslToHex from "@/helpers/hslToHex";
import hexToHue from "@/helpers/hexToHue";
import UiMobileDrawer from "@/components/ui/UiMobileDrawer.vue";

defineOptions({ name: "MobileDrawerSearchColor" });

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  availableColors: {
    type: Array,
    default: () => [
      "#ef4444",
      "#d97706",
      "#22c55e",
      "#0ea5e9",
      "#1d4ed8",
      "#fda4af",
      "#fdba74",
      "#bbf7d0",
      "#bae6fd",
      "#c4b5fd",
    ],
  },
  value: {
    type: String,
    default: null,
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

const suggestions = computed(() => props.availableColors);

const hue = ref(210);
const selectedColor = ref(props.value || hslToHex(hue.value, 100, 50));

watch(
  () => props.value,
  (value) => {
    if (!value) {
      return;
    }
    selectedColor.value = value;
    const h = hexToHue(value);
    if (h !== null) hue.value = h;
  },
  { immediate: true }
);

const onHueInput = () => {
  selectedColor.value = hslToHex(hue.value, 100, 50);
  emit("update:value", selectedColor.value);
};

const select = (color) => {
  selectedColor.value = color;
  const h = hexToHue(color);
  if (h !== null) hue.value = h;
  emit("update:value", color);
};

watch(
  () => props.modelValue,
  (isOpen, wasOpen) => {
    if (isOpen && !wasOpen) {
      emit("open");
    }
  }
);

function confirm() {
  emit("confirm", selectedColor.value);
  open.value = false;
}
</script>

<style scoped>
.color-preview {
  width: 32px !important;
  height: 32px !important;
  min-width: 32px;
  min-height: 32px;
  max-width: 32px;
  max-height: 32px;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  border: none;
  flex: 0 0 auto;
  pointer-events: none;
}

.swatch {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.15);
}
</style>
<style scoped>
.drawer-actions {
  grid-template-columns: 1fr 1fr;
}
.drawer-actions > .btn {
  width: 100%;
}
</style>
