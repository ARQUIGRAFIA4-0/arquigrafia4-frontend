<template>
  <div class="covers-guide">
    <p class="covers-guide__lead">
      O gráfico de uma coleção se relaciona com os dados da coleção. Confira a relação entre os
      elementos gráficos e os dados:
    </p>

    <section class="covers-guide__section" aria-labelledby="covers-guide-cores">
      <h3 id="covers-guide-cores" class="covers-guide__section-title">Cores</h3>
      <p class="covers-guide__section-text">Representam o volume de imagens na coleção.</p>
      <ul class="covers-guide__samples">
        <li v-for="sample in COLOR_SAMPLES" :key="sample.alt">
          <img :src="sample.src" :alt="sample.alt" :title="sample.alt" class="covers-guide__tile" />
        </li>
      </ul>
    </section>

    <section class="covers-guide__section" aria-labelledby="covers-guide-pontos">
      <h3 id="covers-guide-pontos" class="covers-guide__section-title">Pontos</h3>
      <p class="covers-guide__section-text">Refletem a média de interpretações sobre as imagens da coleção.</p>
      <ul class="covers-guide__samples">
        <li v-for="sample in DOT_SAMPLES" :key="sample.alt">
          <svg
            class="covers-guide__tile covers-guide__tile--outlined"
            :viewBox="`0 0 ${VIEWBOX} ${VIEWBOX}`"
            role="img"
            :aria-label="sample.alt"
          >
            <title>{{ sample.alt }}</title>
            <circle
              v-for="(position, index) in sample.positions"
              :key="index"
              :cx="DOT_MARGIN + position * (VIEWBOX - DOT_MARGIN * 2)"
              :cy="DOT_MARGIN + index * dotStep"
              :r="DOT_RADIUS"
            />
          </svg>
        </li>
      </ul>
    </section>

    <section class="covers-guide__section" aria-labelledby="covers-guide-tracado">
      <h3 id="covers-guide-tracado" class="covers-guide__section-title">Traçado das linhas</h3>
      <p class="covers-guide__section-text">
        Indicam se a coleção abrange um período de anos, décadas ou séculos.
      </p>
      <ul class="covers-guide__samples">
        <li v-for="sample in LINE_STYLE_SAMPLES" :key="sample.alt">
          <img :src="sample.src" :alt="sample.alt" :title="sample.alt"
            class="covers-guide__tile covers-guide__tile--outlined" />
        </li>
      </ul>
    </section>

    <section class="covers-guide__section" aria-labelledby="covers-guide-quantidade">
      <h3 id="covers-guide-quantidade" class="covers-guide__section-title">Quantidade de linhas</h3>
      <p class="covers-guide__section-text">
        Refletem a proporção entre tags e imagens na coleção. Quanto mais linhas, mais tags.
      </p>
      <ul class="covers-guide__samples">
        <li v-for="sample in LINE_COUNT_SAMPLES" :key="sample.alt">
          <img :src="sample.src" :alt="sample.alt" :title="sample.alt"
            class="covers-guide__tile covers-guide__tile--outlined" />
        </li>
      </ul>
    </section>

    <p class="covers-guide__lead covers-guide__closing">
      A partir desse sistema visual, navegue no acervo e explore as características das coleções a
      partir de suas formas gráficas.
    </p>
  </div>
</template>

<script setup>
// Os exemplos usam os mesmos assets das capas geradas (AlbumCoverArt /
// helpers/albumCoverArt.js); as faixas descritas nos textos alternativos
// seguem as regras desse helper.
import fundoVerde from "@/assets/album/fundo-verde.png";
import fundoAzul from "@/assets/album/fundo-azul.png";
import fundoLaranja from "@/assets/album/fundo-laranja.png";
import fundoRosa from "@/assets/album/fundo-rosa.png";
import linhasAnosAlta from "@/assets/album/linhas-anos-alta.png";
import linhasDecadasAlta from "@/assets/album/linhas-decadas-alta.png";
import linhasSeculosAlta from "@/assets/album/linhas-seculos-alta.png";
import linhasSeculosBaixa from "@/assets/album/linhas-seculos-baixa.png";

const COLOR_SAMPLES = [
  { src: fundoVerde, alt: "Verde: até 3 imagens" },
  { src: fundoAzul, alt: "Azul: de 4 a 7 imagens" },
  { src: fundoLaranja, alt: "Laranja: de 8 a 12 imagens" },
  { src: fundoRosa, alt: "Rosa: 13 imagens ou mais" },
];

const LINE_STYLE_SAMPLES = [
  { src: linhasAnosAlta, alt: "Linhas retas: período de anos" },
  { src: linhasDecadasAlta, alt: "Linhas em zigue-zague: período de décadas" },
  { src: linhasSeculosAlta, alt: "Linhas onduladas: período de séculos" },
];

const LINE_COUNT_SAMPLES = [
  { src: linhasSeculosBaixa, alt: "Poucas linhas: poucas tags por imagem" },
  { src: linhasAnosAlta, alt: "Muitas linhas: muitas tags por imagem" },
];

// Cada ponto corresponde a um par de interpretações (binômio); a posição
// horizontal é a média das avaliações entre os dois extremos.
const DOT_SAMPLES = [
  { positions: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5], alt: "Pontos alinhados ao centro: interpretações equilibradas" },
  { positions: [0.15, 0.6, 0.4, 0.6, 0.32, 0.3], alt: "Pontos pouco dispersos: interpretações próximas do centro" },
  { positions: [0.15, 0.6, 0.78, 0.6, 0.45, 0.9], alt: "Pontos dispersos: interpretações próximas dos extremos" },
];

const VIEWBOX = 100;
const DOT_MARGIN = 8;
const DOT_RADIUS = 3.5;
const dotStep = (VIEWBOX - DOT_MARGIN * 2) / (DOT_SAMPLES[0].positions.length - 1);
</script>

<style lang="scss" scoped>
$breakpoint-md: 768px;

.covers-guide {
  color: var(--Cinza_E, #2f2f2f);
}

.covers-guide__lead {
  font-size: 16px;
  font-weight: 500;
  line-height: 150%;
  margin-bottom: 2rem;

  @media (min-width: $breakpoint-md) {
    font-size: 18px;
  }
}

.covers-guide__section {
  margin-bottom: 2rem;
}

.covers-guide__section-title {
  font-size: 16px;
  font-weight: 500;
  line-height: 150%;
  margin-bottom: 0.5rem;

  @media (min-width: $breakpoint-md) {
    font-size: 18px;
  }
}

.covers-guide__section-text {
  font-size: 12px;
  line-height: 125%;
  margin-bottom: 1rem;

  @media (min-width: $breakpoint-md) {
    font-size: 14px;
  }
}

.covers-guide__samples {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1.5rem;
  margin: 0;
  padding: 0;
  list-style: none;

  @media (min-width: $breakpoint-md) {
    gap: 2rem;
  }
}

.covers-guide__tile {
  display: block;
  width: 64px;
  height: 64px;
  object-fit: cover;

  @media (min-width: $breakpoint-md) {
    width: 72px;
    height: 72px;
  }

  &--outlined {
    border: 1px solid var(--Preto, #1a1a1a);
    background-color: var(--Branco, #fff);
    fill: var(--Preto, #1a1a1a);
  }
}

.covers-guide__closing {
  margin-top: 2.5rem;
  margin-bottom: 0;
}
</style>
