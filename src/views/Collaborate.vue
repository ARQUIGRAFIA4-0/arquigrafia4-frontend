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
    <div class="upload-image-box">
      <UploadImageBox :show-upload-instructions="true"
        instructions-title="Colabore com o Arquigrafia<br />enviando suas imagens." />
    </div>
  </div>
  <div v-else>
    <!-- Visitante -->
    <AuthLogin />
  </div>
</template>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.upload-image-box {
  padding: 1.5rem 1rem;

  @include md {
    padding-left: 50px;
    padding-right: 50px;
  }
}
</style>
