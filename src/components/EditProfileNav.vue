<script setup>
const props = defineProps({
  selected: String
});
</script>

<template>
  <ul class="edit-profile-nav">
    <li @click="$emit('select', 'personalRef')"
      :class="{ 'edit-profile-nav--selected': props.selected === 'personalRef' }">Dados pessoais</li>
    <li @click="$emit('select', 'professionalRef')"
      :class="{ 'edit-profile-nav--selected': props.selected === 'professionalRef' }">Dados profissionais</li>
    <li @click="$emit('select', 'interestsRef')"
      :class="{ 'edit-profile-nav--selected': props.selected === 'interestsRef' }">Temas de interesse</li>
    <li @click="$emit('select', 'collectiveRef')"
      :class="{ 'edit-profile-nav--selected': props.selected === 'collectiveRef' }">Coletivos</li>
  </ul>
</template>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
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
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;

  /* Esconde a scrollbar */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari and Opera */
  }

  @include md {
    overflow-x: visible;
  }

  li {
    margin-right: 26px;
    font-weight: 300;
    font-size: 14px;
    line-height: 150%;
    letter-spacing: 0%;
    text-align: center;
    vertical-align: middle;
    cursor: pointer;
    flex-shrink: 0;

    @include md {
      font-size: 20px;
      font-size: 20px;
      line-height: 100%;
      margin-right: 48px;
    }

    &.edit-profile-nav--selected {
      color: #AA4F28;
      font-weight: 800;
      font-size: 14px;
      line-height: 150%;
      letter-spacing: 0%;
      text-align: center;
      vertical-align: middle;
      padding-bottom: 10px;
      border-bottom: 3px solid;

      @include md {
        font-weight: 700;
        font-size: 20px;
        line-height: 100%;
      }
    }
  }
}
</style>