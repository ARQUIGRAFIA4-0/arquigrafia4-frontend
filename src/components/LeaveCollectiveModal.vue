<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from "vue";

defineOptions({
  name: "LeaveCollectiveModal",
});

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  collectiveName: { type: String, default: "" },
  isLeaving: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue", "confirm"]);

const cancelButton = ref(null);

function close() {
  if (props.isLeaving) return;
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
      // Foco inicial em "Cancelar": evita sair do coletivo com um Enter acidental.
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
  <Teleport to="body">
    <div v-if="modelValue" class="modal-backdrop" @click.self="close">
      <div
        class="modal-panel"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="leave-collective-modal-title"
        aria-describedby="leave-collective-modal-text"
      >
        <div class="modal-header">
          <h5 id="leave-collective-modal-title" class="m-0 w-100 h2">
            Deixar de participar?
          </h5>
        </div>

        <div id="leave-collective-modal-text" class="modal-body">
          <p class="modal-text">
            Tem certeza que deseja deixar de participar de
            <strong v-if="collectiveName">"{{ collectiveName }}"</strong
            ><span v-else>este coletivo</span>?
          </p>
          <p class="modal-warning">
            Para voltar, será preciso solicitar a entrada novamente.
          </p>
        </div>

        <div class="modal-footer footer-grid">
          <button
            ref="cancelButton"
            type="button"
            class="btn btn-outline-secondary btn-sm w-100"
            :disabled="isLeaving"
            @click="close"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="btn btn-danger btn-sm w-100"
            :disabled="isLeaving"
            @click="emit('confirm')"
          >
            {{ isLeaving ? "Saindo..." : "Deixar de participar" }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
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
  overflow-wrap: anywhere;
}

.modal-warning {
  margin: 0;
  font-size: 0.9rem;
  color: var(--Cinza_F, #333);
  font-weight: 500;
}

@media (max-width: 575.98px) {
  .modal-header {
    padding: 16px 16px 0 16px;
  }

  .modal-body {
    padding: 16px;
  }
}
</style>
