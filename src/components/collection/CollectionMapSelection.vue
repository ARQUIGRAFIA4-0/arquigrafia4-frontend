<script setup>
import { computed, onMounted, onUnmounted } from "vue";
import { RouterLink } from "vue-router";

defineOptions({ name: "CollectionMapSelection" });

// Card da coluna de detalhes quando há uma imagem ou um ponto do percurso
// selecionado no mapa. Com percurso, permite navegar entre os pontos.
const props = defineProps({
  // Imagem selecionada no mapa (ou null quando é um ponto sem imagem carregada).
  image: { type: Object, default: null },
  // Ponto do percurso correspondente à seleção (helpers/pathStops).
  stop: { type: Object, default: null },
  stopCount: { type: Number, default: 0 },
  previousStop: { type: Object, default: null },
  nextStop: { type: Object, default: null },
});

const emit = defineEmits(["back", "open-image", "go-to-stop"]);

// Evita repetir o nome quando o ponto usa o título da própria imagem.
const showStopTitle = computed(
  () => Boolean(props.stop) && props.stop.title !== props.image?.title
);

// Esc fecha a seleção. Setas ← → navegam pelo percurso, exceto com o mapa em
// foco (no mapa as setas movem a visualização). Nada disso vale ao digitar ou
// com um diálogo aberto.
function handleKeydown(event) {
  if (event.defaultPrevented) return;
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.target?.closest?.("input, textarea, select, [contenteditable]")) return;
  if (document.querySelector(".modal.show, [role='dialog'][aria-modal='true']")) return;

  if (event.key === "Escape") {
    event.preventDefault();
    emit("back");
    return;
  }

  if (!props.stop || event.target?.closest?.(".maplibregl-map")) return;

  const target =
    event.key === "ArrowLeft"
      ? props.previousStop
      : event.key === "ArrowRight"
        ? props.nextStop
        : null;
  if (!target) return;

  event.preventDefault();
  emit("go-to-stop", target);
}

onMounted(() => window.addEventListener("keydown", handleKeydown));
onUnmounted(() => window.removeEventListener("keydown", handleKeydown));
</script>

<template>
  <section
    class="map-selection"
    :aria-label="image ? 'Imagem selecionada no mapa' : 'Ponto do percurso selecionado'"
  >
    <button
      type="button"
      class="map-selection__back"
      aria-label="Fechar seleção e voltar às informações da coleção"
      aria-keyshortcuts="Escape"
      title="Voltar às informações da coleção (Esc)"
      @click="emit('back')"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M13.1248 7.00055C13.1248 6.88452 13.0787 6.77324 12.9967 6.69119C12.9146 6.60915 12.8033 6.56305 12.6873 6.56305H2.36843L5.12206 3.8103C5.16273 3.76963 5.195 3.72134 5.21701 3.66819C5.23903 3.61504 5.25036 3.55808 5.25036 3.50055C5.25036 3.44303 5.23903 3.38606 5.21701 3.33292C5.195 3.27977 5.16273 3.23148 5.12206 3.1908C5.08138 3.15013 5.03309 3.11786 4.97994 3.09584C4.92679 3.07383 4.86983 3.0625 4.81231 3.0625C4.75478 3.0625 4.69782 3.07383 4.64467 3.09584C4.59152 3.11786 4.54323 3.15013 4.50256 3.1908L1.00256 6.6908C0.961813 6.73144 0.929488 6.77972 0.907432 6.83287C0.885376 6.88603 0.874023 6.94301 0.874023 7.00055C0.874023 7.0581 0.885376 7.11508 0.907432 7.16823C0.929488 7.22138 0.961813 7.26966 1.00256 7.3103L4.50256 10.8103C4.54323 10.851 4.59152 10.8832 4.64467 10.9053C4.69782 10.9273 4.75478 10.9386 4.81231 10.9386C4.86983 10.9386 4.92679 10.9273 4.97994 10.9053C5.03309 10.8832 5.08138 10.851 5.12206 10.8103C5.16273 10.7696 5.195 10.7213 5.21701 10.6682C5.23903 10.615 5.25036 10.5581 5.25036 10.5006C5.25036 10.443 5.23903 10.3861 5.21701 10.3329C5.195 10.2798 5.16273 10.2315 5.12206 10.1908L2.36843 7.43805H12.6873C12.8033 7.43805 12.9146 7.39196 12.9967 7.30991C13.0787 7.22786 13.1248 7.11658 13.1248 7.00055Z"
          fill="currentColor"
        />
      </svg>
      <span>informações da coleção</span>
    </button>

    <nav v-if="stop" class="map-selection__stop-nav" aria-label="Navegação pelo percurso">
      <div class="map-selection__stop-info" aria-live="polite">
        <span class="map-selection__stop-number" aria-hidden="true">{{ stop.number }}</span>
        <span class="map-selection__stop-text">
          <span class="map-selection__stop-count">Ponto {{ stop.number }} de {{ stopCount }}</span>
          <span v-if="showStopTitle" class="map-selection__stop-title">{{ stop.title }}</span>
        </span>
      </div>
      <div class="map-selection__stop-actions">
        <button
          type="button"
          class="map-selection__nav-btn"
          :disabled="!previousStop"
          :aria-label="previousStop ? `Ponto anterior: ${previousStop.title}` : 'Ponto anterior'"
          title="Ponto anterior (←)"
          @click="emit('go-to-stop', previousStop)"
        >
          <i class="bi bi-chevron-left" aria-hidden="true"></i>
          anterior
        </button>
        <button
          type="button"
          class="map-selection__nav-btn"
          :disabled="!nextStop"
          :aria-label="nextStop ? `Próximo ponto: ${nextStop.title}` : 'Próximo ponto'"
          title="Próximo ponto (→)"
          @click="emit('go-to-stop', nextStop)"
        >
          próximo
          <i class="bi bi-chevron-right" aria-hidden="true"></i>
        </button>
      </div>
    </nav>

    <template v-if="image">
      <div
        class="map-selection__media"
        role="img"
        :aria-label="image.title || 'Imagem da coleção'"
        :style="{ backgroundImage: `url(${image.imageUrl})` }"
      />
      <button
        type="button"
        class="map-selection__image-button"
        @click="emit('open-image', image.id)"
      >
        <span class="map-selection__image-title" :title="image.title || 'Sem título'">
          {{ image.title || "Sem título" }}
        </span>
        <span class="map-selection__image-arrow" aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M1.5 12.0009C1.5 11.802 1.57902 11.6113 1.71967 11.4706C1.86032 11.33 2.05109 11.2509 2.25 11.2509H19.9395L15.219 6.53195C15.0782 6.39112 14.9991 6.20011 14.9991 6.00095C14.9991 5.80178 15.0782 5.61078 15.219 5.46995C15.3598 5.32912 15.5508 5.25 15.75 5.25C15.9492 5.25 16.1402 5.32912 16.281 5.46995L22.281 11.4699C22.3508 11.5396 22.4063 11.6224 22.4441 11.7135C22.4819 11.8046 22.5013 11.9023 22.5013 12.0009C22.5013 12.0996 22.4819 12.1973 22.4441 12.2884C22.4063 12.3795 22.3508 12.4623 22.281 12.5319L16.281 18.5319C16.1402 18.6728 15.9492 18.7519 15.75 18.7519C15.5508 18.7519 15.3598 18.6728 15.219 18.5319C15.0782 18.3911 14.9991 18.2001 14.9991 18.0009C14.9991 17.8018 15.0782 17.6108 15.219 17.4699L19.9395 12.7509H2.25C2.05109 12.7509 1.86032 12.6719 1.71967 12.5313C1.57902 12.3906 1.5 12.1999 1.5 12.0009Z"
              fill="#2F2F2F"
            />
          </svg>
        </span>
      </button>
    </template>

    <!-- Ponto sem imagem (ou com imagem fora das páginas já carregadas). -->
    <div v-else-if="stop" class="map-selection__media map-selection__media--empty">
      <i class="bi bi-geo-fill map-selection__empty-icon" aria-hidden="true"></i>
      <RouterLink
        v-if="stop.imageId"
        :to="`/explore/dados/image/${stop.imageId}`"
        class="map-selection__empty-link"
      >
        Ver imagem do ponto
      </RouterLink>
      <span v-else class="map-selection__empty-text">Ponto sem imagem relacionada.</span>
    </div>
  </section>
