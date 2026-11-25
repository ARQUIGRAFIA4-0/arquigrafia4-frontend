<template>
  <div class="guia-estilo">
    <div class="guia-estilo__abas" data-cy="guia-estilo-abas">
      <UiAbas :itens="ITENS_MENU" aria-label="Seções do guia de estilo" />
    </div>

    <aside class="guia-estilo__menu" data-cy="guia-estilo-menu">
      <UiMenuLateral
        :itens="ITENS_MENU"
        aria-label="Seções do guia de estilo"
      />
    </aside>

    <div class="guia-estilo__conteudo">
      <header class="guia-estilo__cabecalho">
        <h1>Guia de estilo</h1>
        <p>
          Tokens e componentes do Design System LINA, desenvolvidos a partir do
          Figma.
        </p>

        <dl class="guia-estilo__legenda">
          <div class="guia-estilo__legenda-item">
            <dt><GuiaEstiloSelo tipo="provisorio" /></dt>
            <dd>valor usado até o design confirmar</dd>
          </div>
          <div class="guia-estilo__legenda-item">
            <dt><GuiaEstiloSelo tipo="diverge" /></dt>
            <dd>o código ainda não segue o Figma; a correção está planejada</dd>
          </div>
          <div class="guia-estilo__legenda-item">
            <dt><GuiaEstiloSelo tipo="fora" /></dt>
            <dd>existe no código, mas não no Figma</dd>
          </div>
        </dl>
      </header>

      <RouterView />
    </div>
  </div>
</template>

<script setup>
import GuiaEstiloSelo from "@/components/guiaEstilo/GuiaEstiloSelo.vue";
import UiAbas from "@/components/ui/UiAbas.vue";
import UiMenuLateral from "@/components/ui/UiMenuLateral.vue";

defineOptions({ name: "GuiaEstiloLayout" });

const ITENS_MENU = [
  { titulo: "Tokens", to: { name: "guia-estilo-tokens" } },
  { titulo: "Botão", to: { name: "guia-estilo-botao" } },
  { titulo: "Item de lista", to: { name: "guia-estilo-item-lista" } },
  { titulo: "Menu lateral", to: { name: "guia-estilo-menu-lateral" } },
  { titulo: "Abas", to: { name: "guia-estilo-abas" } },
];
</script>

<style scoped>
/* Como a página Sobre do Figma: no mobile, 1 coluna com abas; a partir de 768px,
   12 colunas com o menu em 3 (2 no desktop largo). */
.guia-estilo {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--espaco-p);
  padding: var(--espaco-g) var(--grade-margem) var(--espaco-xxg);
}

/* A faixa de abas vai até a borda direita da tela, como no Figma. */
.guia-estilo__abas {
  margin-right: calc(-1 * var(--grade-margem));
}

.guia-estilo__menu {
  display: none;
}

.guia-estilo__conteudo {
  display: flex;
  flex-direction: column;
  gap: var(--espaco-gg);
  min-width: 0;
}

@media (min-width: 768px) {
  .guia-estilo {
    grid-template-columns: repeat(12, minmax(0, 1fr));
    column-gap: var(--grade-gutter);
    padding-top: var(--espaco-xxg);
  }

  .guia-estilo__abas {
    display: none;
  }

  .guia-estilo__menu {
    display: block;
    grid-column: 1 / span 3;
  }

  .guia-estilo__conteudo {
    grid-column: 4 / -1;
  }
}

@media (min-width: 1440px) {
  .guia-estilo__menu {
    grid-column: 1 / span 2;
  }

  .guia-estilo__conteudo {
    grid-column: 3 / -1;
  }
}

.guia-estilo__cabecalho {
  display: flex;
  flex-direction: column;
  gap: var(--espaco-p);
}

.guia-estilo__cabecalho h1,
.guia-estilo__cabecalho p {
  margin: 0;
}

.guia-estilo__legenda {
  display: flex;
  flex-wrap: wrap;
  gap: var(--espaco-pp) var(--espaco-g);
  margin: 0;
}

.guia-estilo__legenda-item {
  display: flex;
  align-items: center;
  gap: var(--espaco-pp);
}

.guia-estilo__legenda dt {
  font-weight: inherit;
}

.guia-estilo__legenda dd {
  margin: 0;
  color: var(--Cinza_M);
  font-size: var(--rotulo-fs);
  line-height: var(--rotulo-lh);
}
</style>
