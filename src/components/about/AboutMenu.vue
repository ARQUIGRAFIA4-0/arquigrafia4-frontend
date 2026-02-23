<template>
  <nav class="about-menu">
    <ul class="about-menu__list">
      <li class="about-menu__item" :class="{ 'about-menu__item--active': $route.name === 'about-project' }">
        <router-link :to="{ name: 'about-project' }" class="about-menu__link">
          <span class="about-menu__text">Sobre</span>
          <i class="bi bi-arrow-right about-menu__icon"></i>
        </router-link>
      </li>
      <li class="about-menu__item" :class="{ 'about-menu__item--active': $route.name === 'about-members' }">
        <router-link :to="{ name: 'about-members' }" class="about-menu__link">
          <span class="about-menu__text">Membros</span>
          <i class="bi bi-arrow-right about-menu__icon"></i>
        </router-link>
      </li>
      <li class="about-menu__item" :class="{ 'about-menu__item--active': $route.name === 'about-policies' }">
        <router-link :to="{ name: 'about-policies' }" class="about-menu__link">
          <span class="about-menu__text">Políticas da plataforma</span>
          <i class="bi bi-arrow-right about-menu__icon"></i>
        </router-link>
      </li>
    </ul>
  </nav>
</template>

<script>
export default {
  name: "AboutMenu",
};
</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.about-menu {
  position: sticky;
  top: 32px;
  z-index: 100;
  background-color: #ffffff;
  padding-right: 1rem;

  &__list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  &__item {
    margin: 0;
    border-bottom: 0.5px solid var(--Cinza_C, #A6A6A6);
    padding: 0;

    &:hover {

      .about-menu__text,
      .about-menu__icon {
        color: var(--Laranja_E, #FF7F00);
      }
    }

    &--active {

      .about-menu__text,
      .about-menu__icon {
        color: var(--Laranja_E, #FF7F00);
      }
    }
  }

  &__link {
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-decoration: none;
    color: inherit;
    width: 100%;
    padding: 12px 4px 12px 4px;
  }

  &__text {
    @include md {
      font-weight: 700;
      font-style: Bold;
      font-size: 14px;
      line-height: 125%;
      letter-spacing: 0%;
    }
  }

  &__icon {
    color: var(--Cinza_M, #636262);

    @include md {
      font-weight: 700;
      font-style: Bold;
      font-size: 14px;
      line-height: 125%;
      letter-spacing: 0%;
    }
  }
}
</style>
