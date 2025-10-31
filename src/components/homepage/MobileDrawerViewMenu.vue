<template>
  <ui-mobile-drawer
    id="drawer-view-menu"
    :model-value="modelValue"
    @update:modelValue="updateModelValue"
    title="Modo de visualização"
    backdrop="true"
  >
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
