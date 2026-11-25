<template>
  <div class="guia-estilo-abas">
    <section class="guia-estilo-abas__secao" data-cy="guia-estilo-abas-pagina">
      <h2>UiAbas</h2>
      <p>
        Componentes <strong>item_tab_txt</strong> e
        <strong>tab_horizontal_txt</strong> do LINA (nós 2353:1212 e 2053:2065).
        Arquivo: <code>src/components/ui/UiAbas.vue</code>.
      </p>
      <p>
        Abas de texto para navegar entre páginas. A aba da página atual fica
        selecionada sozinha. Quando as abas não cabem na largura, a faixa rola
        para o lado, como na página Sobre mobile do Interfaces.
      </p>

      <div class="guia-estilo-abas__amostra" data-cy="guia-estilo-abas-exemplo">
        <UiAbas :itens="ITENS_EXEMPLO" aria-label="Exemplo de abas" />
      </div>
      <pre class="guia-estilo-abas__trecho"><code>{{ TRECHO_ABAS }}</code></pre>

      <div class="table-responsive">
        <table class="table guia-estilo-abas__api">
          <thead>
            <tr>
              <th scope="col">Figma</th>
              <th scope="col">Código</th>
              <th scope="col">Observação</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="linha in API" :key="linha.figma">
              <td>{{ linha.figma }}</td>
              <td>
                <code>{{ linha.codigo }}</code>
              </td>
              <td>{{ linha.obs }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="guia-estilo-abas__secao">
      <h2>Medidas</h2>
      <ul>
        <li>
          Espaço entre abas: 12px no mobile e 40px no desktop, como nas telas do
          Interfaces. O LINA usa 24px no desktop.
        </li>
        <li>
          Aba não selecionada em Light; selecionada em ExtraBold 14px no mobile
          e Bold 20px no desktop, com linha de 3px em Laranja_E.
        </li>
        <li>
          A aba guarda a largura do texto em negrito e não muda de tamanho.
        </li>
      </ul>
    </section>

    <section class="guia-estilo-abas__secao">
      <h2>Hover</h2>
      <p>
        Ao passar o mouse, só a cor do texto muda para Laranja_E. O peso não
        muda, para a aba não mudar de largura.
      </p>
    </section>

    <section class="guia-estilo-abas__secao">
      <h2>Foco</h2>
      <p>
        Segue o
        <RouterLink :to="{ name: 'guia-estilo-tokens' }"
          >padrão de foco</RouterLink
        >
        do Design System. A faixa tem uma folga em volta para o contorno não ser
        cortado quando ela rola.
      </p>
    </section>

    <section class="guia-estilo-abas__secao">
      <h2>Com o menu lateral</h2>
      <p>
        No padrão da página Sobre, a mesma navegação aparece como
        <RouterLink :to="{ name: 'guia-estilo-menu-lateral' }"
          >menu lateral</RouterLink
        >
        no desktop e como abas no mobile. Os dois componentes recebem a mesma
        lista de itens, e o CSS da página mostra um ou outro em 768px, como
        neste guia.
      </p>
      <pre
        class="guia-estilo-abas__trecho"
      ><code>{{ TRECHO_LAYOUT }}</code></pre>
    </section>

    <section class="guia-estilo-abas__secao">
      <h2>Ainda não existe</h2>
      <ul>
        <li>Abas de ícone (item_tab_icone e tab_icone do LINA).</li>
        <li>Abas que trocam o conteúdo na mesma página, sem mudar de rota.</li>
        <li>
          As abas atuais do site ainda não usam este componente; a migração vem
          depois.
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import UiAbas from "@/components/ui/UiAbas.vue";

defineOptions({ name: "GuiaEstiloAbas" });

const ITENS_EXEMPLO = [
  { titulo: "Tokens", to: { name: "guia-estilo-tokens" } },
  { titulo: "Abas", to: { name: "guia-estilo-abas" } },
  { titulo: "Botão", to: { name: "guia-estilo-botao" } },
  { titulo: "Inativa", inativo: true },
];

const API = [
  {
    figma: "Dispositivo desk / mobile",
    codigo: "(automático)",
    obs: "Troca em 768px: texto 14 → 20px, espaço entre abas 12 → 40px.",
  },
  {
    figma: "Estado selecionado",
    codigo: "(automático)",
    obs: 'A aba da página atual, com aria-current="page".',
  },
  {
    figma: "Estado ativo",
    codigo: "(padrão)",
    obs: "Aba com link para outra página.",
  },
  {
    figma: "Estado inativo",
    codigo: "inativo: true",
    obs: "No item. Aparece em Cinza_C e não é link.",
  },
  {
    figma: "camada Item",
    codigo: "titulo",
    obs: "Texto da aba. Obrigatório em cada item.",
  },
  {
    figma: "—",
    codigo: "to",
    obs: "Rota da aba. Obrigatório, exceto nas inativas.",
  },
  {
    figma: "—",
    codigo: 'aria-label="Texto"',
    obs: "Obrigatório: descreve a navegação para leitores de tela.",
  },
];

const TRECHO_ABAS = `<UiAbas
  aria-label="Seções do guia de estilo"
  :itens="[
    { titulo: 'Tokens', to: { name: 'guia-estilo-tokens' } },
    { titulo: 'Abas', to: { name: 'guia-estilo-abas' } },
    { titulo: 'Inativa', inativo: true },
  ]"
/>`;

const TRECHO_LAYOUT = `<!-- src/views/GuiaEstilo/GuiaEstiloLayout.vue -->
<div class="guia-estilo__abas">
  <UiAbas :itens="ITENS_MENU" aria-label="Seções do guia de estilo" />
</div>
<aside class="guia-estilo__menu">
  <UiMenuLateral :itens="ITENS_MENU" aria-label="Seções do guia de estilo" />
</aside>`;
</script>

<style scoped>
.guia-estilo-abas {
  display: flex;
  flex-direction: column;
  gap: var(--espaco-xg);
}

.guia-estilo-abas__secao {
  display: flex;
  flex-direction: column;
  gap: var(--espaco-m);
}

.guia-estilo-abas__secao h2,
.guia-estilo-abas__secao p,
.guia-estilo-abas__secao ul {
  margin: 0;
}

.guia-estilo-abas__secao h2 {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--espaco-pp);
}

.guia-estilo-abas__trecho {
  margin: 0;
  padding: var(--espaco-m);
  background-color: var(--Off_white);
  font-size: var(--rotulo-fs);
  line-height: var(--rotulo-lh);
}

.guia-estilo-abas__api {
  font-size: var(--p-fs);
}
</style>
