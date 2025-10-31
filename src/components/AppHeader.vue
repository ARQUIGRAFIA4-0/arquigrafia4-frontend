<template>
  <header
    class="app-header d-flex flex-wrap justify-content-between align-items-center pt-3 pb-0 pb-sm-3 mb-3 px-3 px-md-4"
  >
    <div class="logo-column">
      <a href="/" class="logo">
        <img src="../assets/logo.svg" alt="Logo" class="logo" />
      </a>
    </div>
    <div class="icons-column order-sm-3 d-flex">
      <!-- Profile Dropdown -->
      <div class="dropdown">
        <span class="profile px-1" role="button" data-bs-toggle="dropdown">
          <i class="bi bi-person-fill"></i>
        </span>
        <ul class="dropdown-menu dropdown-menu-end">
          <template v-if="isLoggedIn">
            <li>
              <router-link class="dropdown-item" to="/profile"
                >Ver perfil</router-link
              >
            </li>
            <li>
              <router-link class="dropdown-item" to="/profile/edit"
                >Editar perfil</router-link
              >
            </li>
            <li><hr class="dropdown-divider" /></li>
            <li>
              <a class="dropdown-item" href="#" @click.prevent="handleLogout"
                >Sair</a
              >
            </li>
          </template>
          <template v-else>
            <li>
              <router-link class="dropdown-item" to="/login"
                >Entrar</router-link
              >
            </li>
          </template>
        </ul>
      </div>
      <!-- About Dropdown -->
      <div class="dropdown">
        <span class="about px-1" role="button" data-bs-toggle="dropdown">
          <i class="bi bi-three-dots-vertical"></i>
        </span>
        <ul class="dropdown-menu dropdown-menu-end">
          <li>
            <router-link class="dropdown-item" to="/about/project"
              >O projeto</router-link
            >
          </li>
          <li>
            <router-link class="dropdown-item" to="/about/events"
              >Eventos</router-link
            >
          </li>
          <li>
            <router-link class="dropdown-item" to="/about/wiki"
              >Wiki Arquigrafia</router-link
            >
          </li>
        </ul>
      </div>
    </div>
    <!-- Desktop Navigation -->
    <nav class="d-none d-sm-flex order-2 col-sm-auto">
      <ul class="nav">
        <li v-for="option in options" :key="option.path" class="nav-item">
          <router-link :to="option.path" class="nav-link">
            <span
              :class="
                route.path.startsWith(option.path)
                  ? 'text-menu--selected'
                  : 'text-menu--unselected'
              "
            >
              {{ option.label }}
            </span>
          </router-link>
        </li>
      </ul>
    </nav>
    <!-- Mobile Navigation -->
    <div class="mobile-nav d-sm-none col-12 order-2 mt-3">
      <div class="mobile-nav__options">
        <router-link
          v-for="option in options"
          :key="option.path"
          :to="option.path"
          class="mobile-nav__link"
          :class="
            route.path.startsWith(option.path)
              ? 'text-menu--selected'
              : 'text-menu--unselected'
          "
        >
          {{ option.label }}
        </router-link>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth";

const route = useRoute();
const router = useRouter();
const store = useAuthStore(); // Initialize the store
const isLoggedIn = computed(() => store.isLoggedIn);

const options = [
  { label: "Explore", path: "/explore", routeName: "explore" },
  { label: "Colabore", path: "/contribua", routeName: "contribua" },
];

const handleLogout = async () => {
  await store.logout();
  router.push("/"); // Redirect to home page after logout
};
</script>

<style scoped>
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
  font-size: 24px;
  font-weight: 900;
  line-height: 100%;
  letter-spacing: -1.08px;
}

.text-menu--unselected {
  color: var(--Cinza_C);
  font-size: 24px;
  font-weight: 900;
  line-height: 100%;
  letter-spacing: -1.08px;
}

@media (max-width: 575.98px) {
  .text-menu--selected,
  .text-menu--unselected {
    font-size: 18px;
  }
}
</style>
