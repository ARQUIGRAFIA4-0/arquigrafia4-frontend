<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import UiField from './ui/UiField.vue';
import { useAuthStore } from "@/store/auth";
import { useUsersStore } from '../store/users';
import { useSubjectsStore } from "@/store/subjects";
import { useProfilesStore } from '../store/profiles';

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

const router = useRouter();
const authStore = useAuthStore();
const usersStore = useUsersStore();
const profilesStore = useProfilesStore();
const subjectsStore = useSubjectsStore();
const userAuthHeader = computed(() => authStore.authHeader);
const today = new Date().toISOString().slice(0, 10);

const name = ref("");
const address = ref("");
const bio = ref("");
const gender = ref("");
const birthdate = ref("");
const race = ref("");
const profession = ref("");
const scholarity = ref("");
const socials = ref({
  lattes: "",
  orcid: "",
  linkedin: "",
  facebook: "",
  instagram: ""
});

const addressPublic = ref();
const genderPublic = ref();
const birthdatePublic = ref();
const racePublic = ref();
const professionPublic = ref();
const scholarityPublic = ref();

const selectedSocialOption = ref("");
const selectedSocialValue = ref("");

const scholarityOptions = [
  "Fundamental Incompleto",
  "Fundamental Completo",
  "Médio Incompleto",
  "Médio Completo",
  "Superior Incompleto",
  "Superior Completo",
  "Mestrado",
  "Doutorado"
];

const genderOptions = [
  "Homem cis",
  "Mulher cis",
  "Homem trans",
  "Mulher trans",
  "Não-binário",
  "Prefiro não informar"
]

const raceOptions = [
  "Branca",
  "Preta",
  "Parda",
  "Amarela",
  "Indígena",
  "Prefiro não informar"
];

const socialOptions = {
  lattes: "Lattes",
  orcid: "Orcid",
  linkedin: "Linkedin",
  facebook: "Facebook",
  instagram: "Instagram"
};

const personalRef = ref(null);
const professionalRef = ref(null);
const interestsRef = ref(null);
const collectiveRef = ref(null);

defineExpose({
  personalRef,
  professionalRef,
  interestsRef,
  collectiveRef
});

watch(() => props.profileData, (newValue) => {
  address.value = newValue?.data?.address || '';
  bio.value = newValue?.data?.bio || '';
  gender.value = newValue?.data?.gender || '';
  const rawBirthdate = newValue?.data?.birthdate || '';
  birthdate.value = rawBirthdate ? rawBirthdate.slice(0, 10) : '';
  race.value = newValue?.data?.race || '';
  profession.value = newValue?.data?.profession || '';
  scholarity.value = newValue?.data?.scholarity || '';
  socials.value = {
    lattes: newValue?.data?.socials?.lattes || '',
    orcid: newValue?.data?.socials?.orcid || '',
    linkedin: newValue?.data?.socials?.linkedin || '',
    facebook: newValue?.data?.socials?.facebook || '',
    instagram: newValue?.data?.socials?.instagram || ''
  };

  const config = newValue?.data?.configurations || {};
  addressPublic.value = 'address' in config ? config.address : true;
  genderPublic.value = 'gender' in config ? config.gender : true;
  birthdatePublic.value = 'birthdate' in config ? config.birthdate : true;
  racePublic.value = 'race' in config ? config.race : true;
  professionPublic.value = 'profession' in config ? config.profession : true;
  scholarityPublic.value = 'scholarity' in config ? config.scholarity : true;
}, { immediate: true });

watch(() => props.userData, (newValue) => {
  name.value = newValue?.name || '';
}, { immediate: true });

function addSocial() {
  if (!selectedSocialOption.value || !selectedSocialValue.value.trim()) return;
  socials.value[selectedSocialOption.value] = selectedSocialValue.value.trim();
  selectedSocialOption.value = '';
  selectedSocialValue.value = '';
}

function removeSocial(key) {
  socials.value[key] = '';
}

