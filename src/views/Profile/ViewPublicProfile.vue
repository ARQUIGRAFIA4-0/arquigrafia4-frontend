<script setup>
import { useRoute } from "vue-router";
import { ref, onMounted, onUnmounted } from "vue";
import { useUsersStore } from "../../store/users";
import { useProfilesStore } from "../../store/profiles";
import ProfileCard from "@/components/ProfileCard.vue";
import ProfileNav from "@/components/ProfileNav.vue";
import ProfileWorks from "@/components/ProfileWorks.vue";
import ProfileAlbums from "@/components/ProfileAlbums.vue";
import ProfileRoutes from "@/components/ProfileRoutes.vue";
import ProfileReviews from "@/components/ProfileReviews.vue";
import ProfileImages from "@/components/ProfileImages.vue";

const route = useRoute();
const usersStore = useUsersStore();
const profilesStore = useProfilesStore();
const isMobile = ref(window.innerWidth < 768);

const userData = ref(null);
const publicProfileData = ref(null);
const selectedTab = ref("Imagens");

onMounted(async () => {
  userData.value = await usersStore.getUser(route.params.id);
  publicProfileData.value = await profilesStore.getPublicProfileById(route.params.id);
  
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
            <ProfileCard :userData="userData" :publicProfileData="publicProfileData" :isMobile="isMobile" />
        </div>
        <div class="d-none d-md-block col-md-1"></div>
        <div class="col-12 col-md-8">
            <div class="profile-container__content">
                <ProfileNav :selected="selectedTab" @select="selectedTab = $event" :isCurrentUser="false" />
                <ProfileImages v-if="selectedTab === 'Imagens'" :isCurrentUser="false"
                    :userData="userData" />
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
    padding: 0 1rem;

    @include md {
        display: flex;
        padding: 0 48px;
    }
}
</style>