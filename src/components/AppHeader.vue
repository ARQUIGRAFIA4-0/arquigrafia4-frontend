<script setup>
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth";
import { resolveAvatarUrl } from "@/helpers/avatarUrl";
import AppMenuOverlay from "./AppMenuOverlay.vue";

const route = useRoute();
const router = useRouter();
const store = useAuthStore();
const isLoggedIn = computed(() => store.isLoggedIn);
const avatarUrl = computed(() => resolveAvatarUrl(store.loggedUser));

const options = [
  { label: "Explore", path: "/explore", routeName: "explore" },
  { label: "Colabore", path: "/colabore", routeName: "colabore" },
];

// Qual menu em tela cheia está aberto no momento: "profile" | "about" | null.
// Substitui os antigos dropdowns do Bootstrap pelo AppMenuOverlay.
const activeMenu = ref(null);
const isProfileMenuOpen = computed(() => activeMenu.value === "profile");
const isAboutMenuOpen = computed(() => activeMenu.value === "about");

function toggleMenu(menu) {
  activeMenu.value = activeMenu.value === menu ? null : menu;
}

function closeMenu() {
  activeMenu.value = null;
}

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
      <!-- Abre o menu de perfil em tela cheia -->
      <span
        class="profile px-1"
        role="button"
        aria-haspopup="dialog"
        :aria-expanded="isProfileMenuOpen"
        @click="toggleMenu('profile')"
      >
        <img v-if="avatarUrl" :src="avatarUrl" alt="Foto de perfil" />
        <i v-else class="bi bi-person-square"
          :style="{ color: isLoggedIn ? 'var(--Laranja_E)' : 'var(--Cinza_M)' }"></i>
      </span>
      <!-- Abre o menu institucional (Sobre) em tela cheia -->
      <span
        class="about px-1"
        role="button"
        aria-haspopup="dialog"
        :aria-expanded="isAboutMenuOpen"
        @click="toggleMenu('about')"
      >
        <i class="bi bi-three-dots-vertical"></i>
      </span>
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

  <!-- Menu em tela cheia (perfil ou institucional, conforme o ícone clicado).
       Fica fora do <header> propositalmente: o próprio componente usa
       Teleport to="body", então mantê-lo aqui fora só evita que ele
       participe do flex-wrap do cabeçalho. -->
  <AppMenuOverlay
    :show="activeMenu !== null"
    :mode="activeMenu || 'about'"
    :is-logged-in="isLoggedIn"
    :avatar-url="avatarUrl"
    @update:show="closeMenu"
    @logout="handleLogout"
  />
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

  // Precisa de position + z-index em qualquer breakpoint (não só a partir
  // do md) para que o header sempre pinte por cima do AppMenuOverlay
  // (z-index: 1029) — é o que faz o header "sobreviver" visualmente ao
  // menu em tela cheia no mobile, como nos mockups de design.
  position: relative;
  z-index: 1030;
  background-color: var(--Branco, #ffffff);

  @include md {
    position: sticky;
    top: 0;
    margin-bottom: 0;
    padding-left: 50px;
    padding-right: 50px;
  }
}

.profile img {
  width: 20px;
  height: 20px;
  border-radius: 2px;
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