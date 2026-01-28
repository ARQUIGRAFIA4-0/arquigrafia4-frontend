<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  gap: {
    type: Number,
    default: 5
  },
  columnWidths: {
    type: Array,
    default: () => [320, 200, 280, 260, 210, 220, 300]
  },
  minColumns: {
    type: Number,
    default: 2
  },
  maxColumns: {
    type: Number,
    default: 7
  },
  itemsPerColumn: {
    type: Number,
    default: 6
  },
  minHeight: {
    type: Number,
    default: 200
  },
  maxHeight: {
    type: Number,
    default: 400
  }
});

const columns = ref(5);
const heights = ref([]);

// Obtém a largura da coluna (imita o comportamento do masonry-wall)
const getColumnWidthTarget = (columnIndex) => {
  if (typeof props.columnWidths === 'number') {
    return props.columnWidths;
  }
  // Repete os valores caso o índice da coluna ultrapasse o tamanho do array
  return props.columnWidths[columnIndex % props.columnWidths.length];
};

// Calcula o número de colunas com base na largura da tela
const calculateColumns = () => {
  const screenWidth = window.innerWidth;
  const avgColumnWidth = Array.isArray(props.columnWidths) 
    ? props.columnWidths.reduce((a, b) => a + b, 0) / props.columnWidths.length
    : props.columnWidths;
  
  // Calcula quantas colunas cabem
  let cols = Math.floor((screenWidth + props.gap) / (avgColumnWidth + props.gap));
  
  // Respeita os limites mínimo/máximo
  cols = Math.max(props.minColumns, Math.min(props.maxColumns, cols));
  
  return cols;
};

// Gera alturas aleatórias para os itens do skeleton
const generateHeights = (numColumns) => {
  const allHeights = [];
  const heightRange = props.maxHeight - props.minHeight;
  
  for (let col = 0; col < numColumns; col++) {
    const columnHeights = [];
    for (let i = 0; i < props.itemsPerColumn; i++) {
      const randomHeight = Math.floor(Math.random() * heightRange) + props.minHeight;
      columnHeights.push(randomHeight);
    }
    allHeights.push(columnHeights);
  }
  
  return allHeights;
};

// Inicializa o skeleton
const initSkeleton = () => {
  columns.value = calculateColumns();
  heights.value = generateHeights(columns.value);
};

// Lida com o redimensionamento da janela
const handleResize = () => {
  const newColumns = calculateColumns();
  if (newColumns !== columns.value) {
    columns.value = newColumns;
    heights.value = generateHeights(newColumns);
  }
};

onMounted(() => {
  initSkeleton();
  window.addEventListener('resize', handleResize, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<template>
  <div class="skeleton-masonry" :style="{ display: 'flex', gap: `${gap}px` }">
    <div
      v-for="columnIndex in columns"
      :key="`skeleton-col-${columnIndex}`"
      class="skeleton-column"
      :style="{
        display: 'flex',
        flexDirection: 'column',
        gap: `${gap}px`,
        flexBasis: `${getColumnWidthTarget(columnIndex - 1)}px`,
        flexGrow: 1,
        minWidth: '0'
      }"
    >
      <div
        v-for="(height, itemIndex) in heights[columnIndex - 1]"
        :key="`skeleton-${columnIndex}-${itemIndex}`"
        class="skeleton-item"
        :style="{ height: `${height}px` }"
      >
        <div class="skeleton-shimmer"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-masonry {
  width: 100%;
  animation: fadeIn 0.3s ease-in;
}

.skeleton-column {
  animation: fadeIn 0.5s ease-in;
}

.skeleton-item {
  position: relative;
  background: #e0e0e0;
  overflow: hidden;
  animation: fadeIn 0.3s ease-in;
}

.skeleton-shimmer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.5),
    transparent
  );
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
