<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/store/auth";
import { useCollectivesStore } from "@/store/collectives";
import CollectiveCard from "@/components/CollectiveCard.vue";
import CollectiveNav from "@/components/CollectiveNav.vue";
import CollectiveImages from "@/components/CollectiveImages.vue";
import CollectiveCollections from "@/components/CollectiveCollections.vue";
import CollectiveMembers from "@/components/CollectiveMembers.vue";
import CollectiveRequests from "@/components/CollectiveRequests.vue";

const route = useRoute();
const authStore = useAuthStore();
const collectivesStore = useCollectivesStore();

const isMobile = ref(window.innerWidth < 768);
const collectiveData = ref(null);
const loadError = ref("");
const selectedTab = ref("Imagens");

const currentUser = computed(() => authStore.loggedUser);
const isLoggedIn = computed(() => authStore.isLoggedIn);

/**
 * Determina o papel do usuário atual no coletivo:
 * null = não membro | "member" | "admin"
 */
const userRole = computed(() => {
  if (!isLoggedIn.value || !currentUser.value || !collectiveData.value?.members) {
    return null;
  }
  const member = collectiveData.value.members.find((m) => m.id === currentUser.value.id);
  return member?.role ?? null;
});

onMounted(async () => {
  const result = await collectivesStore.getCollective(route.params.id);
  if (result.success) {
    collectiveData.value = result.data;
  } else {
    loadError.value = result.message;
  }

  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});

function handleResize() {
  isMobile.value = window.innerWidth < 768;
}

function handleMembersUpdated(newMembers) {
  if (collectiveData.value) {
    collectiveData.value = { ...collectiveData.value, members: newMembers };
  }
}

async function handleRequestApproved() {
  // Recarrega collectiveData para manter a lista de membros atualizada
  const result = await collectivesStore.getCollective(route.params.id);
  if (result.success) {
    collectiveData.value = result.data;
  }
}
</script>

<template>
  <div>
    <div v-if="loadError" class="alert alert-danger m-4" role="alert">
      {{ loadError }}
    </div>

    <div v-else :class="['collective-container', isMobile ? '' : 'row']">
      <!-- Card lateral esquerdo -->
      <div class="col-12 collective-container__sidebar">
        <CollectiveCard
          :collectiveData="collectiveData"
          :userRole="userRole"
          :isLoggedIn="isLoggedIn"
          :isMobile="isMobile"
        />
      </div>

      <!-- Gutter só acima de 1440px -->
      <div class="collective-container__gutter" aria-hidden="true"></div>

      <!-- Conteúdo principal (abas) -->
      <div class="col-12 collective-container__main">
        <div class="collective-container__content">
          <CollectiveNav :selected="selectedTab" :userRole="userRole" @select="selectedTab = $event" />
          <CollectiveImages
            v-if="selectedTab === 'Imagens'"
            :collectiveId="collectiveData?.id ?? null"
            :collectiveName="collectiveData?.name ?? null"
            :isMember="userRole !== null"
          />
          <CollectiveCollections
            v-else-if="selectedTab === 'Coleções'"
            :collectiveId="collectiveData?.id ? String(collectiveData.id) : null"
            :collectiveName="collectiveData?.name ?? null"
            :isMember="userRole !== null"
          />
          <CollectiveMembers
            v-else-if="selectedTab === 'Participantes'"
            :members="collectiveData?.members ?? null"
            :collectiveId="String(collectiveData?.id ?? '')"
            :userRole="userRole"
            :currentUserId="currentUser?.id"
            @update:members="handleMembersUpdated"
          />
          <CollectiveRequests
            v-else-if="selectedTab === 'Solicitações' && userRole === 'admin'"
            :collectiveId="String(collectiveData?.id ?? '')"
            @request-approved="handleRequestApproved"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$breakpoint-md: 768px;
$breakpoint-lg: 1024px;
$breakpoint-after-gutter: 1441px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.collective-container {
  width: 100%;
  padding: 0 1rem;
  box-sizing: border-box;

  @include md {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 0 1.25rem;
  }

  @media (min-width: #{$breakpoint-lg}) {
    gap: 24px;
    padding: 0 2rem;
  }

  @media (min-width: #{$breakpoint-after-gutter}) {
    gap: 0;
    padding: 0 48px;
  }

  &__gutter {
    display: none;
  }

  &__sidebar {
    min-width: 0;
  }

  &__main {
    min-width: 0;
  }

  &__content {
    width: 100%;
    min-width: 0;
  }
}

/*
 * Sidebar com largura fixa (como no perfil), para botões não ficarem
 * espremidos; o conteúdo principal ocupa o restante.
 * 768–1440: sem gutter.
 */
@media (min-width: #{$breakpoint-md}) {
  .collective-container__sidebar {
    flex: 0 0 240px;
    width: 240px;
    max-width: 240px;
  }

  .collective-container__main {
    flex: 1 1 0;
    width: auto;
  }
}

@media (min-width: #{$breakpoint-lg}) {
  .collective-container__sidebar {
    flex-basis: 260px;
    width: 260px;
    max-width: 260px;
  }
}

/* >1440: restaura proporção original com gutter (3 + 1 + 8) */
@media (min-width: #{$breakpoint-after-gutter}) {
  .collective-container__sidebar {
    flex: 0 0 auto;
    width: 25%;
    max-width: none;
  }

  .collective-container__gutter {
    display: block;
    flex: 0 0 auto;
    width: 8.33333333%;
  }

  .collective-container__main {
    flex: 0 0 auto;
    width: 66.66666667%;
  }
}
</style>
