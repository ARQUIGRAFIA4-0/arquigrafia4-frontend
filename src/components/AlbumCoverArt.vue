<template>
  <div
    class="album-cover-art"
    :style="{ backgroundImage: `url(${backgroundSrc})` }"
  >
    <img
      v-if="linesSrc"
      :src="linesSrc"
      class="album-cover-art__lines"
      alt=""
      aria-hidden="true"
    />

    <svg
      v-if="dots.length"
      class="album-cover-art__svg"
      :viewBox="`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <circle
        v-for="dot in dots"
        :key="dot.id"
        :cx="dot.x"
        :cy="dot.y"
        r="8"
        class="album-cover-art__dot"
      />
    </svg>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { getAlbumCoverArt } from "@/helpers/albumCoverArt";
import albumDefaultImage from "@/assets/album-default.png";

const props = defineProps({
  album: { type: Object, required: true },
});

// Importa os 4 fundos e os 12 assets de linhas já existentes nos assets
// do projeto. Ajuste a extensão (.png/.jpg/.svg) conforme os arquivos reais.
const backgroundModules = import.meta.glob("@/assets/album/fundo-*.png", {
  eager: true,
  import: "default",
});
const linesModules = import.meta.glob("@/assets/album/linhas-*.png", {
  eager: true,
  import: "default",
});

function resolveAsset(modules, key, fallback = null) {
  if (!key) return fallback;
  const match = Object.entries(modules).find(([path]) =>
    path.endsWith(`${key}.png`),
  );
  return match ? match[1] : fallback;
}

const cover = computed(() => getAlbumCoverArt(props.album));
const backgroundSrc = computed(() =>
  resolveAsset(backgroundModules, cover.value.backgroundKey, albumDefaultImage),
);
const linesSrc = computed(() =>
  resolveAsset(linesModules, cover.value.linesAssetKey),
);

// ---- geometria dos pontos ---------------------------------------------
// As linhas em si vêm prontas no asset (linesSrc): sempre 5, igualmente
// espaçadas (confirmado com o design). Aqui só calculamos onde cada
// ponto cai — sentado ACIMA da linha correspondente, como uma letra
// escrita em cima da pauta de um caderno (o ponto não fica centralizado
// em cima do traço, e sim encostado por cima dele).
const VIEWBOX_WIDTH = 300;
const VIEWBOX_HEIGHT = 300;
const MARGIN_X = 24;
const TOP_MARGIN = 34;
const BOTTOM_MARGIN = 11;
const DOT_RADIUS = 8;
const DOT_GAP_ABOVE_LINE = 3; // espaço entre a base do ponto e a linha
const DOT_COUNT = 6;

const dots = computed(() => {
  const { lineCount, dotPositions } = cover.value;
  
  if (!lineCount) return [];

  const usableWidth = VIEWBOX_WIDTH - MARGIN_X * 2;
  const usableHeight = VIEWBOX_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN;
  const step = usableHeight / (DOT_COUNT - 1);

  return Array.from({ length: DOT_COUNT }, (_, index) => {
    const lineY = TOP_MARGIN + step * index;
    const dotY = lineY - DOT_RADIUS - DOT_GAP_ABOVE_LINE;
    const t = dotPositions[index] ?? 0.5;
    const x = MARGIN_X + t * usableWidth;
    return { id: `dot-${index}`, x, y: dotY };
  });
});
</script>

<style lang="scss" scoped>
.album-cover-art {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  position: relative;
  overflow: hidden;
}

.album-cover-art__lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  // Equivalente ao `ctx.globalCompositeOperation = 'multiply'` (OVERLAY_BLEND)
  // usado no protótipo em canvas: faz o asset de linhas se misturar com a
  // cor do fundo (áreas claras do PNG "somem", só o traço escuro aparece
  // tingido pela cor do fundo) em vez de simplesmente cobrir o fundo.
  mix-blend-mode: multiply;
}

.album-cover-art__svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  // Equivalente ao PROCEDURAL_BLEND ('multiply') aplicado aos pontos no
  // protótipo em canvas, mantendo a mesma composição de camadas
  // (fundo -> linhas -> pontos, todas em multiply) especificada na reunião.
  mix-blend-mode: multiply;
}

.album-cover-art__dot {
  fill: #1a1a1a;
}
</style>
