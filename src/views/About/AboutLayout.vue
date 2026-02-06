<template>
  <div class="container-fluid about-layout">
    <div class="row my-2 justify-content-center">
      <div class="d-none d-md-block col-md-2">
        <AboutMenu />
      </div>
      <div class="d-none d-md-block col-md-1"></div>
      <div class="col-12 col-md-9 row about-layout__content">
        <slot></slot>
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
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.about-layout {
  margin-top: 34px;

  @include md {
    margin-top: 0px;
    padding: 8px 40px;
  }

  &__content {
    @include md {}
  }
}

.container-fluid {
  --bs-gutter-x: 0;
}
</style>
