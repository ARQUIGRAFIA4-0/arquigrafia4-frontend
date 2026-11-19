<template>
  <div class="collection-covers-preview" role="img" aria-label="Exemplos de capas de coleções">
    <AlbumCoverArt v-for="album in SAMPLE_ALBUMS" :key="album.id" :album="album" />
  </div>
</template>

<script setup>
import AlbumCoverArt from "@/components/AlbumCoverArt.vue";

// Coleções fictícias, só com os `stats` que AlbumCoverArt usa, escolhidas para
// mostrar as 4 cores, os 3 traçados e quantidades de linhas diferentes.
const binomials = (values) => values.map((average, order) => ({ order, average }));

const SAMPLE_ALBUMS = [
  { id: "sample-1", stats: { total_images: 10, total_unique_tags: 80, date_range: { from: 1900, to: 1940 }, binomial_averages: binomials([20, 85, 50, 70, 35, 60]) } },
  { id: "sample-2", stats: { total_images: 2, total_unique_tags: 10, date_range: { from: 1950, to: 1980 }, binomial_averages: binomials([30, 75, 40, 80, 25, 55]) } },
  { id: "sample-3", stats: { total_images: 20, total_unique_tags: 150, date_range: { from: 1990, to: 1995 }, binomial_averages: binomials([25, 70, 30, 85, 45, 20]) } },
  { id: "sample-4", stats: { total_images: 5, total_unique_tags: 40, date_range: { from: 1800, to: 1990 }, binomial_averages: binomials([50, 65, 15, 75, 30, 60]) } },
  { id: "sample-5", stats: { total_images: 6, total_unique_tags: 4, date_range: { from: 2001, to: 2004 }, binomial_averages: binomials([40, 60, 35, 65, 50, 50]) } },
  { id: "sample-6", stats: { total_images: 12, total_unique_tags: 9, date_range: { from: 1850, to: 1990 }, binomial_averages: binomials([15, 85, 25, 90, 60, 40]) } },
];
</script>

<style lang="scss" scoped>
.collection-covers-preview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  width: 100%;
  height: 100%;
  background-color: var(--Branco, #fff);
}
</style>
