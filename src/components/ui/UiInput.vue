<script setup>
import { computed, useAttrs } from "vue";

defineOptions({ name: "UiInput", inheritAttrs: false });

const props = defineProps({
  modelValue: { type: [String, Number], default: "" },
  type: { type: String, default: "text" },
  multiline: { type: Boolean, default: false },
  rows: { type: [Number, String], default: 5 },
  placeholder: { type: String, default: "" },
  disabled: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
  invalid: { type: Boolean, default: false },
  maxlength: { type: [Number, String], default: undefined },
  autocomplete: { type: String, default: undefined },
});

const emit = defineEmits([
  "update:modelValue",
  "blur",
  "focus",
  "input",
  "keydown",
]);

const attrs = useAttrs();

const controlClass = computed(() => [
  "form-control",
  "ui-input",
  { "is-invalid": props.invalid },
  attrs.class,
]);

function onInput(event) {
  emit("update:modelValue", event.target.value);
  emit("input", event);
}
</script>

<template>
  <textarea
    v-if="multiline"
    :class="controlClass"
    :value="modelValue"
    :rows="rows"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :maxlength="maxlength"
    :autocomplete="autocomplete"
    v-bind="{ ...attrs, class: undefined }"
    @input="onInput"
    @blur="emit('blur', $event)"
    @focus="emit('focus', $event)"
    @keydown="emit('keydown', $event)"
  />
  <input
    v-else
    :class="controlClass"
    :type="type"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :maxlength="maxlength"
    :autocomplete="autocomplete"
    v-bind="{ ...attrs, class: undefined }"
    @input="onInput"
    @blur="emit('blur', $event)"
    @focus="emit('focus', $event)"
    @keydown="emit('keydown', $event)"
  />
</template>

<style scoped lang="scss">
.ui-input {
  display: flex;
  box-sizing: border-box;
  width: 100%;
  align-self: stretch;
  align-items: center;
  gap: 18px;
  border-radius: 5px;
  border: 0.75px solid var(--Preto, #1f1f1f);
  background: var(--Off_white, #faf9f9);
  color: var(--Preto, #1f1f1f);
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 150%;
}

.ui-input:not(textarea) {
  height: 30px;
  min-height: 30px;
  padding: 6px 10px;
}

textarea.ui-input {
  display: flex;
  height: auto;
  min-height: 120px;
  padding: 6px 10px;
  align-items: flex-start;
  resize: vertical;
}

.ui-input:focus {
  border-color: var(--Preto, #1f1f1f);
  box-shadow: none;
  outline: none;
}

.ui-input:disabled,
.ui-input[readonly] {
  background: var(--Off_white, #faf9f9);
  opacity: 1;
}

.ui-input.is-invalid {
  border-color: var(--Negativo_E, #bc1518);
}

:global(.input-group) > .ui-input {
  flex: 1 1 auto;
  width: 1%;
  min-width: 0;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
</style>
