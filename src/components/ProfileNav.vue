<script setup>
import { defineProps } from "vue";
const props = defineProps({
  selected: String
});
</script>

<template>
  <ul class="profile-nav">
    <li @click="$emit('select', 'Imagens')" :class="{ 'profile-nav--selected': props.selected === 'Imagens' }">Imagens</li>
    <li @click="$emit('select', 'Álbuns')" :class="{ 'profile-nav--selected': props.selected === 'Álbuns' }">Álbuns</li>
    <li @click="$emit('select', 'Percursos')" :class="{ 'profile-nav--selected': props.selected === 'Percursos' }">Percursos</li>
    <li @click="$emit('select', 'Obras')" :class="{ 'profile-nav--selected': props.selected === 'Obras' }">Obras</li>
    <li @click="$emit('select', 'Avaliações')" :class="{ 'profile-nav--selected': props.selected === 'Avaliações' }">Avaliações</li>
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

.profile-nav {
  display: flex;
  list-style: none;
  padding: 0;
  margin: 0;
  margin-bottom: 32px;
  padding: 0px 0 0 0;

  li {
    margin-right: 32px;
    font-weight: 300;
    font-size: 16px;
    line-height: 100%;
    letter-spacing: 0%;
    text-align: center;
    vertical-align: middle;
    cursor: pointer;

    @include md {
      font-size: 20px;
      margin-right: 48px;
    }
  }

  &--selected {
    color: #AA4F28;
    font-weight: 800;
    font-size: 12px;
    line-height: 150%;
    letter-spacing: 0%;
    padding-bottom: 8px;
    border-bottom: 4px solid;
    text-align: center;
    vertical-align: middle;

    @include md {
      font-size: 20px;
      font-weight: 700;
      line-height: 100%;
    }
  }
}
</style>