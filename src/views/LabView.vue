<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import ViewLab from "@/components/homepage/ViewLab.vue";
import { findProjectBySlug } from "@/data/labProjects.js";

const route = useRoute();
const router = useRouter();

const activeTab = computed(() => "lab");

const mode = computed(() => {
  return route.params.slug ? "detail" : "grid";
});

const currentProject = computed(() => {
  if (route.params.slug) {
    return findProjectBySlug(route.params.slug);
  }
  return null;
});

function navigateToCollection() {
  router.push("/explore/acervo/mosaic");
}

function navigateToLab() {
  if (route.name !== "lab-list") {
    router.push("/explore/lab");
  }
}
</script>

<template>
  <div class="lab-page">
    <div class="tabs-container">
      <ul class="nav nav-underline tabs-nav">
        <li class="nav-item">
          <button
            :class="['nav-link', { active: activeTab === 'acervo' }]"
            :aria-current="activeTab === 'acervo' ? 'page' : undefined"
            data-label="Acervo"
            @click="navigateToCollection"
          >
            Acervo
          </button>
        </li>
        <li class="nav-item">
          <button
            :class="['nav-link', { active: activeTab === 'lab' }]"
            :aria-current="activeTab === 'lab' ? 'page' : undefined"
            data-label="Lab"
            @click="navigateToLab"
          >
            Lab
          </button>
        </li>
      </ul>
    </div>

    <div class="container-lab">
      <ViewLab
        :mode="mode"
        :project="currentProject"
      />
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

.lab-page {
  min-height: 100vh;
}

.tabs-container {
  display: flex;
  justify-content: flex-start;
  padding-left: 1rem;
  padding-right: 1rem;

  @include md {
    padding-left: 50px;
    padding-right: 50px;
  }
}

.tabs-nav {
  max-width: 560px;
  margin-bottom: 4px;
}

.nav-underline {
  @include md {
    gap: 40px;
  }
}

.container-lab {
  padding-left: 1rem;
  padding-right: 1rem;
  padding-bottom: 2rem;

  @include md {
    margin-top: 40px;
    padding-left: 50px;
    padding-right: 50px;
  }
}
</style>
