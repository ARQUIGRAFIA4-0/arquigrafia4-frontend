<template>
  <Teleport to="body">
    <Transition name="suggest-modal-fade">
      <div v-if="modelValue" class="suggest-modal-overlay" @click.self="close">
        <div class="suggest-modal" role="dialog" aria-modal="true" aria-labelledby="suggest-modal-title">
          <div class="suggest-modal-header">
            <h2 id="suggest-modal-title" class="suggest-modal-title">
              Edição colaborativa
            </h2>
            <button type="button" class="suggest-modal-close" aria-label="Fechar" @click="close">
              <i class="bi bi-x-lg" aria-hidden="true"></i>
            </button>
          </div>

          <p class="suggest-modal-text">
            Você gostaria de complementar as informações sobre essa imagem ou
            sugerir alterações nos dados existentes?
          </p>

          <div class="suggest-modal-actions">
            <button type="button" class="btn suggest-modal-btn suggest-modal-btn--cancel" @click="close">
              Cancelar
            </button>
            <button type="button" class="btn suggest-modal-btn suggest-modal-btn--confirm" @click="confirm">
              Sugerir edições
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "confirm", "cancel"]);

function close() {
  emit("update:modelValue", false);
  emit("cancel");
}

function confirm() {
  emit("update:modelValue", false);
  emit("confirm");
}
</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;

.suggest-modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 1050;
}

.suggest-modal {
  width: 100%;
  max-width: 577px;
  background-color: var(--Branco);
  border-radius: 16px;
  padding: 1rem 1rem 0 1rem;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
}

.suggest-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 1rem 3.125rem 1rem 3.125rem;

  @media (max-width: 425px) {
    margin: 0 1.125rem 1.5rem 1.125rem;
  }
}

.suggest-modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 500;
  line-height: 150%;
  color: var(--Preto);
}

.suggest-modal-close {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--Cinza_M);
  cursor: pointer;

  .bi {
    font-size: .6563rem;
  }
}

.suggest-modal-text {
  margin: 0 3.125rem 1.5rem 3.125rem;
  color: var(--Preto);
  font-weight: 500;
  font-size: 1rem;
  line-height: 150%;

  @media (max-width: 425px) {
    margin: 0 1.125rem 1.5rem 1.125rem;
  }
}

.suggest-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin: 1rem 0;
}

.suggest-modal-btn {
  width: 100%;
  max-width: 264px;
  min-width: 110px;
  height: 25px;
  border-radius: 5px;
  padding: .125rem .875rem;
  font-weight: 400;
  font-size: 0.875rem;
  line-height: 150%;
}

.suggest-modal-btn--cancel {
  background-color: var(--Off_white);
  border: 1px solid var(--Cinza_E);
  color: var(--Preto);

  &:hover {
    background-color: var(--Branco);
  }
}

.suggest-modal-btn--confirm {
  background-color: var(--Cinza_E);
  color: var(--Branco);

  &:hover {
    background-color: var(--Preto);
  }
}

/* Transição de entrada/saída do modal */
.suggest-modal-fade-enter-active,
.suggest-modal-fade-leave-active {
  transition: opacity 0.18s ease;
}

.suggest-modal-fade-enter-from,
.suggest-modal-fade-leave-to {
  opacity: 0;
}
</style>
