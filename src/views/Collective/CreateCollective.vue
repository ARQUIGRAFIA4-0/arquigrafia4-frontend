<template>
  <div class="container-fluid authentication-container">
    <div class="row my-2 justify-content-center gy-4">
      <!-- Form: full width até lg; em lg+ divide com o mosaico -->
      <div class="col-12 create-collective__form">
        <CollectiveCreateForm />
      </div>

      <!-- Gutter só acima de 1440px -->
      <div class="create-collective__gutter" aria-hidden="true"></div>

      <!-- Image Gallery -->
      <div class="col-12 create-collective__mosaic">
        <ViewMosaic />
      </div>
    </div>
  </div>
</template>

<script setup>
import ViewMosaic from "@/components/homepage/ViewMosaic.vue";
import CollectiveCreateForm from "@/components/CollectiveCreateForm.vue";
</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-lg: 992px;
$breakpoint-xl: 1200px;
$breakpoint-after-gutter: 1441px;

.authentication-container {
  padding: 8px 1rem;

  @media (min-width: #{$breakpoint-lg}) {
    padding: 8px 24px;
  }

  @media (min-width: #{$breakpoint-xl}) {
    padding: 8px 50px;
  }
}

.create-collective__gutter {
  display: none;
}

/* 992–1440: form + mosaico sem coluna vazia */
@media (min-width: #{$breakpoint-lg}) {
  .create-collective__form {
    flex: 0 0 auto;
    width: 41.66666667%; /* ~col-5 */
  }

  .create-collective__mosaic {
    flex: 0 0 auto;
    width: 58.33333333%; /* ~col-7 */
  }
}

@media (min-width: #{$breakpoint-xl}) {
  .create-collective__form {
    width: 33.33333333%; /* ~col-4 */
  }

  .create-collective__mosaic {
    width: 66.66666667%; /* ~col-8, absorve o antigo gutter */
  }
}

/* >1440: restaura o gutter (4 + 1 + 7) */
@media (min-width: #{$breakpoint-after-gutter}) {
  .create-collective__form {
    width: 33.33333333%;
  }

  .create-collective__gutter {
    display: block;
    flex: 0 0 auto;
    width: 8.33333333%;
  }

  .create-collective__mosaic {
    width: 58.33333333%;
  }
}
</style>
