<template>
  <div class="lab-project-detail">
    <!-- Back Button -->
    <!-- <button
      type="button"
      class="btn btn-link p-0 d-inline-flex align-items-center text-decoration-none back-link"
      @click="$emit('back')"
    >
      <i class="bi bi-arrow-left-square back-link__icon"></i>
      <span class="back-link__label">Voltar</span>
    </button> -->

    <!-- Title -->
    <h1 class="lab-project-detail__title">{{ project.fullTitle }}</h1>

    <!-- Hero Image -->
    <div class="lab-project-detail__hero-image-wrapper">
      <img :src="project.image" :alt="project.title" class="lab-project-detail__hero-image" />
    </div>

    <!-- Mobile Action Menu -->
    <div class="d-md-none lab-project-detail__mobile-actions">
      <a
        v-for="link in project.links"
        :key="link.type"
        :href="link.url"
        class="mobile-action-button"
        :aria-label="link.label"
        target="_blank"
        rel="noopener noreferrer"
      >
        <i class="bi" :class="getIconClass(link.type)" aria-hidden="true"></i>
      </a>
    </div>

    <!-- Content Columns -->
    <div class="lab-project-detail__content row">
      <!-- Left Column: Description -->
      <div class="col-12 col-md-6 lab-project-detail__main">
        <h2 class="lab-project-detail__section-title">Sobre o projeto</h2>
        <div class="lab-project-detail__description" v-html="project.fullDescription"></div>
      </div>

      <!-- Right Column: Researcher + Actions -->
      <div class="col-12 col-md-6 lab-project-detail__sidebar">
        <div class="row">
          <!-- Researcher Info -->
          <div class="col-12 col-md-8 lab-project-detail__researcher">
            <h3 class="lab-project-detail__researcher-title">Pesquisador</h3>
            <div class="lab-project-detail__researcher-info">
              <img :src="project.researcher.avatar" :alt="project.researcher.name"
                class="lab-project-detail__researcher-avatar" />
              <div class="lab-project-detail__researcher-text">
                <p class="lab-project-detail__researcher-bio" v-html="project.researcher.bio"></p>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="d-none d-md-flex col-md-4 lab-project-detail__actions">
            <a v-for="link in project.links" :key="link.type" :href="link.url" :class="[
              'btn',
              'btn-sm',
              'd-flex',
              'align-items-center',
              'gap-2',
              link.type === 'project' ? 'btn-primary' : 'btn-outline-secondary'
            ]" target="_blank" rel="noopener noreferrer">
              <i class="bi" :class="getIconClass(link.type)"></i>
              {{ link.label }}
            </a>
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

function getIconClass(type) {
  const icons = {
    project: "bi-box-arrow-up-right",
    share: "bi-share",
    publications: "bi-book",
    manual: "bi-info-circle",
  };
  return icons[type] || "bi-link";
}
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
    font-size: 20px;
    line-height: 150%;
    letter-spacing: 0%;
    margin-bottom: 12px;

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
    padding-top: 66.67%; // 3:2 aspect ratio
    overflow: hidden;
    background-color: var(--Cinza_C, #f5f5f5);
    margin-bottom: 24px;
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
    margin-bottom: 24px;

    @include md {
      margin-bottom: 0;
    }
  }

  &__section-title {
    font-weight: 500;
    font-size: 16px;
    line-height: 150%;
    letter-spacing: 0%;
    margin-bottom: 8px;

    @include md {
      font-size: 20px;
      margin-bottom: 16px;
    }
  }

  &__description {
    font-weight: 400;
    font-size: 12px;
    line-height: 125%;
    letter-spacing: 0%;

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
    margin-bottom: 0;
  }

  &__researcher-title {
    font-weight: 500;
    font-size: 16px;
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

  &__researcher-bio {
    font-weight: 400;
    font-size: 12px;
    line-height: 125%;
    letter-spacing: 0%;

    @include md {
      font-size: 14px;
      line-height: 150%;
      color: var(--Cinza_E, #8c8c8c);
      margin: 0;
    }
  }

  &__mobile-actions {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border-radius: 6px;
    background-color: var(--Off_white);
    box-shadow: 2px 2px 5px 2px rgba(0, 0, 0, 0.25);
    backdrop-filter: blur(2px);
    width: 100%;
    box-sizing: border-box;
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }

  &__actions {
    flex-direction: column;
    gap: 0.5rem;

    i {
      font-size: 14px;
    }

    a {
      font-weight: 400;
      font-size: 14px;
      line-height: 150%;
      letter-spacing: 0%;
    }
  }
}

.mobile-action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--Cinza_E);
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
  text-decoration: none;

  &:hover {
    background-color: var(--Laranja_C);
    color: var(--Cinza_E);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.6);
  }

  .bi {
    font-size: 1.2rem;
  }
}
</style>
