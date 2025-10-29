<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "../../store/auth";
import { useProfilesStore } from "../../store/profiles";
import ProfileNav from "@/components/ProfileNav.vue";
import ProfileWorks from "@/components/ProfileWorks.vue";
import ProfileAlbums from "@/components/ProfileAlbums.vue";
import ProfileRoutes from "@/components/ProfileRoutes.vue";
import ProfileReviews from "@/components/ProfileReviews.vue";
import ProfileImages from "@/components/ProfileImages.vue";

const authStore = useAuthStore();
const profilesStore = useProfilesStore();

const currentUserData = ref(authStore.loggedUser);
const currentUserAuthHeader = computed(() => authStore.authHeader);

const publicProfileData = ref(null);
const privateProfileData = ref(null);

const userImages = ref([]);
const selectedTab = ref("Imagens");

onMounted(async () => {
  publicProfileData.value = await profilesStore.getPublicProfileById(currentUserData.value.id);
  privateProfileData.value = await profilesStore.getProfileById(currentUserAuthHeader.value, currentUserData.value.id);
});

</script>

<template>
  <div class="profile-container row">
    <div class="col-12 col-md-3"></div>
    <div class="d-none d-md-block col-md-1"></div>
    <div class="col-12 col-md-8">
      <div class="profile-container__content">
        <ProfileNav :selected="selectedTab" @select="selectedTab = $event" />
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