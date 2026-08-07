<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth";
import { useCollectivesStore } from "@/store/collectives";
import { useVracStore } from "@/store/vrac";
import CollectiveCard from "@/components/CollectiveCard.vue";
import CollectiveEditForm from "@/components/CollectiveEditForm.vue";
import CollectiveEditNav from "@/components/CollectiveEditNav.vue";

/** Layout tipo desktop do Figma (sidebar + gutter + form) a partir de 768. */
const SIDEBAR_LAYOUT_MIN = 768;

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const collectivesStore = useCollectivesStore();
const vracStore = useVracStore();

const isMobile = ref(window.innerWidth < SIDEBAR_LAYOUT_MIN);
const collectiveData = ref(null);
const loadError = ref("");

const currentUser = computed(() => authStore.loggedUser);
const isLoggedIn = computed(() => authStore.isLoggedIn);

const userRole = computed(() => {
  if (!isLoggedIn.value || !currentUser.value || !collectiveData.value?.members) {
    return null;
  }
  const member = collectiveData.value.members.find((m) => m.id === currentUser.value.id);
  return member?.role ?? null;
});

onMounted(async () => {
  // Inicia o carregamento dos temas imediatamente (sem bloquear) para aquecer o
  // cache em paralelo. O formulário aguarda apenas o getCollective — os temas
  // carregam de forma concorrente, então o onMounted do formulário encontrará o
  // cache pronto (ou se juntará à Promise em andamento via deduplicação).
  vracStore.getVRACSubjects().catch(() => {});

  const result = await collectivesStore.getCollective(route.params.id);
  if (result.success) {
    collectiveData.value = result.data;

    // Redirecionar se o usuário não for admin
    const member = result.data.members?.find((m) => m.id === currentUser.value?.id);
    if (!member || member.role !== "admin") {
      router.replace({ name: "collective-detail", params: { id: route.params.id } });
      return;
    }
  } else {
    loadError.value = result.message || "Não foi possível carregar o coletivo.";
  }

  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});

function handleResize() {
  isMobile.value = window.innerWidth < SIDEBAR_LAYOUT_MIN;
}

const selectedTab = ref("collectiveDataRef");
const collectiveEditFormRef = ref(null);

function handleNavSelect(refName) {
  selectedTab.value = refName;
  scrollToSection(refName);
}

function scrollToSection(refName) {
  if (!collectiveEditFormRef.value || !refName) return;
  const target = collectiveEditFormRef.value[refName];
  if (target?.$el || target) {
    (target?.$el || target).scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
</script>

<template>
  <div
    class="collective-edit"
    :class="{ 'collective-edit--desktop': !isMobile }"
  >
    <aside v-if="!isMobile" class="collective-edit__sidebar">
      <CollectiveCard
        :collectiveData="collectiveData"
        :userRole="userRole"
        :isLoggedIn="isLoggedIn"
        :isMobile="isMobile"
      />
    </aside>

    <!-- Gutter 1/12 só no desk ≥1440 (grid Figma 3 | 1 | 8) -->
    <div
      v-if="!isMobile"
      class="collective-edit__gutter"
      aria-hidden="true"
    />

    <section class="collective-edit__main">
      <div class="collective-edit__nav">
        <CollectiveEditNav
          v-if="collectiveData"
          :selected="selectedTab"
          @select="handleNavSelect"
        />
      </div>
      <div class="collective-edit__form">
        <div v-if="loadError" class="alert alert-danger" role="alert">
          {{ loadError }}
        </div>
        <CollectiveEditForm
          v-else-if="collectiveData"
          :collectiveData="collectiveData"
          ref="collectiveEditFormRef"
        />
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
$breakpoint-laptop: 768px;
$breakpoint-wide: 1440px;

.collective-edit {
  width: 100%;
  padding: 0 1rem;
  max-width: 1440px;
  margin: 0 auto;
  box-sizing: border-box;

  /* <1440: 2 colunas + gap */
  &--desktop {
    display: grid;
    grid-template-columns: minmax(200px, 240px) minmax(0, 1fr);
    gap: 20px;
    padding: 0 1.25rem;
    align-items: start;

    @media (min-width: 1024px) {
      grid-template-columns: minmax(240px, 280px) minmax(0, 1fr);
      gap: 32px;
      padding: 0 2rem;
    }

    @media (min-width: 1280px) {
      grid-template-columns: minmax(260px, 300px) minmax(0, 1fr);
      gap: 48px;
      padding: 0 48px;
    }

    /* ≥1440: grid Figma 12 cols — 3 | 1 | 8 */
    @media (min-width: #{$breakpoint-wide}) {
      grid-template-columns: minmax(0, 3fr) minmax(0, 1fr) minmax(0, 8fr);
      gap: 0;
      padding: 0 48px;
    }
  }

  &__sidebar {
    min-width: 0;
    position: sticky;
    top: 1rem;

    @media (min-width: #{$breakpoint-wide}) {
      grid-column: 1;
    }
  }

  &__gutter {
    display: none;
    min-width: 0;

    @media (min-width: #{$breakpoint-wide}) {
      display: block;
      grid-column: 2;
    }
  }

  &__main {
    min-width: 0;
    display: flex;
    flex-direction: column;

    @media (min-width: #{$breakpoint-wide}) {
      grid-column: 3;
    }
  }

  &__nav {
    margin-top: 0.5rem;

    @media (min-width: #{$breakpoint-laptop}) {
      margin-top: 0;
    }
  }

  &__form {
    min-width: 0;
    width: 100%;
    max-width: none;
  }
}
</style>
