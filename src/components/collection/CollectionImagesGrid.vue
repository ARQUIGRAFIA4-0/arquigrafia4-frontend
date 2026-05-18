<script setup>
import FitTags from "@/views/Profile/FitTags.vue";

defineOptions({ name: "CollectionImagesGrid" });

// Define as props do componente
const props = defineProps({
  images: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  isGridReflowing: { type: Boolean, default: false },
  selectedImageId: { type: [String, Number], default: null },
  removingImageId: { type: [String, Number], default: null },
  isInfoActive: { type: Boolean, default: false },
});

// Emite eventos para ativar/desativar a imagem e remover a imagem da coleção
const emit = defineEmits(["activate", "remove"]);

// Verifica se a imagem está selecionada
function isCardSelected(item) {
  return props.selectedImageId === item.id;
}

// Formata a data da imagem
function formatDate(dates) {
  if (!dates || dates.length === 0) return null;

  const dateInfo = dates.find((d) => d.type === "creation") || dates[0];
  if (!dateInfo) return null;

  const earliest = dateInfo.earliest_date
    ? new Date(dateInfo.earliest_date).getFullYear()
    : null;

  const latest = dateInfo.latest_date
    ? new Date(dateInfo.latest_date).getFullYear()
    : null;

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
    class="collection-grid collection-grid--skeleton"
    :class="{
      'collection-grid--info-open': isInfoActive,
      'collection-grid--info-closed': !isInfoActive,
    }"
    role="status"
    aria-label="Carregando coleção"
  >
    <div
      v-for="n in 12"
      :key="`collection-skeleton-${n}`"
      class="collection-grid__card-skeleton"
      aria-hidden="true"
    >
      <div class="collection-grid__card-skeleton-image" />
      <div class="collection-grid__card-skeleton-body">
        <div class="collection-grid__card-skeleton-title" />
        <div class="collection-grid__card-skeleton-subtitle" />
      </div>
    </div>
    <span class="visually-hidden">Carregando coleção...</span>
  </div>

  <template v-else-if="images.length">
    <div
      class="collection-grid"
      :class="{
        'collection-grid--reflowing': isGridReflowing,
        'collection-grid--info-open': isInfoActive,
        'collection-grid--info-closed': !isInfoActive,
      }"
    >
      <div
        v-for="item in images"
        :key="item.id"
        class="collection-grid__link"
        role="button"
        tabindex="0"
        @click="emit('activate', item, $event)"
        @keydown.enter.prevent="emit('activate', item, $event)"
        @keydown.space.prevent="emit('activate', item, $event)"
      >
        <article
          class="collection-grid__card"
          :class="{ 'collection-grid__card--selected': isCardSelected(item) }"
        >
          <div class="collection-grid__image-wrapper">
            <img :src="item.imageUrl" class="collection-grid__image" :alt="item.title" />
          </div>

          <div class="collection-grid__content">
            <RouterLink
              class="collection-grid__title-link"
              :to="`/explore/dados/image/${item.id}`"
              @click.stop
            >
              <h3 class="collection-grid__title">{{ item.title }}</h3>
            </RouterLink>

            <p v-if="formatDate(item.dates)" class="collection-grid__date">
              {{ formatDate(item.dates) }}
            </p>

            <div class="collection-grid__footer">
              <div
                v-if="!isCardSelected(item) && item.subjects?.length"
                class="collection-grid__tags"
              >
                <FitTags :subjects="item.subjects" :gap="4" />
              </div>

              <div v-else-if="isCardSelected(item)" class="collection-grid__actions">
                <button
                  type="button"
                  class="collection-grid__remove-btn"
                  :disabled="removingImageId === item.id"
                  @click.stop="emit('remove', item.id)"
                >
                  <span>Remover da coleção</span>
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </template>

  <div v-else class="collection-detail__gallery-empty">
    Esta coleção ainda não possui imagens.
  </div>
