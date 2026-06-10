<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth";
import { useCollectivesStore } from "@/store/collectives";
import { useVracStore } from "@/store/vrac";
import CollectiveCard from "@/components/CollectiveCard.vue";
import CollectiveEditForm from "@/components/CollectiveEditForm.vue";
import CollectiveEditNav from "@/components/CollectiveEditNav.vue";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const collectivesStore = useCollectivesStore();
const vracStore = useVracStore();

const isMobile = ref(window.innerWidth < 768);
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
  isMobile.value = window.innerWidth < 768;
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
  <div :class="['collective-container', isMobile ? '' : 'row']">
    <!-- Card lateral esquerdo (apenas desktop) -->
    <div class="col-12 col-md-3">
      <CollectiveCard
        v-if="!isMobile"
        :collectiveData="collectiveData"
        :userRole="userRole"
        :isLoggedIn="isLoggedIn"
        :isMobile="isMobile"
      />
    </div>

    <div class="d-none d-md-block col-md-1"></div>

    <!-- Formulário de edição -->
    <div :class="['col-12 col-md-8', isMobile ? '' : 'row']">
      <div class="col-12 col-md-8">
        <CollectiveEditNav
          v-if="collectiveData"
          :selected="selectedTab"
          @select="handleNavSelect"
        />
        <div v-if="loadError" class="alert alert-danger mt-3" role="alert">
          {{ loadError }}
        </div>
        <CollectiveEditForm
          v-else-if="collectiveData"
          :collectiveData="collectiveData"
          ref="collectiveEditFormRef"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.collective-container {
  width: 100%;
  padding: 0 1rem;

  @include md {
    display: flex;
    padding: 0 3rem;
  }
}
</style>
