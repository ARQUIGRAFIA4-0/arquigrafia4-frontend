<script setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import UiField from './ui/UiField.vue';
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
      },
      configurations: {
        address: addressPublic.value,
        gender: genderPublic.value,
        birthdate: birthdatePublic.value,
        race: racePublic.value,
        profession: professionPublic.value,
        scholarity: scholarityPublic.value
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
    <!-- Nome -->
    <!-- Data de nascimento e Localização -->
    <!-- Gênero e Raça -->
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
    <div class="row">
      <div class="col-12 col-md-6">
        <UiField id="scholarity" label="Escolaridade" explain="Selecione sua escolaridade.">
          <div class="dropdown">
            <button class="w-100 btn btn-outline-secondary btn-icon dropdown-toggle caret-right justify-content-between"
              type="button" data-bs-toggle="dropdown">
              {{ scholarity || "Nível" }}
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
    <div class="profile-form__account-button">
      <button type="button" @click="handleLogout">Sair do perfil</button>
      <i class="bi bi-arrow-right"></i>
    </div>
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

.profile-form {
  &__account-button {
    display: flex;
    justify-content: space-between;
    padding: 8px 0px;
    border-bottom: 1px solid #A6A6A6;
    margin-bottom: 44px;

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