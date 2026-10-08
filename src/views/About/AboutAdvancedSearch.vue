<template>
  <AboutLayout>
    <div class="col-12 col-md-8">
      <h1 class="about-search__title">Como funciona a Busca Avançada</h1>
    </div>
    <div class="col-12 col-md-8">
      <h2 class="about-search__subtitle">
        A busca avançada do ARQUIGRAFIA combina diferentes tipos de filtro para encontrar imagens. Entender quando ela
        usa E (AND), quando usa OU (OR) e como cada campo compara o texto digitado ajuda a montar pesquisas mais
        precisas.
      </h2>

      <!-- 1. Regra geral -->
      <h3 class="about-search__subtitle about-search__subtitle--rules">
        1. Regra geral: filtros diferentes usam E (AND)
      </h3>
      <p class="about-search__paragraph">
        Cada filtro preenchido restringe o resultado. Quando você usa filtros de tipos diferentes ao mesmo tempo, a
        imagem precisa atender a <strong>todos</strong> eles. Por exemplo, uma pesquisa com:
      </p>
      <ul class="about-search__list">
        <li>Busca textual: <code class="about-search__code">rio</code></li>
        <li>Material: <code class="about-search__code">concreto</code></li>
        <li>Licença: <code class="about-search__code">CC BY</code></li>
      </ul>
      <p class="about-search__paragraph">é avaliada como:</p>
      <pre class="about-search__block"><code>(busca textual = "rio")
E
(material = concreto)
E
(licença = CC BY)</code></pre>
      <p class="about-search__paragraph about-search__paragraph--conclusion">
        <strong>Conclusão:</strong> quanto mais filtros diferentes você preenche, menor (e mais precisa) fica a lista
        de resultados.
      </p>

      <!-- 2. Várias opções no mesmo filtro -->
      <h3 class="about-search__subtitle about-search__subtitle--rules">
        2. Várias opções dentro do mesmo filtro também usam E (AND)
      </h3>
      <p class="about-search__paragraph">Exemplo de busca textual gerada:</p>
      <pre class="about-search__block"><code>q=rio+de+janeiro</code></pre>
      <p class="about-search__paragraph">
        Nos filtros em que é possível selecionar mais de uma opção, a imagem precisa ter
        <strong>todas</strong> as opções escolhidas. Isso vale para:
      </p>
      <ul class="about-search__list">
        <li>Assuntos (tags)</li>
        <li>Obras</li>
        <li>Técnicas</li>
        <li>Tipologias (tipos de obra)</li>
        <li>Materiais</li>
        <li>Períodos estilísticos</li>
        <li>Contextos culturais</li>
      </ul>
      <p class="about-search__paragraph">
        Por exemplo, selecionar os materiais concreto e vidro retorna apenas imagens que tenham os dois:
      </p>
      <pre class="about-search__block"><code>material = concreto 
E 
material = vidro</code></pre>
      <p class="about-search__paragraph">
        Se você também selecionar a técnica <code class="about-search__code">pré-moldado</code>, ela se soma às
        demais condições:
      </p>
      <pre class="about-search__block"><code>(material = concreto)
E
(material = vidro)
E
(técnica = pré-moldado)</code></pre>

      <h4 class="about-search__subheading">A exceção: licenças usam OU (OR)</h4>
      <p class="about-search__paragraph">
        Cada imagem tem uma única licença, então exigir duas ao mesmo tempo nunca retornaria nada. Por isso, ao
        selecionar várias licenças, basta a imagem ter <strong>uma</strong> delas:
      </p>
      <pre class="about-search__block"><code>licença = CC BY OU licença = CC0</code></pre>

      <h4 class="about-search__subheading">Tipologias, materiais, períodos e contextos culturais incluem as tags</h4>
      <p class="about-search__paragraph">
        Muitas imagens mais antigas do acervo registram essas informações apenas como assuntos (tags). Por isso, nos
        filtros de <strong>tipologia</strong>, <strong>material</strong>, <strong>período estilístico</strong> e
        <strong>contexto cultural</strong>, cada opção escolhida também encontra imagens que tenham uma tag com
        exatamente o mesmo texto (sem diferenciar maiúsculas e minúsculas):
      </p>
      <pre class="about-search__block"><code>(material = concreto OU tag "concreto")
