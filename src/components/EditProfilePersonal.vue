<script setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from "@/store/auth";

const props = defineProps({
  profileData: {
    type: Object,
    default: null
  },
  userData: {
    type: Object,
    default: null
  }
});

const store = useAuthStore();
const router = useRouter();

const address = ref('');
const bio = ref('');
const gender = ref('');
const birthdate = ref('');
const race = ref('');
const profession = ref('');
const scholarity = ref('');
const lattes = ref('');
const orcid = ref('');

watch(() => props.profileData, (newValue) => {
  address.value = newValue?.data?.address || '';
  bio.value = newValue?.data?.bio || '';
  gender.value = newValue?.data?.gender || '';
  birthdate.value = newValue?.data?.birthdate || '';
  race.value = newValue?.data?.race || '';
  profession.value = newValue?.data?.profession || '';
  scholarity.value = newValue?.data?.scholarity || '';
  lattes.value = newValue?.data?.socials?.lattes || '';
  orcid.value = newValue?.data?.socials?.orcid || '';
}, { immediate: true });

function handleLogout() {
  store.logout();
  router.push('/');
}
</script>

<template>
  <button type="button" @click="handleLogout">Sair do perfil</button>
</template>

<style lang="scss" scoped>
@import "@/scss/variables";
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}
</style>