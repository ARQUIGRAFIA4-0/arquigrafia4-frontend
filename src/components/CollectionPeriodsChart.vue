<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import * as echarts from "echarts";

defineOptions({ name: "CollectionPeriodsChart" });

defineProps({
  ariaLabel: {
    type: String,
    default: "Gráfico de períodos da coleção",
  },
});

const chartRef = ref(null); // referência para o elemento do gráfico
let chartInstance = null; // instância do gráfico

/**
 * Linha horizontal em coordenadas do canvas: de 0 a largura total (o axisLine
 * nativo do ECharts no eixo categoria não ocupa o canvas inteiro).
 */
function buildFullWidthAxisGraphic(el) {
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  if (!w || !h) return [];
  const y = h - 28;
  return [
    {
      type: "line",
      shape: { x1: 0, y1: y, x2: w, y2: y },
      style: {
        stroke: "#1f1f1f",
        lineWidth: 1,
      },
      silent: true,
      z: 10,
    },
  ];
}

function buildMockOption() {
  const years = [];
  for (let y = 1960; y <= 2015; y++) {
    years.push(y);
  }

  const MOCK_BY_YEAR = {
    1961: 1, 1962: 1, 1963: 3, 1964: 1, 1965: 1, 1966: 1,
    1970: 1, 1971: 1, 1972: 1, 1973: 5, 1974: 1, 1975: 1, 1976: 1,
    1980: 1, 1981: 1, 1982: 3, 1983: 1, 1984: 1, 1985: 1, 1986: 5,
    1992: 1, 1998: 5, 1999: 2, 2000: 1, 2001: 1, 2002: 8, 2003: 2, 2004: 3, 2005: 1, 2006: 1, 2007: 1, 2008: 1,
    2010: 1, 2011: 3, 2012: 1, 2013: 1,
  };

  const values = years.map((y) => MOCK_BY_YEAR[y] ?? 0);

  return {
    animation: false,
    grid: {
      left: 0,
      right: 0,
      top: 8,
      bottom: 28,
      containLabel: false,
    },
    xAxis: {
      type: "category",
      data: years,
      boundaryGap: false,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: "#1f1f1f",
        fontFamily: '"DM Sans", sans-serif',
        fontSize: 11,
        interval: (index) => {
          const y = years[index];
          return y % 10 === 0;
        },
        formatter: (value) => {
          const y = Number(value);
          return y % 10 === 0 ? String(y) : "";
        },
      },
      splitLine: { show: false },
    },
    yAxis: {
      show: false,
      max: 5,
    },
    series: [
      {
        type: "bar",
        data: values,
        barWidth: "55%",
        barGap: "40%",
        itemStyle: {
          color: "#4a4a4a",
          borderRadius: [1, 1, 0, 0],
        },
      },
    ],
  };
}

// Inicializa o gráfico
function initChart() {

  // Limpa o gráfico
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }

  chartInstance = echarts.init(chartRef.value);
  chartInstance.setOption({
    ...buildMockOption(),
    graphic: buildFullWidthAxisGraphic(chartRef.value),
  });

}

// Limpa o gráfico
function disposeChart() {
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
}

// Redimensiona o gráfico
function onResize() {
  chartInstance.resize();
  chartInstance.setOption({ graphic: buildFullWidthAxisGraphic(chartRef.value) });
}

// Inicializa o gráfico
onMounted(() => {
  nextTick(() => {
    initChart();
    requestAnimationFrame(() => {

      chartInstance.setOption({ graphic: buildFullWidthAxisGraphic(chartRef.value) });
      
    });
    window.addEventListener("resize", onResize);
  });
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  disposeChart();
});

</script>

<template>
  <div
    ref="chartRef"
    class="collection-periods-chart"
    role="img"
    :aria-label="ariaLabel"
  />
</template>

<style scoped>
.collection-periods-chart {
  width: 100%;
  max-width: 430px;
  height: 82px;
}
</style>
