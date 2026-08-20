<script setup>
import { ref, watch, computed } from "vue";
import AlbumCoverArt from "@/components/AlbumCoverArt.vue";
import { excludeFavoritesAlbums } from "@/constants/favoritesCollection";

// Options
defineOptions({
  name: "AlbumPickerModal",
});

// Props
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  albums: { type: Array, default: () => [] },
  preselectedAlbumIds: { type: Array, default: () => [] },
  scopes: { type: Array, default: () => [] },
  selectedScopeId: { type: [String, Number], default: null },
  loadingAlbums: { type: Boolean, default: false },
  excludeFavorites: { type: Boolean, default: true },
});

const emit = defineEmits([
  "update:modelValue",
  "open-create-collection",
  "confirm-add",
  "change-scope",
]);

function close() {
  emit("update:modelValue", false);
}

// Criar coleção
function onAddCollection() {
  emit("open-create-collection");
}

/**
 * Start: Seletor de escopo (usuário ou coletivo)
 */
const isScopeOpen = ref(false);

const selectedScope = computed(
  () =>
    props.scopes.find((s) => s.id === props.selectedScopeId) ??
    props.scopes[0] ??
    null,
);

const availableScopes = computed(() =>
  props.scopes.filter((s) => s.id !== selectedScope.value?.id),
);

function toggleScopeDropdown() {
  isScopeOpen.value = !isScopeOpen.value;
}

function selectScope(scope) {
  isScopeOpen.value = false;
  if (scope.id === selectedScope.value?.id) return;
  emit("change-scope", scope);
}

/**
 * Start: Selecionar álbum para inserir imagem
 */
const selectedAlbumIds = ref([]);
const hasAlbumSelection = computed(() => selectedAlbumIds.value.length > 0);

const visibleAlbums = computed(() =>
  props.excludeFavorites ? excludeFavoritesAlbums(props.albums) : props.albums,
);

function normalizePreselectedIds(ids = []) {
  if (!props.excludeFavorites) return [...ids];
  const visibleIds = new Set(visibleAlbums.value.map((album) => album.id));
  return ids.filter((id) => visibleIds.has(id));
}

const primaryActionLabel = computed(() =>
  props.preselectedAlbumIds.length ? "Atualizar" : "Adicionar",
);

// Todos os álbuns do escopo compartilham o mesmo dono: o subtítulo é o nome do escopo
function getAlbumAuthorName() {
  return selectedScope.value?.name || "";
}

// Selecionar/desselecionar álbum
function toggleAlbum(albumId) {
  if (selectedAlbumIds.value.includes(albumId)) {
    // se já está selecionado, desseleciona
    selectedAlbumIds.value = selectedAlbumIds.value.filter(
      (id) => id !== albumId,
    );
    return;
  }

  selectedAlbumIds.value = [...selectedAlbumIds.value, albumId]; // se não está selecionado, seleciona
}

// Confirmar adicionar imagem ao álbum
function onConfirmAdd() {
  emit("confirm-add", {
    albumIds: selectedAlbumIds.value,
  });

  emit("update:modelValue", false);
}

// sempre que abrir o modal, resetar seleção, fechar o dropdown e travar scroll do body
watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) {
      isScopeOpen.value = false;
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    selectedAlbumIds.value = normalizePreselectedIds(props.preselectedAlbumIds);
  },
);

// ao trocar de escopo, a lista de álbuns recarrega no pai: sincroniza a seleção
watch(
  () => props.preselectedAlbumIds,
  (ids) => {
    if (props.modelValue) {
      selectedAlbumIds.value = normalizePreselectedIds(ids);
    }
  },
);
</script>