async function updatePersonalData() {
  // Atualiza user apenas se o nome foi alterado
  if (name.value !== props.userData.name) {
    try {
      const payload = {
        name: name.value,
        email: props.userData.email
      };
      await store.updateUser(props.userData.id, payload);
    } catch (error) {
      console.error("Erro ao atualizar user.");
    }
  }

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
      socials: socials.value,
      configurations: {
        address: addressPublic.value,
        gender: genderPublic.value,
        birthdate: birthdatePublic.value,
        race: racePublic.value,
        profession: professionPublic.value,
        scholarity: scholarityPublic.value
      }
    };
    await profilesStore.updateProfile(userAuthHeader.value, props.profileData.data.id, payload);
    router.push('/eu');
  } catch (error) {
    console.error("Erro ao atualizar perfil.");
  }
}

function handleLogout() {
  authStore.logout();
  router.push('/');
}

function handleCancel() {
  router.push('/eu');
}
</script>

<template>
  <form @submit.prevent="updatePersonalData">
    <!-- Nome -->
    <div class="row mb-4">
      <div class="col-12">
        <UiField id="name" label="Nome" explain="Digite seu nome.">
          <input type="text" class="form-control" id="name" v-model="name" placeholder="Adicione seu nome"
            autocomplete="name" />
        </UiField>
      </div>
    </div>
    <!-- Data de nascimento e Localização -->
    <div class="row mb-4">
      <div class="col-12 col-md-6">
        <UiField id="birthdate" label="Data de nascimento" explain="Digite sua data de nascimento.">
          <input type="date" class="form-control" id="birthdate" v-model="birthdate" :max="today"
            placeholder="Sua data de nascimento" />
        </UiField>
        <div class="form-check form-switch mt-2 form-check-reverse">
          <input class="form-check-input" type="checkbox" role="switch" id="birthdate_public" v-model="birthdatePublic"
            switch>
          <label class="form-check-label" for="birthdate_public">Exibir informação em meu perfil público.</label>
        </div>
      </div>
      <div class="col-12 col-md-6">
        <UiField id="address" label="Sua localização" explain="Digite sua localização.">
          <input type="text" class="form-control" id="address" v-model="address"
            placeholder="Sua cidade, estado ou país" autocomplete="address-line1" />
        </UiField>
        <div class="form-check form-switch mt-2 form-check-reverse">
          <input class="form-check-input" type="checkbox" role="switch" id="address_public" v-model="addressPublic"
            switch>
          <label class="form-check-label" for="address_public">Exibir informação em meu perfil público.</label>
        </div>
      </div>
    </div>
    <!-- Gênero e Raça -->
    <div class="row mb-4">
      <div class="col-12 col-md-6">
        <UiField id="gender" label="Gênero" explain="Selecione seu gênero.">
          <div class="dropdown">
            <button class="w-100 btn btn-outline-secondary btn-icon dropdown-toggle caret-right justify-content-between"
              type="button" data-bs-toggle="dropdown">
              <span v-if="!gender" class="profile-form__dropdown-placeholder">Selecione</span>
              {{ gender }}
            </button>
            <ul class="w-100 dropdown-menu menu-light">
              <li v-for="option in genderOptions" :key="option">
                <button class="dropdown-item" type="button" @click="gender = option">
                  {{ option }}
                </button>
              </li>
            </ul>
          </div>
        </UiField>
        <div class="form-check form-switch mt-2 form-check-reverse">
          <input class="form-check-input" type="checkbox" role="switch" id="gender_public" v-model="genderPublic"
            switch>
          <label class="form-check-label" for="gender_public">Exibir informação em meu perfil público.</label>
        </div>
      </div>
      <div class="col-12 col-md-6">
        <UiField id="race" label="Raça" explain="Selecione sua raça.">
          <div class="dropdown">
            <button class="w-100 btn btn-outline-secondary btn-icon dropdown-toggle caret-right justify-content-between"
              type="button" data-bs-toggle="dropdown">
              <span v-if="!race" class="profile-form__dropdown-placeholder">Selecione</span>
              {{ race }}
            </button>
            <ul class="w-100 dropdown-menu menu-light">
              <li v-for="option in raceOptions" :key="option">
                <button class="dropdown-item" type="button" @click="race = option">
                  {{ option }}
                </button>
              </li>
            </ul>
          </div>
        </UiField>
        <div class="form-check form-switch mt-2 form-check-reverse">
          <input class="form-check-input" type="checkbox" role="switch" id="race_public" v-model="racePublic" switch>
          <label class="form-check-label" for="race_public">Exibir informação em meu perfil público.</label>
        </div>
      </div>
    </div>
    <!-- Bio -->
    <div class="row mb-5">
      <div class="col-12">
        <UiField id="bio" label="Mini biografia" explain="Conte um pouco sobre você.">
          <textarea id="bio" class="form-control" v-model="bio" rows="5"
            placeholder="Digite sua mini biografia"></textarea>
        </UiField>
        <div class="feedback">
          Máximo 500 caracteres.
        </div>
      </div>
    </div>
    <!-- Escolaridade e Profissão -->
    <div class="row mb-5">
      <div class="col-12 col-md-6">
        <UiField id="scholarity" label="Escolaridade" explain="Selecione sua escolaridade.">
          <div class="dropdown">
            <button class="w-100 btn btn-outline-secondary btn-icon dropdown-toggle caret-right justify-content-between"
              type="button" data-bs-toggle="dropdown">
              <span v-if="!scholarity" class="profile-form__dropdown-placeholder">Nível</span>
              {{ scholarity }}
            </button>
            <ul class="w-100 dropdown-menu menu-light">
              <li v-for="option in scholarityOptions" :key="option">
                <button class="dropdown-item" type="button" @click="scholarity = option">
                  {{ option }}
                </button>
              </li>
            </ul>
          </div>
        </UiField>
        <div class="form-check form-switch mt-2 form-check-reverse">
          <input class="form-check-input" type="checkbox" role="switch" id="scholarity_public"
            v-model="scholarityPublic" switch>
          <label class="form-check-label" for="scholarity_public">Exibir informação em meu perfil público.</label>
        </div>
      </div>
      <div class="col-12 col-md-6">
        <UiField id="profession" label="Profissão" explain="Digite sua profissão.">
          <input type="text" class="form-control" id="profession" v-model="profession" placeholder="Sua ocupação" />
        </UiField>
        <div class="form-check form-switch mt-2 form-check-reverse">
          <input class="form-check-input" type="checkbox" role="switch" id="profession_public"
            v-model="professionPublic" switch>
          <label class="form-check-label" for="profession_public">Exibir informação em meu perfil público.</label>
        </div>
      </div>
    </div>
    <div class="profile-form__account-button mb-2">
      <button type="button">Alterar senha</button>
      <i class="bi bi-arrow-right"></i>
    </div>
    <div class="profile-form__account-button mb-5">
      <button type="button" @click="handleLogout">Sair do perfil</button>
      <i class="bi bi-arrow-right"></i>
    </div>
    <div class="row row-cols-2 g-3">
      <div class="col">
        <button class="btn btn-outline-secondary btn-sm w-100" @click="handleCancel">Cancelar</button>
      </div>
      <div class="col">
        <button class="btn btn-secondary btn-sm w-100" type="submit">Salvar alterações</button>
      </div>
    </div>
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

.profile-form {
  &__account-button {
    display: flex;
    justify-content: space-between;
    padding: 8px 0px;
    border-bottom: 1px solid #A6A6A6;

    button {
      background: transparent;
      border: none;
      color: #000;
      cursor: pointer;
      font-weight: 700;
      font-style: Bold;
      font-size: 12px;
      line-height: 125%;
      letter-spacing: 0%;

      @include md {
        font-size: 14px;
      }

      &:hover {
        text-decoration: underline;
      }
    }

    i {
      font-size: 22px;
      color: #636262;

      @include md {
        font-size: 24px;
      }
    }
  }

  &__dropdown-placeholder {
    color: #636262;
    font-style: Italic;
  }
}

.form-check-label {
  font-weight: 500;
  font-style: Medium;
  font-size: 12px;
  line-height: 125%;
  letter-spacing: 0%;
}

.feedback {
  display: block;
  width: 100%;
  font-size: 10px;
  font-style: normal;
  font-weight: 400;
  line-height: 115%;
  text-align: right;
  margin-top: 8px;

  @include md {
    font-size: 12px;
  }
}
</style>