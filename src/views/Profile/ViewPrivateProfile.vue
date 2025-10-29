<script setup>
import { ref, computed } from "vue";
import { useAuthStore } from "../../store/auth";
import { useProfilesStore } from "../../store/profiles";

const authStore = useAuthStore();
const profilesStore = useProfilesStore();

const currentUserData = ref(authStore.loggedUser);
const currentUserAuthHeader = computed(() => authStore.authHeader);

</script>
<template></template>