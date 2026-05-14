<template>
  <div class="collective-card">
    <div class="collective-card__media">
      <img class="collective-card__image" :src="collectiveImageDefault" alt="foto do usuário" />
    </div>
    <div class="collective-card__body">
      <h3 class="collective-card__name">Lero Lero FAU</h3>
      <div class="collective-card__location">
        <i class="bi bi-geo-alt"></i>
        <span>São Paulo, SP</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import collectiveImageDefault from '@/assets/perfil_coletivo.png';
</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-md: 768px;
$breakpoint-sm: 425px;

.collective-card {
  max-width: 220px;
  // max-height: 337px;
  // min-height: 211px;
  height: 100%;
  width: 100%;
  background-color: var(--Off_white, #f8f8f8);
  border-radius: 0.625rem;
  // box-shadow: 0.65px 0.65px 2.61px 0.65px rgba(0, 0, 0, 0.1);
  box-shadow: 1px 1px 3px 2px rgba(0, 0, 0, 0.1);
  padding: 1rem 1.375rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.326rem;


  &__media {
    width: 46px;
    max-height: 46px;
    overflow: hidden;
  }

  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &__body {
    padding: 0.75rem 0.5rem 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;

    // @media (max-width: $breakpoint-sm) {
    //   padding: 0.5rem;
    //   gap: 0.5rem;
    // }
  }

  &__name {
    font-size: 0.813rem;
    font-weight: 500;
    color: var(--Preto, #1a1a1a);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    // @media (max-width: $breakpoint-sm) {
    //   font-size: 0.75rem;
    // }
  }

  &__location {
    color: var(--Cinza_M);
    font-size: 0.489rem;

    .bi {
      font-size: 0.489rem;
      color: var(--Cinza_M);
      margin-right: 0.326rem;
    }
  }

  @media (max-width: $breakpoint-sm) {
    max-width: 142px;
    height: 211px;
  }
}
</style>