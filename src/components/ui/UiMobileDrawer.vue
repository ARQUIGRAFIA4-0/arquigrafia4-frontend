<template>
  <div
    class="offcanvas offcanvas-bottom"
    tabindex="-1"
    :id="id"
    :aria-labelledby="`${id}-label`"
    :data-bs-scroll="String(allowBodyScroll)"
    :data-bs-backdrop="backdropAttr"
  >
    <div class="offcanvas-header">
      <h2 class="h2" :id="`${id}-label`">
        {{ title }}
      </h2>
      <button
        type="button"
        class="btn-close header-close"
        data-bs-dismiss="offcanvas"
        aria-label="Close"
      ></button>
    </div>
    <div class="offcanvas-body p-0">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, watch, toRef, computed } from "vue";
import { Offcanvas as OffcanvasESM } from "bootstrap";

defineOptions({ name: "UiMobileDrawer" });

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    default: "",
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
  allowBodyScroll: {
    type: Boolean,
    default: true,
  },
  backdrop: {
    type: [Boolean, String],
    default: true, // true | false | 'static'
  },
});

const emit = defineEmits(["update:modelValue", "shown", "hidden"]);

const isOpen = toRef(props, "modelValue");
let instance = null;
let OffcanvasCtor = null;

const backdropAttr = computed(() =>
  props.backdrop === true
    ? true
    : props.backdrop === false
      ? false
      : props.backdrop
);

function ensureInstance() {
  if (!OffcanvasCtor) {
    OffcanvasCtor = window.bootstrap?.Offcanvas || OffcanvasESM || null;
  }
  if (!instance && OffcanvasCtor) {
    const el = document.getElementById(props.id);
    if (el) {
      instance = OffcanvasCtor.getOrCreateInstance(el, {
        scroll: props.allowBodyScroll,
        backdrop: props.backdrop,
      });
      el.addEventListener("shown.bs.offcanvas", () => {
        emit("shown");
        emit("update:modelValue", true);
      });
      el.addEventListener("hidden.bs.offcanvas", () => {
        emit("hidden");
        emit("update:modelValue", false);
      });
    }
  }
}

function open() {
  ensureInstance();
  instance?.show?.();
}

function close() {
  instance?.hide?.();
}

watch(isOpen, (next) => {
  if (next) open();
  else close();
});

onMounted(() => {
  ensureInstance();
  if (props.modelValue) open();
});

onBeforeUnmount(() => {
  try {
    instance?.dispose?.();
  } catch (_) {
    // ignore
  }
  instance = null;
});
</script>

<style scoped>
.offcanvas-bottom {
  height: stretch;
  box-shadow: var(--shadow-elevation-high);
  transform: none;
  opacity: 0;
  transition: opacity 0.10s linear;
}

.offcanvas-bottom.show {
  opacity: 1;
}

.offcanvas-header {
  padding: 12px 16px 0px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}
.offcanvas-title {
  font-size: 16px;
  text-align: center;
  margin: 0;
}
.offcanvas-body {
  overflow-y: auto;
}
.header-close {
  position: absolute;
  top: 8px;
  right: 12px;
  display: none;
}
</style>
