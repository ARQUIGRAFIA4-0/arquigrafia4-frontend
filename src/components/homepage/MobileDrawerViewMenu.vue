<template>
  <ui-mobile-drawer
    id="drawer-view-menu"
    :model-value="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    title="Modo de visualização"
    backdrop="true"
  >
    <div class="list-group list-group-flush">
      <button
        class="list-group-item list-group-item-action"
        @click="$emit('select', 'mar')"
      >
        <i class="bi bi-image"></i> Mar de imagens
      </button>
      <button
        class="list-group-item list-group-item-action"
        @click="$emit('select', 'grid')"
      >
        <i class="bi bi-grid"></i> Grade
      </button>
      <button
        class="list-group-item list-group-item-action"
        @click="$emit('select', 'mosaic')"
      >
        <i class="bi bi-grid-1x2"></i> Mosaico
      </button>
      <button
        class="list-group-item list-group-item-action"
        @click="$emit('select', 'map')"
      >
        <i class="bi bi-map"></i> Mapa
      </button>
    </div>
  </ui-mobile-drawer>
</template>

<script>
import UiMobileDrawer from "@/components/ui/UiMobileDrawer.vue";

export default {
  name: "MobileDrawerViewMenu",
  components: { UiMobileDrawer },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
  },
  emits: ["update:modelValue", "select"],
};
</script>

<style scoped>
.list-group-item {
  padding: 2rem 1rem 0.5rem 1rem;
  color: var(--p-color);
  font-size: var(--p-fs);
  font-weight: 700;
  line-height: 125%;
  display: flex;
  align-items: center;
}

.list-group-item:last-child {
  border-bottom: 1px solid var(--bs-list-group-border-color);
}

.list-group-item:hover,
.list-group-item:focus,
.list-group-item:active {
  color: var(--p-color);
  background-color: transparent;
}

.list-group-item i {
  font-size: 1.25rem;
  margin-right: 24px;
}
</style>