</template>
<style scoped>
.collection-grid {
  --collection-card-w: 274px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, var(--collection-card-w)), 1fr));
  gap: var(--pp, 18px);
  align-items: start;
  justify-content: stretch;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.collection-grid--info-open {
  justify-content: stretch;
  padding-inline: 62px;
}

.collection-grid--info-closed {
  grid-template-columns: repeat(auto-fill, minmax(min(100%, var(--collection-card-w)), 1fr));
  justify-content: stretch;
}

.collection-grid__link {
  display: flex;
  width: 100%;
  max-width: 100%;
  text-decoration: none;
  color: inherit;
}

.collection-grid__card {
  display: flex;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  flex-direction: column;
  align-items: stretch;
  gap: var(--pp, 8px);
  padding-bottom: var(--pp, 8px);
  border-radius: 5px;
  border: 0.25px solid var(--Cinza_C, #a6a6a6);
  background: var(--Off_white, #faf9f9);
  box-shadow: 1px 1px 3px 2px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  min-height: 458px;
  transition:
    opacity 180ms ease,
    transform 220ms ease;
}

.collection-grid--reflowing .collection-grid__card {
  opacity: 0;
  transform: translateY(6px);
}

.collection-grid__image-wrapper {
  position: relative;
  flex: 0 0 auto;
  width: 100%;
  max-width: none;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background-color: #f8f9fa;
}

.collection-grid__image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.collection-grid__content {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: 100%;
  padding: 14px 14px 4px;
}

.collection-grid__footer {
  margin-top: auto;
  min-height: 0;
  width: 100%;
}

.collection-grid__tags {
  width: 100%;
}

.collection-grid__title {
  margin: 0;
  font-weight: 700;
  font-size: 14px;
  line-height: 125%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.collection-grid__date {
  margin: 2px 0 0;
  font-size: 14px;
  color: var(--Cinza_E, #2f2f2f);
}

.collection-grid__title-link {
  color: inherit;
  text-decoration: none;
}

.collection-grid__title-link:hover .collection-grid__title {
  text-decoration: underline;
}

.collection-grid__card--selected {
  background: var(--Laranja_C, #f3e7dc);
}

.collection-grid__actions {
  width: 100%;
}

.collection-grid__remove-btn {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 2px 14px;
  border-radius: 5px;
  border: 1px solid var(--Laranja_E, #AA4F28);
  background: var(--Off_white, #FAF9F9);
  color: var(--Laranja_E, #AA4F28);
  font-size: 12px;
  cursor: pointer;
}

.collection-grid__remove-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.collection-grid__card-skeleton {
  display: flex;
  width: 100%;
  max-width: 100%;
  min-height: 346px;
  box-sizing: border-box;
  flex-direction: column;
  align-items: stretch;
  gap: var(--pp, 8px);
  padding-bottom: var(--pp, 8px);
  border-radius: 5px;
  border: 0.25px solid var(--Cinza_C, #a6a6a6);
  background: var(--Off_white, #faf9f9);
  box-shadow: 1px 1px 3px 2px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  pointer-events: none;
}

.collection-grid__card-skeleton-image {
  width: 100%;
  max-width: none;
  aspect-ratio: 1 / 1;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: collectionSkeletonShimmer 1.5s infinite;
}

.collection-grid__card-skeleton-body {
  padding: 8px 10px 0;
}

.collection-grid__card-skeleton-title {
  height: 14px;
  border-radius: 4px;
  margin-bottom: 6px;
  width: 80%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: collectionSkeletonShimmer 1.5s infinite;
}

.collection-grid__card-skeleton-subtitle {
  height: 12px;
  border-radius: 4px;
  width: 50%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: collectionSkeletonShimmer 1.5s infinite;
}

.collection-detail__gallery-empty {
  color: #666;
  font-size: 14px;
  padding: 12px 0;
}

@keyframes collectionSkeletonShimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

</style>