</template>

<style scoped>
.map-selection {
  display: flex;
  width: 338px;
  max-width: 100%;
  padding: 16px 12px 0;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
  gap: 16px;
  box-sizing: border-box;
}

.map-selection__back,
.map-selection__nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 14px;
  border-radius: 5px;
  border: 1px solid var(--Cinza_E);
  background: var(--Off_white);
  color: var(--Cinza_E);
  font-size: 14px;
  font-weight: 400;
  line-height: 150%;
  cursor: pointer;
  transition: background-color 150ms ease, color 150ms ease;
}

.map-selection__back {
  align-self: flex-start;
}

.map-selection__back:hover,
.map-selection__nav-btn:hover:not(:disabled) {
  background: var(--Cinza_E);
  color: var(--Off_white);
}

.map-selection__back:focus-visible,
.map-selection__nav-btn:focus-visible {
  outline: 2px solid var(--Cinza_E);
  outline-offset: 2px;
}

.map-selection__nav-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.map-selection__stop-nav {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.map-selection__stop-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

/* Mesmo marcador da lista de pontos, em laranja como no mapa. */
.map-selection__stop-number {
  display: inline-flex;
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--Laranja_M, #d27d30);
  color: var(--Branco, #fff);
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
}

.map-selection__stop-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.map-selection__stop-count {
  color: var(--Cinza_M);
  font-size: 14px;
  line-height: 150%;
}

.map-selection__stop-title {
  color: var(--Preto);
  font-size: 16px;
  font-weight: 500;
  line-height: 150%;
  overflow-wrap: anywhere;
}

.map-selection__stop-actions {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.map-selection__media {
  height: 314px;
  flex-shrink: 0;
  align-self: stretch;
  border-radius: 8px;
  border-top: 0.25px solid var(--Cinza_C, #a6a6a6);
  border-right: 0.25px solid var(--Cinza_C, #a6a6a6);
  border-left: 0.25px solid var(--Cinza_C, #a6a6a6);
  background-color: lightgray;
  background-position: 50%;
  background-size: cover;
  background-repeat: no-repeat;
}

.map-selection__media--empty {
  display: flex;
  height: 160px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0.25px solid var(--Cinza_C, #a6a6a6);
  background-color: var(--Off_white);
  color: var(--Cinza_E);
  font-size: 14px;
}

.map-selection__empty-icon {
  color: var(--Laranja_E);
  font-size: 24px;
}

.map-selection__empty-link {
  color: var(--Preto);
  text-decoration: underline;
}

.map-selection__image-button {
  display: flex;
  min-height: 60px;
  padding: 0;
  gap: 8px;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  align-self: stretch;
  width: 100%;
  box-sizing: border-box;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
}

.map-selection__image-title {
  flex: 1;
  min-width: 0;
  margin: 0;
  color: var(--Cinza_E);
  font-size: 16px;
  font-style: normal;
  font-weight: 500;
  line-height: 140%;
  text-align: left;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  overflow: hidden;
}

.map-selection__image-arrow {
  display: flex;
  padding: 6px;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  color: var(--Cinza_E);
}
</style>
