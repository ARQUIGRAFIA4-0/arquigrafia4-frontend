<script setup>
import { useAuthStore } from "@/store/auth";
import { useProfilesStore } from "../../store/profiles";
import { ref, computed, onMounted } from "vue";

const authStore = useAuthStore();
const profilesStore = useProfilesStore();
const userAuthHeader = computed(() => authStore.authHeader);

const userData = computed(() => authStore.loggedUser);
const profileData = ref(null);

onMounted(async () => {
  profileData.value = await profilesStore.getProfileById(userAuthHeader.value, userData.value.id);
});
</script>
<template></template>
<style scoped></style>