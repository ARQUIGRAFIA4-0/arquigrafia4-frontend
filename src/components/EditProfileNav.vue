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

/* Desktop: a partir do layout em duas colunas da página de editar */
$breakpoint-desk: 992px;

.edit-profile-nav {
  display: flex;
  list-style: none;
  margin: 0 0 32px;
  padding: 0;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  gap: 12px; /* espaçamento mobile e telas menores */

  /* Esconde a scrollbar, mas mantém o scroll horizontal */
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }

  @media (min-width: #{$breakpoint-desk}) {
    gap: 40px; /* espaçamento desk */
  }

  li {
    margin: 0;
    font-weight: 300;
    font-size: 14px; /* mobile e telas menores */
    line-height: 150%;
    text-align: center;
    cursor: pointer;
    flex-shrink: 0;

    @media (min-width: #{$breakpoint-desk}) {
      font-size: 20px; /* desk */
      line-height: 100%;
    }

    &.edit-profile-nav--selected {
      color: #aa4f28;
      font-weight: 800;
      font-size: 14px;
      line-height: 150%;
      padding-bottom: 10px;
      border-bottom: 3px solid currentColor;

      @media (min-width: #{$breakpoint-desk}) {
        font-weight: 700;
        font-size: 20px;
        line-height: 100%;
      }
    }
  }
}
</style>
