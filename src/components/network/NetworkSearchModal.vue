<template>
  <div id="offcanvasSearch" class="offcanvas offcanvas-bottom network-offcanvas network-offcanvas--search"
    data-bs-backdrop="false" data-bs-scroll="true" tabindex="-1">
    <div class="offcanvas-body network-offcanvas__body">

      <button class="network-offcanvas__close btn btn-icon" type="button" data-bs-dismiss="offcanvas"
        aria-label="Fechar">
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
        <button class="btn network-offcanvas__btn-voltar" type="button" data-bs-dismiss="offcanvas">
          Voltar
        </button>
        <button class="btn network-offcanvas__btn-salvar" type="button" data-bs-dismiss="offcanvas" @click="confirm">
          Buscar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { Tooltip } from "bootstrap";

onMounted(() => {
  const el = document.querySelector(".search-modal__help-icon");
  if (el) new Tooltip(el);
});

const emit = defineEmits(["search"]);

const inputText = ref("");
const terms = ref([]);

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
}

defineExpose({ terms });
</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-md: 768px;

.network-offcanvas--search {
  height: auto;
  max-height: 60vh;
  width: 480px;
  max-width: 480px;
  top: auto;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 0.75rem 0.75rem 0 0;

  @media (min-width: $breakpoint-md) {
    height: 100vh;
    max-height: 100vh;
    width: 100vw;
    max-width: 100vw;
  }
}

.network-offcanvas__body {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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

  & .bi {
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
}

.search-modal__clear-btn:hover {
  color: var(--Preto, #1a1a1a);
  border-color: var(--Preto, #1a1a1a);
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
}

.search-modal__input::placeholder {
  color: var(--Cinza_M, #a6a6a6);
  font-style: italic;
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
}

.search-modal__add-btn:hover {
  opacity: 0.85;
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
}

.search-modal__chip-remove:hover {
  opacity: 1;
}

.search-modal__help-icon {
  display: inline-flex;
  align-items: center;
  /* color: var(--Cinza_E, #1a1a1a); */
  /* font-size: 0.75rem; */
  cursor: default;

  .bi {
    font-size: 0.75rem;
  }

  &:hover {
    color: var(--Cinza_E, #1a1a1a);
  }
}

.search-modal__help-icon:hover {
  color: var(--Cinza_E, #1a1a1a);
}

/* Estilo do tooltip */
:global(.search-modal__tooltip .tooltip-inner) {
  max-width: 260px;
  font-size: 0.8rem;
  text-align: left;
  padding: 0.5rem 0.75rem;
  background-color: #fff;
  color: #1a1a1a;
  border-radius: 0.375rem;
  border: 1px solid var(--Cinza_C, #d9d9d9);
}

:global(.search-modal__tooltip .tooltip-arrow::before) {
  border-right-color: #fff;
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