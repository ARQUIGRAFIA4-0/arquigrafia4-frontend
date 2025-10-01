<script setup>
import { ref } from 'vue';
const images = ref([]);
</script>

<template>
  <div v-if="images.length === 0">
    <div class="upload-box">
      <h1>Você ainda não tem<br>contribuições.</h1>
      <i class="bi bi-plus-circle-fill upload-box__icon"></i>
      <div class="upload-box__instructions">
        <p>clique aqui ou arraste um ou<br>mais arquivos para esta área.</p>
        <p>limite aceito: 10 imagens</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "@/scss/variables";
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.upload-box {
  >*+* {
    margin-top: 1.5rem;
  }

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #FAF9F9;
  border: 2px solid #636262;
  width: 100%;
  border-radius: 7px;
  border-width: 2px;
  padding: 80px 0;
  box-shadow: 4px 4px 8px 0px #000000;
  cursor: pointer;

  &--dragging {
    background-color: rgba(#B46013, 0.6);
  }

  h1 {
    font-weight: 500;
    font-size: 30px;
    line-height: 150%;
    letter-spacing: 0%;
    text-align: center;
    vertical-align: middle;
  }

  &__icon {
    font-size: 50px;
    color: #0F59A5;
  }

  &__instructions {
    >*+* {
      margin-top: 1.5rem;
    }

    p {
      font-weight: 400;
      font-size: 16px;
      line-height: 20px;
      text-align: center;
      vertical-align: middle;
      text-transform: lowercase;
    }
  }

  &__input {
    display: none;
  }
}

.item-card {
  &__image {
    border-radius: 8px 8px 0 0;
    width: 100%;
    height: 120px;
    background-color: #9c9c9c;
    cursor: pointer;
  }

  &__text {
    border: 1px solid #E0E0E0;
    border-top: 0;
    padding: 8px 12px;
    border-radius: 0 0 8px 8px;
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
    cursor: pointer;
  }
}
</style>