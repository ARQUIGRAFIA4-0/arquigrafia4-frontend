<script setup>
const props = defineProps({
  // [{ id, message, type: 'success' | 'error' }]
  toasts: { type: Array, default: () => [] },
  // 'soft'  → fundo claro + texto colorido (upload/metadados)
  // 'solid' → fundo colorido + texto branco (perfil/coletivo)
  variant: { type: String, default: "soft" },
});

const emit = defineEmits(["close", "pause", "resume"]);

const isSuccess = (toast) => toast.type === "success";

const boxClass = (toast) => {
  if (props.variant === "solid") {
    return [
      "fs-6",
      "text-white",
      "d-flex",
      "align-items-center",
      "justify-content-between",
      isSuccess(toast) ? "bg-positivo-e" : "bg-negativo-e",
    ];
  }
  return [
    "h-auto",
    "fs-6",
    "border",
    "border-start-3",
    isSuccess(toast)
      ? "alert-success bg-positivo-c text-positivo-e border-success"
      : "alert-danger bg-negativo-c text-negativo-e border-danger",
  ];
};

const iconClass = (toast) => {
  if (props.variant === "solid") {
    return isSuccess(toast)
      ? "bi bi-check-all"
      : "bi bi-exclamation-triangle-fill";
  }
  return isSuccess(toast)
    ? "bi bi-check-circle-fill text-positivo-e"
    : "bi bi-exclamation-triangle-fill text-negativo-e";
};

const closeClass = (toast) => {
  if (props.variant === "solid") return "btn-close text-white";
  return isSuccess(toast)
    ? "btn-close text-positivo-e"
    : "btn-close text-negativo-e";
};
</script>

<template>
  <transition-group name="toast" tag="div" class="app-toast-stack">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="app-toast"
      @mouseenter="emit('pause', toast.id)"
      @mouseleave="emit('resume', toast.id)"
    >
      <div class="app-toast__card alert" :class="boxClass(toast)" role="alert">
        <div class="d-flex align-items-center gap-2">
          <i :class="iconClass(toast)" />
          <span>{{ toast.message }}</span>
        </div>
        <button
          type="button"
          :class="closeClass(toast)"
          aria-label="Close"
          @click="emit('close', toast.id)"
        />
      </div>
    </div>
  </transition-group>
</template>

<style lang="scss" scoped>
.app-toast-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.app-toast__card {
  width: max-content;
  max-width: 100%;
}

// A opacidade anima no elemento externo (que carrega a centralização
// via translateX), e o deslocamento anima no card interno — assim o
// slide não conflita com o transform de centralização.
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.28s ease;
}

.toast-enter-active .app-toast__card,
.toast-leave-active .app-toast__card {
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

// Reflow suave: quando um toast sai, os demais deslizam para a nova posição.
.toast-move {
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
}

.toast-enter-from .app-toast__card {
  transform: translateY(-12px);
}

.toast-leave-to .app-toast__card {
  transform: translateY(-8px);
}
</style>
