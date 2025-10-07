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

<script>
import { ref, computed, watch } from "vue";
import UiMobileDrawer from "@/components/ui/UiMobileDrawer.vue";

export default {
  name: "MobileDrawerSearchColor",
  components: { UiMobileDrawer },
  props: {
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
  },
  emits: ["update:modelValue", "update:value", "confirm"],
  setup(props, { emit }) {
    const open = computed({
      get: () => props.modelValue,
      set: (value) => emit("update:modelValue", value),
    });

    const suggestions = computed(() => props.availableColors);

    // Helpers to convert HSL <-> HEX
    const hslToHex = (h, s, l) => {
      const s1 = s / 100;
      const l1 = l / 100;
      const c = (1 - Math.abs(2 * l1 - 1)) * s1;
      const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
      const m = l1 - c / 2;
      let r = 0,
        g = 0,
        b = 0;
      if (h < 60) {
        r = c;
        g = x;
        b = 0;
      } else if (h < 120) {
        r = x;
        g = c;
        b = 0;
      } else if (h < 180) {
        r = 0;
        g = c;
        b = x;
      } else if (h < 240) {
        r = 0;
        g = x;
        b = c;
      } else if (h < 300) {
        r = x;
        g = 0;
        b = c;
      } else {
        r = c;
        g = 0;
        b = x;
      }
      const toHex = (n) =>
        Math.round((n + m) * 255)
          .toString(16)
          .padStart(2, "0");
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toLowerCase();
    };

    const hexToHue = (hex) => {
      if (!hex) return null;
      const clean = hex.replace("#", "");
      const bigint = parseInt(
        clean.length === 3
          ? clean
              .split("")
              .map((c) => c + c)
              .join("")
          : clean,
        16
      );
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      const rn = r / 255,
        gn = g / 255,
        bn = b / 255;
      const max = Math.max(rn, gn, bn),
        min = Math.min(rn, gn, bn);
      const d = max - min;
      if (d === 0) return 0;
      let h = 0;
      switch (max) {
        case rn:
          h = ((gn - bn) / d) % 6;
          break;
        case gn:
          h = (bn - rn) / d + 2;
          break;
        default:
          h = (rn - gn) / d + 4;
          break;
      }
      h = Math.round(h * 60);
      if (h < 0) h += 360;
      return h;
    };

    const hue = ref(210);
    const selectedColor = ref(props.value || hslToHex(hue.value, 100, 50));

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
      () => props.value,
      (next) => {
        if (next) {
          selectedColor.value = next;
          const h = hexToHue(next);
          if (h !== null) hue.value = h;
        }
      }
    );

    const confirm = () => {
      emit("confirm", selectedColor.value);
      open.value = false;
    };

    return {
      open,
      suggestions,
      hue,
      selectedColor,
      onHueInput,
      select,
      confirm,
    };
  },
};
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
