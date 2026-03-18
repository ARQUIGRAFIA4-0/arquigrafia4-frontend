<script setup>
import { watch } from "vue";

defineOptions({
  name: "DeleteImageModal",
});

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  imageData: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "confirm"]);

function close() {
  emit("update:modelValue", false);
}

function handleEsc(event) {
  if (event.key === "Escape") {
    close();
  }
}

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      document.body.style.overflow = 'hidden';
      window.addEventListener("keydown", handleEsc);
    } else {
      document.body.style.overflow = '';
      window.removeEventListener("keydown", handleEsc);
    }
  }
);

function confirmDelete() {
  emit("confirm", props.imageData);
  emit("update:modelValue", false);
}
</script>

<template>
  <div v-if="modelValue" class="modal-backdrop" @click.self="close">
    <div
      class="modal-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div class="modal-header">
        <h5 id="delete-modal-title" class="m-0 w-100 h2">Excluir imagem?</h5>
      </div>

      <div class="modal-body">
        <p class="modal-text">
          Tem certeza que deseja excluir 
          <strong v-if="imageData?.title">"{{ imageData.title }}"</strong><span v-else>esta imagem</span>?
        </p>
        <p class="modal-warning">
          Esta ação não pode ser desfeita.
        </p>
      </div>

      <div class="modal-footer footer-grid">
        <button
          type="button"
          class="btn btn-outline-secondary btn-sm w-100"
          @click="close"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="btn btn-danger btn-sm w-100"
          @click="confirmDelete"
        >
          Excluir
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
</style>
