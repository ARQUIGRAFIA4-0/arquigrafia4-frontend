<script setup>
import { useRoute } from "vue-router";
import { useAuthStore } from "@/store/auth";
import { ref, computed, onMounted } from "vue";

const route = useRoute();
const store = useAuthStore();
const user = computed(() => store.loggedUser);

const profileData = ref(null);

onMounted(async () => {
    if (route.path === "/eu") {
        profileData.value = await store.getProfileById(user.value.id);
    }
});
</script>

<template>
</template>

<style lang="scss" scoped></style>