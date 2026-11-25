<template>
  <div class="guia-estilo-menu">
    <section class="guia-estilo-menu__secao" data-cy="guia-estilo-menu-lateral">
      <h2>UiMenuLateral</h2>
      <p>
        Menu da página <strong>Sobre</strong> no Figma Interfaces (nó
        5607:28472). Arquivo: <code>src/components/ui/UiMenuLateral.vue</code>.
      </p>
      <p>
        É uma pilha de itens com 8px entre eles. Cada item é um
        <RouterLink :to="{ name: 'guia-estilo-item-lista' }"
          >UiItemLista</RouterLink
        >, e o da página atual fica em Laranja_E. No desktop, o menu acompanha a
        rolagem da página.
      </p>

      <div class="guia-estilo-menu__amostra">
        <UiMenuLateral
          :itens="ITENS_EXEMPLO"
          aria-label="Exemplo de menu lateral"
        />
      </div>
      <pre class="guia-estilo-menu__trecho"><code>{{ TRECHO_MENU }}</code></pre>

      <div class="table-responsive">
        <table class="table guia-estilo-menu__api">
          <thead>
            <tr>
              <th scope="col">Prop</th>
              <th scope="col">Valor</th>
              <th scope="col">Observação</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>itens</code></td>
              <td><code>[{ titulo, to, subtitulo?, imagem? }]</code></td>
              <td>Cada item vira um UiItemLista com link de rota.</td>
            </tr>
            <tr>
              <td><code>aria-label</code></td>
              <td>texto</td>
              <td>Obrigatório: descreve a navegação para leitores de tela.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        No mobile, a página troca o menu pelas
        <RouterLink :to="{ name: 'guia-estilo-abas' }">abas</RouterLink>, com os
        mesmos itens, como na página Sobre mobile do Interfaces.
      </p>
    </section>
  </div>
</template>

<script setup>
import UiMenuLateral from "@/components/ui/UiMenuLateral.vue";

defineOptions({ name: "GuiaEstiloMenuLateral" });

const ITENS_EXEMPLO = [
  { titulo: "Tokens", to: { name: "guia-estilo-tokens" } },
  { titulo: "Botão", to: { name: "guia-estilo-botao" } },
  { titulo: "Item de lista", to: { name: "guia-estilo-item-lista" } },
  { titulo: "Menu lateral", to: { name: "guia-estilo-menu-lateral" } },
];

const TRECHO_MENU = `<UiMenuLateral
  aria-label="Seções do guia de estilo"
  :itens="[
    { titulo: 'Tokens', to: { name: 'guia-estilo-tokens' } },
    { titulo: 'Botão', to: { name: 'guia-estilo-botao' } },
  ]"
/>`;
</script>

<style scoped>
.guia-estilo-menu {
  display: flex;
  flex-direction: column;
  gap: var(--espaco-xg);
}

.guia-estilo-menu__secao {
  display: flex;
  flex-direction: column;
  gap: var(--espaco-m);
}

.guia-estilo-menu__secao h2,
.guia-estilo-menu__secao p {
  margin: 0;
}

.guia-estilo-menu__amostra {
  max-width: 16rem;
}

.guia-estilo-menu__trecho {
  margin: 0;
  padding: var(--espaco-m);
  background-color: var(--Off_white);
  font-size: var(--rotulo-fs);
  line-height: var(--rotulo-lh);
}

.guia-estilo-menu__api {
  font-size: var(--p-fs);
}
</style>
