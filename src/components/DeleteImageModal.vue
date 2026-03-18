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