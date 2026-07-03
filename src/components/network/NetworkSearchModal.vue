<template>
  <div v-if="isMobile" id="offcanvasSearch" ref="offcanvasEl"
    class="offcanvas offcanvas-bottom network-offcanvas network-offcanvas--search" data-bs-backdrop="false"
    data-bs-scroll="true" tabindex="-1">
    <div class="offcanvas-body network-offcanvas__body">
      <button class="network-offcanvas__close btn btn-icon" type="button" data-bs-dismiss="offcanvas"
        aria-label="Fechar">
        <i class="bi bi-x-lg" />
      </button>

      <div class="search-modal__header">
        <div class="d-flex align-items-center gap-2">
          <h2 class="network-offcanvas__title">Busca por nome</h2>
          <UiField id="network-offcanvas-help" class="network-offcanvas__help-field" label=" "
            explain="Busque por um nome específico ou pelo nome de um coletivo." />
        </div>
      </div>

      <div class="search-modal__input-row">
        <input v-model="inputText" class="search-modal__input" type="text" placeholder="Digite um nome..."
          @keydown.enter="confirm" />
      </div>

      <div class="network-offcanvas__actions">
        <button class="btn network-offcanvas__btn-voltar" type="button" data-bs-dismiss="offcanvas"
          @click="clearSearch">
          Limpar
        </button>
        <button class="btn network-offcanvas__btn-salvar" type="button" data-bs-dismiss="offcanvas"
          @click="confirm">Buscar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { Offcanvas } from "bootstrap";
import UiField from "../ui/UiField.vue";

const emit = defineEmits(["search"]);

const inputText = ref("");
const terms = ref([]);
const dialogEl = ref(null);
const offcanvasEl = ref(null);
const isMobile = ref(window.innerWidth < 768);

function onResize() {
  isMobile.value = window.innerWidth < 768;
}

onMounted(() => {
  window.addEventListener("resize", onResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
});

function openModal() {
  if (!isMobile.value) {
    dialogEl.value?.showModal();
    dialogEl.value?.addEventListener("click", onDialogClick);
  } else {
    const el = offcanvasEl.value;
    if (el) Offcanvas.getOrCreateInstance(el).show();
  }
}

function onDialogClick(e) {
  const rect = dialogEl.value.getBoundingClientRect();
  const clickedOutside =
    e.clientX < rect.left ||
    e.clientX > rect.right ||
    e.clientY < rect.top ||
    e.clientY > rect.bottom;

  if (clickedOutside) closeModal();
}

function closeModal() {
  dialogEl.value?.close();
  dialogEl.value?.removeEventListener("click", onDialogClick);
}

function closeMobile() {
  const el = offcanvasEl.value;
  if (el) Offcanvas.getInstance(el)?.hide();
}

function clearSearch() {
  inputText.value = "";
  emit("search", "");
}

function confirm() {
  emit("search", inputText.value.trim());

  if (isMobile.value) {
    closeMobile();
  } else {
    closeModal();
  }
}

defineExpose({ terms, openModal, closeModal, closeMobile });
</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-md: 768px;


/* ── Offcanvas mobile ── */
.network-offcanvas--search {
  height: 100vh;
  max-height: 100vh;
  width: 100vw;
  max-width: 100vw;
  left: 0;
  border-radius: 0;
}

/* ── Corpo compartilhado ── */
.network-offcanvas__body {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
}

.network-offcanvas__close {
  align-self: flex-end;
  width: 24px;
  height: 24px;
  border-radius: 100%;
  background-color: var(--Gray-900, #212529);
  color: var(--Branco, #fff);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px;
  border: none;

  .bi {
    font-size: 15px;
  }
}

.search-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;

  h2 {
    font-size: 1rem;
    margin: 0;
  }
}

.search-modal__input-row {
  display: flex;
  align-items: stretch;
  border: 1px solid var(--Cinza_C, #d9d9d9);
  border-radius: 0.375rem;
  overflow: hidden;
}

.search-modal__clear-btn {
  background-color: transparent;
  color: var(--Preto, #1a1a1a);
  border: 1px solid var(--Cinza_M, #a6a6a6);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.250rem 0.688rem;
  cursor: pointer;
  font-size: 0.875rem;

  & .bi {
    line-height: 0;
    font-size: 0.7rem;
  }

  &:hover {
    color: var(--Branco, #fff);
    background-color: var(--Preto, #1a1a1a);
  }

}

.search-modal__input {
  flex: 1;
  border: none;
  outline: none;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  background: transparent;
  color: var(--Preto, #1a1a1a);
  min-width: 0;

  &::placeholder {
    color: var(--Cinza_M, #a6a6a6);
    font-style: italic;
  }
}

.search-modal__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.search-modal__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--Laranja_M, #c0622a);
  color: var(--Branco, #fff);
  padding: 0.375rem 0.75rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.network-offcanvas__help-field {
  width: 0;
}

.network-offcanvas__actions {
  display: flex;
  gap: 0.75rem;
  margin-top: auto;
}

.network-offcanvas__btn-voltar {
  flex: 1;
  border: 1px solid var(--Preto, #1a1a1a);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 30px;
}

.network-offcanvas__btn-salvar {
  flex: 1;
  background-color: var(--Preto, #1a1a1a);
  color: var(--Branco, #fff);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 30px;
}
</style>