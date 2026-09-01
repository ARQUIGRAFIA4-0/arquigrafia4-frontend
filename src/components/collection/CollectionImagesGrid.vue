<script setup>
import { RouterLink } from "vue-router";
import ImageGridCard from "@/components/image/ImageGridCard.vue";

defineOptions({ name: "CollectionImagesGrid" });

// Define as props do componente
const props = defineProps({
  images: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  isGridReflowing: { type: Boolean, default: false },
  selectedImageId: { type: [String, Number], default: null },
  removingImageId: { type: [String, Number], default: null },
  isInfoActive: { type: Boolean, default: false },
  allowRemove: { type: Boolean, default: true },
});

// Emite eventos para ativar/desativar a imagem e remover a imagem da coleção
const emit = defineEmits(["activate", "remove"]);

// Verifica se a imagem está selecionada
function isCardSelected(item) {
  return props.selectedImageId === item.id;
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
        <div class="collection-grid__card-skeleton-tags" />
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
      <template v-for="item in images" :key="item.id">
        <RouterLink
          v-if="!allowRemove"
          :to="`/explore/dados/image/${item.id}`"
          class="collection-grid__link"
        >
          <ImageGridCard
            :item="item"
            class="collection-grid__card"
          />
        </RouterLink>

        <div
          v-else
          class="collection-grid__link collection-grid__link--selectable"
          role="button"
          tabindex="0"
          @click="emit('activate', item, $event)"
          @keydown.enter.prevent="emit('activate', item, $event)"
          @keydown.space.prevent="emit('activate', item, $event)"
        >
          <ImageGridCard
            :item="item"
            :selected="isCardSelected(item)"
            :show-tags="!isCardSelected(item)"
            class="collection-grid__card"
          >
            <template v-if="isCardSelected(item)" #footer>
              <div class="collection-grid__actions">
                <button
                  type="button"
                  class="collection-grid__remove-btn"
                  :disabled="removingImageId === item.id"
                  @click.stop="emit('remove', item.id)"
                >
                  <span>Remover da coleção</span>
                </button>
              </div>
            </template>
          </ImageGridCard>
        </div>
      </template>
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
  align-items: stretch;
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
  height: 100%;
  max-width: 100%;
  text-decoration: none;
  color: inherit;
}

.collection-grid__link:hover {
  text-decoration: none;
}

.collection-grid__link--selectable {
  cursor: pointer;
}

.collection-grid__card {
  min-height: 458px;
  transition:
    opacity 180ms ease,
    transform 220ms ease;
}

.collection-grid--reflowing .collection-grid__card {
  opacity: 0;
  transform: translateY(6px);
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
  height: 100%;
  max-width: 100%;
  min-height: 458px;
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
  position: relative;
  flex: 0 0 auto;
  width: 100%;
  max-width: none;
  aspect-ratio: 1 / 1;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: collectionSkeletonShimmer 1.5s infinite;
}

.collection-grid__card-skeleton-body {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: 100%;
  padding: 14px 14px 4px;
  box-sizing: border-box;
}

.collection-grid__card-skeleton-title {
  height: 18px;
  border-radius: 4px;
  width: 80%;
  flex: 0 0 auto;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: collectionSkeletonShimmer 1.5s infinite;
}

.collection-grid__card-skeleton-subtitle {
  height: 14px;
  border-radius: 4px;
  width: 40%;
  margin-top: 2px;
  flex: 0 0 auto;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: collectionSkeletonShimmer 1.5s infinite;
}

.collection-grid__card-skeleton-tags {
  margin-top: auto;
  height: 24px;
  border-radius: 4px;
  width: 72%;
  flex: 0 0 auto;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: collectionSkeletonShimmer 1.5s infinite;
}

.collection-detail__gallery-empty {
  color: #666;
  font-size: 14px;
  padding: 12px 0;
}

@media (max-width: 1434px) {
  .collection-grid--info-open,
  .collection-grid--info-closed {
    padding-inline: 0;
  }
}

@keyframes collectionSkeletonShimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (max-width: 767px) {
  .collection-grid,
  .collection-grid--info-open,
  .collection-grid--info-closed {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
    width: 100%;
    max-width: 100%;
    padding-inline: 0;
    overflow-x: clip;
  }

  .collection-grid__link {
    min-width: 0;
  }

  .collection-grid__card,
  .collection-grid__card-skeleton {
    min-width: 0;
    min-height: 0;
    box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.1);
  }
}

</style>