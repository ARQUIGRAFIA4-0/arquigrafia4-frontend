<script setup>
import { useAuthStore } from "@/store/auth";
import { useProfilesStore } from "../../store/profiles";
import { ref, computed, onMounted, onUnmounted } from "vue";
import ProfileCard from "@/components/ProfileCard.vue";
import EditProfileNav from '@/components/EditProfileNav.vue';
import EditProfileForm from "@/components/EditProfileForm.vue";

/** Layout tipo desktop do Figma (sidebar + gutter + form) a partir de 768. */
const SIDEBAR_LAYOUT_MIN = 768;

const authStore = useAuthStore();
const profilesStore = useProfilesStore();
const isMobile = ref(window.innerWidth < SIDEBAR_LAYOUT_MIN);
const userAuthHeader = computed(() => authStore.authHeader);

const userData = computed(() => authStore.loggedUser);
const privateProfileData = ref(null);

const selectedTab = ref("personalRef");
const editProfileFormRef = ref(null);

onMounted(async () => {
  privateProfileData.value = await profilesStore.getProfileById(userAuthHeader.value, userData.value.id);

  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

function handleResize() {
  isMobile.value = window.innerWidth < SIDEBAR_LAYOUT_MIN;
}

function handleNavSelect(refName) {
  selectedTab.value = refName;
  scrollToSection(refName);
}

function scrollToSection(refName) {
  if (!editProfileFormRef.value || !refName) return;
  const target = editProfileFormRef.value[refName];
  if (target?.$el || target) {
    (target?.$el || target).scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
</script>

<template>
  <div
    class="profile-container"
    :class="{ 'profile-container--desktop': !isMobile }"
  >
    <aside v-if="!isMobile" class="profile-container__sidebar">
      <ProfileCard
        :userData="userData"
        :profileData="privateProfileData"
        :isMobile="isMobile"
        :isOwnProfile="true"
      />
    </aside>

    <!-- Gutter 1/12 só no desk ≥1440 (grid Figma 3 | 1 | 8) -->
    <div
      v-if="!isMobile"
      class="profile-container__gutter"
      aria-hidden="true"
    />

    <section class="profile-container__main">
      <div class="profile-container__nav">
        <EditProfileNav :selected="selectedTab" @select="handleNavSelect" />
      </div>
      <div class="profile-container__form">
        <EditProfileForm
          v-if="privateProfileData"
          :userData="userData"
          :profileData="privateProfileData"
          ref="editProfileFormRef"
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
