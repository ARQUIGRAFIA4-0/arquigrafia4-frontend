<template>
  <nav class="ui-abas" :aria-label="ariaLabel">
    <ul ref="lista" class="ui-abas__lista">
      <li v-for="item in itens" :key="item.titulo" class="ui-abas__item">
        <span
          v-if="item.inativo"
          class="ui-abas__aba ui-abas__aba--inativa"
          aria-disabled="true"
          :data-texto="item.titulo"
          >{{ item.titulo }}</span
        >
        <RouterLink
          v-else
          v-slot="{ href, navigate, isActive }"
          :to="item.to"
          custom
        >
          <a
            :href="href"
            class="ui-abas__aba"
            :class="{ 'ui-abas__aba--selecionada': isActive }"
            :aria-current="isActive ? 'page' : undefined"
            :data-texto="item.titulo"
            @click="navigate"
            >{{ item.titulo }}</a
          >
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

<script setup>
import { nextTick, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

defineOptions({ name: "UiAbas" });

defineProps({
  itens: {
    type: Array,
    required: true,
    validator: (itens) =>
      itens.every((item) => item && item.titulo && (item.to || item.inativo)),
  },
  ariaLabel: {
    type: String,
    required: true,
  },
});

const lista = ref(null);
const route = useRoute();

// Quando as abas não cabem e rolam para o lado, mantém a selecionada visível.
function mostrarSelecionada() {
  const faixa = lista.value;
  const aba = faixa?.querySelector('[aria-current="page"]');
  if (!aba) return;
  const estilo = getComputedStyle(faixa);
  const folgaInicio = parseFloat(estilo.paddingLeft) || 0;
  const folgaFim = parseFloat(estilo.paddingRight) || 0;
  const inicio = aba.offsetLeft - folgaInicio;
  const fim = aba.offsetLeft + aba.offsetWidth + folgaFim;
  if (inicio < faixa.scrollLeft) {
    faixa.scrollLeft = inicio;
  } else if (fim > faixa.scrollLeft + faixa.clientWidth) {
    faixa.scrollLeft = fim - faixa.clientWidth;
  }
}

onMounted(mostrarSelecionada);
watch(
  () => route.fullPath,
  () => nextTick(mostrarSelecionada),
);
</script>

<style scoped>
/* A folga (padding + margem negativa) evita que a rolagem corte o contorno de
   foco; a sobra à direita afasta a última aba da borda quando a faixa rola. */
.ui-abas__lista {
  --ui-abas-folga: calc(var(--foco-largura) + var(--foco-afastamento));

  position: relative;
  display: flex;
  gap: var(--abas-gap);
  margin: calc(-1 * var(--ui-abas-folga)) 0 calc(-1 * var(--ui-abas-folga))
    calc(-1 * var(--ui-abas-folga));
  padding: calc(var(--abas-padding-vertical) + var(--ui-abas-folga))
    var(--espaco-p) calc(var(--abas-padding-vertical) + var(--ui-abas-folga))
    var(--ui-abas-folga);
  list-style: none;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}

.ui-abas__lista::-webkit-scrollbar {
  display: none;
}

.ui-abas__item {
  flex-shrink: 0;
}

/* No Figma a linha de 3px fica por fora da aba de 40px. */
.ui-abas__aba {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: content-box;
  height: var(--abas-altura);
  border-bottom: var(--abas-linha) solid transparent;
  color: var(--Preto);
  font-size: var(--submenu-nsel-fs);
  font-weight: var(--submenu-nsel-fw);
  line-height: var(--submenu-nsel-lh);
  white-space: nowrap;
  text-decoration: none;
}

/* Reserva a largura do texto em negrito: a aba não muda de tamanho ao ser
   selecionada. */
.ui-abas__aba::after {
  content: attr(data-texto);
  height: 0;
  overflow: hidden;
  visibility: hidden;
  font-size: var(--abas-sel-fs);
  font-weight: var(--abas-sel-fw);
}

.ui-abas__aba--selecionada {
  border-bottom-color: var(--Laranja_E);
  color: var(--Laranja_E);
  font-size: var(--abas-sel-fs);
  font-weight: var(--abas-sel-fw);
  line-height: var(--abas-sel-lh);
}

.ui-abas__aba--inativa {
  color: var(--Cinza_C);
  cursor: default;
}

/* No hover só a cor muda, para a aba não mudar de largura. */
a.ui-abas__aba:hover {
  color: var(--Laranja_E);
}

a.ui-abas__aba:focus-visible {
  outline: var(--foco-largura) solid var(--foco-cor);
  outline-offset: var(--foco-afastamento);
}
</style>
