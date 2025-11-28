<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import UiField from './ui/UiField.vue';
import { useAuthStore } from "@/store/auth";
import { useUsersStore } from '../store/users';
import { useSubjectsStore } from "@/store/subjects";
import { useProfilesStore } from '../store/profiles';
import defaultProfileImage from '@/assets/profile_image.png';

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
  facebook: "",
  instagram: "",
  linkedin: "",
  whatsapp: "",
  x: ""
});

const addressPublic = ref();
const genderPublic = ref();
const birthdatePublic = ref();
const racePublic = ref();
const professionPublic = ref();
const scholarityPublic = ref();

const selectedSocialOption = ref("");
const selectedSocialValue = ref("");

// Refs para upload de imagem de perfil
const profileImageFile = ref(null);
const profileImageURLPreview = ref("");
const profileImageInputRef = ref(null);

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
];

const raceOptions = [
  "Branca",
  "Preta",
  "Parda",
  "Amarela",
  "Indígena",
  "Prefiro não informar"
];

const socialOptions = {
  lattes: { label: "Lattes", placeholder: "http://lattes.cnpq.br/seu_id_lattes" },
  orcid: { label: "Orcid", placeholder: "http://orcid.org/seu_id_orcid" },
  facebook: { label: "Facebook", placeholder: "http://facebook.com/seu_id_facebook" },
  instagram: { label: "Instagram", placeholder: "http://instagram.com/seu_id_instagram" },
  linkedin: { label: "Linkedin", placeholder: "http://linkedin.com/in/seu_id_linkedin" },
  whatsapp: { label: "Whatsapp", placeholder: "Digite o DDD + Telefone: XX999999999" },
  x: { label: "X", placeholder: "http://x.com/seu_id_x" }
};

// Refs para modal de alteração de senha
const showPasswordModal = ref(false);
const newPassword = ref("");
const passwordConfirmation = ref("");

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
    facebook: newValue?.data?.socials?.facebook || '',
    instagram: newValue?.data?.socials?.instagram || '',
    linkedin: newValue?.data?.socials?.linkedin || '',
    whatsapp: newValue?.data?.socials?.whatsapp || '',
    x: newValue?.data?.socials?.x || ''
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

function handleProfileImageChange(event) {
  const uploadedFile = event.target.files[0];
  if (!uploadedFile) return;

  // Verifica o tamanho do arquivo (2MB)
  const maxSize = 2 * 1024 * 1024;
  if (uploadedFile.size > maxSize) {
    alert('Por favor, selecione uma imagem de no máximo 2MB.');
    return;
  }

  // Validação do arquivo de imagem
  const reader = new FileReader();

  reader.onerror = () => {
    alert('Erro ao ler o arquivo. Por favor, selecione uma imagem válida.');
  };

  reader.onload = (e) => {
    const img = new Image();

    img.onerror = () => {
      alert('O arquivo selecionado não é uma imagem válida.');
      profileImageFile.value = null;
      profileImageURLPreview.value = '';
    };

    img.onload = () => {
      // Imagem válida
      profileImageFile.value = uploadedFile;
      profileImageURLPreview.value = e.target.result;
    };

    img.src = e.target.result;
  };

  reader.readAsDataURL(uploadedFile);
}

function openProfileImageDialog() {
  profileImageInputRef.value?.click();
}

function closePasswordModal() {
  showPasswordModal.value = false;
  newPassword.value = "";
  passwordConfirmation.value = "";
}

async function updateUserPassword(newPassword) {
  try {
    const payload = {
      name: props.userData.name,
      email: props.userData.email,
      password: newPassword
    };
    // Atualiza a senha do usuário no banco de dados
    const response = await usersStore.updateUser(userAuthHeader.value, props.userData.id, payload);
  } catch (error) {
    throw new Error("Erro ao atualizar a senha do usuário.");
  }
}

function handlePasswordChange() {
  if (!newPassword.value) {
    alert('Digite a nova senha.');
    return;
  }
  if (newPassword.value !== passwordConfirmation.value) {
    alert('As senhas não conferem.');
    return;
  }
  updateUserPassword(newPassword.value)
    .then(() => {
      alert('Senha alterada com sucesso!');
      showPasswordModal.value = false;
      newPassword.value = "";
      passwordConfirmation.value = "";
    })
    .catch(() => {
      alert('Erro ao alterar a senha.');
    });
}

