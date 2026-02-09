<template>
  <div class="lab-view">
    <div class="lab-view__header">
      <h1 class="lab-view__title">ARQUIGRAFIA Lab</h1>
      <p class="lab-view__subtitle">
        Conheça os projetos desenvolvidos por pesquisadores da comunidade ARQUIGRAFIA.
      </p>
    </div>

    <div class="lab-view__grid row">
      <div v-for="item in labItems" :key="item.id" class="col-12 col-md-6 col-lg-4 mb-4">
        <lab-card :image="item.image" :title="item.title" :subtitle="item.subtitle" :author="item.author" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import LabCard from "@/components/LabCard.vue";

const labItems = ref([]);
</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.lab-view {
  &__header {
    margin-bottom: 2rem;

    @include md {
      margin-bottom: 36px;
    }
  }

  &__title {
    font-weight: 500;
    font-size: 24px;
    line-height: 150%;
    letter-spacing: 0%;
    margin-bottom: 8px;

    @include md {
      font-weight: 500;
      font-size: 30px;
      line-height: 150%;
      letter-spacing: 0%;
    }
  }

  &__subtitle {
    font-weight: 500;
    font-size: 14px;
    line-height: 150%;
    letter-spacing: 0%;

    @include md {
      font-weight: 500;
      font-size: 16px;
    }
  }
}
</style>
