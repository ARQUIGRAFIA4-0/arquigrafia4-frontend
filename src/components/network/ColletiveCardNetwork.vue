<template>
  <a class="collective-card" :href="`/coletivos/${collective.id}`">
    <div class="collective-card__media">
      <img
        class="collective-card__image"
        :src="collectiveImage"
        :alt="`foto de ${collective.name}`"
      />
    </div>
    <div class="collective-card__body">
      <h3 class="collective-card__name">{{ collective.name }}</h3>
      <div class="collective-card__location">
        <i class="bi bi-geo-alt"></i>
        <span>{{ collective.location ?? 'Não especificado' }}</span>
      </div>
    </div>
  </a>
</template>

<script setup>
import { computed } from 'vue';
import collectiveImageDefault from '@/assets/perfil_coletivo.png';

const API_BASE_URL = import.meta.env.VITE_BASE_REQUEST_URL;

const props = defineProps({
  collective: {
    type: Object,
    required: true,
  },
});

const collectiveImage = computed(() => {
  const url = props.collective.avatar_url || props.collective.image_url;
  return url ? `${API_BASE_URL}${url}` : collectiveImageDefault;
});
</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-sm: 425px;

.collective-card {
  width: 100%;
  box-sizing: border-box;
  background-color: var(--Off_white, #f8f8f8);
  border: 0.25px solid var(--Cinza_C, #c2c2c2);
  border-radius: 0.625rem;
  box-shadow: 1px 1px 3px 2px rgba(0, 0, 0, 0.1);
  padding: 1rem 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-decoration: none;
  transition: box-shadow 0.2s ease-in-out;

  &:hover {
    box-shadow: 2px 2px 6px 3px rgba(0, 0, 0, 0.25);
  }

  &__media {
    width: 46px;
    height: 46px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
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
    gap: 0.25rem;
    min-width: 0;
    width: 100%;
  }

  &__name {
    font-size: 0.813rem;
    font-weight: 500;
    color: var(--Preto, #1a1a1a);
    margin: 0;
    width: 100%;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__location {
    color: var(--Cinza_M, #a6a6a6);
    font-size: 0.625rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    max-width: 100%;

    span {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .bi {
      font-size: 0.625rem;
      color: var(--Cinza_M, #a6a6a6);
      flex-shrink: 0;
    }
  }
}
</style>
