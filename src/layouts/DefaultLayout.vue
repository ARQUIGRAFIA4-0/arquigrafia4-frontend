<template>
  <AppHeader />
  <RouterView />
  <AppFooter v-if="shouldShowFooter" />
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { resolveViewOptionByRoute } from "@/constants/viewModes";

import AppFooter from "../components/AppFooter.vue";
import AppHeader from "../components/AppHeader.vue";

const route = useRoute();

const shouldShowFooter = computed(() => {
  if (route.name !== "explore") {
    return true;
  }

  return resolveViewOptionByRoute(route.params.viewMode).showFooter;
});
</script>
