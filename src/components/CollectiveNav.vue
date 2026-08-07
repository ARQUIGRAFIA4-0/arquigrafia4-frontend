<script setup>
const props = defineProps({
  selected: String,
  userRole: { type: String, default: null },
});
</script>

<template>
  <ul class="collective-nav">
    <li
      :class="{ 'collective-nav--selected': props.selected === 'Imagens' }"
      @click="$emit('select', 'Imagens')"
    >Imagens</li>
    <li
      :class="{ 'collective-nav--selected': props.selected === 'Coleções' }"
      @click="$emit('select', 'Coleções')"
    >Coleções</li>
    <li
      :class="{ 'collective-nav--selected': props.selected === 'Participantes' }"
      @click="$emit('select', 'Participantes')"
    >Participantes</li>
    <li
      v-if="props.userRole === 'admin'"
      :class="{ 'collective-nav--selected': props.selected === 'Solicitações' }"
      @click="$emit('select', 'Solicitações')"
    >Solicitações</li>
  </ul>
</template>

<style lang="scss" scoped>
@use "@/scss/variables" as *;

/* Em telas pequenas, fonte 14px e espaçamento de 12px; em telas grandes (≥1425px), aumenta para 20px e gap de 40px */
$breakpoint-desk: 1425px;

.collective-nav {
  display: flex;
  list-style: none;
  margin: 0 0 24px;
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

    &.collective-nav--selected {
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
