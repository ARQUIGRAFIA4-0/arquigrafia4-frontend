<template>
  <div class="guia-estilo-item">
    <section class="guia-estilo-item__secao" data-cy="guia-estilo-item-lista">
      <h2>UiItemLista</h2>
      <p>
        Componente <strong>item lista</strong> do LINA (nó 2360:146). Arquivo:
        <code>src/components/ui/UiItemLista.vue</code>. É a peça que forma o
        <RouterLink :to="{ name: 'guia-estilo-menu-lateral' }"
          >menu lateral</RouterLink
        >
        e serve para outras listas.
      </p>

      <div class="table-responsive">
        <table class="table guia-estilo-item__api">
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
      class="guia-estilo-item__secao"
      data-cy="guia-estilo-item-lista-variantes"
    >
      <h2>Variantes</h2>
      <div class="guia-estilo-item__grade">
        <figure
          v-for="exemplo in EXEMPLOS"
          :key="exemplo.id"
          class="guia-estilo-item__exemplo"
        >
          <div class="guia-estilo-item__amostra">
            <UiItemLista v-bind="exemplo.props" />
          </div>
          <figcaption>
            <span class="guia-estilo-item__rotulo">
              {{ exemplo.titulo }}
              <GuiaEstiloSelo v-if="exemplo.provisorio" tipo="provisorio" />
            </span>
            <code>{{ exemplo.trecho }}</code>
          </figcaption>
        </figure>
      </div>
    </section>

    <section class="guia-estilo-item__secao">
      <h2>Hover e foco</h2>
      <p>
        Quando o item é um link, o título e a seta ficam em Laranja_E ao passar
        o mouse. O foco por teclado segue o
        <RouterLink :to="{ name: 'guia-estilo-tokens' }"
          >padrão de foco</RouterLink
        >
        do Design System.
      </p>
    </section>
  </div>
</template>

<script setup>
import GuiaEstiloSelo from "@/components/guiaEstilo/GuiaEstiloSelo.vue";
import UiItemLista from "@/components/ui/UiItemLista.vue";
import fotoExemplo from "@/assets/collective_image.png";

defineOptions({ name: "GuiaEstiloItemLista" });

const API = [
  {
    figma: "Dispositivo desktop / mobile",
    codigo: "(automático)",
    obs: "Troca em 768px: título 14 → 12px, seta 25 → 12px, imagem 50 → 30px.",
  },
  {
    figma: "Título",
    codigo: 'titulo="Texto"',
    obs: "Obrigatório.",
  },
  {
    figma: "subtítulo",
    codigo: 'subtitulo="Texto"',
    obs: "Vazio = não aparece.",
  },
  {
    figma: "imagem (avatar perfil_coletivo)",
    codigo: ':imagem="url"',
    obs: "Círculo com a foto recortada sobre fundo Laranja_E. Vazio = sem imagem.",
  },
  {
    figma: "título e seta em Laranja_E (Interfaces)",
    codigo: "ativo",
    obs: "Com to, o item também fica ativo sozinho na página atual.",
  },
  {
    figma: "—",
    codigo: ':to="{ name: \'rota\' }" | href="url"',
    obs: "Com to vira link de rota; com href, link comum; sem os dois, só exibe.",
  },
];

// Imagem vazia que falha ao carregar sem fazer requisição.
const IMAGEM_INVALIDA = "data:image/png;base64,";

const EXEMPLOS = [
  {
    id: "titulo",
    titulo: "Só título",
    props: { titulo: "Título" },
    trecho: '<UiItemLista titulo="Título" />',
  },
  {
    id: "subtitulo",
    titulo: "Título e subtítulo",
    props: { titulo: "Título", subtitulo: "subtítulo" },
    trecho: '<UiItemLista titulo="Título" subtitulo="subtítulo" />',
  },
  {
    id: "imagem",
    titulo: "Com imagem",
    props: { titulo: "Título", subtitulo: "subtítulo", imagem: fotoExemplo },
    trecho:
      '<UiItemLista titulo="Título" subtitulo="subtítulo" :imagem="foto" />',
  },
  {
    id: "ativo",
    titulo: "Ativo",
    props: { titulo: "Título", ativo: true },
    trecho: '<UiItemLista titulo="Título" ativo />',
  },
  {
    id: "imagem-falhou",
    titulo: "Foto que não carregou",
    provisorio: true,
    props: { titulo: "Título", imagem: IMAGEM_INVALIDA },
    trecho: '<UiItemLista titulo="Título" imagem="(url quebrada)" />',
  },
];
</script>

<style scoped>
.guia-estilo-item {
  display: flex;
  flex-direction: column;
  gap: var(--espaco-xg);
}

.guia-estilo-item__secao {
  display: flex;
  flex-direction: column;
  gap: var(--espaco-m);
}

.guia-estilo-item__secao h2,
.guia-estilo-item__secao p {
  margin: 0;
}

.guia-estilo-item__api {
  font-size: var(--p-fs);
}

.guia-estilo-item__grade {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: var(--espaco-g);
}

.guia-estilo-item__exemplo {
  display: flex;
  flex-direction: column;
  gap: var(--espaco-pp);
  margin: 0;
}

.guia-estilo-item__amostra {
  max-width: 16rem;
}

.guia-estilo-item__exemplo figcaption {
  display: flex;
  flex-direction: column;
  gap: var(--espaco-ppp);
  font-size: var(--rotulo-fs);
  line-height: var(--rotulo-lh);
}

.guia-estilo-item__rotulo {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--espaco-pp);
  color: var(--Cinza_M);
}
</style>
