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
  const text = String(label ?? ""); // Converte o label para string
  const canvas = estimateTagWidth._canvas || (estimateTagWidth._canvas = document.createElement("canvas")); // Canvas para medir a largura do texto
  const ctx = canvas.getContext("2d"); // Contexto do canvas
  ctx.font = '400 12px "DM Sans", sans-serif'; // Fonte do texto
  const textWidth = Math.ceil(ctx.measureText(text).width); // Largura do texto. para saber quantos pixels o texto ocupa com a fonte real (DM Sans 12px).

  // padding horizontal + borda + folga
  return textWidth + 18; // Largura total da tag

}

// Calcula a largura da própria tag de agrupamento (+3, +12, etc.), porque ela também ocupa espaço e precisa entrar no cálculo de layout.
function estimateOverflowTagWidth(count) {
  return estimateTagWidth(`+${count}`);
}

// Recomputa a quantidade de tags visíveis
function recompute() {
  // Converte para array se não for
  const subjects = Array.isArray(props.subjects) ? props.subjects : [];

  // Container ref é o elemento que contém as tags
  const container = containerRef.value;
  if (!container) return;

  // Largura máxima do container
  const maxWidth = container.clientWidth;
  if (!maxWidth) return;
  const maxLines = 2; // Quantidade máxima de linhas

  let line = 1;
  let lineUsed = 0;
  let count = 0;

  for (let i = 0; i < subjects.length; i++) {
    const remainingAfterThis = subjects.length - (i + 1);
    const tagWidth = estimateTagWidth(subjects[i]?.term);

    // Reserva espaço para o +N quando ainda há itens ocultos
    const overflowWidth =
      remainingAfterThis > 0 ? props.gap + estimateOverflowTagWidth(remainingAfterThis) : 0;

    // Tentar colocar na linha atual
    const gapBefore = lineUsed > 0 ? props.gap : 0; // Espaço antes da tag
    const projectedCurrentLine = lineUsed + gapBefore + tagWidth + overflowWidth; // Largura projetada da linha atual

    // Se a tag cabe na linha atual
    if (projectedCurrentLine <= maxWidth) {
      // Incrementa a quantidade de tags visíveis
      count += 1;
      lineUsed += gapBefore + tagWidth;
      continue;
    }

    // Tentar quebrar para a próxima linha (se ainda houver)
    if (line < maxLines) {
      const projectedNextLine = tagWidth + overflowWidth;
      if (projectedNextLine <= maxWidth) {
        line += 1;
        count += 1;
        lineUsed = tagWidth; // começa nova linha com essa tag
        continue;
      }
    }

    // Não cabe nem na linha atual nem na próxima
    break;
  }

  // Garante ao menos 1 tag visível se houver subjects
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

const visibleSubjects = computed(() => props.subjects.slice(0, visibleCount.value)); // Pega as tags visíveis
const overflowCount = computed(() => Math.max(0, props.subjects.length - visibleCount.value)); // Calcula a quantidade de tags que não cabem

function onResize() {
  scheduleRecompute();
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
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);

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
  <div v-if="subjects?.length" ref="containerRef" class="fit-tags">
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
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: auto;
  padding-top: 8px;
}

.fit-tags__tag {
  border-radius: 2px;
  border: 1px solid var(--Laranja_E, #AA4F28);
  padding: 6px 8px;
  font-size: 12px;
  line-height: 115%;
  color: var(--Laranja_E, #AA4F28);
}

.fit-tags__tag--overflow {
  font-weight: 500;
}
</style>