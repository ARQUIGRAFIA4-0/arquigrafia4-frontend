<template>
  <div class="lab-view">
    <!-- Grid View -->
    <template v-if="mode === 'grid'">
      <div class="lab-view__header d-none d-md-block">
        <h1 class="lab-view__title">ARQUIGRAFIA Lab</h1>
        <p class="lab-view__subtitle">
          Conheça os projetos desenvolvidos por pesquisadores da comunidade ARQUIGRAFIA.
        </p>
      </div>

      <div class="lab-view__grid row">
        <div v-for="item in labItems" :key="item.id" class="col-12 col-md-6 col-lg-4 mb-4">
          <LabCard
            :image="item.image"
            :title="item.cardTitle"
            :subtitle="item.subTitle"
            :authors="item.researchers"
            @click="selectProject(item)"
          />
        </div>
      </div>
    </template>

    <!-- Detail View -->
    <template v-else-if="mode === 'detail' && project">
      <LabProjectDetail
        :project="project"
        @back="backToGrid"
      />
    </template>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import LabCard from "@/components/LabCard.vue";
import LabProjectDetail from "@/components/LabProjectDetail.vue";
import { labProjects } from "@/data/labProjects.js";

const props = defineProps({
  mode: {
    type: String,
    required: true,
    validator: (value) => ["grid", "detail"].includes(value),
  },
  project: {
    type: Object,
    default: null,
  },
});

const router = useRouter();
const labItems = ref(labProjects);

function selectProject(project) {
  router.push(`/explore/lab/${project.slug}`);
}

function backToGrid() {
  // Tenta voltar no histórico
  if (window.history.length > 1) {
    router.back();
  } else {
    // Fallback para a lista do lab se não houver histórico
    router.push("/explore/lab");
  }
}
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
  @include md {
    margin-bottom: 80px;
  }

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
