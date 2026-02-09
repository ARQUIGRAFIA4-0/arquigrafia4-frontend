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

    <!-- Content Columns -->
    <div class="lab-project-detail__content row">
      <!-- Left Column: Description -->
      <div class="col-12 col-md-6 lab-project-detail__main">
        <h2 class="lab-project-detail__section-title">Sobre o projeto</h2>
        <div
          class="lab-project-detail__description"
          v-html="project.fullDescription"
        ></div>
      </div>

      <!-- Right Column: Researcher + Actions -->
      <div class="col-12 col-md-6 lab-project-detail__sidebar">
        <div class="row">
          <!-- Researcher Info -->
          <div class="col-12 col-md-8 lab-project-detail__researcher">
            <h3 class="lab-project-detail__researcher-title">Pesquisador</h3>
            <div class="lab-project-detail__researcher-info">
              <img
                :src="project.researcher.avatar"
                :alt="project.researcher.name"
                class="lab-project-detail__researcher-avatar"
              />
              <div class="lab-project-detail__researcher-text">
                <p class="lab-project-detail__researcher-name">
                  {{ project.researcher.name }}
                </p>
                <p class="lab-project-detail__researcher-bio">
                  {{ project.researcher.bio }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
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

  &__main {
    margin-bottom: 2rem;

    @include md {
      margin-bottom: 0;
    }
  }

  &__section-title {
    font-weight: 500;
    font-size: 20px;
    line-height: 150%;
    letter-spacing: 0%;
    margin-bottom: 1rem;
    color: var(--Preto, #1f1f1f);

    @include md {
      font-size: 20px;
      margin-bottom: 16px;
    }
  }

  &__description {
    font-weight: 400;
    font-size: 14px;
    line-height: 150%;
    letter-spacing: 0%;
    color: var(--Preto, #1f1f1f);

    :deep(p) {
      margin-bottom: 1rem;

      &:last-child {
        margin-bottom: 0;
      }
    }

    @include md {
      font-size: 14px;
      padding-right: 32px;
    }
  }

  &__researcher {
    margin-bottom: 2rem;

    @include md {
      margin-bottom: 0;
    }
  }

  &__researcher-title {
    font-weight: 500;
    font-size: 18px;
    line-height: 150%;
    letter-spacing: 0%;
    margin-bottom: 1rem;
    color: var(--Preto, #1f1f1f);

    @include md {
      font-size: 20px;
    }
  }

  &__researcher-info {
    display: flex;
    gap: 1rem;
  }

  &__researcher-avatar {
    width: 64px;
    height: 64px;
    border-radius: 4px;
    object-fit: cover;
    flex-shrink: 0;
  }

  &__researcher-text {
    flex: 1;
  }

  &__researcher-name {
    font-weight: 500;
    font-size: 16px;
    line-height: 125%;
    letter-spacing: 0%;
    margin-bottom: 0.5rem;
    color: var(--Preto, #1f1f1f);
  }

  &__researcher-bio {
    font-weight: 400;
    font-size: 14px;
    line-height: 150%;
    letter-spacing: 0%;
    color: var(--Cinza_E, #8c8c8c);
    margin: 0;
  }
}
</style>
