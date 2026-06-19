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
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.collective-edit-nav {
  display: flex;
  list-style: none;
  padding: 0;
  margin: 0;
  margin-bottom: 32px;
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
      line-height: 100%;
      margin-right: 48px;
    }

    &.collective-edit-nav--selected {
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