E
(material = vidro OU tag "vidro")</code></pre>
      <p class="about-search__paragraph">
        Os filtros de técnica, obra e assunto não fazem essa equivalência: consideram apenas o vínculo direto.
      </p>
      <p class="about-search__paragraph about-search__paragraph--conclusion">
        <strong>Conclusão:</strong> adicionar opções a um mesmo filtro <strong>restringe</strong> o resultado, assim
        como adicionar um filtro de outro tipo. A única exceção são as licenças, em que mais opções
        <strong>ampliam</strong> o resultado.
      </p>

      <!-- 3. Busca textual -->
      <h3 class="about-search__subtitle about-search__subtitle--rules">
        3. Busca textual ("Todos os campos")
      </h3>
      <p class="about-search__paragraph">
        O campo de busca principal procura cada palavra digitada nos seguintes campos da imagem:
      </p>
      <ul class="about-search__list">
        <li>título da imagem</li>
        <li>assuntos (tags)</li>
        <li>descrição</li>
        <li>nome dos contribuidores</li>
        <li>título da obra fotografada</li>
        <li>localização (endereço)</li>
      </ul>
      <p class="about-search__paragraph">
        <strong>Todas as palavras precisam ser encontradas (E)</strong>, mas cada uma pode estar em um campo
        diferente. Ao pesquisar <code class="about-search__code">rio de janeiro</code>, o conector "de" é ignorado e a
        busca fica:
      </p>
      <pre class="about-search__block"><code>("rio..." em algum dos campos)
