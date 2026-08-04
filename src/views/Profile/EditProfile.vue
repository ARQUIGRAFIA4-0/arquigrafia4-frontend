<script setup>
import { useAuthStore } from "@/store/auth";
import { useProfilesStore } from "../../store/profiles";
import { ref, computed, onMounted, onUnmounted } from "vue";
import ProfileCard from "@/components/ProfileCard.vue";
import EditProfileNav from '@/components/EditProfileNav.vue';
import EditProfileForm from "@/components/EditProfileForm.vue";

/** Sidebar ao lado a partir de laptop (1024). */
const SIDEBAR_LAYOUT_MIN = 1024;

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
/* Sidebar ao lado: laptop e acima */
$breakpoint-laptop: 1024px;
/* Mais ar na faixa wide */
$breakpoint-wide: 1425px;

.profile-container {
  width: 100%;
  padding: 0 1rem;
  max-width: 1440px;
  margin: 0 auto;
  box-sizing: border-box;

  &--desktop {
    display: grid;
    /* Laptop 1024: card um pouco mais estreito + gap moderado */
    grid-template-columns: minmax(200px, 240px) minmax(0, 1fr);
    gap: 24px;
    padding: 0 1.5rem;
    align-items: start;
  }

  &__sidebar {
    min-width: 0;
    position: sticky;
    top: 1rem;
  }

  &__main {
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  &__nav {
    margin-top: 0.5rem;

    @media (min-width: #{$breakpoint-laptop}) {
      margin-top: 0;
    }
  }

  &__form {
    min-width: 0;
    max-width: 720px;
    width: 100%;
  }
}

@media (min-width: #{$breakpoint-wide}) {
  .profile-container--desktop {
    grid-template-columns: minmax(260px, 300px) minmax(0, 1fr);
    gap: 48px;
    padding: 0 3rem;
  }
}
</style>
