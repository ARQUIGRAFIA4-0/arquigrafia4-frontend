<template>
  <div class="container-fluid about-layout">
    <div class="row about-layout__row">
      <aside class="about-layout__menu">
        <AboutMenu />
      </aside>

      <div class="about-layout__gutter" aria-hidden="true" />

      <div class="about-layout__content row">
        <slot />
      </div>
    </div>
  </div>
</template>

<script>
import AboutMenu from "@/components/about/AboutMenu.vue";

export default {
  name: "AboutLayout",
  components: {
    AboutMenu,
  },
};
</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;

$breakpoint-laptop: 768px;
$breakpoint-side: 1024px;
$breakpoint-wide: 1440px;

.about-layout {
  width: 100%;
  margin-top: 34px;
  padding: 0 1rem;
  box-sizing: border-box;

  @media (min-width: #{$breakpoint-laptop}) {
    margin-top: 0;
    padding: 8px 1.25rem;
  }

  @media (min-width: #{$breakpoint-side}) {
    padding: 8px 2rem;
  }

  @media (min-width: #{$breakpoint-wide}) {
    padding: 8px 50px;
  }
}

.about-layout__row {
  --bs-gutter-x: 1.25rem;
  margin-left: 0;
  margin-right: 0;

  @media (min-width: #{$breakpoint-wide}) {
    --bs-gutter-x: 0;
  }
}

/* Menu lateral a partir de 768 (comportamento atual); sem gutter até 1440 */
.about-layout__menu {
  display: none;
  min-width: 0;

  @media (min-width: #{$breakpoint-laptop}) {
    display: block;
    flex: 0 0 auto;
    width: 22%;
    max-width: 220px;
  }

  @media (min-width: #{$breakpoint-side}) {
    width: 18%;
  }

  @media (min-width: #{$breakpoint-wide}) {
    width: 16.666667%; /* ~2/12 */
    max-width: none;
  }
}

.about-layout__gutter {
  display: none;
  min-width: 0;

  @media (min-width: #{$breakpoint-wide}) {
    display: block;
    flex: 0 0 auto;
    width: 8.333333%; /* 1/12 — igual /eu/imagens */
  }
}

.about-layout__content {
  --bs-gutter-x: 0;
  min-width: 0;
  width: 100%;
  margin-left: 0;
  margin-right: 0;

  @media (min-width: #{$breakpoint-laptop}) and (max-width: 1439.98px) {
    flex: 1 1 0;
    width: auto;
  }

  @media (min-width: #{$breakpoint-wide}) {
    flex: 0 0 auto;
    width: 75%; /* 9/12 */
  }
}

.container-fluid {
  --bs-gutter-x: 0;
}
</style>
