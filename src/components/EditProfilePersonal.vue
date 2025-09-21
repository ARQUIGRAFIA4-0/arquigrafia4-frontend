<script setup>
import { ref } from 'vue';
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