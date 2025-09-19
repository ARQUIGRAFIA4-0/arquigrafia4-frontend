<script setup>
const props = defineProps({
  profileData: {
    type: Object,
    default: null
  }
});
</script>

<template></template>

<style lang="scss" scoped>
@import "@/scss/variables";
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}
</style>