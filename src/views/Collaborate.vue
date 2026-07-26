<script setup>
import { computed, watchEffect } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth";
import UploadImageBox from "@/components/UploadImageBox.vue";

defineOptions({ name: "CollaborateView" });

const router = useRouter();
const store = useAuthStore();
const isLoggedIn = computed(() => store.isLoggedIn);

// Redireciona para /login se o usuário não estiver logado
watchEffect(() => {
  if (!isLoggedIn.value) {
    router.push("/login");
  }
});
</script>

<template>
  <div v-if="isLoggedIn">
    <!-- Usuário logado -->
    <div class="upload-image-box">
      <UploadImageBox :show-upload-instructions="true"
        instructions-title="Colabore com o ARQUIGRAFIA<br />enviando suas imagens." />
    </div>
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
