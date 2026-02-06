<template>
  <AboutLayout>
    <div class="col-12 col-md-8">
      <h1 class="about-members__title">Membros</h1>
    </div>
    <div class="col-12 col-md-8">
      <h2 class="about-members__subtitle"></h2>
      <p class="about-members__paragraph"></p>
    </div>
  </AboutLayout>
</template>

<script>
import AboutLayout from "./AboutLayout.vue";

export default {
  name: "AboutMembers",
  components: {
    AboutLayout,
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

.about-members {
  &__title {
    @include md {
      width: fit-content;
      font-weight: 600;
      font-size: 30px;
      line-height: 150%;
      letter-spacing: 0%;
      vertical-align: middle;
      margin-bottom: 55px;
      border-bottom: 4px solid #000000;
      padding-bottom: 20px;
    }
  }

  &__subtitle {
    @include md {
      font-weight: 500;
      font-size: 20px;
      line-height: 150%;
      letter-spacing: 0%;
      margin-bottom: 32px;
    }
  }

  &__paragraph {
    @include md {
      font-weight: 500;
      font-size: 16px;
      line-height: 150%;
      letter-spacing: 0%;
      padding: 0 48px;
    }
  }
}
</style>
