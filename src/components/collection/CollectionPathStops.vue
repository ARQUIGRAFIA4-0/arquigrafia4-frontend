<script setup>
import { computed, ref } from "vue";
import { RouterLink } from "vue-router";
import { api } from "@/services/api";

defineOptions({ name: "CollectionPathStops" });

const props = defineProps({
  // Paradas salvas do percurso: { title, order, imageId, ... }
  stops: { type: Array, default: () => [] },
  // Imagens da coleção já carregadas (usadas para mostrar a imagem do ponto).
  images: { type: Array, default: () => [] },
});

const imagesById = computed(
  () => new Map(props.images.map((image) => [String(image.id), image]))
);

// Imagens buscadas sob demanda (pontos cuja imagem ainda não foi carregada
// na paginação da coleção). imageId → { status, src, title }
const fetchedImages = ref(new Map());

function setFetchedImage(imageId, value) {
  const next = new Map(fetchedImages.value);
  next.set(imageId, value);
  fetchedImages.value = next;
}

async function fetchStopImage(imageId) {
  const current = fetchedImages.value.get(imageId);
  if (current && current.status !== "error") return;

  setFetchedImage(imageId, { status: "loading", src: null, title: "" });
  try {
    const image = await api.getImageDetails(imageId);
    setFetchedImage(imageId, {
      status: "loaded",
      src: image?.imageUrl ?? image?.thumbUrl ?? null,
      title: image?.title ?? "",
    });
  } catch (error) {
    console.warn("Falha ao carregar imagem do ponto:", error);
    setFetchedImage(imageId, { status: "error", src: null, title: "" });
  }
}

const orderedStops = computed(() =>
  [...props.stops]
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
    .map((stop, index) => {
      const imageId = stop.imageId != null ? String(stop.imageId) : null;
      const image = imageId ? imagesById.value.get(imageId) ?? null : null;
      const fetched = imageId ? fetchedImages.value.get(imageId) ?? null : null;
      return {
        key: `${stop.order ?? index}-${index}`,
        number: index + 1,
        title: stop.title?.trim() || `Ponto ${index + 1}`,
        imageId,
        imageSrc: image?.imageUrl ?? image?.thumbUrl ?? fetched?.src ?? null,
        imageTitle: image?.title ?? fetched?.title ?? "",
        isImageLoading: !image && fetched?.status === "loading",
      };
    })
);

// Pontos com o dropdown aberto.
const openKeys = ref(new Set());

function toggleStop(stop) {
  const next = new Set(openKeys.value);
  if (next.has(stop.key)) {
    next.delete(stop.key);
  } else {
    next.add(stop.key);
    // Imagem fora das páginas já carregadas: busca pelo id.
    if (stop.imageId && !stop.imageSrc) fetchStopImage(stop.imageId);
  }
  openKeys.value = next;
}
</script>

<template>
  <ol v-if="orderedStops.length" class="path-stops">
    <li
      v-for="stop in orderedStops"
      :key="stop.key"
      class="path-stops__item"
      :class="{ 'path-stops__item--open': openKeys.has(stop.key) }"
    >
      <button
        type="button"
        class="path-stops__toggle"
        :aria-expanded="openKeys.has(stop.key)"
        :aria-controls="`path-stop-panel-${stop.key}`"
        @click="toggleStop(stop)"
      >
        <span class="path-stops__number" aria-hidden="true">{{ stop.number }}</span>
        <span class="path-stops__title">{{ stop.title }}</span>
        <i class="bi bi-chevron-down path-stops__chevron" aria-hidden="true"></i>
      </button>

      <div
        v-if="openKeys.has(stop.key)"
        :id="`path-stop-panel-${stop.key}`"
        class="path-stops__panel"
      >
        <template v-if="stop.imageId">
          <div
            v-if="stop.isImageLoading"
            class="path-stops__image-skeleton"
            role="status"
            aria-label="Carregando imagem do ponto"
          />
          <RouterLink
            v-else-if="stop.imageSrc"
            :to="`/explore/dados/image/${stop.imageId}`"
            class="path-stops__image-link"
          >
            <img
              :src="stop.imageSrc"
              :alt="stop.imageTitle || stop.title"
              class="path-stops__image"
              loading="lazy"
            />
          </RouterLink>
          <RouterLink
            v-else
            :to="`/explore/dados/image/${stop.imageId}`"
            class="path-stops__link"
          >
            Ver imagem do ponto
          </RouterLink>
        </template>
        <p v-else class="path-stops__no-image">
          <i class="bi bi-geo-fill" aria-hidden="true"></i>
          Ponto sem imagem relacionada.
        </p>
      </div>
    </li>
  </ol>
  <p v-else class="path-stops__empty">Nenhum ponto definido.</p>
</template>

<style scoped>
.path-stops {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.path-stops__item {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.path-stops__toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-width: 0;
  padding: 0;
  border: 0;
  background: none;
  text-align: left;
  cursor: pointer;
}

.path-stops__toggle:focus-visible {
  outline: 2px solid var(--Preto, #1f1f1f);
  outline-offset: 2px;
  border-radius: 4px;
}

.path-stops__chevron {
  margin-left: auto;
  flex: 0 0 auto;
  color: var(--Cinza_E, #2f2f2f);
  font-size: 14px;
  transition: transform 0.2s ease;
}

.path-stops__item--open .path-stops__chevron {
  transform: rotate(180deg);
}

.path-stops__panel {
  padding-left: 40px;
}

.path-stops__image-link {
  display: block;
  overflow: hidden;
  border-radius: 8px;
}

.path-stops__image {
  display: block;
  width: 100%;
  max-height: 220px;
  object-fit: cover;
}

.path-stops__image-skeleton {
  width: 100%;
  height: 160px;
  border-radius: 8px;
  background: linear-gradient(90deg, #ececec 25%, #f5f5f5 50%, #ececec 75%);
  background-size: 200% 100%;
  animation: path-stops-shimmer 1.2s ease-in-out infinite;
}

@keyframes path-stops-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.path-stops__link {
  color: var(--Preto, #1f1f1f);
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  text-decoration: underline;
}

.path-stops__no-image {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--Cinza_E, #2f2f2f);
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
}

.path-stops__number {
  display: inline-flex;
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--Preto, #1f1f1f);
  color: var(--Branco, #fff);
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
}

.path-stops__title {
  min-width: 0;
  color: var(--Preto, #1f1f1f);
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 150%;
  overflow-wrap: anywhere;
}

.path-stops__empty {
  margin: 0;
  color: var(--Cinza_E, #2f2f2f);
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
}
</style>
