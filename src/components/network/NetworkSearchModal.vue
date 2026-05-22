<template>
  <Teleport to="body">
    <dialog v-if="!isMobile" ref="dialogEl" class="search-dialog">

      <div class="offcanvas-body network-offcanvas__body">

        <button class="network-offcanvas__close btn btn-icon" type="button" @click="closeModal" aria-label="Fechar">
          <i class="bi bi-x-lg" />
        </button>


        <div class="search-modal__header">
          <div class="d-flex align-items-center gap-2">
            <h2 class="network-offcanvas__title">Busca por nome</h2>
            <span class="search-modal__help-icon" data-bs-toggle="tooltip" data-bs-placement="right"
              data-bs-custom-class="search-modal__tooltip"
              title="Digite um nome e clique em + ou pressione Enter para adicionar. Você pode adicionar múltiplos nomes — a busca retornará resultados para qualquer um deles.">
              <i class="bi bi-info-circle-fill" />
            </span>
          </div>

          <button v-if="terms.length > 0" class="btn search-modal__clear-btn" type="button" @click="clearAll">
            <i class="bi bi-x-lg" />
            Limpar busca
          </button>
        </div>

        <!-- Campo de entrada -->
        <div class="search-modal__input-row">
          <input v-model="inputText" class="search-modal__input" type="text" placeholder="Digite um nome..."
            @keydown.enter="addTerm" />
          <button class="search-modal__add-btn" type="button" @click="addTerm">
            <i class="bi bi-plus-lg" />
          </button>
        </div>

        <!-- Chips -->
        <div v-if="terms.length > 0" class="search-modal__chips-section">
          <p class="search-modal__chips-label">Termos de busca</p>
          <div class="search-modal__chips">
            <span v-for="(term, index) in terms" :key="index" class="search-modal__chip">
              {{ term }}
              <button class="search-modal__chip-remove" type="button" :aria-label="`Remover ${term}`"
                @click="removeTerm(index)">
                ×
              </button>
            </span>
          </div>
        </div>

        <!-- Ações -->
        <div class="network-offcanvas__actions">
          <button class="btn network-offcanvas__btn-voltar" type="button" @click="closeModal">
            Voltar
          </button>
          <button class="btn network-offcanvas__btn-salvar" type="button" @click="confirm">
            Buscar
          </button>
        </div>
      </div>
    </dialog>
  </Teleport>

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
          <span class="search-modal__help-icon" data-bs-toggle="tooltip" data-bs-placement="top"
            data-bs-custom-class="search-modal__tooltip"
            title="Digite um nome e clique em + ou pressione Enter para adicionar. Você pode adicionar múltiplos nomes — a busca retornará resultados para qualquer um deles.">
            <i class="bi bi-info-circle-fill" />
          </span>
        </div>
        <button v-if="terms.length > 0" class="btn search-modal__clear-btn" type="button" @click="clearAll">
          <i class="bi bi-x-lg" />
          Limpar busca
        </button>
      </div>

      <div class="search-modal__input-row">
        <input v-model="inputText" class="search-modal__input" type="text" placeholder="Digite um nome..."
          @keydown.enter="addTerm" />
        <button class="search-modal__add-btn" type="button" @click="addTerm">
          <i class="bi bi-plus-lg" />
        </button>
      </div>

      <div v-if="terms.length > 0" class="search-modal__chips-section">
        <p class="search-modal__chips-label">Termos de busca</p>
        <div class="search-modal__chips">
          <span v-for="(term, index) in terms" :key="index" class="search-modal__chip">
            {{ term }}
            <button class="search-modal__chip-remove" type="button" :aria-label="`Remover ${term}`"
              @click="removeTerm(index)">×</button>
          </span>
        </div>
      </div>

      <div class="network-offcanvas__actions">
        <button class="btn network-offcanvas__btn-voltar" type="button" data-bs-dismiss="offcanvas">Voltar</button>
        <button class="btn network-offcanvas__btn-salvar" type="button" data-bs-dismiss="offcanvas"
          @click="confirm">Buscar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import { Tooltip, Offcanvas } from "bootstrap";

// onMounted(() => {
//   const el = document.querySelector(".search-modal__help-icon");
//   if (el) new Tooltip(el);
// });

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

  nextTick(() => {
    document.querySelectorAll(".search-modal__help-icon").forEach((el) => {
      new Tooltip(el);
    });
  });
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

function addTerm() {
  const value = inputText.value.trim();
  if (!value || terms.value.includes(value)) return;
  terms.value.push(value);
  inputText.value = "";
}

function removeTerm(index) {
  terms.value.splice(index, 1);
}

function clearAll() {
  terms.value = [];
  inputText.value = "";
  emit("search", []);
}

function confirm() {
  emit("search", [...terms.value]);
  closeModal();
}

defineExpose({ terms, openModal, closeModal, closeMobile });
</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-md: 768px;

/* ── Dialog desktop ── */
.search-dialog {
  border: none;
  border-radius: 0.75rem;
  padding: 0;
  width: 480px;
  max-width: 90vw;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  overflow: hidden;

  &::backdrop {
    background-color: rgba(0, 0, 0, 0.25);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }
}

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
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8rem;
  color: var(--Cinza_M, #a6a6a6);
  border: 1px solid var(--Cinza_M, #a6a6a6);
  border-radius: 0.375rem;
  padding: 0.25rem 0.625rem;
  white-space: nowrap;

  &:hover {
    color: var(--Preto, #1a1a1a);
    border-color: var(--Preto, #1a1a1a);
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

.search-modal__add-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  background-color: var(--Preto, #1a1a1a);
  color: var(--Branco, #fff);
  border: none;
  font-size: 1rem;
  flex-shrink: 0;

  &:hover {
    opacity: 0.85;
  }
}

.search-modal__chips-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.search-modal__chips-label {
  font-size: 0.875rem;
  font-weight: 500;
  margin: 0;
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

.search-modal__chip-remove {
  background: none;
  border: none;
  color: inherit;
  font-size: 1rem;
  line-height: 1;
  padding: 0;
  cursor: pointer;
  opacity: 0.8;

  &:hover {
    opacity: 1;
  }
}

.search-modal__help-icon {
  display: inline-flex;
  align-items: center;
  cursor: default;

  .bi {
    font-size: 0.75rem;
  }

  &:hover {
    color: var(--Cinza_E, #1a1a1a);
  }
}

/* Tooltip branco */
:global(.search-modal__tooltip .tooltip-inner) {
  max-width: 260px;
  font-size: 0.8rem;
  text-align: left;
  padding: 0.5rem 0.75rem;
  background-color: #fff;
  color: #1a1a1a;
  border-radius: 0.375rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

:global(.search-modal__tooltip .tooltip-arrow::before) {
  border-right-color: #fff;
}

/* Ações */
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