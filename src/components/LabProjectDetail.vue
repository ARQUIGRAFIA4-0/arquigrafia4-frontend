<template>
  <div class="lab-project-detail">
    <!-- Back Button -->
    <button
      type="button"
      class="btn btn-link p-0 d-inline-flex align-items-center text-decoration-none back-link"
      @click="$emit('back')"
    >
      <i class="bi bi-arrow-left-square back-link__icon"></i>
      <span class="back-link__label">Voltar</span>
    </button>

    <!-- Title -->
    <h1 class="lab-project-detail__title">{{ project.fullTitle }}</h1>

    <!-- Hero Image -->
    <div class="lab-project-detail__hero-image-wrapper">
      <img
        :src="project.image"
        :alt="project.title"
        class="lab-project-detail__hero-image"
      />
    </div>
  </div>
</template>

<script setup>
defineProps({
  project: {
    type: Object,
    required: true,
  },
});

defineEmits(["back"]);
</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.back-link {
  color: var(--Preto, #1f1f1f);
  margin-bottom: 1.5rem;
  font-size: 14px;
  gap: 0.5rem;

  &:hover {
    color: var(--Laranja_E, #aa4f28);
  }

  .back-link__icon {
    color: var(--Cinza_M);
  }

  .back-link__label {
    color: var(--Preto);
    text-decoration: underline;
  }

  @include md {
    font-size: 16px;
    margin-bottom: 2rem;
  }
}

.lab-project-detail {
  &__title {
    font-weight: 500;
    font-size: 24px;
    line-height: 150%;
    letter-spacing: 0%;
    margin-bottom: 1.5rem;

    @include md {
      font-weight: 500;
      font-size: 30px;
      line-height: 150%;
      letter-spacing: 0%;
      margin-bottom: 16px;
    }
  }

  &__hero-image-wrapper {
    position: relative;
    width: 100%;
    padding-top: 42.86%; // 21:9 aspect ratio
    overflow: hidden;
    background-color: var(--Cinza_C, #f5f5f5);
    margin-bottom: 2rem;
    border-radius: 4px;

    @include md {
      margin-bottom: 50px;
    }
  }

  &__hero-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }
}
</style>
