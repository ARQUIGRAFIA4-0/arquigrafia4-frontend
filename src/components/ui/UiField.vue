<template>
  <div class="ui-field">
    <div
      v-if="label"
      class="d-flex flex-row justify-content-between w-100 mb-1"
    >
      <label class="form-label text-cinza-e h3" :for="inputId">{{ label }}</label>
      <div v-if="explain" class="flex-grow-0" style="margin-right: 12px">
        <button
          type="button"
          class="btn p-0 border-0 bg-transparent"
          data-bs-toggle="popover"
          data-bs-placement="top"
          data-bs-trigger="hover focus"
          :data-bs-content="explain"
          :aria-label="'Mais informações: ' + explain"
          data-cy="explain-icon"
          ref="explainRef"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M12 6C12 7.5913 11.3679 9.11742 10.2426 10.2426C9.11742 11.3679 7.5913 12 6 12C4.4087 12 2.88258 11.3679 1.75736 10.2426C0.632141 9.11742 0 7.5913 0 6C0 4.4087 0.632141 2.88258 1.75736 1.75736C2.88258 0.632141 4.4087 0 6 0C7.5913 0 9.11742 0.632141 10.2426 1.75736C11.3679 2.88258 12 4.4087 12 6ZM4.122 4.52475C4.09782 4.52508 4.07384 4.52047 4.0515 4.51121C4.02917 4.50195 4.00896 4.48823 3.99211 4.47089C3.97526 4.45354 3.96213 4.43295 3.95351 4.41036C3.94489 4.38777 3.94098 4.36366 3.942 4.3395C4.0125 3.06825 5.05275 2.625 6.00375 2.625C7.05075 2.625 8.00775 3.1725 8.00775 4.305C8.00775 5.115 7.5315 5.5005 7.07475 5.84775C6.522 6.267 6.31725 6.42375 6.31725 6.96225V7.041C6.31725 7.09073 6.2975 7.13842 6.26233 7.17358C6.22717 7.20875 6.17948 7.2285 6.12975 7.2285H5.52225C5.47304 7.22851 5.4258 7.20916 5.39072 7.17465C5.35564 7.14013 5.33554 7.09321 5.33475 7.044L5.33175 6.88125C5.30325 6.186 5.703 5.75775 6.20775 5.391C6.65025 5.058 6.9315 4.839 6.9315 4.36275C6.9315 3.744 6.4605 3.48675 5.946 3.48675C5.34375 3.48675 5.00625 3.84525 4.9395 4.33725C4.926 4.44 4.8435 4.52475 4.74 4.52475H4.12125H4.122ZM5.86575 9.357C5.42775 9.357 5.109 9.0615 5.109 8.66175C5.109 8.24775 5.42775 7.95675 5.8665 7.95675C6.32325 7.95675 6.6375 8.24775 6.6375 8.66175C6.6375 9.0615 6.3225 9.357 5.86575 9.357Z"
              fill="#2F2F2F"
            />
          </svg>
        </button>
      </div>
    </div>

    <slot
      :id="inputId"
      :ariaInvalid="invalid ? 'true' : undefined"
      :errorId="errorId"
      :ariaDescribedby="ariaDescribedby"
      :invalid="invalid"
    />

    <div
      v-if="invalid && invalidMessage"
      class="d-block text-cinza-m invalid-feedback"
      :id="errorId"
    >
      {{ invalidMessage }}
    </div>
  </div>
</template>

<script>
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import { Popover } from "bootstrap";

let uniqueIdCounter = 0;

export default {
  name: "UiField",
  props: {
    label: {
      type: String,
      default: "",
    },
    id: {
      type: String,
      default: undefined,
    },
    invalid: {
      type: Boolean,
      default: false,
    },
    invalidMessage: {
      type: String,
      default: "",
    },
    explain: {
      type: String,
      default: "",
    },
  },
  setup(props) {
    const explainRef = ref(null);
    let explainPopoverInstance = null;

    const inputId = computed(() => props.id || `ui-field-${++uniqueIdCounter}`);
    const errorId = computed(() =>
      props.invalid && props.invalidMessage ? `${inputId.value}-error` : undefined
    );
    const ariaDescribedby = computed(() =>
      props.invalid && props.invalidMessage ? errorId.value : undefined
    );

    onMounted(() => {
      if (explainRef.value && props.explain) {
        explainPopoverInstance = new Popover(explainRef.value, {
          trigger: "hover focus",
          placement: "top",
          container: "body",
          content: props.explain,
        });
      }
    });

    onBeforeUnmount(() => {
      if (explainPopoverInstance) {
        explainPopoverInstance.dispose();
        explainPopoverInstance = null;
      }
    });

    return { explainRef, inputId, errorId, ariaDescribedby };
  },
};
</script>

<style scoped>
.ui-field {
  width: 100%;
}

.invalid-feedback {
  color: #bc1518;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 115%;
  text-align: right;
}
</style>


