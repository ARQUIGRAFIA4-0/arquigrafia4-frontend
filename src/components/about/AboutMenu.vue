<template>
  <nav class="about-menu">
    <ul class="about-menu__list">
      <li class="about-menu__item">
        <a href="#" class="about-menu__link">
          <span class="about-menu__text">Sobre</span>
          <i class="bi bi-arrow-right about-menu__icon"></i>
        </a>
      </li>
      <li class="about-menu__item">
        <a href="#" class="about-menu__link">
          <span class="about-menu__text">Membros</span>
          <i class="bi bi-arrow-right about-menu__icon"></i>
        </a>
      </li>
      <li class="about-menu__item">
        <a href="#" class="about-menu__link">
          <span class="about-menu__text">Políticas da plataforma</span>
          <i class="bi bi-arrow-right about-menu__icon"></i>
        </a>
      </li>
      <li class="about-menu__item">
        <a href="#" class="about-menu__link">
          <span class="about-menu__text">FAQ</span>
          <i class="bi bi-arrow-right about-menu__icon"></i>
        </a>
      </li>
      <li class="about-menu__item">
        <a href="#" class="about-menu__link">
          <span class="about-menu__text">Código Aberto</span>
          <i class="bi bi-arrow-right about-menu__icon"></i>
        </a>
      </li>
      <li class="about-menu__item">
        <a href="#" class="about-menu__link">
          <span class="about-menu__text">Vocabulário</span>
          <i class="bi bi-arrow-right about-menu__icon"></i>
        </a>
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
  &__list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  &__item {
    margin: 0;
    border-bottom: 0.5px solid var(--Cinza_C, #A6A6A6);
    padding: 12px 4px 12px 4px;

    &:hover {
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
