<script setup>
const buscarImagem = (numero) => {
  return new URL(`../assets/uploadPlaceholder${numero}.png`, import.meta.url)
    .href;
};
</script>

<template>
  <div class="cg">
    <h2 class="cg__title">Orientações para colaborar</h2>

    <!-- Tamanho máximo de arquivo -->
    <section class="cg-section">
      <p>
        O ARQUIGRAFIA aceita imagens com até 10Mb. Caso sua imagem seja muito
        grande, faça uma edição para convertê-la em um tamanho menor.
      </p>
      <div class="cg-resize-row">
        <img
          src="../assets/uploadPlaceholder1.png"
          alt="Exemplo de imagem em tamanho original"
          class="cg-thumb cg-thumb--lg"
        />
        <i class="bi bi-arrow-right cg-arrow" aria-hidden="true"></i>
        <img
          src="../assets/uploadPlaceholder1.png"
          alt="Exemplo de imagem convertida para tamanho menor"
          class="cg-thumb cg-thumb--md"
        />
      </div>
    </section>

    <!-- Quantidade de imagens -->
    <section class="cg-section">
      <p>Você pode enviar até 10 imagens por vez.</p>
      <div class="cg-grid">
        <div class="cg-grid__add" aria-hidden="true">
          <i class="bi bi-plus-circle-fill"></i>
        </div>
        <img
          v-for="n in 3"
          :key="n"
          :src="buscarImagem(n)"
          :alt="`Exemplo de imagem enviada ${n}`"
          class="cg-thumb cg-thumb--grid"
        />
      </div>
    </section>

    <!-- Evitar duplicadas -->
    <section class="cg-section">
      <p>
        O ARQUIGRAFIA é uma plataforma colaborativa e aberta. Sendo assim, a
        comunidade recomenda que você faça uma pré-seleção de suas imagens,
        evitando imagens duplicadas ou muito semelhantes.
      </p>
      <div class="cg-row">
        <img
          src="../assets/uploadPlaceholder1.png"
          alt="Exemplo de imagem original"
          class="cg-thumb cg-thumb--flex"
        />
        <div class="cg-thumb-wrap">
          <div class="cg-thumb-wrap--iconWarning">
            <img
              src="../assets/uploadPlaceholder1.png"
              alt="Exemplo de imagem duplicada, não recomendada"
              class="cg-thumb cg-thumb--flex cg-thumb--warning"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Foco temático -->
    <section class="cg-section">
      <p>
        Buscamos difundir imagens de arquiteturas e do espaço construído nos
        contextos brasileiro e lusófono. Sendo assim, garanta que suas
        imagens tenham esses elementos como foco.
      </p>
      <div class="cg-row">
        <img
          src="../assets/uploadPlaceholder1.png"
          alt="Exemplo de imagem de arquitetura, dentro do foco"
          class="cg-thumb cg-thumb--flex"
        />
        <div class="cg-thumb-wrap">
          <div class="cg-thumb-wrap--iconWarning">
            <img
            src="../assets/uploadPlaceholder4.png"
              alt="Exemplo de imagem fora do foco temático, não recomendada"
              class="cg-thumb cg-thumb--flex cg-thumb--warning"
            />
          </div>
        </div>
        <img
          src="../assets/uploadPlaceholder3.png"
          alt="Exemplo de imagem de arquitetura, dentro do foco"
          class="cg-thumb cg-thumb--flex"
        />
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.cg {
  width: 100%;
  max-width: 555px;
  padding: 0px 40px;

  &__title {
    font-weight: 500;
    font-size: 20px;
    line-height: 150%;
    margin: 32px 0 16px 0;
    color: var(--Cinza_E);

    @include md {
      // font-size: 30px;
      // margin-bottom: 28px;
    }
  }
}

.cg-section {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }

  p {
    font-size: 14px;
    line-height: 125%;
    color: var(--Cinza_E);
    margin: 0 0 16px;

    @include md {
      // font-size: 16px;
    }
  }
}

// Linha 1: imagem original -> seta -> imagem convertida
.cg-resize-row {
  display: flex;
  align-items: center;
  gap: 12px;

  @include md {
    gap: 24px;
  }
}

.cg-arrow {
  flex-shrink: 0;
  font-style: normal;
  font-size: 20px;
  color: var(--Cinza_E);

  @include md {
    font-size: 28px;
  }
}

// Linha 2: grade de exemplos + botão "adicionar"
.cg-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  @include md {
    gap: 16px;
  }

  &__add {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 48px;
    border-radius: 2.98px;
    border: 1px solid #2f2f2f;
    flex-shrink: 0;

    i {
      font-size: 22px;
      color: #575757;

      @include md {
        font-size: 24px;
      }
    }
  }
}

// Linhas 3 e 4: pares/trios de exemplos, com destaque de alerta
.cg-row {
  display: flex;
  gap: 8px;

  @include md {
    gap: 16px;
  }
}

.cg-thumb {
  width: 100%;
  object-fit: cover;
  border-radius: 5px;
  border: 2px solid transparent;
  display: block;

  &--lg {
    width: 42%;
    max-width: 108px;
    aspect-ratio: 4 / 3;
  }

  &--md {
    width: 34%;
    max-width: 72px;
    aspect-ratio: 4 / 3;
  }

  &--grid {
    width: 64px;
    height: 48px;
    border-radius: 2.98px;
    flex-shrink: 0;
  }

  &--flex {
    width: 108px;
    height: 81px;
    border-radius: 5px;
  }

  &--warning {
    border-color: #f70008;
    filter: opacity(0.7);
  }
}

.cg-thumb-wrap {
  position: relative;

  &--iconWarning {
    position: relative;

    &::before {
      content: "!";
      display: block;
      width: 26px;
      height: 26px;
      color: var(--Branco);
      position: absolute;
      z-index: 1;
      top: 5px;
      right: 5.5px;
      border-radius: 50%;
      background-color: #e5252c;
      font-weight: 700;
      font-size: 15px;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  
      @include md {
        // width: 32px;
        // height: 32px;
        // font-size: 18px;
        // top: -12px;
        // right: -12px;
      }
    }
  }
}
</style>