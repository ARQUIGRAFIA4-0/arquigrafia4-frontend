<template>
  <div class="guia-estilo-botao">
    <section class="guia-estilo-botao__secao">
      <h2>UiButton</h2>
      <p>
        Componente <strong>Botão_p</strong> do Figma (nó 147:1330). Arquivo:
        <code>src/components/ui/UiButton.vue</code>.
      </p>
      <div class="table-responsive">
        <table class="table guia-estilo-botao__api">
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

    <section
      class="guia-estilo-botao__secao"
      data-cy="guia-estilo-botao-variantes"
    >
      <h2>Variantes</h2>
      <p>
        Cada linha é uma combinação de hierarquia e destaque. As colunas mostram
        o conteúdo (texto, ícone e texto, só ícone), ativo e inativo.
      </p>

      <div
        v-for="linha in LINHAS"
        :key="linha.figma"
        class="guia-estilo-botao__linha"
      >
        <h3>
          {{ linha.titulo }}
          <span class="guia-estilo-botao__figma">Figma: {{ linha.figma }}</span>
        </h3>
        <p v-if="linha.nota" class="guia-estilo-botao__nota">
          <GuiaEstiloSelo tipo="provisorio" /> {{ linha.nota }}
        </p>
        <div class="guia-estilo-botao__grade">
          <figure
            v-for="coluna in COLUNAS"
            :key="coluna.id"
            class="guia-estilo-botao__exemplo"
          >
            <UiButton
              v-bind="{ ...linha.props, ...coluna.props }"
              :disabled="coluna.inativo"
            />
            <figcaption>
              <span class="guia-estilo-botao__coluna">{{ coluna.titulo }}</span>
              <code>{{ trecho(linha, coluna) }}</code>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>

    <section class="guia-estilo-botao__secao">
      <h2>Hover e pressionado <GuiaEstiloSelo tipo="provisorio" /></h2>
      <p>
        O Figma ainda não define esses estados. Até lá, seguem o padrão do
        Bootstrap: no hover o fundo escurece 15% (contorno: preenche com a cor);
        pressionado escurece 20%. Passe o mouse nos exemplos acima para
        conferir.
      </p>
    </section>

    <section class="guia-estilo-botao__secao">
      <h2>Foco</h2>
      <p>
        Segue o
        <RouterLink :to="{ name: 'guia-estilo-tokens' }"
          >padrão de foco</RouterLink
        >
        do Design System, no lugar do anel do Bootstrap. Use Tab nos exemplos
        acima para conferir.
      </p>
    </section>

    <section class="guia-estilo-botao__secao">
      <h2>Largura total</h2>
      <p>Não é variante: use a classe <code>w-100</code> no uso.</p>
      <div class="guia-estilo-botao__largura">
        <UiButton texto="Rótulo" class="w-100" />
      </div>
      <code>&lt;UiButton texto="Rótulo" class="w-100" /&gt;</code>
    </section>

    <section class="guia-estilo-botao__secao">
      <h2>Ainda não existe</h2>
      <ul>
        <li>Tamanho pequeno (sm): aguarda definição do design.</li>
        <li>Botão como link (&lt;a&gt; ou RouterLink).</li>
        <li>Estado de carregando.</li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import UiButton from "@/components/ui/UiButton.vue";
import GuiaEstiloSelo from "@/components/guiaEstilo/GuiaEstiloSelo.vue";

defineOptions({ name: "GuiaEstiloBotao" });

const API = [
  {
    figma: "Hierarquia 1º / 2º",
    codigo: ':hierarquia="1" | :hierarquia="2"',
    obs: "Padrão 1. O 2 é o contorno, com fundo Off_white.",
  },
  {
    figma: "Destaque on / off",
    codigo: ':destaque="true" | :destaque="false"',
    obs: "Padrão true (Laranja_E). false = neutro (Cinza_E).",
  },
  {
    figma: "Estado ativo / inativo",
    codigo: "disabled",
    obs: "Atributo nativo do HTML. Inativo = opacidade 0,4.",
  },
  {
    figma: "Icone on / off",
    codigo: 'icone="nome-do-icone"',
    obs: "Nome do Bootstrap Icon, sem o prefixo bi-. Vazio = off.",
  },
  {
    figma: "Texto on / off",
    codigo: 'texto="Rótulo"',
    obs: "Vazio = off. Só ícone exige aria-label.",
  },
  {
    figma: "Display desk / mobile",
    codigo: "(automático)",
    obs: "Altura 38px no desktop e 48px no mobile, trocando em 768px.",
  },
];

