<script setup></script>

<template>
  <ul class="profile-nav">
    <li>Dados pessoais</li>
    <li>Dados profissionais</li>
    <li>Temas de interesse</li>
    <li>Coletivos</li>
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