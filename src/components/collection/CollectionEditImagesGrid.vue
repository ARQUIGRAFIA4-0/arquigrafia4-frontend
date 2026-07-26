<script setup>
import { ref, watch } from "vue";
import draggable from "vuedraggable";

defineOptions({ name: "CollectionEditImagesGrid" });

const props = defineProps({
  images: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  selectedImageId: { type: [String, Number], default: null },
  removingImageId: { type: [String, Number], default: null },
});

const emit = defineEmits(["activate", "remove", "reorder"]);

const localImages = ref([...props.images]);

watch(
  () => props.images,
  (val) => { localImages.value = [...val]; }
);

function onReorder() {
  emit("reorder", [...localImages.value]);
}

function isCardSelected(item) {
  return props.selectedImageId === item.id;
}

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
    class="collection-edit-images-grid collection-edit-images-grid--skeleton"
    role="status"
    aria-label="Carregando imagens da coleção"
  >
    <article
      v-for="n in 12"
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

  <draggable
    v-else-if="localImages.length"
    v-model="localImages"
    tag="div"
    class="collection-edit-images-grid"
    aria-label="Imagens da coleção"
    item-key="id"
    handle=".collection-edit-images-grid__btn--reorder"
    :animation="150"
    @change="onReorder"
  >
    <template #item="{ element: item }">
      <div
        class="collection-edit-images-grid__link"
        role="button"
        tabindex="0"
        @click="emit('activate', item, $event)"
        @keydown.enter.prevent="emit('activate', item, $event)"
        @keydown.space.prevent="emit('activate', item, $event)"
      >
        <article
          class="collection-edit-images-grid__card"
          :class="{
            'collection-edit-images-grid__card--selected': isCardSelected(item),
          }"
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
            <div class="collection-edit-images-grid__meta">
              <h3 class="collection-edit-images-grid__title">
                {{ item.title || "Sem título" }}
              </h3>
              <p class="collection-edit-images-grid__subtitle">
                {{ formatDate(item.dates) || "\u00A0" }}
              </p>
            </div>

            <div
              class="collection-edit-images-grid__actions"
              :class="{
                'collection-edit-images-grid__actions--visible': isCardSelected(item),
              }"
            >
              <button
                type="button"
                class="collection-edit-images-grid__btn collection-edit-images-grid__btn--remove"
                :disabled="removingImageId === item.id"
                :tabindex="isCardSelected(item) ? 0 : -1"
                @click.stop="emit('remove', item.id)"
              >
                <i class="bi bi-trash" aria-hidden="true" />
                <span>Remover</span>
              </button>
              <button
                type="button"
                class="collection-edit-images-grid__btn collection-edit-images-grid__btn--reorder"
                :tabindex="isCardSelected(item) ? 0 : -1"
                aria-label="Arrastar para reordenar"
                @click.stop
              >
                <i class="bi bi-arrows-move" aria-hidden="true" />
                <span>Reordenar</span>
              </button>
            </div>
          </div>
        </article>
      </div>
    </template>
  </draggable>

  <p v-else class="collection-edit-images-grid__empty">
    Esta coleção ainda não possui imagens.
  </p>
</template>

<style scoped lang="scss">
.collection-edit-images-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  align-items: stretch;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.collection-edit-images-grid__link {
  display: flex;
  width: 100%;
  height: 100%;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}

.collection-edit-images-grid__card {
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  align-items: stretch;
  gap: 0;
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
  flex: 1 1 auto;
  min-height: 94px;
  padding: var(--ppp, 4px) var(--pp, 8px) var(--pp, 8px);
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
  align-self: stretch;
  overflow: hidden;
  box-sizing: border-box;
  background: var(--Branco, #fff);
}

.collection-edit-images-grid__card--selected .collection-edit-images-grid__body {
  background: var(--Laranja_C, #f3e7dc);
}

.collection-edit-images-grid__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  align-self: stretch;
  flex: 0 0 auto;
}

.collection-edit-images-grid__title {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  align-self: stretch;
  height: 15px;
  min-height: 15px;
  max-height: 15px;
  overflow: hidden;
  margin: 10px 0 0;
  color: var(--Preto, #1f1f1f);
  text-overflow: ellipsis;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-style: normal;
  font-weight: 700;
  line-height: 125%;
}

.collection-edit-images-grid__subtitle {
  display: block;
  align-self: stretch;
  height: 14px;
  min-height: 14px;
  overflow: hidden;
  margin: 0;
  color: var(--Preto, #1f1f1f);
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: "DM Sans", sans-serif;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 115%;
}

.collection-edit-images-grid__actions {
  display: flex;
  align-items: stretch;
  gap: 8px;
  align-self: stretch;
  width: 100%;
  min-height: 22px;
  margin-top: 10px;
  visibility: hidden;
  pointer-events: none;
}

.collection-edit-images-grid__actions--visible {
  visibility: visible;
  pointer-events: auto;
}

.collection-edit-images-grid__btn {
  display: inline-flex;
  flex: 1 1 0;
  min-width: 0;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 5px;
  border: 1px solid transparent;
  font-family: "DM Sans", sans-serif;
  font-size: 12px;
  font-weight: 400;
  line-height: 150%;
  white-space: nowrap;
  cursor: pointer;
}

.collection-edit-images-grid__btn i {
  font-size: 12px;
}

.collection-edit-images-grid__btn--remove {
  border-color: var(--Laranja_E, #aa4f28);
  background: var(--Branco, #fff);
  color: var(--Laranja_E, #aa4f28);

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.collection-edit-images-grid__btn--reorder {
  border-color: var(--Laranja_E, #aa4f28);
  background: var(--Laranja_E, #aa4f28);
  color: var(--Branco, #fff);
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

.collection-edit-images-grid__empty {
  margin: 0;
  color: var(--Cinza_E, #2f2f2f);
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  line-height: 150%;
}

.collection-edit-images-grid--skeleton {
  pointer-events: none;
}

.collection-edit-images-grid__card--skeleton {
  pointer-events: none;
  gap: 0;
  padding-bottom: 0;
}

.collection-edit-images-grid__card--skeleton .collection-edit-images-grid__body {
  min-height: 94px;
}

.collection-edit-images-grid__image-skeleton,
.collection-edit-images-grid__title-skeleton,
.collection-edit-images-grid__subtitle-skeleton {
  border-radius: 4px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: collection-edit-images-shimmer 1.5s infinite;
}

.collection-edit-images-grid__image-skeleton {
  width: 100%;
  aspect-ratio: 220 / 198;
  flex: 0 0 auto;
  border-radius: 0;
}

.collection-edit-images-grid__title-skeleton {
  width: 80%;
  height: 14px;
  flex: 1 1 auto;
}

.collection-edit-images-grid__subtitle-skeleton {
  width: 50%;
  height: 12px;
  flex: 0 0 12px;
}

@keyframes collection-edit-images-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Ghost card do SortableJS durante o momento do arraste */
:deep(.sortable-ghost) {
  opacity: 0.35;
}

@media (max-width: 1256px) {
  .collection-edit-images-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .collection-edit-images-grid__actions {
    align-items: center;
    gap: 6px;
  }

  .collection-edit-images-grid__btn {
    height: 22px;
    gap: 3px;
    padding: 0 6px;
    font-size: 11px;
    line-height: 1;
    box-sizing: border-box;
  }

  .collection-edit-images-grid__btn i {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 11px;
    line-height: 1;
  }

  .collection-edit-images-grid__btn span {
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

@media (max-width: 767px) {
  .collection-edit-images-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
}
</style>