const LINHAS = [
  {
    titulo: "Hierarquia 1 com destaque",
    figma: "Hierarquia=1º, Destaque=on",
    props: { hierarquia: 1, destaque: true },
  },
  {
    titulo: "Hierarquia 1 neutro",
    figma: "Hierarquia=1º, Destaque=off",
    props: { hierarquia: 1, destaque: false },
  },
  {
    titulo: "Hierarquia 2 com destaque",
    figma: "Hierarquia=2º, Destaque=on",
    props: { hierarquia: 2, destaque: true },
  },
  {
    titulo: "Hierarquia 2 neutro",
    figma: "Hierarquia=2º, Destaque=off",
    props: { hierarquia: 2, destaque: false },
    nota: "No Figma, a variante só ícone usa Preto; aqui usa Cinza_E, como as demais.",
  },
];

const CONTEUDOS = [
  { id: "texto", titulo: "Texto", props: { texto: "Rótulo" } },
  {
    id: "icone-texto",
    titulo: "Ícone e texto",
    props: { icone: "sticky", texto: "Rótulo" },
  },
  {
    id: "icone",
    titulo: "Só ícone",
    props: { icone: "sticky", "aria-label": "Rótulo" },
  },
];

const COLUNAS = CONTEUDOS.flatMap((conteudo) => [
  { ...conteudo, id: `${conteudo.id}-ativo`, inativo: false },
  {
    ...conteudo,
    id: `${conteudo.id}-inativo`,
    titulo: `${conteudo.titulo}, inativo`,
    inativo: true,
  },
]);

const trecho = (linha, coluna) => {
  const atributos = [];
  if (linha.props.hierarquia === 2) atributos.push(':hierarquia="2"');
  if (!linha.props.destaque) atributos.push(':destaque="false"');
  const { icone, texto } = coluna.props;
  if (icone) atributos.push(`icone="${icone}"`);
  if (texto) atributos.push(`texto="${texto}"`);
  if (coluna.props["aria-label"]) {
    atributos.push(`aria-label="${coluna.props["aria-label"]}"`);
  }
  if (coluna.inativo) atributos.push("disabled");
  return `<UiButton ${atributos.join(" ")} />`;
};
</script>

<style scoped>
.guia-estilo-botao {
  display: flex;
  flex-direction: column;
  gap: var(--espaco-xg);
}

.guia-estilo-botao__secao {
  display: flex;
  flex-direction: column;
  gap: var(--espaco-m);
}

.guia-estilo-botao__secao h2,
.guia-estilo-botao__secao p,
.guia-estilo-botao__secao ul {
  margin: 0;
}

.guia-estilo-botao__api {
  font-size: var(--p-fs);
}

.guia-estilo-botao__linha {
  display: flex;
  flex-direction: column;
  gap: var(--espaco-p);
  padding-top: var(--espaco-m);
  border-top: var(--bs-border-width) solid var(--Cinza_C);
}

.guia-estilo-botao__linha h3 {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--espaco-pp);
  margin: 0;
}

.guia-estilo-botao__figma,
.guia-estilo-botao__coluna {
  color: var(--Cinza_M);
  font-size: var(--rotulo-fs);
  font-weight: var(--rotulo-fw);
  line-height: var(--rotulo-lh);
}

.guia-estilo-botao__nota {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--espaco-pp);
  color: var(--Cinza_E);
  font-size: var(--rotulo-fs);
}

.guia-estilo-botao__grade {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
  gap: var(--espaco-g);
}

.guia-estilo-botao__exemplo {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--espaco-pp);
  margin: 0;
}

.guia-estilo-botao__exemplo figcaption {
  display: flex;
  flex-direction: column;
  gap: var(--espaco-ppp);
  font-size: var(--rotulo-fs);
  line-height: var(--rotulo-lh);
}

.guia-estilo-botao__largura {
  padding: var(--espaco-m);
  border: var(--bs-border-width) dashed var(--Cinza_C);
}
</style>
