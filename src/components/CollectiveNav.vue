<script setup>
const props = defineProps({ selected: String });
</script>

<template>
  <ul class="collective-nav">
    <li
      :class="{ 'collective-nav--selected': props.selected === 'Imagens' }"
      @click="$emit('select', 'Imagens')"
    >Imagens</li>
    <li
      :class="{ 'collective-nav--selected': props.selected === 'Participantes' }"
      @click="$emit('select', 'Participantes')"
    >Participantes</li>
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

.collective-nav {
  display: flex;
  list-style: none;
  padding: 0;
  margin: 0;
  margin-bottom: 24px;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }

  @include md {
    overflow-x: visible;
  }

  li {
    font-weight: 300;
    font-size: 12px;
    line-height: 150%;
    letter-spacing: 0%;
    text-align: center;
    vertical-align: middle;
    margin-right: 32px;
    cursor: pointer;
    flex-shrink: 0;

    @include md {
      font-size: 20px;
      margin-right: 48px;
      line-height: 100%;
    }

    &.collective-nav--selected {
      color: #aa4f28;
      font-weight: 800;
      font-size: 12px;
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
