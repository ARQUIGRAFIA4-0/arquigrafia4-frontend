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
const MARGIN_Y = 20;
const DOT_RADIUS = 3;
const DOT_GAP_ABOVE_LINE = 3; // espaço entre a base do ponto e a linha

const dots = computed(() => {
  const { lineCount, dotPositions } = cover.value;
  if (!lineCount) return [];

  const usableWidth = VIEWBOX_WIDTH - MARGIN_X * 2;
  const usableHeight = VIEWBOX_HEIGHT - MARGIN_Y * 2;
  const step = lineCount > 1 ? usableHeight / (lineCount - 1) : 0;

  return Array.from({ length: lineCount }, (_, index) => {
    const lineY = lineCount > 1 ? MARGIN_Y + step * index : VIEWBOX_HEIGHT / 2;
    const dotY = lineY - DOT_RADIUS - DOT_GAP_ABOVE_LINE;
    const t = dotPositions[index] ?? 0.5;
    const x = MARGIN_X + t * usableWidth;
    return { id: `dot-${index}`, x, y: dotY };
  });
});
</script>

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
        r="3"
        class="album-cover-art__dot"
      />
    </svg>
  </div>
</template>

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
}

.album-cover-art__svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.album-cover-art__dot {
  fill: #1a1a1a;
}
</style>
