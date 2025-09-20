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
const user = computed(() => store.loggedUser);

const profileData = ref(null);
const selectedTab = ref("Imagens");

onMounted(async () => {
  if (["/eu", "/eu/"].includes(route.path)) {
    profileData.value = await store.getProfileById(user.value.id);
  }
});
</script>

<template>
  <div class="profile-container">
    <div class="col-12 col-md-4">
      <ProfileCard :profileData="profileData" :user="user" />
    </div>
    <div class="d-none d-md-block col-md-1"></div>
    <div class="col-12 col-md-7">
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

  &__content {
    @include md {
      padding: 32px 0;
    }
  }
}
</style>