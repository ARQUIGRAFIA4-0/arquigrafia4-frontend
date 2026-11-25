<template>
  <nav class="ui-menu-lateral" :aria-label="ariaLabel">
    <ul class="ui-menu-lateral__lista">
      <li v-for="item in itens" :key="item.titulo">
        <UiItemLista v-bind="item" />
      </li>
    </ul>
  </nav>
</template>

<script setup>
import UiItemLista from "@/components/ui/UiItemLista.vue";

defineOptions({ name: "UiMenuLateral" });

defineProps({
  itens: {
    type: Array,
    required: true,
    validator: (itens) => itens.every((item) => item && item.titulo && item.to),
  },
  ariaLabel: {
    type: String,
    required: true,
  },
});
</script>

<style scoped>
.ui-menu-lateral__lista {
  display: flex;
  flex-direction: column;
  gap: var(--espaco-pp);
  margin: 0;
  padding: 0;
  list-style: none;
}

/* No desktop o menu acompanha a rolagem. O topo desconta o cabeçalho fixo do
   site (botão de 38px + 16px acima e abaixo) e deixa um respiro. */
@media (min-width: 768px) {
  .ui-menu-lateral {
    position: sticky;
    top: calc(
      var(--control-height-desk) + 2 * var(--espaco-m) + var(--espaco-g)
    );
  }
}
</style>
