<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "../../store/auth";
import { useProfilesStore } from "../../store/profiles";

const authStore = useAuthStore();
const profilesStore = useProfilesStore();

const currentUserData = ref(authStore.loggedUser);
const currentUserAuthHeader = computed(() => authStore.authHeader);

const publicProfileData = ref(null);
const privateProfileData = ref(null);

onMounted(async () => {
    publicProfileData.value = await profilesStore.getPublicProfileById(currentUserData.value.id);
    privateProfileData.value = await profilesStore.getProfileById(currentUserAuthHeader.value, currentUserData.value.id);
});

</script>
<template></template>