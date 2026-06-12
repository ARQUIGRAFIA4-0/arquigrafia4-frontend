<script setup>
defineOptions({ name: "CollectionEditImagesGrid" });

// Props
const props = defineProps({
  images: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
});

// Formata a data da imagem.
function formatDate(dates) {
  if (!dates || dates.length === 0) return null;

  const dateInfo = dates.find((d) => d.type === "creation") || dates[0];
  if (!dateInfo) return null;

  const earliest = dateInfo.earliest_date ? new Date(dateInfo.earliest_date).getFullYear() : null;

  const latest = dateInfo.latest_date ? new Date(dateInfo.latest_date).getFullYear() : null;

  const circa = dateInfo.circa_earliest_date || dateInfo.circa_latest_date;

  if (!earliest) return null;

  const prefix = circa ? "c." : "";

  if (!latest || earliest === latest) {
    return `${prefix}${earliest}`;
  }

  return `${prefix}${earliest}-${latest}`;
  
}
</script>

<template>
  <div
    v-if="isLoading"
    class="collection-edit-images-grid"
    role="status"
    aria-label="Carregando imagens da coleção"
  >
    <article
      v-for="n in 6"
      :key="`collection-edit-skeleton-${n}`"
      class="collection-edit-images-grid__card collection-edit-images-grid__card--skeleton"
      aria-hidden="true"
    >
      <div class="collection-edit-images-grid__image-skeleton" />
      <div class="collection-edit-images-grid__body">
        <div class="collection-edit-images-grid__title-skeleton" />
        <div class="collection-edit-images-grid__subtitle-skeleton" />
      </div>
    </article>
    <span class="visually-hidden">Carregando imagens...</span>
  </div>

  <div
    v-else-if="images.length"
    class="collection-edit-images-grid"
    aria-label="Imagens da coleção"
  >
    <article
      v-for="item in images"
      :key="item.id"
      class="collection-edit-images-grid__card"
    >
      <div class="collection-edit-images-grid__image-wrap">
        <img
          :src="item.imageUrl"
          :alt="item.title || 'Imagem da coleção'"
          class="collection-edit-images-grid__image"
          loading="lazy"
        />
      </div>

      <div class="collection-edit-images-grid__body">
        <h3 class="collection-edit-images-grid__title">
          {{ item.title || "Sem título" }}
        </h3>
        <p
          v-if="formatDate(item.dates)"
          class="collection-edit-images-grid__subtitle"
        >
          {{ formatDate(item.dates) }}
        </p>
      </div>
    </article>
  </div>

  <p v-else class="collection-edit-images-grid__empty">
    Esta coleção ainda não possui imagens.
  </p>
</template>

<style scoped lang="scss">
.collection-edit-images-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  align-items: start;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

@container collection-edit-images (max-width: 560px) {
  .collection-edit-images-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.collection-edit-images-grid__card {
  display: flex;
  width: 100%;
  padding-bottom: var(--pp, 8px);
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  border-radius: 5px;
  border: 0.25px solid var(--Cinza_C, #a6a6a6);
  background: var(--Branco, #fff);
  box-shadow: 1px 1px 3px 2px rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
  overflow: hidden;
}

.collection-edit-images-grid__image-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 220 / 198;
  flex: 0 0 auto;
  overflow: hidden;
  background: #f8f9fa;
}

.collection-edit-images-grid__image {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.collection-edit-images-grid__body {
  display: flex;
  height: 66px;
  min-height: 66px;
  max-height: 66px;
  padding: var(--ppp, 4px) var(--pp, 8px);
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  align-self: stretch;
  flex: 0 0 66px;
  overflow: hidden;
  box-sizing: border-box;
}

.collection-edit-images-grid__title {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  flex: 1 1 auto;
  min-height: 0;
  align-self: stretch;
  overflow: hidden;
  margin: 0;
  color: var(--Preto, #1f1f1f);
  text-overflow: ellipsis;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-style: normal;
  font-weight: 700;
  line-height: 125%;
}

.collection-edit-images-grid__subtitle {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  flex: 0 0 14px;
  align-self: stretch;
  overflow: hidden;
  margin: 0;
  color: var(--Preto, #1f1f1f);
  text-overflow: ellipsis;
  font-family: "DM Sans", sans-serif;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 115%;
}

.collection-edit-images-grid__empty {
  margin: 0;
  color: var(--Cinza_E, #2f2f2f);
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  line-height: 150%;
}

.collection-edit-images-grid__card--skeleton {
  pointer-events: none;
}

.collection-edit-images-grid__image-skeleton,
.collection-edit-images-grid__title-skeleton,
.collection-edit-images-grid__subtitle-skeleton {
  background: #ececec;
  animation: collection-edit-skeleton-pulse 1.8s ease-in-out infinite;
}

.collection-edit-images-grid__image-skeleton {
  width: 100%;
  aspect-ratio: 220 / 198;
  flex: 0 0 auto;
}

.collection-edit-images-grid__title-skeleton {
  width: 80%;
  height: 14px;
  border-radius: 4px;
  flex: 1 1 auto;
}

.collection-edit-images-grid__subtitle-skeleton {
  width: 40%;
  height: 12px;
  border-radius: 4px;
  flex: 0 0 12px;
}

@keyframes collection-edit-skeleton-pulse {
  0% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}

@media (max-width: 767px) {
  .collection-edit-images-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 479px) {
  .collection-edit-images-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>