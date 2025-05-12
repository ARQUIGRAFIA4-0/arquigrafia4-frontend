<template>
  <header class="d-flex flex-wrap justify-content-between align-items-center px-5 py-3 mb-3">
    <div class="logo-column">
      <a href="/" class="logo">
        <img src="../assets/logo.svg" alt="Logo" class="logo" />
      </a>
    </div>
    <div class="icons-column order-sm-3">
      <span class="px-1"><i class="bi bi-person-fill"></i></span>
      <span class="px-1"><i class="bi bi-three-dots-vertical"></i></span>
    </div>
    <!-- Desktop Navigation -->
    <nav class="d-none d-sm-flex order-2 col-sm-auto">
      <ul class="nav">
        <li class="nav-item"><a href="/" class="nav-link">Explore</a></li>
        <li class="nav-item"><a href="/contribua" class="nav-link">Contribua</a></li>
      </ul>
    </nav>
    <!-- Mobile Navigation -->
    <div class="dropdown d-sm-none col-12 order-2 mt-3">
      <button class="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
        {{ activeLabel }} <i class="bi bi-chevron-down"></i>
      </button>
      <ul class="dropdown-menu">
        <li v-for="option in filteredOptions" :key="option.path">
          <router-link class="dropdown-item" :to="option.path" @click="dropdownOpen = false">
            {{ option.label }}
          </router-link>
        </li>
      </ul>
    </div>
  </header>
</template>

<script>
import { computed, ref } from "vue";
import { useRoute } from "vue-router";

export default {
  setup() {
    const route = useRoute();
    const dropdownOpen = ref(false);

    const options = [
      { label: "Explore", path: "/" },
      { label: "Contribua", path: "/contribua" },
      { label: "Participe", path: "/participe" },
    ];

    const activeLabel = computed(() => {
      const active = options.find(option => option.path === route.path);
      return active ? active.label : "Explore";
    });

    const filteredOptions = computed(() => {
      return options.filter(option => option.path !== route.path);
    });

    const toggleDropdown = () => {
      dropdownOpen.value = !dropdownOpen.value;
    };

    return { dropdownOpen, activeLabel, filteredOptions, toggleDropdown };
  }
};
</script>
