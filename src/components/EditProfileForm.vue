<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import UiField from './ui/UiField.vue';
import { useAuthStore } from "@/store/auth";
import { useUsersStore } from '../store/users';
import { useVracStore } from "@/store/vrac";
import { useProfilesStore } from '../store/profiles';
import defaultProfileImage from '@/assets/profile_image.png';
import axios from 'axios';
import imageCompression from 'browser-image-compression';

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

const MAX_DIMENSION = 2000;

const router = useRouter();
const authStore = useAuthStore();
const usersStore = useUsersStore();
const profilesStore = useProfilesStore();
const vracStore = useVracStore();
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

// Refs para os temas de interesse
const subjects = ref([]);
const interestInput = ref("");
const selectedInterests = ref([]);
const filteredSubjects = computed(() =>
  subjects.value.filter(
    option =>
      option.term.toLowerCase().includes(interestInput.value.toLowerCase()) &&
      !selectedInterests.value.some(selected => selected.id === option.id)
  )
);

// Alert system
const alertMessage = ref("");
const alertType = ref("");
const showAlert = ref(false);

function displayAlert(message, type = "error") {
  alertMessage.value = message;
  alertType.value = type;
  showAlert.value = true;
}

function closeAlert() {
  showAlert.value = false;
  alertMessage.value = "";
  alertType.value = "";
}

onMounted(async () => {
  try {
    const response = await vracStore.getVRACSubjects();
    subjects.value = response.data;
  } catch (error) {
    console.error("Error fetching VRAC subjects:", error);
  }
});

function addInterest(interestObj) {
  if (!selectedInterests.value.some(i => i.id === interestObj.id)) {
    selectedInterests.value.push(interestObj);
    interestInput.value = '';
  }
}

function removeInterest(interestObj) {
  selectedInterests.value = selectedInterests.value.filter(i => i.id !== interestObj.id);
}

async function createNewSubjectFromNewInterest(term) {
  try {
    const result = await vracStore.addVRACSubject(term);
    interestInput.value = '';
    addInterest(result.data);
  } catch (error) {
    console.error("Erro ao adicionar novo termo:", error);
  }
}

// Refs para modal de alteração de senha
const showPasswordModal = ref(false);
const newPassword = ref("");
const passwordConfirmation = ref("");
const showNewPassword = ref(false);
const showPasswordConfirmation = ref(false);

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
  selectedInterests.value = newValue?.data?.subjects || [];

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

function validateImage(file) {
  return new Promise((resolve) => {
    const img = new Image();

    // img.onload = () => {
    //   if (img.width > MAX_DIMENSION || img.height > MAX_DIMENSION) {
    //     displayAlert(`Imagem deve ter no máximo ${MAX_DIMENSION}x${MAX_DIMENSION}px`);
    //     resolve(false);
    //   } else {
    //     resolve(true);
    //   }
    // };

    img.onerror = () => {
      displayAlert('Erro ao ler o arquivo. Por favor, selecione uma imagem válida.');
      profileImageFile.value = null;
      profileImageURLPreview.value = '';
      resolve(false);
    };

    img.src = URL.createObjectURL(file);
  });
}

async function updateProfile() {
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
    subjects: [...selectedInterests.value.map(interest => interest.id)],
    configurations: {
      address: addressPublic.value,
      gender: genderPublic.value,
      birthdate: birthdatePublic.value,
      race: racePublic.value,
      profession: professionPublic.value,
      scholarity: scholarityPublic.value
    }
  };

  await profilesStore.updateProfile(
    userAuthHeader.value,
    props.profileData.data.id,
    payload
  );

}

