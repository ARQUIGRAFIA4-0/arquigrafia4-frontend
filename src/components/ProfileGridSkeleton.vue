<script setup>
defineProps({
  count: { type: Number, default: 4 },
});
</script>

<template>
  <div class="row g-4" aria-busy="true" aria-live="polite">
    <div v-for="n in count" :key="`skeleton-${n}`" class="col-6 col-md-3">
      <article class="profile-grid-card profile-grid-card--skeleton" aria-hidden="true">
        <div class="profile-grid-card__image-wrapper profile-grid-card__image-wrapper--skeleton"></div>
        <div class="profile-grid-card__body">
          <div class="profile-grid-card__skeleton-line"></div>
          <div class="profile-grid-card__skeleton-line profile-grid-card__skeleton-line--short"></div>
        </div>
      </article>
    </div>
  </div>
</template>

<style lang="scss">
@use "@/scss/profile-grid-card.scss";
</style>