<template>
  <transition name="album-picker-fade">
    <div v-if="modelValue" class="album-picker__backdrop" @click.self="close">
      <div
        class="album-picker__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="album-picker-title"
      >
        <div class="album-picker__body">
          <header class="album-picker__header">
            <h2 id="album-picker-title" class="album-picker__title">
              Adicionar imagens à coleção
            </h2>
            <button
              type="button"
              class="album-picker__close"
              aria-label="Fechar"
              @click="close"
            >
              <svg
                class="album-picker__close-icon album-picker__close-icon--desktop"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M6.97034 6.96839C7.04001 6.89854 7.12277 6.84313 7.21389 6.80532C7.30501 6.76751 7.40269 6.74805 7.50134 6.74805C7.59999 6.74805 7.69767 6.76751 7.78879 6.80532C7.87991 6.84313 7.96267 6.89854 8.03234 6.96839L12.0013 10.9389L15.9703 6.96839C16.0401 6.89866 16.1229 6.84334 16.214 6.8056C16.3051 6.76786 16.4027 6.74844 16.5013 6.74844C16.6 6.74844 16.6976 6.76786 16.7887 6.8056C16.8798 6.84334 16.9626 6.89866 17.0323 6.96839C17.1021 7.03812 17.1574 7.1209 17.1951 7.21201C17.2329 7.30312 17.2523 7.40077 17.2523 7.49939C17.2523 7.598 17.2329 7.69565 17.1951 7.78676C17.1574 7.87787 17.1021 7.96066 17.0323 8.03039L13.0618 11.9994L17.0323 15.9684C17.1021 16.0381 17.1574 16.1209 17.1951 16.212C17.2329 16.3031 17.2523 16.4008 17.2523 16.4994C17.2523 16.598 17.2329 16.6957 17.1951 16.7868C17.1574 16.8779 17.1021 16.9607 17.0323 17.0304C16.9626 17.1001 16.8798 17.1554 16.7887 17.1932C16.6976 17.2309 16.6 17.2503 16.5013 17.2503C16.4027 17.2503 16.3051 17.2309 16.214 17.1932C16.1229 17.1554 16.0401 17.1001 15.9703 17.0304L12.0013 13.0599L8.03234 17.0304C7.96261 17.1001 7.87982 17.1554 7.78872 17.1932C7.69761 17.2309 7.59996 17.2503 7.50134 17.2503C7.40272 17.2503 7.30507 17.2309 7.21396 17.1932C7.12286 17.1554 7.04007 17.1001 6.97034 17.0304C6.90061 16.9607 6.84529 16.8779 6.80756 16.7868C6.76982 16.6957 6.75039 16.598 6.75039 16.4994C6.75039 16.4008 6.76982 16.3031 6.80756 16.212C6.84529 16.1209 6.90061 16.0381 6.97034 15.9684L10.9408 11.9994L6.97034 8.03039C6.9005 7.96072 6.84508 7.87796 6.80727 7.78684C6.76946 7.69572 6.75 7.59804 6.75 7.49939C6.75 7.40074 6.76946 7.30305 6.80727 7.21194C6.84508 7.12082 6.9005 7.03806 6.97034 6.96839Z"
                  fill="#636262"
                />
              </svg>
              <i
                class="bi bi-x-circle-fill album-picker__close-icon album-picker__close-icon--mobile"
                aria-hidden="true"
              ></i>
            </button>
          </header>

          <div v-if="scopes.length > 1" class="album-picker__scope">
            <span class="album-picker__scope-caption"
              >Adicionar nas coleções de</span
            >
            <div
              class="album-picker__scope-selected"
              role="button"
              tabindex="0"
              @click="toggleScopeDropdown"
              @keydown.enter.prevent="toggleScopeDropdown"
              @keydown.space.prevent="toggleScopeDropdown"
            >
              <span class="album-picker__scope-identity" v-if="selectedScope">
                <span class="album-picker__scope-avatar">
                  <img
                    v-if="selectedScope.avatar"
                    :src="selectedScope.avatar"
                    alt=""
                  />
                  <span v-else class="album-picker__scope-initials">{{
                    selectedScope.initials
                  }}</span>
                </span>
                <span class="album-picker__scope-name">{{
                  selectedScope.name
                }}</span>
              </span>
              <i
                class="bi bi-chevron-down album-picker__scope-chevron"
                :class="{ 'album-picker__scope-chevron--open': isScopeOpen }"
                aria-hidden="true"
              />
            </div>

            <div v-if="isScopeOpen" class="album-picker__scope-menu">
              <button
                v-for="scope in availableScopes"
                :key="scope.id"
                type="button"
                class="album-picker__scope-option"
                @click="selectScope(scope)"
              >
                <span class="album-picker__scope-avatar">
                  <img v-if="scope.avatar" :src="scope.avatar" alt="" />
                  <span v-else class="album-picker__scope-initials">{{
                    scope.initials
                  }}</span>
                </span>
                <span class="album-picker__scope-name">{{ scope.name }}</span>
              </button>
            </div>
          </div>

          <div
            v-if="loadingAlbums"
            class="album-picker__list album-picker__list--skeleton"
            aria-hidden="true"
          >
            <div
              v-for="n in 2"
              :key="n"
              class="album-picker__cell album-picker__skeleton-cell"
            >
              <div
                class="album-picker__thumb album-picker__skeleton-block"
              ></div>
              <span class="album-picker__text">
                <span
                  class="album-picker__skeleton-line album-picker__skeleton-block"
                ></span>
                <span
                  class="album-picker__skeleton-line album-picker__skeleton-line--short album-picker__skeleton-block"
                ></span>
              </span>
            </div>
          </div>
          <div v-else class="album-picker__list">
            <button
              type="button"
              class="album-picker__cell album-picker__cell--action"
              :class="{ 'album-picker__cell--dimmed': hasAlbumSelection }"
              @click="onAddCollection"
            >
              <span class="album-picker__add-thumb" aria-hidden="true">
                <span class="album-picker__add-circle">
                  <i class="bi bi-plus-lg album-picker__add-plus" />
                </span>
              </span>
              <span class="album-picker__label">Criar coleção</span>
            </button>
            <button
              v-for="album in visibleAlbums"
              :key="album.id"
              type="button"
              class="album-picker__cell album-picker__cell--action"
              :class="{
                'album-picker__cell--selected': selectedAlbumIds.includes(
                  album.id,
                ),
                'album-picker__cell--dimmed':
                  hasAlbumSelection && !selectedAlbumIds.includes(album.id),
              }"
              @click="toggleAlbum(album.id)"
            >
              <div class="album-picker__thumb">
                <AlbumCoverArt :album="album" />
              </div>
              <span class="album-picker__text">
                <span class="album-picker__label">{{ album.title }}</span>
                <span
                  v-if="getAlbumAuthorName(album)"
                  class="album-picker__subtitle"
                >
                  {{ getAlbumAuthorName(album) }}
                </span>
              </span>
            </button>
          </div>
        </div>

        <footer class="album-picker__footer">
          <button
            type="button"
            class="album-picker__btn album-picker__btn--cancel"
            @click="close"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="album-picker__btn album-picker__btn--add"
            :aria-label="primaryActionLabel"
            @click="onConfirmAdd"
          >
            {{ primaryActionLabel }}
          </button>
        </footer>
      </div>
    </div>
  </transition>
