<script setup>
import { computed } from "vue";
import { useAuthStore } from "@/store/auth";
import AuthLogin from "./Auth/AuthLogin.vue";
import UploadImageBox from "@/components/UploadImageBox.vue";

const store = useAuthStore();
const isLoggedIn = computed(() => store.isLoggedIn);
</script>

<template>
  <div v-if="isLoggedIn">
    <!-- Usuário logado -->
    <div class="container py-4">
      <UploadImageBox />
    </div>
  </div>
  <div v-else>
    <!-- Visitante -->
    <AuthLogin />
  </div>
</template>

<style scoped></style>
