<template>
  <div class="default-layout">
    <AppHeader />
    <main class="default-layout__main">
      <RouterView />
    </main>
    <AppFooter v-if="shouldShowFooter" />
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { resolveViewOptionByRoute } from "@/constants/viewModes";

import AppFooter from "../components/AppFooter.vue";
import AppHeader from "../components/AppHeader.vue";

const route = useRoute();

const shouldShowFooter = computed(() => {
  if (route.meta.showFooter === false) {
    return false;
  }

  if (route.name !== "explore") {
    return true;
  }

  return resolveViewOptionByRoute(route.params.viewMode).showFooter;
});
</script>

<style scoped>
.default-layout {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.default-layout__main {
  flex: 1 0 auto;
}

@media (min-width: 768px) {
  .default-layout__main {
    padding-top: 1rem;
  }
}
</style>
