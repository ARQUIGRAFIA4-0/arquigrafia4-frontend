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
    padding: 0 3rem;
  }

  &__content {
    @include md {
      padding: 32px 0;
    }
  }
}
</style>