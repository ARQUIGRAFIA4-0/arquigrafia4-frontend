<template>
  <article class="ui-card" :class="stateClasses" :aria-disabled="ariaDisabled">
    <div v-if="$slots.image" class="ui-card__media">
      <slot name="image" />
    </div>

    <div class="ui-card__content">
      <div class="ui-card__body">
        <slot />
      </div>
    </div>

    <footer v-if="$slots.footer" class="ui-card__footer">
      <slot name="footer" />
    </footer>
  </article>
</template>

<script setup>
import { computed } from "vue";

defineOptions({ name: "UiCard" });

const props = defineProps({
  state: {
    type: String,
    default: "neutral",
    validator: (value) => ["neutral", "active", "inactive"].includes(value),
  },
});

const stateClasses = computed(() => ({
  "ui-card--active": props.state === "active",
  "ui-card--inactive": props.state === "inactive",
}));

const ariaDisabled = computed(() =>
  props.state === "inactive" ? "true" : undefined
);
</script>
