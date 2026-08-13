<template>
  <a class="user-card" :href="`/perfil/${user.id}`">
    <div class="user-card__media">
      <img class="user-card__image" :src="userImage" :alt="`foto de ${user.name}`" />
    </div>
    <div class="user-card__body">
      <h3 class="user-card__name">{{ user.name }}</h3>
      <FitTags v-if="user.tags?.length" :subjects="user.tags" />
    </div>
  </a>
</template>

<script setup>
import { computed } from 'vue';
import FitTags from "@/views/Profile/FitTags.vue";
import networkImageDefault1 from '@/assets/networkImageDefault-1.png';
import networkImageDefault2 from '@/assets/networkImageDefault-2.png';
import networkImageDefault3 from '@/assets/networkImageDefault-3.png';
const API_BASE_URL = import.meta.env.VITE_BASE_REQUEST_URL;

const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
});

const defaultImages = [
  networkImageDefault1,
  networkImageDefault2,
  networkImageDefault3,
];

const randomDefaultImage =
  defaultImages[Math.floor(Math.random() * defaultImages.length)];

const userImage = computed(() => {
  return props.user.avatar_url
    ? `${API_BASE_URL}${props.user.avatar_url}`
    : randomDefaultImage;
});

</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-md: 768px;
$breakpoint-sm: 425px;

.user-card {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  background-color: var(--Off_white, #f8f8f8);
  border: 0.25px solid var(--Cinza_C, #c2c2c2);
  border-radius: 0.25rem;
  box-shadow: 1px 1px 3px 2px rgba(0, 0, 0, 0.1);
  text-decoration: none;
  transition: box-shadow 0.2s ease-in-out;
  overflow: hidden;
  display: block;

  &:hover {
    box-shadow: 2px 2px 6px 3px rgba(0, 0, 0, 0.25);
  }

  &__media {
    width: 100%;
    overflow: hidden;
    line-height: 0;
    background: #e8e8e8;
  }

  &__image {
    width: 100%;
    height: auto;
    aspect-ratio: 1 / 1;
    object-fit: cover;
    display: block;
  }

  &__body {
    padding: 0.75rem 0.5rem 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;

    @media (max-width: $breakpoint-md) {
      padding: 0.4rem;
      gap: 0.5rem;
    }
  }

  &__name {
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--Preto, #1a1a1a);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    @media (max-width: $breakpoint-sm) {
      font-size: 0.75rem;
    }
  }
}
</style>
