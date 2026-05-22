<template>
  <div class="collective-card">
    <div class="collective-card__media">
      <img class="collective-card__image" :src="collectiveImageDefault" :alt="`foto de ${collective.name}`" />
    </div>
    <div class="collective-card__body">
      <h3 class="collective-card__name">{{ collective.name }}</h3>
      <div class="collective-card__location">
        <i class="bi bi-geo-alt"></i>
        <span>{{ collective.location ?? '-' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import collectiveImageDefault from '@/assets/perfil_coletivo.png';
defineProps({
  collective: {
    type: Object,
    required: true,
  },
});
</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-lg: 1024px;
$breakpoint-md: 768px;
$breakpoint-sm: 425px;
$breakpoint-xs: 320px;



.collective-card {
  max-height: 116px;
  width: 100%;
  box-sizing: border-box;
  background-color: var(--Off_white, #f8f8f8);
  border-radius: 0.625rem;
  box-shadow: 1px 1px 3px 2px rgba(0, 0, 0, 0.1);
  padding: 1rem 1.375rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.326rem;


  &__media {
    width: 46px;
    height: 46px;
  }

  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &__body {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.326rem;
  }

  &__name {
    font-size: 0.813rem;
    font-weight: 500;
    color: var(--Preto, #1a1a1a);
    margin: 0;
    width: 100%;
    max-width: 170px;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    @media (max-width: $breakpoint-sm) {
      width: 100%;
      max-width: 95px;
    }

    @media (max-width: $breakpoint-md) {
      width: 100%;
      max-width: 95px;
    }
  }

  &__location {
    color: var(--Cinza_M);
    font-size: 0.489rem;
    display: flex;
    justify-content: center;

    .bi {
      font-size: 0.489rem;
      color: var(--Cinza_M);
      margin-right: 0.326rem;
    }
  }

  @media (max-width: $breakpoint-sm) {
    height: 100%;
    max-height: none;
  }

  @media (min-width: $breakpoint-xs) {
    padding: 1rem 0;
  }
}
</style>