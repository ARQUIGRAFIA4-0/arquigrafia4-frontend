<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useAuthStore } from "../../store/auth";
import { useProfilesStore } from "../../store/profiles";
import ProfileCard from "@/components/ProfileCard.vue";
import ProfileNav from "@/components/ProfileNav.vue";
import ProfileWorks from "@/components/ProfileWorks.vue";
import ProfileAlbums from "@/components/ProfileAlbums.vue";
import ProfileRoutes from "@/components/ProfileRoutes.vue";
import ProfileReviews from "@/components/ProfileReviews.vue";
import ProfileImages from "@/components/ProfileImages.vue";

const authStore = useAuthStore();
const profilesStore = useProfilesStore();
const isMobile = ref(window.innerWidth < 768);

const currentUserData = computed(() => authStore.loggedUser);
const currentUserAuthHeader = computed(() => authStore.authHeader);

const publicProfileData = ref(null);
const privateProfileData = ref(null);

const userImages = ref([]);
const selectedTab = ref("Imagens");

onMounted(async () => {
  publicProfileData.value = await profilesStore.getPublicProfileById(currentUserData.value.id);
  privateProfileData.value = await profilesStore.getProfileById(currentUserAuthHeader.value, currentUserData.value.id);
  
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

function handleResize() {
  isMobile.value = window.innerWidth < 768;
}
</script>

<template>
  <div :class="['profile-container', isMobile ? '' : 'row']">
    <div class="col-12 col-md-3">
      <ProfileCard :userData="currentUserData" :publicProfileData="publicProfileData"
        :privateProfileData="privateProfileData" :isMobile="isMobile" />
    </div>
    <div class="d-none d-md-block col-md-1"></div>
    <div class="col-12 col-md-8">
      <div class="profile-container__content">
        <ProfileNav :selected="selectedTab" @select="selectedTab = $event" :isCurrentUser="true" />
        <ProfileImages v-if="selectedTab === 'Imagens'" :userImages="userImages" :isCurrentUser="true" />
        <ProfileAlbums v-if="selectedTab === 'Álbuns'" />
        <ProfileRoutes v-if="selectedTab === 'Percursos'" />
        <ProfileWorks v-if="selectedTab === 'Obras'" />
        <ProfileReviews v-if="selectedTab === 'Avaliações'" />
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

.profile-container {
  width: 100%;
  padding: 0 32px;

  @include md {
    display: flex;
    padding: 0 48px;
  }
}
</style>