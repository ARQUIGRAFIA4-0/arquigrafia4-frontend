<template>
  <header
    class="d-flex flex-wrap justify-content-between align-items-center px-5 py-3 mb-3"
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
              <router-link class="dropdown-item" to="/eu"
                >Ver perfil</router-link
              >
            </li>
            <li>
              <router-link class="dropdown-item" to="/eu/editar"
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
        <li class="nav-item"><a href="/" class="nav-link">Explore</a></li>
        <li class="nav-item">
          <a href="/contribua" class="nav-link">Contribua</a>
        </li>
      </ul>
    </nav>
    <!-- Mobile Navigation -->
    <div class="dropdown d-sm-none col-12 order-2 mt-3">
      <button
        class="btn btn-secondary dropdown-toggle"
        type="button"
        data-bs-toggle="dropdown"
      >
        {{ activeLabel }} <i class="bi bi-chevron-down"></i>
      </button>
      <ul class="dropdown-menu">
        <li v-for="option in filteredOptions" :key="option.path">
          <router-link
            class="dropdown-item"
            :to="option.path"
            @click="dropdownOpen = false"
          >
            {{ option.label }}
          </router-link>
        </li>
      </ul>
    </div>
  </header>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth";

const route = useRoute();
const router = useRouter();
const store = useAuthStore(); // Initialize the store
const dropdownOpen = ref(false);
const isLoggedIn = computed(() => store.isLoggedIn);

const options = [
  { label: "Explore", path: "/" },
  { label: "Contribua", path: "/contribua" },
];

const activeLabel = computed(() => {
  const active = options.find((option) => option.path === route.path);
  return active ? active.label : "Explore";
});

const filteredOptions = computed(() => {
  return options.filter((option) => option.path !== route.path);
});

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value;
};

const handleLogout = async () => {
  await store.logout();
  router.push("/"); // Redirect to home page after logout
};

// return {
//   dropdownOpen,
//   activeLabel,
//   filteredOptions,
//   toggleDropdown,
//   handleLogout,
//   isLoggedIn
// };
</script>
