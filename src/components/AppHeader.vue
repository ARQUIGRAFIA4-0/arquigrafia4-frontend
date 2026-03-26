<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth";

const route = useRoute();
const router = useRouter();
const store = useAuthStore();
const isLoggedIn = computed(() => store.isLoggedIn);

const options = [
  { label: "Explore", path: "/explore", routeName: "explore" },
  { label: "Colabore", path: "/colabore", routeName: "colabore" },
];

const handleLogout = async () => {
  await store.logout();
  router.push("/");
};
</script>

<template>
  <header class="app-header">
    <div class="logo-column">
      <a href="/" class="logo">
        <img src="../assets/logo.svg" alt="Logo" class="logo" />
      </a>
    </div>
    <div class="d-flex icons-column order-sm-3 gap-3">
      <!-- Profile Dropdown -->
      <div class="dropdown">
        <span class="profile px-1" role="button" data-bs-toggle="dropdown" aria-expanded="false">
          <i class="bi bi-person-square" :style="{ color: isLoggedIn ? 'var(--Laranja_E)' : 'var(--Cinza_M)' }"></i>
        </span>
        <ul class="dropdown-menu dropdown-menu-end">
          <template v-if="isLoggedIn">
            <li>
              <router-link class="dropdown-item" to="/eu">Ver perfil</router-link>
            </li>
            <li>
              <router-link class="dropdown-item" to="/eu/editar">Editar perfil</router-link>
            </li>
            <li>
              <hr class="dropdown-divider" />
            </li>
            <li>
              <a class="dropdown-item" href="#" @click.prevent="handleLogout">Sair</a>
            </li>
          </template>
          <template v-else>
            <li>
              <router-link class="dropdown-item" to="/login">Entrar</router-link>
            </li>
          </template>
        </ul>
      </div>
      <!-- About Dropdown -->
      <div class="dropdown">
        <span class="about px-1" role="button" data-bs-toggle="dropdown" aria-expanded="false">
          <i class="bi bi-three-dots-vertical"></i>
        </span>
        <ul class="dropdown-menu dropdown-menu-end">
          <li>
            <router-link class="dropdown-item" to="/about/project">Sobre</router-link>
          </li>
          <li>
            <router-link class="dropdown-item" to="/about/members">Membros</router-link>
          </li>
          <li>
            <router-link class="dropdown-item" to="/about/policies">Políticas</router-link>
          </li>
          <li>
            <router-link class="dropdown-item" to="/about/faq">FAQ</router-link>
          </li>
          <li>
            <router-link class="dropdown-item" to="/about/vocabulary">Vocabulário</router-link>
          </li>
        </ul>
      </div>
    </div>
    <!-- Desktop Navigation -->
    <nav class="d-none d-sm-flex order-2 col-sm-auto">
      <ul class="nav">
        <li v-for="option in options" :key="option.path" class="nav-item">
          <router-link :to="option.path" class="nav-link">
            <span :class="route.path.startsWith(option.path)
              ? 'text-menu--selected'
              : 'text-menu--unselected'
              ">
              {{ option.label }}
            </span>
          </router-link>
        </li>
      </ul>
    </nav>
    <!-- Mobile Navigation -->
    <div class="mobile-nav d-sm-none col-12 order-2 mt-3">
      <div class="mobile-nav__options">
        <router-link v-for="option in options" :key="option.path" :to="option.path" class="mobile-nav__link" :class="route.path.startsWith(option.path)
          ? 'text-menu--selected'
          : 'text-menu--unselected'
          ">
          {{ option.label }}
        </router-link>
      </div>
    </div>
  </header>
</template>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.app-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;

  padding-top: 1rem;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
  padding-left: 1rem;
  padding-right: 1rem;

  @include md {
    padding-left: 50px;
    padding-right: 50px;
  }
}

.icons-column {
  position: relative;
  z-index: 10;
}

.mobile-nav {
  position: relative;
  padding-bottom: 15px;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: -1rem;
    right: -1rem;
    height: 1px;
    background-color: var(--Cinza_C);
    opacity: 0.5;
  }
}

.mobile-nav__options {
  display: flex;
  justify-content: flex-start;
  gap: 24px;
}

.mobile-nav__link {
  text-decoration: none;
}

.text-menu--selected {
  color: var(--Cinza_E);
  font-weight: 900;
  font-size: 18px;
  line-height: 100%;
  letter-spacing: -1.08px;
  text-align: center;
  vertical-align: middle;

  @include md {
    font-size: 24px;
  }
}

.text-menu--unselected {
  color: var(--Cinza_C);
  font-weight: 500;
  font-size: 18px;
  line-height: 100%;
  letter-spacing: -1.08px;
  text-align: center;
  vertical-align: middle;

  @include md {
    font-size: 24px;
  }
}
</style>
