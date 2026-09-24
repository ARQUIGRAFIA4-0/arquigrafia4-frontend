<template>
  <AboutLayout>
    <div class="col-12 col-md-8">
      <h1 class="about-search__title">Como funciona a Busca Avançada</h1>
    </div>
    <div class="col-12 col-md-8">
      <h2 class="about-search__subtitle">
        A busca avançada do ARQUIGRAFIA combina diferentes tipos de filtro para encontrar imagens. Entender quando ela
        usa E (AND) e quando usa OU (OR) ajuda a montar pesquisas mais precisas.
      </h2>

      <!-- 1. Regra geral -->
      <h3 class="about-search__subtitle about-search__subtitle--rules">
        1. Regra geral: filtros diferentes usam E (AND)
      </h3>
      <p class="about-search__paragraph">
        Quando diferentes tipos de filtros são utilizados ao mesmo tempo, eles são combinados com
        <strong>E (AND)</strong>. Por exemplo, uma pesquisa com:
      </p>
      <ul class="about-search__list">
        <li>Busca textual: <code class="about-search__code">rio</code></li>
        <li>Data: <code class="about-search__code">1950</code></li>
        <li>Licença: <code class="about-search__code">CC BY</code></li>
      </ul>
      <p class="about-search__paragraph">
        exige que a imagem atenda a todos os filtros simultaneamente:
      </p>
      <pre class="about-search__block"><code>rio
E
data = 1950
E
licença = CC BY</code></pre>
      <p class="about-search__paragraph about-search__paragraph--conclusion">
        <strong>Conclusão:</strong> filtros de tipos diferentes são combinados com AND.
      </p>

      <!-- 2. Busca textual -->
      <h3 class="about-search__subtitle about-search__subtitle--rules">
        2. Busca textual, "Todos os campos" e Tags usam OU (OR)
      </h3>
      <p class="about-search__paragraph">Exemplo de busca textual gerada:</p>
      <pre class="about-search__block"><code>q=rio+de+janeiro</code></pre>
      <p class="about-search__paragraph">
        O parâmetro <code class="about-search__code">q</code> é processado pelo método
        <code class="about-search__code">filterByFullText</code>, que utiliza a busca de texto completo do MySQL:
      </p>
      <pre class="about-search__block"><code>MATCH(...) AGAINST(? IN BOOLEAN MODE)</code></pre>
      <p class="about-search__paragraph">
        O texto digitado é enviado ao MySQL sem os operadores <code class="about-search__code">+</code> ou
        <code class="about-search__code">-</code>. Por isso, os termos da pesquisa são tratados como opcionais, o que
        resulta em um comportamento de <strong>OU (OR)</strong> entre as palavras.
      </p>
      <p class="about-search__paragraph">
        Ao pesquisar <code class="about-search__code">rio de janeiro</code>, os termos relevantes
        <code class="about-search__code">rio</code> e <code class="about-search__code">janeiro</code> podem ser
        tratados como:
      </p>
      <pre class="about-search__block"><code>rio OR janeiro</code></pre>
      <p class="about-search__paragraph">
        Basta que um dos campos contenha um dos termos para que a imagem possa fazer parte do resultado. De forma
        simplificada:
      </p>
      <pre class="about-search__block"><code>(título contém "rio" OU "janeiro")
OU
(assunto contém "rio" OU "janeiro")
OU
(descrição contém "rio" OU "janeiro")
OU
(contribuidor contém "rio" OU "janeiro")
OU
(título da obra contém "rio" OU "janeiro")</code></pre>
      <p class="about-search__paragraph about-search__paragraph--conclusion">
        <strong>Conclusão:</strong> a busca textual é bastante abrangente e utiliza OR tanto entre os termos quanto
        entre os campos pesquisados.
      </p>

      <!-- 3. Frase inteira -->
      <h3 class="about-search__subtitle about-search__subtitle--rules">
        3. Quando a busca procura a frase inteira?
      </h3>
      <p class="about-search__paragraph">
        Nos campos <strong>Título</strong> e <strong>Autoria</strong>. Esses campos usam o operador
        <code class="about-search__code">LIKE</code>, que procura o texto digitado exatamente como uma sequência.
      </p>

      <div class="about-search__table-wrapper">
        <table class="about-search__table">
          <thead>
            <tr>
              <th scope="col">Busca</th>
              <th scope="col">Comportamento</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code class="about-search__code">q = "rio de janeiro"</code></td>
              <td>rio OR janeiro</td>
            </tr>
            <tr>
              <td><code class="about-search__code">Título = "rio de janeiro"</code></td>
              <td>procura "rio de janeiro" como sequência</td>
            </tr>
            <tr>
              <td><code class="about-search__code">q = "rio de janeiro" + ano = 1950</code></td>
              <td>(rio OR janeiro) AND ano = 1950</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </AboutLayout>
</template>

<script>
import AboutLayout from "./AboutLayout.vue";

export default {
  name: "AboutAdvancedSearch",
  components: {
    AboutLayout,
  },
};
</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.about-search {
  &__title {
    width: fit-content;
    font-weight: 600;
    font-size: 20px;
    line-height: 150%;
    letter-spacing: 0%;
    vertical-align: middle;
    border-bottom: 2px solid #000000;
    padding-bottom: 16px;
    margin-bottom: 24px;

    @include md {
      font-size: 30px;
      margin-bottom: 55px;
      border-bottom: 4px solid #000000;
      padding-bottom: 20px;
    }
  }

  &__subtitle {
    font-weight: 500;
    font-size: 16px;
    line-height: 150%;
    letter-spacing: 0%;
    margin-bottom: 24px;

    @include md {
      font-size: 20px;
      margin-bottom: 32px;
      padding-right: 120px;
    }

    &--rules {
      font-weight: 600;
      margin-top: 24px;
      margin-bottom: 12px;

      @include md {
        font-size: 18px;
        margin-top: 64px;
        margin-bottom: 24px;
      }
    }
  }

  // Recuo compartilhado pelo conteúdo das seções (igual ao das políticas)
  &__paragraph,
  &__list,
  &__block,
  &__table-wrapper {
    @include md {
      margin-left: 120px;
    }
  }

  &__paragraph {
    font-weight: 400;
    font-size: 14px;
    line-height: 125%;
    letter-spacing: 0%;

    @include md {
      font-weight: 500;
      font-size: 16px;
      line-height: 150%;
    }

    &--conclusion {
      border-left: 2px solid #000000;
      padding-left: 12px;
      margin-top: 16px;
    }
  }

  &__list {
    font-size: 14px;
    line-height: 150%;
    padding-left: 20px;
    margin-bottom: 16px;

    @include md {
      font-weight: 500;
      font-size: 16px;
    }

    li {
      margin-bottom: 4px;
    }
  }

  &__code {
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    font-size: 0.9em;
    background-color: #f2f2f2;
    padding: 1px 6px;
    border-radius: 3px;
  }

  &__block {
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    font-size: 13px;
    line-height: 150%;
    background-color: #f2f2f2;
    border-left: 3px solid #000000;
    padding: 12px 16px;
    margin-bottom: 16px;
    overflow-x: auto;
    white-space: pre;

    @include md {
      font-size: 14px;
      padding: 16px 20px;
    }
  }

  &__table-wrapper {
    overflow-x: auto;
    margin-bottom: 32px;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
    line-height: 150%;

    @include md {
      font-size: 16px;
    }

    th,
    td {
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid #d9d9d9;
      vertical-align: top;
    }

    th {
      font-weight: 600;
      border-bottom: 2px solid #000000;
    }

    td:first-child {
      white-space: nowrap;
    }
  }
}
</style>