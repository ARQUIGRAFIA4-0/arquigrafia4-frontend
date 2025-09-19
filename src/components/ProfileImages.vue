<script setup>
</script>

<template>
</template>

<style lang="scss" scoped>
@import "@/scss/variables";
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.item-card {
  &__image {
    border-radius: 8px 8px 0 0;
    width: 100%;
    height: 120px;
    background-color: #9c9c9c;
    cursor: pointer;
  }

  &__text {
    border: 1px solid #E0E0E0;
    border-top: 0;
    padding: 8px 12px;
    border-radius: 0 0 8px 8px;
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
    cursor: pointer;
  }
}
</style>