<script setup>
import { defineProps } from "vue";
const props = defineProps({
  selected: String
});
</script>

<template>
  <ul class="edit-profile-nav">
    <li @click="$emit('select', 'personalRef')" :class="{ 'edit-profile-nav--selected': props.selected === 'personalRef' }">Dados pessoais</li>
    <li @click="$emit('select', 'professionalRef')" :class="{ 'edit-profile-nav--selected': props.selected === 'professionalRef' }">Dados profissionais</li>
    <li @click="$emit('select', 'interestsRef')" :class="{ 'edit-profile-nav--selected': props.selected === 'interestsRef' }">Temas de interesse</li>
    <li @click="$emit('select', 'collectiveRef')" :class="{ 'edit-profile-nav--selected': props.selected === 'collectiveRef' }">Coletivos</li>
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

.edit-profile-nav {
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