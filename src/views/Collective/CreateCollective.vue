<template>
  <div class="container-fluid authentication-container">
    <div class="row my-2 justify-content-center">
      <!-- Form Column -->
      <div class="col-12 col-md-4">
        <CollectiveCreateForm />
      </div>

      <!-- Empty Column -->
      <div class="d-none d-md-block col-md-1"></div>

      <!-- Image Gallery Column -->
      <div class="col-12 col-md-7">
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
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.authentication-container {
  @include md {
    padding: 8px 50px;
  }
}
</style>