E
("janeiro..." em algum dos campos)</code></pre>
      <p class="about-search__paragraph">
        Assim, uma imagem com o título "Rio Branco" e a palavra "janeiro" na descrição também aparece no resultado.
      </p>

      <h4 class="about-search__subheading">Como o texto digitado é tratado</h4>
      <ul class="about-search__list">
        <li>Maiúsculas e minúsculas não fazem diferença.</li>
        <li>
          Pontuação e símbolos são trocados por espaço. <code class="about-search__code">pré-moldado</code> vira as
          palavras "pré" e "moldado", e as duas passam a ser exigidas.
        </li>
        <li>
          Não há operadores: aspas, <code class="about-search__code">+</code>,
          <code class="about-search__code">-</code> e <code class="about-search__code">*</code> são descartados. Não é
          possível procurar uma frase exata nem excluir uma palavra pela busca textual.
          <code class="about-search__code">-praia</code>, por exemplo, passa a <strong>exigir</strong> "praia".
        </li>
        <li>Palavras repetidas contam uma vez só.</li>
        <li>Palavras de uma letra (como "e", "a", "o") são ignoradas.</li>
        <li>
          Conectores comuns também são ignorados, entre eles
          <code class="about-search__code">de, da, do, em, no, na, ao, as, os, um, ou, dos, das, uma, uns, por, para,
            com, que, nos, nas</code>
          e equivalentes em inglês e espanhol (como <code class="about-search__code">of, the, and, for, with, la, el,
            en</code>).
        </li>
        <li>
          São consideradas no máximo as <strong>6 primeiras</strong> palavras de três letras ou mais (e no máximo 6
          palavras de duas letras). As demais são ignoradas.
        </li>
        <li>
          Se, depois disso, não sobrar nenhuma palavra (por exemplo, ao digitar apenas
          <code class="about-search__code">de</code>), o texto inteiro é procurado como um trecho dentro do
          <strong>título</strong> da imagem.
        </li>
      </ul>

      <h4 class="about-search__subheading">Palavras de três letras ou mais</h4>
      <p class="about-search__paragraph">
        No título, assuntos, descrição, contribuidores e título da obra, a palavra é comparada como
        <strong>início de palavra</strong> (prefixo): <code class="about-search__code">mosaico</code> encontra
        "mosaicos" e <code class="about-search__code">arquitet</code> encontra "arquitetura" e "arquiteto". Uma palavra
        no meio de outra não é encontrada: <code class="about-search__code">teto</code> não encontra "arquiteto".
      </p>
      <p class="about-search__paragraph">
        Na <strong>localização</strong> a comparação é mais solta: a palavra pode aparecer em qualquer posição do
        endereço, inclusive no meio de outra palavra (<code class="about-search__code">rio</code> encontra "Rua Mário
        de Andrade").
      </p>

      <h4 class="about-search__subheading">Palavras de duas letras</h4>
      <p class="about-search__paragraph">
        Palavras de duas letras que não são conectores, como <code class="about-search__code">sé</code> ou
        <code class="about-search__code">sp</code>, precisam aparecer como <strong>palavra inteira</strong>:
        <code class="about-search__code">sé</code> não encontra "série". Elas são procuradas no título, assuntos,
        contribuidores, título da obra e localização, mas <strong>não na descrição</strong>. Acentos não fazem
        diferença nessa comparação, então <code class="about-search__code">sé</code> também encontra "se".
      </p>
      <p class="about-search__paragraph">
        Ao pesquisar <code class="about-search__code">catedral da sé</code>:
      </p>
      <pre class="about-search__block"><code>("catedral..." em algum dos campos)
E
(palavra inteira "sé" no título, assunto, contribuidor,
 título da obra ou localização)</code></pre>

      <p class="about-search__paragraph about-search__paragraph--conclusion">
        <strong>Conclusão:</strong> a busca textual procura em vários campos, mas cada palavra digitada
        <strong>restringe</strong> o resultado. Prefira poucas palavras significativas.
      </p>

      <!-- 4. Campos específicos -->
      <h3 class="about-search__subtitle about-search__subtitle--rules">
        4. Campos específicos: Título, Autoria e Local
      </h3>
      <p class="about-search__paragraph">
        Os campos <strong>Título</strong>, <strong>Autoria</strong> (nome do contribuidor) e <strong>Local</strong>
        não separam o texto em palavras: o texto digitado inteiro é procurado como um <strong>trecho contínuo</strong>,
        em qualquer posição do campo, inclusive no meio de uma palavra.
      </p>
      <p class="about-search__paragraph">
        Por isso, no campo Título, <code class="about-search__code">rio de janeiro</code> só encontra títulos que
        contenham essa sequência exata, enquanto <code class="about-search__code">rio</code> também encontra títulos
        como "Interior da casa" ou "Casa Mário de Andrade".
      </p>

      <!-- 5. Datas -->
      <h3 class="about-search__subtitle about-search__subtitle--rules">5. Datas da imagem e da obra</h3>
      <p class="about-search__paragraph">
        Há dois conjuntos de datas: a <strong>data da imagem</strong> (quando a foto foi feita) e a
        <strong>data da obra</strong> (quando a obra arquitetônica foi realizada). Cada data cadastrada é um intervalo,
        com início e fim.
      </p>
      <ul class="about-search__list">
        <li><strong>Data inicial</strong>: o início do intervalo da imagem precisa ser igual ou posterior a ela.</li>
        <li><strong>Data final</strong>: o fim do intervalo da imagem precisa ser igual ou anterior a ela.</li>
      </ul>
      <p class="about-search__paragraph">
        Com as duas preenchidas, o intervalo da imagem precisa caber <strong>inteiro</strong> dentro do período
        pesquisado. Uma foto datada de 1948 a 1952 não aparece em uma busca de 1950 a 1960, porque começa antes de
        1950.
      </p>
      <pre class="about-search__block"><code>início da data da imagem &gt;= data inicial
E
fim da data da imagem &lt;= data final</code></pre>
      <p class="about-search__paragraph">
        Imagens sem data cadastrada não aparecem quando algum filtro de data é usado. A data da obra segue a mesma
        regra, aplicada às datas das obras associadas à imagem. Quando uma imagem tem mais de uma data (ou mais de uma
        obra), cada uma das duas condições pode ser atendida por uma data diferente.
      </p>

      <!-- 6. Binômios -->
      <h3 class="about-search__subtitle about-search__subtitle--rules">6. Binômios</h3>
      <p class="about-search__paragraph">
        Os binômios (pares de qualidades opostas, avaliados numa escala de 0 a 100) são filtrados pela
        <strong>média das avaliações</strong> que a imagem recebeu:
      </p>
      <ul class="about-search__list">
        <li>Lado esquerdo do binômio: média menor que 50.</li>
        <li>Lado direito do binômio: média igual ou maior que 50.</li>
      </ul>
      <p class="about-search__paragraph">
        Ao escolher vários binômios, a imagem precisa atender a <strong>todos</strong> (E). Imagens que nunca foram
        avaliadas em um binômio não aparecem quando ele é usado como filtro.
      </p>

      <!-- 7. Ordenação -->
      <h3 class="about-search__subtitle about-search__subtitle--rules">7. Ordem dos resultados</h3>
      <p class="about-search__paragraph">Quando você não escolhe uma ordenação:</p>
      <ul class="about-search__list">
        <li><strong>Sem busca textual</strong>, os resultados aparecem em ordem aleatória.</li>
        <li>
          <strong>Com busca textual</strong>, aparecem primeiro as imagens cujo <strong>título</strong> contém todas
          as palavras de três letras ou mais digitadas (como início de palavra); depois, as demais. Dentro de cada
          grupo, as imagens mais recentes vêm primeiro.
        </li>
        <li>
          Se a busca textual só tiver palavras de duas letras, os resultados vêm apenas das mais recentes para as mais
          antigas.
        </li>
      </ul>
      <p class="about-search__paragraph">
        Não há um cálculo de relevância mais fino: dentro de cada grupo, não importa quantas vezes nem em quantos
        campos as palavras aparecem.
      </p>
      <p class="about-search__paragraph">
        Também é possível ordenar por <strong>título</strong> (ordem alfabética), por <strong>data da imagem</strong>
        (início do intervalo) ou por <strong>data de envio</strong>, em ordem crescente ou decrescente (o padrão é
        decrescente). Nesse caso, a prioridade para imagens com as palavras no título deixa de valer.
      </p>

      <!-- Resumo -->
      <h3 class="about-search__subtitle about-search__subtitle--rules">Resumo</h3>
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
              <td><code class="about-search__code">q = rio de janeiro</code></td>
              <td>"rio..." E "janeiro..." (cada uma em qualquer campo); "de" é ignorado</td>
            </tr>
            <tr>
              <td><code class="about-search__code">q = catedral da sé</code></td>
              <td>"catedral..." E a palavra inteira "sé" (fora da descrição)</td>
            </tr>
            <tr>
              <td><code class="about-search__code">q = +rio -praia</code></td>
              <td>símbolos descartados: "rio..." E "praia..."</td>
            </tr>
            <tr>
              <td><code class="about-search__code">q = de</code></td>
              <td>título contém o trecho "de"</td>
            </tr>
            <tr>
              <td><code class="about-search__code">Título = rio de janeiro</code></td>
              <td>título contém o trecho "rio de janeiro"</td>
            </tr>
            <tr>
              <td><code class="about-search__code">Material = concreto, vidro</code></td>
              <td>concreto E vidro (vínculo direto ou tag de mesmo texto)</td>
            </tr>
            <tr>
              <td><code class="about-search__code">Licença = CC BY, CC0</code></td>
              <td>CC BY OU CC0</td>
            </tr>
            <tr>
              <td><code class="about-search__code">q = rio + Material = concreto</code></td>
              <td>(busca textual "rio") E material = concreto</td>
            </tr>
            <tr>
              <td><code class="about-search__code">Data = 1950 a 1960</code></td>
              <td>intervalo da imagem inteiramente entre 1950 e 1960</td>
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

  &__subheading {
    font-weight: 600;
    font-size: 14px;
    line-height: 150%;
    margin-top: 20px;
    margin-bottom: 8px;

    @include md {
      font-size: 16px;
      margin-top: 32px;
      margin-bottom: 12px;
    }
  }

  // Recuo compartilhado pelo conteúdo das seções (igual ao das políticas)
  &__paragraph,
  &__list,
  &__block,
  &__subheading,
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