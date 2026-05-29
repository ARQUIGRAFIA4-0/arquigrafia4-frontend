<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

// Formato esperado:
// [
//   {
//     id: 1,
//     term: "Tag 1"
//   },
//   {
//     id: 2,
//     term: "Tag 2"
//   }
// ]
const props = defineProps({
  subjects: {
    type: Array,
    default: () => [],
  },
  gap: {
    type: Number,
    default: 6,
  },
});

const containerRef = ref(null);
const visibleCount = ref(0);
let resizeObserver = null;
let recomputeFrame = null;

// Estima a largura de uma tag
function estimateTagWidth(label) {
  const text = String(label ?? "");
  const canvas = estimateTagWidth._canvas || (estimateTagWidth._canvas = document.createElement("canvas"));
  const ctx = canvas.getContext("2d");
  ctx.font = '400 12px "DM Sans", sans-serif';
  const textWidth = Math.ceil(ctx.measureText(text).width);

  return textWidth + 18;
}

function estimateOverflowTagWidth(count) {
  return estimateTagWidth(`+${count}`);
}

function recompute() {
  const subjects = Array.isArray(props.subjects) ? props.subjects : [];
  const container = containerRef.value;
  if (!container) return;

  const maxWidth = container.clientWidth;
  if (!maxWidth) return;
  const maxLines = 2;

  let line = 1;
  let lineUsed = 0;
  let count = 0;

  for (let i = 0; i < subjects.length; i++) {
    const remainingAfterThis = subjects.length - (i + 1);
    const tagWidth = estimateTagWidth(subjects[i]?.term);
    const overflowWidth =
      remainingAfterThis > 0 ? props.gap + estimateOverflowTagWidth(remainingAfterThis) : 0;
    const gapBefore = lineUsed > 0 ? props.gap : 0;
    const projectedCurrentLine = lineUsed + gapBefore + tagWidth + overflowWidth;

    if (projectedCurrentLine <= maxWidth) {
      count += 1;
      lineUsed += gapBefore + tagWidth;
      continue;
    }

    if (line < maxLines) {
      const projectedNextLine = tagWidth + overflowWidth;
      if (projectedNextLine <= maxWidth) {
        line += 1;
        count += 1;
        lineUsed = tagWidth;
        continue;
      }
    }

    break;
  }

  visibleCount.value = Math.max(1, count);
}

function scheduleRecompute() {
  if (recomputeFrame) {
    cancelAnimationFrame(recomputeFrame);
  }

  recomputeFrame = requestAnimationFrame(() => {
    recomputeFrame = null;
    recompute();
  });
}

const visibleSubjects = computed(() => props.subjects.slice(0, visibleCount.value));
const overflowCount = computed(() => Math.max(0, props.subjects.length - visibleCount.value));
const allSubjects = computed(() =>
  (Array.isArray(props.subjects) ? props.subjects : []).filter((s) => String(s?.term ?? "").trim())
);
const allTagsAriaLabel = computed(() => allSubjects.value.map((s) => s.term).join(", "));

const showTooltip = ref(false);
const tooltipStyle = ref({});

function updateTooltipPosition() {
  const el = containerRef.value;
  if (!el) return;

  const rect = el.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;

  tooltipStyle.value = {
    left: `${centerX}px`,
    top: `${rect.top}px`,
    transform: "translate(-50%, calc(-100% - 14px))",
  };
}

function openTooltip() {
  if (overflowCount.value <= 0) return;
  updateTooltipPosition();
  showTooltip.value = true;
}

function closeTooltip() {
  showTooltip.value = false;
}

function onViewportChange() {
  if (showTooltip.value) {
    updateTooltipPosition();
  }
  scheduleRecompute();
}

function onResize() {
  onViewportChange();
}

onMounted(async () => {
  await nextTick();
  scheduleRecompute();

  if (containerRef.value && "ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(() => {
      scheduleRecompute();
    });

    resizeObserver.observe(containerRef.value);
  }

  window.addEventListener("resize", onResize);
  window.addEventListener("scroll", onViewportChange, true);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  window.removeEventListener("scroll", onViewportChange, true);

  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }

  if (recomputeFrame) {
    cancelAnimationFrame(recomputeFrame);
    recomputeFrame = null;
  }
});

watch(
  () => props.subjects,
  async () => {
    await nextTick();
    scheduleRecompute();
  },
  { deep: true }
);
</script>

<template>
  <div
    v-if="subjects?.length"
    ref="containerRef"
    class="fit-tags"
    :class="{ 'fit-tags--has-tooltip': overflowCount > 0 }"
    tabindex="0"
    :aria-label="overflowCount > 0 ? `Todas as tags: ${allTagsAriaLabel}` : undefined"
    @mouseenter="openTooltip"
    @mouseleave="closeTooltip"
    @focusin="openTooltip"
    @focusout="closeTooltip"
  >
    <Teleport to="body">
      <div
        v-if="overflowCount > 0 && showTooltip"
        class="fit-tags__tooltip fit-tags__tooltip--portal"
        :style="tooltipStyle"
        role="tooltip"
        :aria-label="allTagsAriaLabel"
      >
        <div class="fit-tags__tooltip-grid">
          <span
            v-for="(subject, index) in allSubjects"
            :key="`tooltip-${subject.id || subject.term}-${index}`"
            class="fit-tags__tag fit-tags__tag--mini"
          >
            {{ subject.term }}
          </span>
        </div>
      </div>
    </Teleport>

    <span
      v-for="(subject, index) in visibleSubjects"
      :key="subject.id || `${subject.term}-${index}`"
      class="fit-tags__tag"
    >
      {{ subject.term }}
    </span>

    <span v-if="overflowCount > 0" class="fit-tags__tag fit-tags__tag--overflow">
      +{{ overflowCount }}
    </span>
  </div>
</template>

<style scoped>
.fit-tags {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: auto;
  padding-top: 8px;
}

.fit-tags__tooltip {
  z-index: 1050;
  width: min(340px, calc(100vw - 48px));
  min-width: min(260px, calc(100vw - 48px));
  box-sizing: border-box;
  padding: 10px 12px;
  border-radius: 4px;
  border: 1px solid var(--Cinza_C, #a6a6a6);
  background: var(--Off_white, #faf9f9);
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.14);
  pointer-events: none;
  overflow: visible;
}

.fit-tags__tooltip--portal {
  position: fixed;
  animation: fit-tags-tooltip-in 0.16s ease;
}

@keyframes fit-tags-tooltip-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.fit-tags__tooltip::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: -5px;
  width: 8px;
  height: 8px;
  background: var(--Off_white, #faf9f9);
  border-right: 1px solid var(--Cinza_C, #a6a6a6);
  border-bottom: 1px solid var(--Cinza_C, #a6a6a6);
  transform: translateX(-50%) rotate(45deg);
  box-shadow: 2px 2px 4px rgba(15, 23, 42, 0.06);
}

.fit-tags__tooltip-grid {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: center;
  gap: 4px 6px;
}

.fit-tags__tag {
  border-radius: 2px;
  border: 1px solid var(--Cinza_C, #a6a6a6);
  padding: 6px 8px;
  font-size: 12px;
  line-height: 115%;
  color: var(--Cinza_E, #2f2f2f);
  background: var(--Off_white, #faf9f9);
  box-sizing: border-box;
}

.fit-tags__tag--mini {
  flex: 0 1 auto;
  border-radius: 2px;
  margin: 0;
  padding: 3px 6px;
  font-size: 10px;
  line-height: 115%;
  white-space: nowrap;
}

.fit-tags__tag--overflow {
  font-weight: 500;
}
</style>
