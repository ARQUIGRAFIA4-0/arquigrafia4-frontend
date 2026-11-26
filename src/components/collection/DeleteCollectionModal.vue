<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from "vue";

defineOptions({
  name: "DeleteCollectionModal",
});

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  collectionTitle: { type: String, default: "" },
  isDeleting: { type: Boolean, default: false },
  error: { type: String, default: "" },
});

const emit = defineEmits(["update:modelValue", "confirm"]);

const cancelButton = ref(null);

function close() {
  if (props.isDeleting) return;
  emit("update:modelValue", false);
}

function handleEsc(event) {
  if (event.key === "Escape") {
    close();
  }
}

function unlockPage() {
  document.body.style.overflow = "";
  window.removeEventListener("keydown", handleEsc);
}

watch(
  () => props.modelValue,
  async (value) => {
    if (value) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEsc);
      // Foco inicial em "Cancelar": evita excluir com um Enter acidental.
      await nextTick();
      cancelButton.value?.focus();
    } else {
      unlockPage();
    }
  }
);

onBeforeUnmount(unlockPage);
</script>

<template>
  <transition name="fade-modal">
    <div
      v-if="modelValue"
      class="delete-collection-modal__backdrop"
      @click.self="close"
    >
      <div
        class="delete-collection-modal__panel"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-collection-modal-title"
        aria-describedby="delete-collection-modal-text"
      >
        <div class="delete-collection-modal__header">
          <h2 id="delete-collection-modal-title" class="delete-collection-modal__title">
            Excluir coleção?
          </h2>
        </div>

        <div id="delete-collection-modal-text" class="delete-collection-modal__body">
          <p class="delete-collection-modal__text">
            Tem certeza que deseja excluir
            <strong v-if="collectionTitle">"{{ collectionTitle }}"</strong
            ><span v-else>esta coleção</span>? As imagens continuam no acervo,
            apenas a coleção será removida.
          </p>
          <p class="delete-collection-modal__warning">Esta ação não pode ser desfeita.</p>
          <p v-if="error" class="delete-collection-modal__error" role="alert">{{ error }}</p>
        </div>

        <div class="delete-collection-modal__footer">
          <button
            ref="cancelButton"
            type="button"
            class="delete-collection-modal__btn delete-collection-modal__btn--secondary"
            :disabled="isDeleting"
            @click="close"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="delete-collection-modal__btn delete-collection-modal__btn--primary"
            :disabled="isDeleting"
            @click="emit('confirm')"
          >
            {{ isDeleting ? "Excluindo..." : "Excluir coleção" }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<!-- Mesmo padrão visual de CollectionPathModal. -->
<style scoped>
.fade-modal-enter-active,
.fade-modal-leave-active {
  transition: opacity 0.2s ease;
}

.fade-modal-enter-from,
.fade-modal-leave-to {
  opacity: 0;
}

.delete-collection-modal__backdrop {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  box-sizing: border-box;
  background: rgba(0, 0, 0, 0.5);
}

.delete-collection-modal__panel {
  display: flex;
  width: 596px;
  max-width: 100%;
  padding: 0 16px;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  border-radius: 16px;
  background: var(--Off_white, #faf9f9);
  box-shadow: 4px 4px 8px 0 rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
}

.delete-collection-modal__header {
  display: flex;
  padding: 32px 32px 16px;
  align-items: center;
  align-self: stretch;
  box-sizing: border-box;
}

.delete-collection-modal__title {
  flex: 1 0 0;
  margin: 0;
  color: var(--Cinza_E, #2f2f2f);
  font-size: 20px;
  font-weight: 500;
  line-height: 150%;
}

.delete-collection-modal__body {
  display: flex;
  padding: 8px 32px;
  flex-direction: column;
  gap: 12px;
  align-self: stretch;
  box-sizing: border-box;
}

.delete-collection-modal__text,
.delete-collection-modal__warning {
  margin: 0;
  color: var(--Cinza_E, #2f2f2f);
  font-size: 16px;
  font-weight: 500;
  line-height: 150%;
  overflow-wrap: anywhere;
}

.delete-collection-modal__warning {
  font-size: 14px;
  font-weight: 400;
}

.delete-collection-modal__error {
  margin: 0;
  color: var(--Negativo_E, #bc1518);
  font-size: 14px;
  font-weight: 500;
}

.delete-collection-modal__footer {
  display: flex;
  padding: 18px 0;
  gap: 16px;
  align-self: stretch;
  box-sizing: border-box;
}

.delete-collection-modal__btn {
  display: flex;
  flex: 1 0 0;
  min-width: 0;
  height: var(--control-height-desk, 38px);
  margin: 0;
  padding: 2px 14px;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  border: 1px solid var(--Cinza_E, #2f2f2f);
  font-size: 14px;
  font-weight: 400;
  line-height: 150%;
  cursor: pointer;
  box-sizing: border-box;
}

.delete-collection-modal__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.delete-collection-modal__btn:focus-visible {
  outline: 2px solid var(--Cinza_E, #2f2f2f);
  outline-offset: 2px;
}

.delete-collection-modal__btn--secondary {
  background: var(--Off_white, #faf9f9);
  color: var(--Cinza_E, #2f2f2f);
}

.delete-collection-modal__btn--primary {
  background: var(--Cinza_E, #2f2f2f);
  color: var(--Branco, #fff);
}

/* Mobile: botões empilhados, com a ação principal em cima e cancelar embaixo. */
@media (max-width: 767px) {
  .delete-collection-modal__header {
    padding: 24px 8px 8px;
  }

  .delete-collection-modal__body {
    padding: 8px;
  }

  .delete-collection-modal__footer {
    flex-direction: column;
    gap: 8px;
  }

  .delete-collection-modal__btn {
    width: 100%;
    flex: 0 0 auto;
    min-height: var(--control-height-mobile, 48px);
    height: var(--control-height-mobile, 48px);
  }

  .delete-collection-modal__btn--primary {
    order: 1;
  }

  .delete-collection-modal__btn--secondary {
    order: 2;
  }
}
</style>
