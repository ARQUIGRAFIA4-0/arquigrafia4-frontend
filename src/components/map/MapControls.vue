<template>
  <div class="map-controls d-flex flex-row align-items-center gap-2 px-2 py-1">
    <button
      type="button"
      class="action-btn btn btn-link text-decoration-none text-white d-flex justify-content-center align-items-center"
      @click="$emit('search')"
      title="Buscar endereço"
    >
      <i class="bi bi-search" style="font-size: 1.2rem"></i>
    </button>
    <button
      type="button"
      class="action-btn btn btn-link text-decoration-none text-white d-flex justify-content-center align-items-center"
      @click="$emit('zoom-in')"
      title="Zoom In"
    >
      <i class="bi bi-plus-lg" style="font-size: 1.5rem"></i>
    </button>
    <button
      type="button"
      class="action-btn btn btn-link text-decoration-none text-white d-flex justify-content-center align-items-center"
      @click="$emit('zoom-out')"
      title="Zoom Out"
    >
      <i class="bi bi-dash-lg" style="font-size: 1.5rem"></i>
    </button>
  </div>
</template>

<script setup>
defineEmits(["zoom-in", "zoom-out", "search"]);
</script>

<style scoped>
.map-controls {
  background-color: rgba(0, 0, 0, 0.222);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(2px);
  color: #fff;
  border-radius: 6px;
  z-index: 10;
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  padding: 0;
  background: transparent;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
}

.action-btn:hover {
  background-color: rgba(255, 255, 255, 0.16);
}

.action-btn:active {
  background-color: rgba(255, 255, 255, 0.3);
}
</style>
