<script setup>
import { ref } from "vue";
import ProfileCard from "@/components/ProfileCard.vue";
import ProfileNav from "../../components/ProfileNav.vue";
import ProfileWorks from "../../components/ProfileWorks.vue";
import ProfileAlbums from "../../components/ProfileAlbums.vue";
import ProfileRoutes from "../../components/ProfileRoutes.vue";
import ProfileReviews from "../../components/ProfileReviews.vue";
import ProfileImageGrid from "../../components/ProfileImages.vue";

const selectedTab = ref("Imagens");
</script>

<template>
  <div class="profile-container">
    <div class="col-12 col-md-4">
      <ProfileCard />
    </div>
    <div class="d-none d-md-block col-md-1"></div>
    <div class="col-12 col-md-7">
      <div class="profile-container__content">
        <ProfileNav :selected="selectedTab" @select="selectedTab = $event" />
        <ProfileImageGrid v-if="selectedTab === 'Imagens'" />
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