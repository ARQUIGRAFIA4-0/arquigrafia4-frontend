<script setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";

defineOptions({ name: "UiExpandableText" });

// Texto limitado a N linhas com "ver mais"/"ver menos". A tipografia é herdada
// do elemento raiz, então basta aplicar a classe de texto no componente.
const props = defineProps({
  text: { type: String, default: "" },
  lines: { type: Number, default: 8 },
});

const textRef = ref(null);
const isExpanded = ref(false);
const isOverflowing = ref(false);

let resizeObserver = null;

function measure() {
  const el = textRef.value;
  // Expandido não há clamp para medir; mantém o último resultado.
  if (!el || isExpanded.value) return;
  isOverflowing.value = el.scrollHeight > el.clientHeight + 1;
}

function toggle() {
  isExpanded.value = !isExpanded.value;
}

watch(
  () => props.text,
  async () => {
    isExpanded.value = false;
    await nextTick();
    measure();
  }
);

onMounted(() => {
  measure();
  if (typeof ResizeObserver !== "undefined" && textRef.value) {
    resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(textRef.value);
  }
});

onUnmounted(() => {
  resizeObserver?.disconnect();
});
</script>

<template>
  <div class="ui-expandable-text">
    <p
      ref="textRef"
      class="ui-expandable-text__content"
      :class="{ 'ui-expandable-text__content--clamped': !isExpanded }"
      :style="{ '--ui-expandable-lines': lines }"
    >{{ text }}</p>
    <button
      v-if="isOverflowing"
      type="button"
      class="ui-expandable-text__toggle"
      :aria-expanded="isExpanded"
      @click="toggle"
    >
      {{ isExpanded ? "ver menos" : "ver mais" }}
    </button>
  </div>
</template>

<style scoped>
.ui-expandable-text__content {
  margin: 0;
  white-space: pre-line;
}

.ui-expandable-text__content--clamped {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: var(--ui-expandable-lines, 8);
  line-clamp: var(--ui-expandable-lines, 8);
  overflow: hidden;
}

.ui-expandable-text__toggle {
  margin: 4px 0 0;
  padding: 0;
  border: 0;
  background: none;
  color: var(--Laranja_E, #aa4f28);
  font: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
}
</style>
