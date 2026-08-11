<script setup>
const props = defineProps({
  selected: String
});
</script>

<template>
  <ul class="collective-edit-nav">
    <li
      @click="$emit('select', 'collectiveDataRef')"
      :class="{ 'collective-edit-nav--selected': props.selected === 'collectiveDataRef' }"
    >Dados do coletivo</li>
    <li
      @click="$emit('select', 'socialsRef')"
      :class="{ 'collective-edit-nav--selected': props.selected === 'socialsRef' }"
    >Redes</li>
    <li
      @click="$emit('select', 'interestsRef')"
      :class="{ 'collective-edit-nav--selected': props.selected === 'interestsRef' }"
    >Temas abordados</li>
  </ul>
</template>

<style lang="scss" scoped>
@use "@/scss/variables" as *;

/* Em telas pequenas, fonte 14px e espaçamento de 12px; em telas grandes (≥1425px), aumenta para 20px e gap de 40px */
$breakpoint-desk: 1425px;

.collective-edit-nav {
  display: flex;
  list-style: none;
  margin: 0 0 32px;
  padding: 0;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  gap: 12px;

  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }

  @media (min-width: #{$breakpoint-desk}) {
    gap: 40px;
  }

  li {
    margin: 0;
    font-weight: 300;
    font-size: 14px;
    line-height: 150%;
    text-align: center;
    cursor: pointer;
    flex-shrink: 0;

    @media (min-width: #{$breakpoint-desk}) {
      font-size: 20px;
      line-height: 100%;
    }

    &.collective-edit-nav--selected {
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