// Desabilita scroll do body ao abrir modal de senha
watch(showPasswordModal, (val) => {
  if (val) document.body.style.overflow = 'hidden';
  else document.body.style.overflow = '';
});

async function updatePersonalData() {
  // Atualiza user somente se o nome foi alterado
  if (name.value !== props.userData.name) {
    try {
      const payload = {
        name: name.value,
        email: props.userData.email
      };
      // Atualiza dados do usuário no banco de dados
      const response = await usersStore.updateUser(userAuthHeader.value, props.userData.id, payload);
      // Atualiza o estado reativo do usuário no authStore
      authStore.loggedUser = response.user;
      // Atualiza dados do usuário no local storage
      localStorage.setItem("loggedUser", JSON.stringify(response.user));
    } catch (error) {
      throw new Error('Erro ao atualizar dados do/a usuário/a.');
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
    <!-- Foto de Perfil-->
    <div class="profile-form__profile-image row mb-4">
      <h3>Foto de perfil</h3>
      <div class="d-flex flex-row gap-3 align-items-end">
        <div class="profile-image-preview">
          <img :src="profileImageURLPreview || defaultProfileImage" alt="Foto de perfil" />
        </div>
        <button type="button" class="btn btn-outline-secondary lh-1" @click="openProfileImageDialog">
          Alterar imagem
        </button>
      </div>
      <input type="file" accept="image/*" ref="profileImageInputRef" @change="handleProfileImageChange"
        class="d-none" />
      <label class="mt-2">Selecione imagens de até 2MB.</label>
    </div>
    <!-- Nome -->
    <div ref="personalRef" class="row mb-4">
      <div class="col-12">
        <UiField id="name" label="Nome" explain="Digite seu nome.">
          <input type="text" class="form-control" id="name" v-model="name" placeholder="Adicione seu nome"
            autocomplete="name" />
        </UiField>
        <div class="d-flex flex-row-reverse mt-2">
          <label class="form-check-label">Preenchimento obrigatório.</label>
        </div>
      </div>
    </div>
    <!-- Data de nascimento e Localização -->
    <div class="row mb-4 gy-4 gy-md-0">
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
    <div class="row mb-4 gy-4 gy-md-0">
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
    <div class="row mb-4 mb-md-5">
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
    <div ref="professionalRef" class="row mb-4 mb-md-5 gy-4 gy-md-0">
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
    <!-- Redes -->
    <div class="row gy-3 mb-5">
      <UiField label="Suas redes"
        explain="Escolha uma rede social, digite o link do seu perfil nessa rede e clique no botão (+) para adicionar à lista.">
        <div class="input-group input-group-sm">
          <button class="btn btn-primary dropdown-toggle bg-azul-e border-azul-e fw-normal" type="button"
            data-bs-toggle="dropdown" aria-expanded="false">
            {{ socialOptions[selectedSocialOption]?.label || "Selecione" }}
          </button>
          <ul class="dropdown-menu menu-light">
            <li v-for="([key, social]) in Object.entries(socialOptions).filter(([key]) => !socials[key])" :key="key">
              <button class="dropdown-item" type="button" @click="selectedSocialOption = key">
                {{ social.label }}
              </button>
            </li>
          </ul>
          <input v-model="selectedSocialValue" class="form-control border-azul-e border-end-0"
            :placeholder="socialOptions[selectedSocialOption]?.placeholder || 'Selecione uma rede social'" />
          <button class="btn btn-light btn-sm border-azul-e border-start-0 bg-transparent" type="button"
            aria-label="Adicionar" @click="addSocial" :disabled="!selectedSocialOption || !selectedSocialValue">
            <i class="bi bi-plus-square-fill fs-8"></i>
          </button>
        </div>
      </UiField>
      <ul>
        <UiField class="mb-3" v-for="([key, value], idx) in Object.entries(socials).filter(([_, v]) => v)" :key="key">
          <div class="input-group input-group-sm">
            <button class="btn btn-primary bg-preto border-preto fw-normal" aria-expanded="false" disabled="true">
              {{ socialOptions[key]?.label }}
            </button>
            <input :value="value" disabled="true" class="form-control border-azul-e border-end-0 bg-branco"
              placeholder="" />
            <button class="btn btn-light btn-sm border-azul-e border-start-0 bg-transparent" type="button"
              aria-label="Remover" @click="removeSocial(key)">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </UiField>
      </ul>
    </div>
    <!-- Botão de alteração de senha -->
    <div class="profile-form__account-button mb-2">
      <button type="button" @click="showPasswordModal = true">Alterar senha</button>
      <i class="bi bi-arrow-right"></i>
    </div>
    <!-- Modal de alteração de senha -->
    <div v-if="showPasswordModal" class="profile-form__password-modal">
      <div class="profile-form__password-content">
        <h4>Alterar senha</h4>
        <div class="mb-4">
          <label for="newPassword">Nova senha</label>
          <input type="password" id="newPassword" v-model="newPassword" class="form-control" />
          <small>Sua senha deve conter pelo menos 8 dígitos com letras e números.</small>
        </div>
        <div class="mb-5">
          <label for="passwordConfirmation">Confirmação nova senha</label>
          <input type="password" id="passwordConfirmation" v-model="passwordConfirmation" class="form-control" />
          <small>Este campo deve ser idêntico ao anterior.</small>
        </div>
        <div class="d-flex gap-2 justify-content-end">
          <div class="w-100 d-flex flex-row gap-2">
            <button type="button" @click="closePasswordModal" class="btn btn-outline-secondary btn-sm w-100">Cancelar</button>
            <button type="button" @click="handlePasswordChange" class="btn btn-secondary btn-sm w-100">Alterar senha</button>
          </div>
        </div>
      </div>
    </div>
    <!-- Botão de log out -->
    <div class="profile-form__account-button mb-5">
      <button type="button" @click="handleLogout">Sair do perfil</button>
      <i class="bi bi-arrow-right"></i>
    </div>
    <!-- Botões de submit e cancelamento -->
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
@use "@/scss/variables" as *;
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.profile-form {
  &__profile-image {
    h3 {
      font-weight: 500;
      font-style: Medium;
      font-size: 14px;
      line-height: 150%;
      letter-spacing: 0%;

      @include md {
        font-size: 16px;
      }
    }

    .profile-image-preview {
      width: 70px;
      height: 70px;
      background-color: $color-laranja-e;
      border-radius: 10px;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      padding: 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
        padding: 0;
      }
    }

    button {
      height: fit-content;
    }

    label {
      font-weight: 400;
      font-style: 9pt;
      font-size: 12px;
      line-height: 115%;
      letter-spacing: 0%;
    }
  }

  &__dropdown-placeholder {
    color: #636262;
    font-style: Italic;
  }

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

  &__password-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(47, 47, 47, 0.2);
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  &__password-content {
    background-color: #fff;

    @include md {
      max-width: 580px;
      border-radius: 16px;
      gap: 16px;
      padding: 24px 64px;
      box-shadow: 4px 4px 8px 0px rgba(0, 0, 0, 0.1);
    }

    h4 {
      font-weight: 500;
      font-style: Medium;
      font-size: 16px;
      line-height: 150%;
      letter-spacing: 0%;

      @include md {
        font-size: 20px;
      }
    }

    label {
      display: block;
      font-weight: 500;
      font-style: Medium;
      line-height: 150%;
      letter-spacing: 0%;

      @include md {
        font-size: 16px;
        margin-bottom: 8px;
      }
    }

    small {
      display: block;
      color: #2F2F2F;
      margin-top: 5px;
      font-weight: 400;
      font-style: 9pt;
      font-size: 10px;
      line-height: 16px;
      letter-spacing: 0%;

      @include md {
        font-size: 14px;
        line-height: 115%;
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

.btn.bg-preto[disabled],
.btn.bg-preto:disabled {
  background-color: #000 !important;
  color: #fff !important;
  opacity: 1 !important;
  border-color: #000 !important;
}
</style>