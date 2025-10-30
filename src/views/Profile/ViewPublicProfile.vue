<script setup>
import { useRoute } from "vue-router";
import { ref, onMounted, onUnmounted } from "vue";
import { useUsersStore } from "../../store/users";
import { useProfilesStore } from "../../store/profiles";

const route = useRoute();
const usersStore = useUsersStore();
const profilesStore = useProfilesStore();
const isMobile = ref(window.innerWidth < 768);

const userData = ref(null);
const publicProfileData = ref(null);

onMounted(() => {
    window.addEventListener('resize', () => {
        isMobile.value = window.innerWidth < 768;
    });
});

onMounted(async () => {
    userData.value = await usersStore.getUser(route.params.id);
    publicProfileData.value = await profilesStore.getPublicProfileById(route.params.id);
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
});

</script>

<template>
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