<template>
  <button :type="type" class="btn ui-button" :class="classes">
    <i v-if="icone" :class="['bi', `bi-${icone}`]" aria-hidden="true" />
    <span v-if="texto">{{ texto }}</span>
  </button>
</template>

<script setup>
import { computed, useAttrs, watchEffect } from "vue";

defineOptions({ name: "UiButton" });

const props = defineProps({
  hierarquia: {
    type: [Number, String],
    default: 1,
    validator: (value) => [1, 2].includes(Number(value)),
  },
  destaque: {
    type: Boolean,
    default: true,
  },
  icone: {
    type: String,
    default: "",
  },
  texto: {
    type: String,
    default: "",
  },
  type: {
    type: String,
    default: "button",
  },
});

const attrs = useAttrs();

const soIcone = computed(() => Boolean(props.icone) && !props.texto);

const classes = computed(() => ({
  "ui-button--hierarquia-2": Number(props.hierarquia) === 2,
  "ui-button--neutro": !props.destaque,
  "btn-icon": soIcone.value,
}));

if (import.meta.env.DEV) {
  watchEffect(() => {
    if (!props.texto && !props.icone) {
      console.warn("[UiButton] Informe `texto`, `icone` ou os dois.");
    } else if (soIcone.value && !attrs["aria-label"]) {
      console.warn(
        `[UiButton] Botão só com ícone ("${props.icone}") precisa de aria-label.`,
      );
    }
  });
}
</script>

<style scoped>
/* Altura, padding, raio e fonte vêm da regra LINA em buttons.scss, que já segue
   o Figma. Aqui ficam só as diferenças do Botão_p em relação aos .btn atuais. */
.ui-button {
  --ui-button-cor: var(--Laranja_E);

  --bs-btn-color: var(--Branco);
  --bs-btn-bg: var(--ui-button-cor);
  --bs-btn-border-color: var(--ui-button-cor);

  /* Hover e pressionado: provisórios (padrão Bootstrap) até o design definir. */
  --bs-btn-hover-color: var(--Branco);
  --bs-btn-hover-bg: color-mix(in srgb, var(--ui-button-cor) 85%, black);
  --bs-btn-hover-border-color: color-mix(
    in srgb,
    var(--ui-button-cor) 80%,
    black
  );
  --bs-btn-active-color: var(--Branco);
  --bs-btn-active-bg: color-mix(in srgb, var(--ui-button-cor) 80%, black);
  --bs-btn-active-border-color: color-mix(
    in srgb,
    var(--ui-button-cor) 75%,
    black
  );
  --bs-btn-focus-box-shadow: none;

  /* Inativo no Figma: mesmas cores, só a opacidade muda. */
  --bs-btn-disabled-color: var(--bs-btn-color);
  --bs-btn-disabled-bg: var(--bs-btn-bg);
  --bs-btn-disabled-border-color: var(--bs-btn-border-color);
  --bs-btn-disabled-opacity: var(--botao-inativo-opacidade);

  gap: var(--botao-gap);
  font-variation-settings: var(--fonte-9pt);
}

.ui-button--neutro {
  --ui-button-cor: var(--Cinza_E);
}

.ui-button--hierarquia-2 {
  --bs-btn-color: var(--ui-button-cor);
  --bs-btn-bg: var(--Off_white);
  --bs-btn-hover-bg: var(--ui-button-cor);
  --bs-btn-hover-border-color: var(--ui-button-cor);
  --bs-btn-active-bg: var(--ui-button-cor);
  --bs-btn-active-border-color: var(--ui-button-cor);
}

/* Foco: padrão do Design System, no lugar do anel do Bootstrap. */
.ui-button:focus-visible {
  outline: var(--foco-largura) solid var(--foco-cor);
  outline-offset: var(--foco-afastamento);
}

.ui-button .bi {
  font-size: var(--botao-icone);
  line-height: 1;
}
</style>
