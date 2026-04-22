<script setup>
import { ref, watch } from "vue";
import defaultCover from "@/assets/album-default.png";

// Options
defineOptions({
  name: "AlbumPickerModal",
});

// Props
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  albums: { type: Array, default: () => [] },
  preselectedAlbumIds: { type: Array, default: () => [] },
});

const emit = defineEmits([
  "update:modelValue",
  "open-create-collection",
  "confirm-add",
]);

function close() {
  emit("update:modelValue", false);
}

// Criar coleção
function onAddCollection() {
  emit("open-create-collection");
}
 
/**
 * Start: Selecionar álbum para inserir imagem
 */
const selectedAlbumIds = ref([]);

// Selecionar/desselecionar álbum
function toggleAlbum(albumId) {

  if (selectedAlbumIds.value.includes(albumId)) {  // se já está selecionado, desseleciona
    selectedAlbumIds.value = selectedAlbumIds.value.filter((id) => id !== albumId);
    return;
  }

  selectedAlbumIds.value = [...selectedAlbumIds.value, albumId]; // se não está selecionado, seleciona

}

// Confirmar adicionar imagem ao álbum
function onConfirmAdd() {
  if (!selectedAlbumIds.value.length) return;

  emit("confirm-add", {
    albumIds: selectedAlbumIds.value,
  });

  emit("update:modelValue", false);
}

// sempre que abrir modal, resetar seleção
watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) return;

    // pré-seleciona álbuns em que a imagem já está
    selectedAlbumIds.value = [...(props.preselectedAlbumIds || [])];

  }

);

</script>

<template>
  <transition name="album-picker-fade">
    <div
      v-if="modelValue"
      class="album-picker__backdrop"
      @click.self="close"
    >
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
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M6.97034 6.96839C7.04001 6.89854 7.12277 6.84313 7.21389 6.80532C7.30501 6.76751 7.40269 6.74805 7.50134 6.74805C7.59999 6.74805 7.69767 6.76751 7.78879 6.80532C7.87991 6.84313 7.96267 6.89854 8.03234 6.96839L12.0013 10.9389L15.9703 6.96839C16.0401 6.89866 16.1229 6.84334 16.214 6.8056C16.3051 6.76786 16.4027 6.74844 16.5013 6.74844C16.6 6.74844 16.6976 6.76786 16.7887 6.8056C16.8798 6.84334 16.9626 6.89866 17.0323 6.96839C17.1021 7.03812 17.1574 7.1209 17.1951 7.21201C17.2329 7.30312 17.2523 7.40077 17.2523 7.49939C17.2523 7.598 17.2329 7.69565 17.1951 7.78676C17.1574 7.87787 17.1021 7.96066 17.0323 8.03039L13.0618 11.9994L17.0323 15.9684C17.1021 16.0381 17.1574 16.1209 17.1951 16.212C17.2329 16.3031 17.2523 16.4008 17.2523 16.4994C17.2523 16.598 17.2329 16.6957 17.1951 16.7868C17.1574 16.8779 17.1021 16.9607 17.0323 17.0304C16.9626 17.1001 16.8798 17.1554 16.7887 17.1932C16.6976 17.2309 16.6 17.2503 16.5013 17.2503C16.4027 17.2503 16.3051 17.2309 16.214 17.1932C16.1229 17.1554 16.0401 17.1001 15.9703 17.0304L12.0013 13.0599L8.03234 17.0304C7.96261 17.1001 7.87982 17.1554 7.78872 17.1932C7.69761 17.2309 7.59996 17.2503 7.50134 17.2503C7.40272 17.2503 7.30507 17.2309 7.21396 17.1932C7.12286 17.1554 7.04007 17.1001 6.97034 17.0304C6.90061 16.9607 6.84529 16.8779 6.80756 16.7868C6.76982 16.6957 6.75039 16.598 6.75039 16.4994C6.75039 16.4008 6.76982 16.3031 6.80756 16.212C6.84529 16.1209 6.90061 16.0381 6.97034 15.9684L10.9408 11.9994L6.97034 8.03039C6.9005 7.96072 6.84508 7.87796 6.80727 7.78684C6.76946 7.69572 6.75 7.59804 6.75 7.49939C6.75 7.40074 6.76946 7.30305 6.80727 7.21194C6.84508 7.12082 6.9005 7.03806 6.97034 6.96839Z" fill="#636262"/>
            </svg>
            </button>
          </header>          
          <div class="album-picker__list">
            <button
              type="button"
              class="album-picker__cell album-picker__cell--action"
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
                v-for="album in albums"
                :key="album.id"
                type="button"
                class="album-picker__cell album-picker__cell--action"
                :class="{ 'album-picker__cell--selected': selectedAlbumIds.includes(album.id) }"
                @click="toggleAlbum(album.id)"
              >
              <div class="album-picker__thumb">
                <img :src="defaultCover" :alt="album.title" />
              </div>
              <span class="album-picker__label">{{ album.title }}</span>
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
            :disabled="!selectedAlbumIds.length"
            @click="onConfirmAdd"
          >
            Adicionar
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
  padding: 0 16px;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  border-radius: 16px;
  background: var(--Off_white, #FAF9F9);
  box-shadow: 4px 4px 8px 0 rgba(0, 0, 0, 0.10);
}

.album-picker__header {
  display: flex;
  padding: 32px 0 16px 0;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
}

.album-picker__title {
  color: #2F2F2F;
  font-family: "DM Sans";
  font-size: 20px;
  font-style: normal;
  font-weight: 500;
  line-height: 150%;
  margin-bottom: 0;
}

.album-picker__close {
  flex-shrink: 0;
  border: none;
  background: none;
  padding: 4px;
  cursor: pointer;
  color: var(--Cinza_E, #2f2f2f);
  line-height: 1;
}

.album-picker__body {
  display: flex;
  padding: 0 32px;
  flex-direction: column;
  align-items: flex-start;
  align-self: stretch;
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

.album-picker__cell--action:hover,
.album-picker__cell--action:focus-visible {
  opacity: 0.88;
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
  background: var(--Off_white, #FAF9F9);
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

.album-picker__thumb img {
  width: 50px;
  height: 50px;
  object-fit: cover;
  display: block;
}

.album-picker__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  color: #000;
  font-family: "DM Sans";
  font-size: 14px;
  font-style: normal;
  font-weight: 700;
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

@media (max-width: 480px) {
  .album-picker__list {
    grid-template-columns: 1fr;
  }
}

.album-picker__cell--selected {
  background: var(--bs-gray-100);
}

.album-picker__cell--selected .album-picker__label {
  color: var(--Laranja_M, #000);
}

.album-picker__cell--selected .album-picker__thumb {
  border-color: var(--Laranja_M, #000);
}

.album-picker__btn--add:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
