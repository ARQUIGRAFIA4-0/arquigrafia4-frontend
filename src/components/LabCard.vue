<template>
  <div
    class="lab-card"
    role="button"
    tabindex="0"
    @click="$emit('click')"
    @keydown.enter="$emit('click')"
    @keydown.space.prevent="$emit('click')"
  >
    <div class="lab-card__image-wrapper">
      <img
        :src="image"
        :alt="title"
        class="lab-card__image"
        loading="lazy"
      />
    </div>
    
    <div class="lab-card__content">
      <h2 class="lab-card__title">{{ title }}</h2>
      <p class="lab-card__subtitle">{{ subtitle }}</p>
      
      <div class="lab-card__author">
        <img
          v-if="authors.length === 1"
          :src="authors[0].avatar"
          :alt="authors[0].name"
          class="lab-card__author-avatar"
        />
        <div v-else class="lab-card__author-placeholder">
          <i class="bi bi-people" aria-hidden="true"></i>
        </div>
        <span class="lab-card__author-name">Por {{ authors.map(a => a.name).join(', ') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  image: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    required: true,
  },
  authors: {
    type: Array,
    required: true,
  },
});

defineEmits(["click"]);
</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.lab-card {
  background: #ffffff;
  overflow: hidden;
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 4px;
  border: 0.25px solid var(--Cinza_C, #A6A6A6);
  box-shadow: 1px 1px 3px 2px rgba(0, 0, 0, 0.1);
  cursor: pointer;

  &:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
    transform: translateY(-4px);
  }

  &:focus {
    outline: 2px solid var(--Laranja_E, #aa4f28);
    outline-offset: 2px;
  }

  &__image-wrapper {
    position: relative;
    width: 100%;
    padding-top: 65%; // proporção da imagem
    overflow: hidden;
    background-color: var(--Cinza_C, #f5f5f5);
  }

  &__image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }

  &__content {
    padding: 16px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  &__title {
    font-weight: 500;
    font-size: 20px;
    line-height: 150%;
    letter-spacing: 0%;
    margin: 0 0 8px 0;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    text-overflow: ellipsis;
  }

  &__subtitle {
    font-weight: 400;
    font-size: 14px;
    line-height: 125%;
    letter-spacing: 0%;
    margin: 0 0 16px 0;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    text-overflow: ellipsis;
  }

  &__author {
    display: flex;
    gap: 16px;
    padding: 0 8px;
    align-items: center;
  }

  @include md {
    &__author {
      align-items: flex-start;
    }
  }

  &__author-avatar {
    width: 40px;
    height: 40px;
    border-radius: 4px;
    object-fit: cover;
    flex-shrink: 0;
  }

  &__author-placeholder {
    width: 40px;
    height: 40px;
    border-radius: 4px;
    flex-shrink: 0;
    background-color: var(--Laranja_E, #aa4f28);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;

    .bi {
      font-size: 1.2rem;
    }
  }

  &__author-name {
    font-weight: 400;
    font-size: 14px;
    line-height: 125%;
    letter-spacing: 0%;
  }
}
</style>
