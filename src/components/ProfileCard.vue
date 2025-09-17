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
    <div class="profile-card">
        <div class="profile-card__header">
            <div class="profile-card__image"></div>
            <div class="profile-card__title">
                <h2>{{ user.name }}</h2>
                <div class="profile-card__address">
                    <i class="bi bi-geo-alt"></i>
                    <p>{{ profileData?.data.address || "Não informado" }}</p>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>

</style>