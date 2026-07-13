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
      <div class="col-12 col-md-3">
        <CollectiveCard
          :collectiveData="collectiveData"
          :userRole="userRole"
          :isLoggedIn="isLoggedIn"
          :isMobile="isMobile"
        />
      </div>

      <div class="d-none d-md-block col-md-1"></div>

      <!-- Conteúdo principal (abas) -->
      <div class="col-12 col-md-8">
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
    padding: 0 48px;
  }

  &__content {
    width: 100%;
  }
}
</style>
