<template>
  <span class="guia-estilo-selo" :class="`guia-estilo-selo--${tipo}`">
    {{ rotulo }}
  </span>
</template>

<script setup>
import { computed } from "vue";

defineOptions({ name: "GuiaEstiloSelo" });

const props = defineProps({
  tipo: {
    type: String,
    required: true,
    validator: (value) => ["provisorio", "diverge", "fora"].includes(value),
  },
});

const ROTULOS = {
  provisorio: "provisório",
  diverge: "diverge do Figma",
  fora: "fora do Figma",
};

const rotulo = computed(() => ROTULOS[props.tipo]);
</script>

<style scoped>
.guia-estilo-selo {
  display: inline-block;
  padding: 0 var(--espaco-pp);
  border: var(--bs-border-width) solid currentColor;
  border-radius: var(--bs-border-radius-pill);
  font-size: var(--rotulo-fs);
  font-weight: var(--rotulo-fw);
  line-height: var(--rotulo-lh);
  font-variation-settings: var(--fonte-9pt);
  white-space: nowrap;
}

.guia-estilo-selo--provisorio {
  color: var(--Azul_E);
  background-color: var(--Azul_C);
}

.guia-estilo-selo--diverge {
  color: var(--Negativo_E);
  background-color: var(--Negativo_C);
}

.guia-estilo-selo--fora {
  color: var(--Cinza_M);
  background-color: var(--Off_white);
}
</style>
