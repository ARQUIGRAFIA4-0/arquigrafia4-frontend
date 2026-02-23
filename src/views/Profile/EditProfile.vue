<script setup>
import { useAuthStore } from "@/store/auth";
import { useProfilesStore } from "../../store/profiles";
import { ref, computed, onMounted, onUnmounted } from "vue";
import ProfileCard from "@/components/ProfileCard.vue";
import EditProfileNav from '@/components/EditProfileNav.vue';
import EditProfileForm from "@/components/EditProfileForm.vue";

const authStore = useAuthStore();
const profilesStore = useProfilesStore();
const isMobile = ref(window.innerWidth < 768);
const userAuthHeader = computed(() => authStore.authHeader);

const userData = computed(() => authStore.loggedUser);
const privateProfileData = ref(null);

const selectedTab = ref("personalRef");
const editProfileFormRef = ref(null);

onMounted(async () => {
  privateProfileData.value = await profilesStore.getProfileById(userAuthHeader.value, userData.value.id);

  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

function handleResize() {
  isMobile.value = window.innerWidth < 768;
}

function handleNavSelect(refName) {
  selectedTab.value = refName;
  scrollToSection(refName);
}

function scrollToSection(refName) {
  if (!editProfileFormRef.value || !refName) return;
  const target = editProfileFormRef.value[refName];
  if (target?.$el || target) {
    (target?.$el || target).scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
</script>

<template>
  <div :class="['profile-container', isMobile ? '' : 'row']">
    <div class="col-12 col-md-3">
      <ProfileCard v-if="!isMobile" :userData="userData" :profileData="privateProfileData"
        :isMobile="isMobile" :isOwnProfile="true" />
    </div>
    <div class="d-none d-md-block col-md-1"></div>
    <div :class="['col-12 col-md-8', isMobile ? '' : 'row']">
      <div class="col-12 col-md-12 mt-md-0 mt-2">
        <EditProfileNav :selected="selectedTab" @select="handleNavSelect" />
      </div>
      <div class="col-12 col-md-8">
        <EditProfileForm v-if="privateProfileData" :userData="userData" :profileData="privateProfileData"
          ref="editProfileFormRef" />
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
    padding: 0 3rem;
  }

  &__content {
    @include md {
      padding: 32px 0;
    }
  }
}
</style>