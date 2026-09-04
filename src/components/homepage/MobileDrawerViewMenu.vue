<template>
  <ui-mobile-drawer
    id="drawer-view-menu"
    :model-value="modelValue"
    @update:modelValue="updateModelValue"
    title=""
    backdrop="true"
  >
    <div class="p-3 drawer-content">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div class="h2 m-0">Modo de visualização</div>
        <button
          type="button"
          class="drawer-close-btn"
          aria-label="Fechar"
          @click="updateModelValue(false)"
        >
          <i class="bi bi-x" />
        </button>
      </div>
      <div class="list-group list-group-flush">
        <button
          v-for="option in viewOptionsList"
          :key="option.selection"
          class="list-group-item list-group-item-action"
          @click="onSelect(option.selection)"
        >
          <i :class="['bi', selectionToViewIcon(option.selection)]"></i>
          {{ option.label }}
        </button>
      </div>
    </div>
  </ui-mobile-drawer>
</template>

<script setup>
import { computed } from "vue";
import UiMobileDrawer from "@/components/ui/UiMobileDrawer.vue";
import { selectionToViewIcon, viewOptions } from "@/constants/viewModes";

defineOptions({ name: "MobileDrawerViewMenu" });

defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue", "select"]);

const viewOptionsList = computed(() => viewOptions());

const updateModelValue = (value) => {
  emit("update:modelValue", value);
};

const onSelect = (selection) => {
  emit("select", { selection });
  emit("update:modelValue", false);
};
</script>

<style scoped>
.drawer-close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  min-width: 24px;
  border-radius: 50%;
  background-color: #000;
  color: #fff;
  border: none;
  padding: 0;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
}

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
