<script setup>
import { ref, computed, onMounted } from 'vue';
import { api } from '@/services/api';

const totalImages = ref(0);

const formattedTotal = computed(() => {
  return totalImages.value.toLocaleString('pt-BR');
});

onMounted(async () => {
  totalImages.value = await api.getTotalImages();
});
</script>

<template>
  <footer class="app-footer">
    <div class="app-footer__content">
      <!-- Logo -->
      <div class="app-footer__logo">
        <a href="/">
          <img src="../assets/logo_footer.png" alt="Arquigrafia" class="app-footer__logo-image" />
        </a>
      </div>

      <!-- Links -->
      <nav class="app-footer__links">
        <router-link to="/about/project" class="app-footer__link">
          o projeto
        </router-link>
        <span>•</span>
        <router-link to="/about/members" class="app-footer__link">
          membros
        </router-link>
        <span>•</span>
        <router-link to="/about/policies" class="app-footer__link">
          políticas
        </router-link>
        <span>•</span>
        <router-link to="/about/faq" class="app-footer__link">
          faq
        </router-link>
        <span>•</span>
        <router-link to="/about/vocabulary" class="app-footer__link">
          vocabulário
        </router-link>
      </nav>

      <!-- Texto -->
      <div class="app-footer__info">
        <p class="app-footer__text">O ARQUIGRAFIA conta com um total de {{ formattedTotal }} fotos.</p>
        <p class="app-footer__text">Este site possui uma licença <a href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank" rel="noopener noreferrer">Creative Commons Attribution 4.0</a></p>
      </div>
    </div>
  </footer>
</template>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
@use "@/scss/mixins" as *;

.app-footer {
  padding: 40px 32px 32px 32px;
  margin-top: 32px;
  border-top: 0.1px solid var(--Cinza_C);

  @include md {
    padding: 24px 50px;
    margin-top: 100px;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 12px;

    @include md {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      text-align: left;
    }
  }

  &__logo {
    &-image {
      height: 30px;
      width: auto;
    }
  }

  &__links {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;

    @include md {
      gap: 1rem;
      height: auto;
    }
  }

  &__link {
    font-weight: 700;
    font-style: Bold;
    font-size: 12px;
    line-height: 125%;
    letter-spacing: 0%;
    text-align: center;
    vertical-align: middle;
    text-decoration: none;
    font-size: 0.9rem;
    transition: color 0.2s ease;

    &:hover {
      color: var(--Laranja_E);
      text-decoration: underline;
    }

    @include md {
      font-weight: 700;
      font-size: 14px;
      line-height: 125%;
      letter-spacing: 0%;
      text-align: center;
      vertical-align: middle;
    }
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  &__text {
    font-weight: 400;
    font-size: 10px;
    color: var(--Cinza_E);
    line-height: 16px;
    letter-spacing: 0%;
    margin: 0;

    @include md {
      font-weight: 400;
      font-size: 12px;
      line-height: 115%;
      letter-spacing: 0%;
    }

    a {
      font-weight: 400;
      font-size: 12px;
      line-height: 115%;
      letter-spacing: 0%;
    }
  }
}
</style>