async function uploadProfileImage() {
  if (!profileImageFile.value) return null;

  const formData = new FormData();
  formData.append('image', profileImageFile.value);
  formData.append('name', props.userData.name);
  formData.append('email', props.userData.email);
  formData.append('_method', 'PUT');

  try {
    const response = await axios.post(
      `api/users/${props.userData.id}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: authStore.authHeader,
        },
      }
    );
    return response.data.user;
  } catch (error) {
    const apiError = error.response.data?.message || 'Erro ao enviar imagem de perfil.';
    displayAlert(apiError);
    throw error;
  }
}

async function handleProfileImageChange(event) {
  closeAlert();

  const uploadedFile = event.target.files?.[0];
  if (!uploadedFile) return;

  // Verifica o tamanho do arquivo (2MB)
  const maxSize = 2 * 1024 * 1024;
  if (uploadedFile.size > maxSize) {
    return displayAlert('Por favor, selecione uma imagem de no máximo 2MB.', "error");
  }

  // Valida iamgem antes de tentar comprimir para evitar processamento desnecessário
  const isValid = await validateImage(uploadedFile);
  if (!isValid) return;


  // Resize automático
  const compressed = await imageCompression(uploadedFile, {
    maxWidthOrHeight: MAX_DIMENSION,
  });

  // Validação do arquivo de imagem
  // const reader = new FileReader();

  // reader.onerror = () => {
  //   alert('Erro ao ler o arquivo. Por favor, selecione uma imagem válida.');
  // };

  // reader.onload = (e) => {
  //   const img = new Image();

  //   img.onerror = () => {
  //     alert('O arquivo selecionado não é uma imagem válida.');
  //     profileImageFile.value = null;
  //     profileImageURLPreview.value = '';
  //   };

  //   img.onload = () => {
  //     // Imagem válida
  //     profileImageFile.value = uploadedFile;
  //     profileImageURLPreview.value = e.target.result;
  //   };
  //   img.src = e.target.result;
  // };

  profileImageFile.value = compressed;
  profileImageURLPreview.value = URL.createObjectURL(compressed);

  // reader.readAsDataURL(uploadedFile);
}

function openProfileImageDialog() {
  profileImageInputRef.value?.click();
}

function closePasswordModal() {
  showPasswordModal.value = false;
  newPassword.value = "";
  passwordConfirmation.value = "";

  // Remove o foco do elemento ativo
  if (document.activeElement) {
    document.activeElement.blur();
  }
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
  // Verifica se a nova senha foi digitada
  if (!newPassword.value) {
    alert('Digite a nova senha.');
    return;
  }

  // Verifica se a senha tem pelo menos 8 caracteres
  if (newPassword.value.length < 8) {
    alert('A senha deve conter pelo menos 8 caracteres.');
    return;
  }

  // Verifica se a senha contém letras e números
  const hasLetter = /[a-zA-Z]/.test(newPassword.value);
  const hasNumber = /[0-9]/.test(newPassword.value);

  if (!hasLetter || !hasNumber) {
    alert('A senha deve conter letras e números.');
    return;
  }

  // Verifica se a confirmação de senha confere
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
  if (val) {
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscapeKey);
  } else {
    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleEscapeKey);
  }
});

function handleEscapeKey(event) {
  if (event.key === 'Escape') {
    closePasswordModal();
  }
}


async function updatePersonalData() {
  try {
    const hasNameChanged = name.value !== props.userData.name;
    const hasImageChanged = !!profileImageFile.value;


    //caso 2
    if (hasNameChanged || hasImageChanged) {
      const formData = new FormData();

      formData.append('name', name.value || props.userData.name);
      formData.append('email', props.userData.email);

      if (hasImageChanged) {
        // FALTA VALIDAR IMAGEM ANTES DE ENVIAR

        formData.append('image', profileImageFile.value);
      }

      formData.append('_method', 'PUT');

      const response = await axios.post(
        `/api/users/${props.userData.id}`,
        formData,
        {
          headers: {
            Authorization: authStore.authHeader,
          },
        }
      );

      authStore.loggedUser = response.data.user;
      localStorage.setItem("loggedUser", JSON.stringify(response.data.user));
    }

    await updateProfile();

    router.push('/eu');

    // 🔹 Atualiza estado se houve mudança
    // if (updatedUser) {
    //   authStore.loggedUser = updatedUser;
    //   localStorage.setItem("loggedUser", JSON.stringify(updatedUser));
    // }

  } catch (error) {
    const apiError = error.response?.data?.errors;

    if (apiError) {
      const firstError = Object.values(apiError)[0]?.[0];
      displayAlert(firstError || 'Erro ao atualizar');
    } else {
      displayAlert('Erro inesperado');
    }

    console.error(error);
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
  <!-- Alerta -->
  <div v-if="showAlert"
    :class="['alert', 'fs-6', alertType === 'success' ? 'bg-positivo-e' : 'bg-negativo-e', 'text-white', 'mb-3', 'd-flex', 'align-items-center', 'justify-content-between', 'auth-alert']"
    role="alert">
    <div class="d-flex align-items-center gap-2">
      <i :class="alertType === 'success' ? 'bi bi-check-all' : 'bi bi-exclamation-triangle-fill'"></i>
      <span>{{ alertMessage }}</span>
    </div>
    <button type="button" class="btn-close text-white" @click="closeAlert" aria-label="Close"></button>
  </div>

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
      <small class="mt-2"><i class="bi bi-exclamation-circle me-1"></i>Envie imagens de até 2MB.</small>
    </div>
    <!-- Nome -->
    <div ref="personalRef" class="row mb-4">
      <div class="col-12">
        <UiField id="name" label="Nome" explain="Digite seu nome.">
          <input type="text" class="form-control" id="name" v-model="name" placeholder="Adicione seu nome"
            autocomplete="name" />
        </UiField>
        <div class="d-flex flex-row-reverse mt-2">
          <small class="form-check-label">Preenchimento obrigatório.</small>
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
        <div class="d-flex form-check form-switch mt-2 form-check-reverse justify-content-between">
          <label class="d-flex form-check-label align-items-center" for="birthdate_public">Exibir informação em meu
            perfil público.</label>
          <input class="form-check-input" type="checkbox" role="switch" id="birthdate_public" v-model="birthdatePublic"
            switch>
        </div>
      </div>
      <div class="col-12 col-md-6">
        <UiField id="address" label="Sua localização" explain="Digite sua localização.">
          <input type="text" class="form-control" id="address" v-model="address"
            placeholder="Sua cidade, estado ou país" autocomplete="address-line1" />
        </UiField>
        <div class="d-flex form-check form-switch mt-2 form-check-reverse justify-content-between">
          <label class="d-flex form-check-label align-items-center" for="address_public">Exibir informação em meu perfil
            público.</label>
          <input class="form-check-input" type="checkbox" role="switch" id="address_public" v-model="addressPublic"
            switch>
        </div>
      </div>
    </div>
    <!-- Gênero e Raça -->
    <div class="row mb-4 gy-4 gy-md-0">
      <div class="col-12 col-md-6">
        <UiField id="gender" label="Gênero" labelTag="span" explain="Selecione seu gênero.">
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
        <div class="d-flex form-check form-switch mt-2 form-check-reverse justify-content-between">
          <label class="d-flex form-check-label align-items-center" for="gender_public">Exibir informação em meu perfil
            público.</label>
          <input class="form-check-input" type="checkbox" role="switch" id="gender_public" v-model="genderPublic"
            switch>
        </div>
      </div>
      <div class="col-12 col-md-6">
        <UiField id="race" label="Raça" labelTag="span" explain="Selecione sua raça.">
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
        <div class="d-flex form-check form-switch mt-2 form-check-reverse justify-content-between">
          <label class="d-flex form-check-label align-items-center" for="race_public">Exibir informação em meu perfil
            público.</label>
          <input class="form-check-input" type="checkbox" role="switch" id="race_public" v-model="racePublic" switch>
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
        <UiField id="scholarity" label="Escolaridade" labelTag="span" explain="Selecione sua escolaridade.">
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
        <div class="d-flex form-check form-switch mt-2 form-check-reverse justify-content-between">
          <label class="d-flex form-check-label align-items-center" for="scholarity_public">Exibir informação em meu
            perfil público.</label>
          <input class="form-check-input" type="checkbox" role="switch" id="scholarity_public"
            v-model="scholarityPublic" switch>
        </div>
      </div>
      <div class="col-12 col-md-6">
        <UiField id="profession" label="Profissão" explain="Digite sua profissão.">
          <input type="text" class="form-control" id="profession" v-model="profession" placeholder="Sua ocupação" />
        </UiField>
        <div class="d-flex form-check form-switch mt-2 form-check-reverse justify-content-between">
          <label class="d-flex form-check-label align-items-center" for="profession_public">Exibir informação em meu
            perfil público.</label>
          <input class="form-check-input" type="checkbox" role="switch" id="profession_public"
            v-model="professionPublic" switch>
        </div>
      </div>
    </div>
    <!-- Redes -->
    <div class="row gy-3 mb-5">
      <UiField label="Suas redes" labelTag="span"
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
          <input v-model="selectedSocialValue" id="social-value-input" name="social-value-input"
            class="form-control border-azul-e border-end-0"
            :placeholder="socialOptions[selectedSocialOption]?.placeholder || 'Selecione uma rede social'" />
          <button class="btn btn-light btn-sm border-azul-e border-start-0" type="button" aria-label="Adicionar"
            @click="addSocial" :disabled="!selectedSocialOption || !selectedSocialValue">
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
            <input :id="'social-' + key" :name="'social-' + key" :value="value" disabled="true"
              class="form-control border-azul-e border-end-0" placeholder="" />
            <button class="btn btn-light btn-sm border-azul-e border-start-0" type="button" aria-label="Remover"
              @click="removeSocial(key)">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </UiField>
      </ul>
    </div>
    <!-- Interesses -->
    <div class="row mb-5" ref="interestsRef">
      <div class="col-12 mb-4">
        <UiField id="interest-input" label="Temas de interesse"
          explain="Digite um tema de interesse e selecione a opção da lista. Caso o tema não exista, você pode adicioná-lo clicando em 'Adicionar novo termo'.">
          <div class="position-relative">
            <input type="text" id="interest-input" name="interest-input" class="form-control"
              :class="interestInput ? 'profile-form__interest-input-with-text' : 'profile-form__interest-input'"
              placeholder="Temas" v-model="interestInput" maxlength="250" />
            <div v-if="interestInput"
              style="width: calc(100%); height: 1px; border-left:1px solid #000;border-right:1px solid #000; padding:0 12px;">
              <div style="width: calc(100%); height: 1px; background-color: #000;"></div>
            </div>
            <!-- Lista de temas -->
            <ul v-if="interestInput" class="profile-form__interest-list">
              <li v-for="(option, index) in filteredSubjects.slice(0, 20)" :key="option.id" @click="addInterest(option)"
                class="profile-form__interest-list-item">
                <span class="profile-form__interest-list-item-term">{{ option.term }}</span>
              </li>
              <li
                v-if="interestInput.trim() && !filteredSubjects.some(opt => opt.term.toLowerCase() === interestInput.trim().toLowerCase())"
                @click="createNewSubjectFromNewInterest(interestInput.trim())"
                class="profile-form__interest-list-item profile-form__interest-list-item--new">
                <i class="bi bi-check me-2"></i><span class="profile-form__interest-list-item-term">Adicionar novo termo
                  "<span style="font-weight: 900">{{ interestInput.trim() }}"</span></span>
              </li>
            </ul>
          </div>
        </UiField>
      </div>
      <!-- Lista de interesses selecionados -->
      <UiField v-if="selectedInterests.length > 0" label="Temas de interesse cadastrados em seu perfil" labelTag="span"
        explain="Você pode remover temas clicando no ícone de 'x' ao lado do nome do tema.">
        <div class="d-flex flex-wrap gap-2 mt-2">
          <div v-for="(interest, index) in selectedInterests" :key="interest.id"
            class="btn btn-primary btn-sm btn-tag d-inline-flex align-items-center">
            {{ interest.term }}
            <button type="button" class="btn-close ms-2" aria-label="Remover" @click="removeInterest(interest)" />
          </div>
        </div>
      </UiField>
    </div>
    <!-- Botão de alteração de senha -->
    <div class="profile-form__account-button mb-2">
      <button type="button" @click="showPasswordModal = true">Alterar senha</button>
      <i class="bi bi-arrow-right"></i>
    </div>
    <!-- Modal de alteração de senha -->
    <transition name="fade-modal">
      <div v-if="showPasswordModal" class="profile-form__password-modal">
        <div class="profile-form__password-modal-content">
          <div>
            <i class="bi bi-x-circle-fill close-modal-mobile" @click="closePasswordModal"></i>
          </div>
          <div class="d-flex justify-content-between">
            <h4>Alterar senha</h4>
            <i class="bi bi-x-lg close-modal-desktop" @click="closePasswordModal"></i>
          </div>
          <div class="mb-4">
            <label for="newPassword">Nova senha</label>
            <div class="position-relative">
              <input :type="showNewPassword ? 'text' : 'password'" id="newPassword" v-model="newPassword"
                class="form-control" />
              <i :class="showNewPassword ? 'bi bi-eye-slash' : 'bi bi-eye'" class="password-toggle-icon"
                @click="showNewPassword = !showNewPassword"></i>
            </div>
            <small>Sua senha deve conter pelo menos 8 dígitos com letras e números.</small>
          </div>
          <div class="mb-5">
            <label for="passwordConfirmation">Confirmação nova senha</label>
            <div class="position-relative">
              <input :type="showPasswordConfirmation ? 'text' : 'password'" id="passwordConfirmation"
                v-model="passwordConfirmation" class="form-control" />
              <i :class="showPasswordConfirmation ? 'bi bi-eye-slash' : 'bi bi-eye'" class="password-toggle-icon"
                @click="showPasswordConfirmation = !showPasswordConfirmation"></i>
            </div>
            <small>Este campo deve ser idêntico ao anterior.</small>
          </div>
          <div class="d-flex gap-2 justify-content-end">
            <div class="w-100 d-flex flex-row gap-2">
              <button type="button" @click="closePasswordModal"
                class="btn btn-outline-secondary btn-sm w-100">Cancelar</button>
              <button type="button" @click="handlePasswordChange" class="btn btn-secondary btn-sm w-100">Alterar
                senha</button>
            </div>
          </div>
        </div>
      </div>
    </transition>
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

    small {
      font-weight: 400;
      font-style: 9pt;
      font-size: 12px;
      line-height: 115%;
      letter-spacing: 0%;

      i {
        font-size: 12px;
      }
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
    width: 100vw;
    height: 100vh;
    background-color: #fff;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    z-index: 1000;
    overflow-y: auto;

    @include md {
      background-color: rgba(47, 47, 47, 0.2);
      backdrop-filter: blur(4px);
      align-items: center;
    }
  }

  &__password-modal-content {
    background-color: #fff;
    width: 100%;
    padding: 76px 32px 32px 32px;

    @include md {
      width: auto;
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

    .close-modal-mobile {
      display: flex;
      justify-content: end;
      font-size: 24px;
      margin-bottom: 32px;

      @include md {
        display: none;
        margin-bottom: 0;
      }
    }

    .close-modal-desktop {
      cursor: pointer;
      font-size: 18px;
      color: #2F2F2F;
      display: none;

      @include md {
        font-size: 20px;
        display: inline-block;
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

    input {
      @include md {
        color: #636262;
        font-size: 14px;
        font-weight: 400;
        font-style: Italic;
        line-height: 150%;
        letter-spacing: 0%;
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

    .password-toggle-icon {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      cursor: pointer;
      color: #2F2F2F;
      font-size: 18px;
    }
  }

  &__interest-input {
    border-radius: 4px;
  }

  &__interest-input-with-text {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    border-bottom: 0;
  }

  &__interest-list {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin: 0;
    padding: 0;
    list-style: none;
    background: #fff;
    border: 1px solid var(--Preto);
    border-top: none;
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 10;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &__interest-list-item {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      color: var(--Laranja_E);
      background-color: var(--Laranja_C);
    }
  }

  &__interest-list-item--new {
    color: var(--Laranja_E);
  }

  &__interest-list-item-term {
    flex: 1;
    font-size: 14px;
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

// Animação modal de alteração de senha
.fade-modal-enter-active {
  transition: opacity 0.2s ease; // fundo

  .profile-form__password-modal-content {
    transition: opacity 0.3s ease 0.2s; // conteúdo
  }
}

.fade-modal-leave-active {
  transition: opacity 0.2s ease 0.2s; // fundo

  .profile-form__password-modal-content {
    transition: opacity 0.2s ease; // conteúdo
  }
}

.fade-modal-enter-from,
.fade-modal-leave-to {
  opacity: 0;

  .profile-form__password-modal-content {
    opacity: 0;
  }
}
</style>