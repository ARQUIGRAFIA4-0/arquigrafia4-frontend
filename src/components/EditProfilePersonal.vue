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

const addressPublic = ref();
const genderPublic = ref();
const birthdatePublic = ref();
const racePublic = ref();
const professionPublic = ref();
const scholarityPublic = ref();

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

  addressPublic.value = newValue?.data?.configurations?.address || true;
  genderPublic.value = newValue?.data?.configurations?.gender || true;
  birthdatePublic.value = newValue?.data?.configurations?.birthdate || true;
  racePublic.value = newValue?.data?.configurations?.race || true;
  professionPublic.value = newValue?.data?.configurations?.profession || true;
  scholarityPublic.value = newValue?.data?.configurations?.scholarity || true;
}, { immediate: true });

async function updatePersonalData() {
  try {
    const payload = {
      user_id: props.userData.id,
      ...props.profileData.data,
      address: address.value,
      bio: bio.value,
      gender: gender.value,
      birthdate: birthdate.value,
      race: race.value,
      profession: profession.value,
      scholarity: scholarity.value,
      socials: {
        ...props.profileData.data.socials,
        lattes: lattes.value,
        orcid: orcid.value,
      }
    };
    await store.updateProfile(props.profileData.data.id, payload);
    router.push('/eu');
  } catch (error) {
    console.error("Erro ao atualizar perfil.");
  }
}

function handleLogout() {
  store.logout();
  router.push('/');
}

function handleCancel() {
  router.push('/eu');
}
</script>

<template>
  <form @submit.prevent="updatePersonalData">
    <button type="button" @click="handleLogout">Sair do perfil</button>
    <button type="button" @click="handleCancel">Cancelar</button>
    <button type="submit">Salvar alterações</button>
  </form>
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