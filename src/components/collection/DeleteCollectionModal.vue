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
  <div v-if="modelValue" class="modal-backdrop" @click.self="close">
    <div
      class="modal-panel"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-collection-modal-title"
      aria-describedby="delete-collection-modal-text"
    >
      <div class="modal-header">
        <h5 id="delete-collection-modal-title" class="m-0 w-100 h2">
          Excluir coleção?
        </h5>
      </div>

      <div id="delete-collection-modal-text" class="modal-body">
        <p class="modal-text">
          Tem certeza que deseja excluir
          <strong v-if="collectionTitle">"{{ collectionTitle }}"</strong
          ><span v-else>esta coleção</span>? As imagens continuam no acervo,
          apenas a coleção será removida.
        </p>
        <p class="modal-warning">Esta ação não pode ser desfeita.</p>
        <p v-if="error" class="modal-error" role="alert">{{ error }}</p>
      </div>

      <div class="modal-footer footer-grid">
        <button
          ref="cancelButton"
          type="button"
          class="btn btn-outline-secondary btn-sm w-100"
          :disabled="isDeleting"
          @click="close"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="btn btn-danger btn-sm w-100"
          :disabled="isDeleting"
          @click="emit('confirm')"
        >
          {{ isDeleting ? "Excluindo..." : "Excluir" }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}

.modal-panel {
  width: 100%;
  max-width: 600px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: var(--shadow-elevation-medium);
  padding: 0px 15px;
}

.modal-header {
  padding: 16px 40px 0 40px;
  border-bottom: none;
}

.modal-body {
  padding: 20px 40px;
}

.modal-footer {
  padding: 12px 0px 15px 0px;
}

.footer-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.modal-text {
  margin: 0 0 12px 0;
  font-size: 0.95rem;
  color: var(--Cinza_E, #555);
  line-height: 1.5;
}

.modal-warning {
  margin: 0;
  font-size: 0.9rem;
  color: var(--Cinza_F, #333);
  font-weight: 500;
}

.modal-error {
  margin: 12px 0 0 0;
  font-size: 0.9rem;
  color: #bc1518;
  font-weight: 500;
}
</style>
