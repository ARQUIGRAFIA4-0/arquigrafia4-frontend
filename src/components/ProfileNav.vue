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
    { label: 'Coleções', value: 'Coleções' },
    // { label: 'Álbuns', value: 'Álbuns' },
    // { label: 'Percursos', value: 'Percursos' },
    // { label: 'Obras', value: 'Obras' },
    // { label: 'Avaliações', value: 'Avaliações' }
  ];

  const privateNavItems = [
    { label: "Minhas imagens", value: "Imagens", routeName: "my-profile-images" },
    { label: "Minhas coleções", value: "Coleções", routeName: "my-profile-collections" }
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
    <li
      v-for="item in navItems"
      :key="item.value"
      :class="{ 'profile-nav--selected': props.selected === item.value }"
    >
      <RouterLink
        v-if="item.routeName"
        class="profile-nav__link"
        :to="{ name: item.routeName }"
      >
        {{ item.label }}
      </RouterLink>

      <button
        v-else
        type="button"
        class="profile-nav__button"
        @click="$emit('select', item.value)"
      >
        {{ item.label }}
      </button>
    </li>
  </ul>
</template>

<style lang="scss" scoped>
@use "@/scss/variables" as *;

/* Em telas pequenas, fonte 14px e espaçamento de 12px; em telas grandes (≥1425px), aumenta para 20px e gap de 40px */
$breakpoint-desk: 1425px;

.profile-nav__link,
.profile-nav__button {
  color: inherit;
  text-decoration: none;
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
  font-weight: inherit;
  font-size: 14px;
  line-height: 150%;
}

.profile-nav {
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

    .profile-nav__link,
    .profile-nav__button {
      font-size: 20px;
      line-height: 100%;
    }
  }

  li {
    margin: 0;
    font-weight: 300;
    text-align: center;
    cursor: pointer;
    flex-shrink: 0;

    &.profile-nav--selected {
      color: #aa4f28;
      font-weight: 800;
      padding-bottom: 10px;
      border-bottom: 4px solid currentColor;

      .profile-nav__link,
      .profile-nav__button {
        font-weight: 800;
        font-size: 14px;
        line-height: 150%;
      }

      @media (min-width: #{$breakpoint-desk}) {
        font-weight: 700;

        .profile-nav__link,
        .profile-nav__button {
          font-weight: 700;
          font-size: 20px;
          line-height: 100%;
        }
      }
    }
  }
}
</style>
