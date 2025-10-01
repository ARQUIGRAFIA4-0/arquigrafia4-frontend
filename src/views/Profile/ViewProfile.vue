<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/store/auth";
import ProfileCard from "@/components/ProfileCard.vue";
import ProfileNav from "@/components/ProfileNav.vue";
import ProfileWorks from "@/components/ProfileWorks.vue";
import ProfileAlbums from "@/components/ProfileAlbums.vue";
import ProfileRoutes from "@/components/ProfileRoutes.vue";
import ProfileReviews from "@/components/ProfileReviews.vue";
import ProfileImages from "@/components/ProfileImages.vue";

const route = useRoute();
const store = useAuthStore();

const isCurrentUser = computed(() => ["/eu", "/eu/"].includes(route.path));
const currentUserData = computed(() => ({ user: store.loggedUser }));
const currentProfileData = ref(null);
const otherUserData = ref(null);
const otherProfileData = ref(null);
const selectedTab = ref("Imagens");

onMounted(async () => {
  if (["/eu", "/eu/"].includes(route.path)) {
    currentProfileData.value = await store.getProfileById(currentUserData.value.user.id);
  }
  else if (route.path.startsWith("/profile") && route.params.id) {
    otherUserData.value = await store.getUser(route.params.id);
    otherProfileData.value = await store.getProfileById(route.params.id);
  }
});
</script>

<template>
  <div class="profile-container row">
    <div class="col-12 col-md-3">
      <ProfileCard 
        :userData="isCurrentUser ? currentUserData : otherUserData"
        :profileData="isCurrentUser ? currentProfileData : otherProfileData" />
    </div>
    <div class="d-none d-md-block col-md-1"></div>
    <div class="col-12 col-md-8">
      <div class="profile-container__content">
        <ProfileNav :selected="selectedTab" @select="selectedTab = $event" />
        <ProfileImages v-if="selectedTab === 'Imagens'" />
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