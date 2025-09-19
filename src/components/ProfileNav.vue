<script setup></script>

<template>
  <ul class="profile-nav">
    <li>Imagens</li>
    <li>Álbuns</li>
    <li>Percursos</li>
    <li>Obras</li>
    <li>Avaliações</li>
  </ul>
</template>

<style lang="scss" scoped>
@import "@/scss/variables";
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}
</style>