</template>

<style lang="scss" scoped>
.album-picker__backdrop {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.5);
}

.album-picker__panel {
  display: flex;
  width: 600px;
  max-width: min(600px, 100%);
  padding: 0 16px;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  overflow: hidden;
  border-radius: 16px;
  background: var(--Off_white, #faf9f9);
  box-shadow: 4px 4px 8px 0 rgba(0, 0, 0, 0.1);
}

.album-picker__header {
  display: flex;
  padding: 32px 0 16px 0;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
}

.album-picker__title {
  color: #2f2f2f;
  font-family: "DM Sans";
  font-size: 20px;
  font-style: normal;
  font-weight: 500;
  line-height: 150%;
  margin-bottom: 0;
}

.album-picker__close {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  color: #2f2f2f;
  line-height: 1;
}

.album-picker__close .bi {
  font-size: 24px;
  line-height: 1;
}

.album-picker__close-icon--mobile {
  display: none;
}

.album-picker__body {
  display: flex;
  padding: 0 32px;
  flex-direction: column;
  align-items: flex-start;
  align-self: stretch;
  flex: 1;
  min-height: 0;
}

.album-picker__scope {
  position: relative;
  align-self: stretch;
  margin-bottom: 8px;
}

.album-picker__scope-caption {
  display: block;
  color: var(--Cinza_M, #636262);
  font-family: "DM Sans", sans-serif;
  font-size: 12px;
  font-style: italic;
  margin-bottom: 4px;
}

.album-picker__scope-selected {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid #cecece;
  background: var(--Branco, #fff);
  cursor: pointer;
}

.album-picker__scope-identity {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.album-picker__scope-avatar {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2f2f2f;
}

.album-picker__scope-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.album-picker__scope-initials {
  color: #fff;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 700;
}

.album-picker__scope-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #2f2f2f;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 500;
}

.album-picker__scope-chevron {
  flex-shrink: 0;
  color: #636262;
  transition: transform 0.2s ease;
}

.album-picker__scope-chevron--open {
  transform: rotate(180deg);
}

.album-picker__scope-menu {
  position: absolute;
  z-index: 5;
  left: 0;
  right: 0;
  margin-top: 4px;
  /* Mostra ~3 escopos; os demais ficam acessíveis por rolagem interna.
     Altura fixa e pequena mantém o dropdown contido no modal em qualquer
     tela, independentemente de quantos coletivos o usuário tenha, e deixa
     uma folga visível entre a base do dropdown e a borda do modal. */
  max-height: 144px;
  overflow-y: auto;
  border-radius: 8px;
  border: 1px solid #cecece;
  background: var(--Off_white, #faf9f9);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
  scrollbar-width: thin;
  scrollbar-color: rgba(99, 98, 98, 0.45) transparent;
}

.album-picker__scope-menu::-webkit-scrollbar {
  width: 6px;
}

.album-picker__scope-menu::-webkit-scrollbar-thumb {
  background: rgba(99, 98, 98, 0.45);
  border-radius: 999px;
}

.album-picker__scope-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 8px;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  font: inherit;
}

.album-picker__scope-option + .album-picker__scope-option {
  border-top: 1px solid color-mix(in srgb, #cecece, transparent 50%);
}

.album-picker__scope-option:hover,
.album-picker__scope-option:focus-visible {
  background: rgba(99, 98, 98, 0.08);
}

/* Skeleton da lista de coleções (transição ao trocar de escopo) */
.album-picker__skeleton-cell {
  cursor: default;
}

.album-picker__skeleton-line {
  display: block;
  height: 12px;
  width: 80%;
  border-radius: 4px;
}

.album-picker__skeleton-line--short {
  width: 50%;
  margin-top: 6px;
}

.album-picker__skeleton-block {
  background: #e9e8e8;
  background-image: linear-gradient(
    90deg,
    #e9e8e8 0px,
    #f4f3f3 40px,
    #e9e8e8 80px
  );
  background-size: 600px 100%;
  animation: album-picker-shimmer 1.4s ease-in-out infinite;
}

@keyframes album-picker-shimmer {
  0% {
    background-position: -120px 0;
  }
  100% {
    background-position: 240px 0;
  }
}

.album-picker__list {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  column-gap: 16px;
  row-gap: 12px;
  width: 100%;
  padding: 12px 0;
  max-height: 300px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(99, 98, 98, 0.45) transparent;
}

/* Chrome/Edge/Safari: barra de scroll */
.album-picker__list::-webkit-scrollbar {
  width: 6px;
}

.album-picker__list::-webkit-scrollbar-track {
  background: transparent;
}

.album-picker__list::-webkit-scrollbar-thumb {
  background: rgba(99, 98, 98, 0.45);
  border-radius: 999px;
}

.album-picker__list::-webkit-scrollbar-thumb:hover {
  background: rgba(99, 98, 98, 0.65);
}

.album-picker__cell {
  display: flex;
  width: 100%;
  min-width: 0;
  padding: 4px;
  align-items: center;
  gap: 16px;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  font: inherit;
  border-bottom: 0.5px solid #cecece;
  flex-wrap: nowrap;
}

.album-picker__cell--action {
  border-radius: 4px;
  transition:
    opacity 0.2s ease,
    box-shadow 0.2s ease;
}

.album-picker__cell--dimmed {
  opacity: 0.4;
}

.album-picker__cell--action:not(.album-picker__cell--selected):hover,
.album-picker__cell--action:not(.album-picker__cell--selected):focus-visible {
  opacity: 1;
  box-shadow: inset 0 0 0 1px var(--Cinza_E, #2f2f2f);
}

.album-picker__add-thumb {
  display: flex;
  flex-shrink: 0;
  width: 50px;
  height: 50px;
  padding: 13.268px 13.368px 12.425px 13px;
  justify-content: center;
  align-items: center;
  border-radius: 0.909px;
  border: 0.1px solid #ccc;
  background: var(--Off_white, #faf9f9);
}

.album-picker__add-circle {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--Cinza_M, #636262);
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.album-picker__add-plus {
  color: #fff;
  font-size: 1.125rem;
}

.album-picker__thumb {
  width: 50px;
  height: 50px;
  flex-shrink: 0;
  border-radius: 4px;
  overflow: hidden;
  background: #ddd;
  border: 2px solid var(--Branco, #fff);
}

.album-picker__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.album-picker__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #000;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 700;
  line-height: 125%;
}

.album-picker__subtitle {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--Cinza_M, #636262);
  font-family: "DM Sans", sans-serif;
  font-size: 12px;
  font-weight: 400;
  line-height: 125%;
}

.album-picker__footer {
  display: flex;
  padding: 16px 0;
  align-items: flex-start;
  gap: 16px;
  align-self: stretch;
}

.album-picker__btn {
  flex: 1;
  height: 25px;
  margin: 0;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid var(--Cinza_E, #2f2f2f);
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  cursor: pointer;
  box-sizing: border-box;
}

.album-picker__btn--cancel {
  background: var(--Branco, #fff);
  border-color: var(--Cinza_E, #2f2f2f);
}

.album-picker__btn--add {
  background: var(--Cinza_E, #2f2f2f);
  border-color: var(--Cinza_E, #2f2f2f);
  color: var(--Branco, #fff);
}

.album-picker-fade-enter-active,
.album-picker-fade-leave-active {
  transition: opacity 0.2s ease;
}

.album-picker-fade-enter-from,
.album-picker-fade-leave-to {
  opacity: 0;
}

@media (max-width: 767px) {
  .album-picker__backdrop {
    padding: 0;
    align-items: stretch;
    justify-content: stretch;
    background: rgba(0, 0, 0, 0.1);
  }

  .album-picker__panel {
    width: 100vw;
    max-width: 100vw;
    height: 100dvh;
    margin: 0;
    border-radius: 0;
    padding: 0;
    gap: 0;
    display: grid;
    grid-template-rows: auto 1fr auto;
  }

  .album-picker__header {
    padding: 4px 0 16px 0;
    justify-content: flex-start;
  }

  .album-picker__close-icon--desktop {
    display: none;
  }

  .album-picker__close-icon--mobile {
    display: block;
  }

  .album-picker__title {
    font-size: 16px;
    line-height: 1.5;
  }

  .album-picker__body {
    padding: 0 32px;
    position: relative;
    padding-top: 70px;
  }

  .album-picker__close {
    position: absolute;
    top: 28px;
    right: 32px;
  }

  .album-picker__list {
    grid-template-columns: 1fr;
    max-height: none;
    -webkit-overflow-scrolling: touch;
    padding: 0 0 24px;
  }

  .album-picker__footer {
    grid-row: 3;
    margin-top: 0;
    padding: 8px 8px calc(32px + env(safe-area-inset-bottom));
    background: var(--Off_white, #faf9f9);
  }

  .album-picker__btn {
    flex: 1 0 0;
    min-width: 0;
    padding: 2px 14px;
    height: 30px;
    border-radius: 5px;
  }

  .album-picker__subtitle {
    font-size: 12px;
  }
}

.album-picker__cell--selected {
  opacity: 1;
  box-shadow: inset 0 0 0 2px var(--Cinza_E, #2f2f2f);
}

.album-picker__cell--selected:hover,
.album-picker__cell--selected:focus-visible {
  opacity: 1;
  box-shadow: inset 0 0 0 2px var(--Cinza_E, #2f2f2f);
}

.album-picker__cell--selected .album-picker__label {
  color: #000;
  font-weight: 700;
}

.album-picker__cell--selected .album-picker__thumb {
  border-color: var(--Branco, #fff);
}

.album-picker__btn--add:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
