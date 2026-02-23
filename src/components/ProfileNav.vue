<script setup>
import { computed } from "vue";

const props = defineProps({
  selected: String,
  isCurrentUser: {
    type: Boolean,
    default: false
  }
});

const navItems = computed(() => {
  const publicNavItems = [
    { label: 'Imagens', value: 'Imagens' },
    // { label: 'Álbuns', value: 'Álbuns' },
    // { label: 'Percursos', value: 'Percursos' },
    // { label: 'Obras', value: 'Obras' },
    // { label: 'Avaliações', value: 'Avaliações' }
  ];

  const privateNavItems = [
    { label: 'Minhas imagens', value: 'Imagens' },
    // { label: 'Meus álbuns', value: 'Álbuns' },
    // { label: 'Meus percursos', value: 'Percursos' },
    // { label: 'Obras', value: 'Obras' },
    // { label: 'Minhas avaliações', value: 'Avaliações' }
  ];

  if (props.isCurrentUser) {
    return privateNavItems;
  }
  return publicNavItems;
});
</script>

<template>
  <ul class="profile-nav">
    <li v-for="item in navItems" :key="item.value" @click="$emit('select', item.value)"
      :class="{ 'profile-nav--selected': props.selected === item.value }">
      {{ item.label }}
    </li>
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

.profile-nav {
  display: flex;
  list-style: none;
  padding: 0;
  margin: 0;
  margin-bottom: 24px;
  padding: 0;
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

    &.profile-nav--selected {
      color: #AA4F28;
      font-weight: 800;
      font-size: 12px;
      line-height: 150%;
      letter-spacing: 0%;
      padding-bottom: 10px;
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
}
</style>