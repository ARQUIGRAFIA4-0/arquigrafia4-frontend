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
    { label: 'Álbuns', value: 'Álbuns' },
    { label: 'Percursos', value: 'Percursos' },
    { label: 'Obras', value: 'Obras' },
    { label: 'Avaliações', value: 'Avaliações' }
  ];

    const privateNavItems = [
    { label: 'Minhas imagens', value: 'Imagens' },
    { label: 'Meus álbuns', value: 'Álbuns' },
    { label: 'Meus percursos', value: 'Percursos' },
    { label: 'Obras', value: 'Obras' },
    { label: 'Minhas avaliações', value: 'Avaliações' }
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