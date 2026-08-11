<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "../../store/auth";
import { useProfilesStore } from "../../store/profiles";
import ProfileCard from "@/components/ProfileCard.vue";
import ProfileNav from "@/components/ProfileNav.vue";
import ProfileImages from "@/components/ProfileImages.vue";
import ProfileCollections from "@/components/ProfileCollections.vue";

/** Sidebar ao lado a partir de tablet. */
const SIDEBAR_LAYOUT_MIN = 768;
/** Card “mobile” só em telas realmente estreitas. */
const MOBILE_CARD_MAX = 768;

const authStore = useAuthStore();
const profilesStore = useProfilesStore();
const route = useRoute();

const showSidebar = ref(window.innerWidth >= SIDEBAR_LAYOUT_MIN);
const isMobile = ref(window.innerWidth < MOBILE_CARD_MAX);

const currentUserData = computed(() => authStore.loggedUser);
const currentUserAuthHeader = computed(() => authStore.authHeader);

const privateProfileData = ref(null);

const selectedTab = computed(() => {
  if (route.name === "my-profile-collections") {
    return "Coleções";
  }
  return "Imagens";
});

onMounted(async () => {
  privateProfileData.value = await profilesStore.getProfileById(
    currentUserAuthHeader.value,
    currentUserData.value.id
  );
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});

function handleResize() {
  showSidebar.value = window.innerWidth >= SIDEBAR_LAYOUT_MIN;
  isMobile.value = window.innerWidth < MOBILE_CARD_MAX;
}
</script>

<template>
  <div
    class="profile-container"
    :class="{ 'profile-container--desktop': showSidebar }"
  >
    <aside class="profile-container__sidebar">
      <ProfileCard
        :userData="currentUserData"
        :profileData="privateProfileData"
        :isMobile="isMobile"
        :isOwnProfile="true"
      />
    </aside>

    <!-- Gutter 1/12 só no desk ≥1440 (grid Figma 3 | 1 | 8) -->
    <div
      v-if="showSidebar"
      class="profile-container__gutter"
      aria-hidden="true"
    />

    <section class="profile-container__main">
      <div class="profile-container__content">
        <ProfileNav :selected="selectedTab" :isCurrentUser="true" />
        <ProfileCollections
          v-if="selectedTab === 'Coleções'"
          :isCurrentUser="true"
          :userData="currentUserData"
        />
        <ProfileImages
          v-if="selectedTab === 'Imagens'"
          :isCurrentUser="true"
          :userData="currentUserData"
        />
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
$breakpoint-laptop: 768px;
$breakpoint-wide: 1440px;

.profile-container {
  width: 100%;
  padding: 0 1rem;
  max-width: 1440px;
  margin: 0 auto;
  box-sizing: border-box;

  /* <1440: 2 colunas + gap (comportamento atual) */
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
    margin-bottom: 1rem;

    @media (min-width: #{$breakpoint-laptop}) {
      margin-bottom: 0;
      position: sticky;
      top: 1rem;
    }

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

    @media (min-width: #{$breakpoint-wide}) {
      grid-column: 3;
    }
  }

  &__content {
    min-width: 0;
    width: 100%;
  }
}
</style>
