<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import UiField from './ui/UiField.vue';
import { useAuthStore } from "@/store/auth";
import { useUsersStore } from '../store/users';
import { useVracStore } from "@/store/vrac";
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
const showEmailModal = ref(false);
const emailPassword = ref("");
const showEmailPassword = ref(false);
const newEmail = ref("");
const currentPassword = ref("");
const showCurrentPassword = ref(false);
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

function closeEmailModal() {
  showEmailModal.value = false;
  emailPassword.value = "";
  showEmailPassword.value = false;
  newEmail.value = "";
  // Remove o foco do elemento ativo
  if (document.activeElement) {
    document.activeElement.blur();
  }
}

function closePasswordModal() {
  showPasswordModal.value = false;
  currentPassword.value = "";
  showCurrentPassword.value = false;
  newPassword.value = "";
  passwordConfirmation.value = "";

  // Remove o foco do elemento ativo
  if (document.activeElement) {
    document.activeElement.blur();
  }
}

async function updateUserPassword(newPasswordValue) {
  try {
    const payload = {
      name: props.userData.name,
      email: props.userData.email,
      password: newPasswordValue,
    };
    if (currentPassword.value) {
      payload.current_password = currentPassword.value;
    }
    // Atualiza a senha do usuário no banco de dados
    const response = await usersStore.updateUser(userAuthHeader.value, props.userData.id, payload);
  } catch (error) {
    throw new Error("Erro ao atualizar a senha do usuário.");
  }
}

function handleEmailChange() {
  // if (!emailPassword.value) {
  //   alert("Digite sua senha.");
  //   return;
  // }

  // if (!newEmail.value) {
  //   alert("Digite o novo e-mail.");
  //   return;
  // }

  // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // if (!emailRegex.test(newEmail.value)) {
  //   alert("Digite um e-mail válido.");
  //   return;
  // }

  // updateUserEmail(newEmail.value)
  //   .then(() => {
  //     alert("E-mail alterado com sucesso!");
  //     closeEmailModal();
  //   })
  //   .catch(() => {
  //     alert("Erro ao alterar e-mail.");
  //   });
}

function handlePasswordChange() {
  if (!currentPassword.value) {
    alert('Digite sua senha atual.');
    return;
  }

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
      currentPassword.value = "";
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

// Desabilita scroll do body ao abrir modal de e-mail
watch(showEmailModal, (val) => {
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
    if (showEmailModal.value) {
      closeEmailModal();
      return;
    }
    closePasswordModal();
  }
}

// Função para redirecionar para a página de recuperação de senha.
function goForgotPassword() {
  closePasswordModal();
  // router.push({ name: 'login' });
  console.log('Redirecionando para a página de recuperação de senha.');
}

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
    <!-- Botão de alterar e-mail -->
    <div class="profile-form__account-button mb-2">
      <button type="button" @click="showEmailModal = true">Alterar e-mail</button>
      <i class="bi bi-arrow-right"></i>
    </div>
    <!-- Modal fora do <form> (Teleport) para o browser não tratar como login / autofill agressivo -->
    <Teleport to="body">
      <transition name="fade-modal">
        <div
          v-if="showEmailModal"
          class="profile-form__password-modal"
          @click.self="closeEmailModal"
        >
          <div
            class="profile-form__password-modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="email-modal-title"
            @click.stop
          >
            <div class="profile-form__password-modal-column">
              <div class="profile-form__password-modal-header">
                <p id="email-modal-title" class="profile-form__password-modal-title">
                  Alterar e-mail de cadastro
                </p>
              </div>

              <div class="profile-form__password-modal-body">
                <div class="profile-form__pwd-field">
                  <p class="profile-form__email-copy">
                    Atualmente seu e-mail de cadastrado em nosso sistema  no Arquigrafia é o <strong class="profile-form__email-copy-highlight">{{ props.userData?.email || "email@email.com" }}</strong>.
                  </p>
                </div>

                <div class="profile-form__pwd-field">
                  <div class="profile-form__pwd-label-row">
                    <label class="profile-form__pwd-label" for="edit-profile-modal-email-password">
                      Senha
                    </label>
                    <span class="profile-form__pwd-help" aria-hidden="true">
                      <i class="bi bi-question-circle-fill" />
                    </span>
                  </div>
                  <div class="profile-form__pwd-input-shell profile-form__pwd-input-shell--disabled">
                    <input
                      id="edit-profile-modal-email-password"
                      v-model="emailPassword"
                      name="edit_profile_email_password"
                      :type="showEmailPassword ? 'text' : 'password'"
                      class="profile-form__pwd-input"
                      disabled
                      placeholder="********"
                      autocomplete="off"
                    />
                    <button
                      type="button"
                      class="profile-form__pwd-toggle"
                      disabled
                      :aria-label="showEmailPassword ? 'Ocultar senha' : 'Mostrar senha'"
                      @click="showEmailPassword = !showEmailPassword"
                    >
                      <i
                        :class="showEmailPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                  <p class="profile-form__pwd-hint profile-form__pwd-hint--right">
                    Preenchimento obrigatório.
                  </p>
                </div>

                <div class="profile-form__pwd-field">
                  <div class="profile-form__pwd-label-row">
                    <label class="profile-form__pwd-label" for="edit-profile-modal-new-email">
                      Novo e-mail
                    </label>
                    <span class="profile-form__pwd-help" aria-hidden="true">
                      <i class="bi bi-question-circle-fill" />
                    </span>
                  </div>
                  <div class="profile-form__pwd-input-shell profile-form__pwd-input-shell--disabled">
                    <input
                      id="edit-profile-modal-new-email"
                      v-model="newEmail"
                      name="edit_profile_new_email"
                      type="email"
                      class="profile-form__pwd-input"
                      disabled
                      placeholder="exemplo@email.com"
                      autocomplete="off"
                    />
                  </div>
                  <p class="profile-form__pwd-hint">
                    Enviaremos um codigo de confirmacao, por isso prefira um e-mail com facil acesso.
                  </p>
                </div>
              </div>
            </div>

            <div class="profile-form__password-modal-footer">
              <button
                type="button"
                class="profile-form__pwd-btn profile-form__pwd-btn--secondary"
                @click="closeEmailModal"
              >
                Cancelar
              </button>
              <button
                type="button"
                class="profile-form__pwd-btn profile-form__pwd-btn--primary"
                @click="handleEmailChange"
              >
                Alterar e-mail
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
    <!-- Botão de alteração de senha -->
    <div class="profile-form__account-button mb-2">
      <button type="button" @click="showPasswordModal = true">Alterar senha</button>
      <i class="bi bi-arrow-right"></i>
    </div>
    <!-- Modal fora do <form> (Teleport) para o browser não tratar como login / autofill agressivo -->
    <Teleport to="body">
    <transition name="fade-modal">
      <div
        v-if="showPasswordModal"
        class="profile-form__password-modal"
        @click.self="closePasswordModal"
      >
        <div
          class="profile-form__password-modal-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="password-modal-title"
          @click.stop
        >
          <div class="profile-form__password-modal-column">
            <div class="profile-form__password-modal-header">
              <p id="password-modal-title" class="profile-form__password-modal-title">
                Alterar senha
              </p>
            </div>

            <div class="profile-form__password-modal-body">
              <!-- Senha atual -->
              <div class="profile-form__pwd-field">
                <div class="profile-form__pwd-label-row">
                  <label class="profile-form__pwd-label" for="edit-profile-modal-current-password">
                    Senha atual
                  </label>
                  <span class="profile-form__pwd-help" aria-hidden="true">
                    <i class="bi bi-question-circle-fill" />
                  </span>
                </div>
                <div class="profile-form__pwd-input-shell profile-form__pwd-input-shell--disabled">
                  <input
                    id="edit-profile-modal-current-password"
                    v-model="currentPassword"
                    name="edit_profile_current_password"
                    :type="showCurrentPassword ? 'text' : 'password'"
                    class="profile-form__pwd-input"
                    disabled
                    autocomplete="off"
                    autocorrect="off"
                    autocapitalize="off"
                    spellcheck="false"
                    data-lpignore="true"
                    data-1p-ignore
                  />
                  <button
                    type="button"
                    class="profile-form__pwd-toggle"
                    :aria-label="showCurrentPassword ? 'Ocultar senha' : 'Mostrar senha'"
                    @click="showCurrentPassword = !showCurrentPassword"
                  >
                    <i
                      :class="showCurrentPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"
                      aria-hidden="true"
                    />
                  </button>
                </div>
                <div class="profile-form__pwd-extra">
                  <button
                    type="button"
                    class="profile-form__pwd-forgot"
                    @click="goForgotPassword"
                  >
                    Esqueci minha senha
                  </button>
                </div>
              </div>

              <!-- Nova senha -->
              <div class="profile-form__pwd-field-group">
                <div class="profile-form__pwd-field">
                  <div class="profile-form__pwd-label-row">
                    <label class="profile-form__pwd-label" for="edit-profile-modal-new-password">
                      Nova senha
                    </label>
                    <span class="profile-form__pwd-help" aria-hidden="true">
                      <i class="bi bi-question-circle-fill" />
                    </span>
                  </div>
                  <div class="profile-form__pwd-input-shell">
                    <input
                      id="edit-profile-modal-new-password"
                      v-model="newPassword"
                      name="edit_profile_new_password"
                      :type="showNewPassword ? 'text' : 'password'"
                      class="profile-form__pwd-input"
                      autocomplete="new-password"
                    />
                    <button
                      type="button"
                      class="profile-form__pwd-toggle"
                      :aria-label="showNewPassword ? 'Ocultar senha' : 'Mostrar senha'"
                      @click="showNewPassword = !showNewPassword"
                    >
                      <i
                        :class="showNewPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                  <p class="profile-form__pwd-hint">
                    Sua senha deve conter pelo menos 8 dígitos com letras e números.
                  </p>
                </div>

                <div class="profile-form__pwd-field">
                  <div class="profile-form__pwd-label-row">
                    <label
                      class="profile-form__pwd-label"
                      for="edit-profile-modal-password-confirmation"
                    >
                      Confirmação nova senha
                    </label>
                    <span class="profile-form__pwd-help" aria-hidden="true">
                      <i class="bi bi-question-circle-fill" />
                    </span>
                  </div>
                  <div class="profile-form__pwd-input-shell">
                    <input
                      id="edit-profile-modal-password-confirmation"
                      v-model="passwordConfirmation"
                      name="edit_profile_new_password_confirm"
                      :type="showPasswordConfirmation ? 'text' : 'password'"
                      class="profile-form__pwd-input"
                      autocomplete="new-password"
                    />
                    <button
                      type="button"
                      class="profile-form__pwd-toggle"
                      :aria-label="
                        showPasswordConfirmation ? 'Ocultar senha' : 'Mostrar senha'
                      "
                      @click="
                        showPasswordConfirmation = !showPasswordConfirmation
                      "
                    >
                      <i
                        :class="
                          showPasswordConfirmation
                            ? 'bi bi-eye-slash'
                            : 'bi bi-eye'
                        "
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                  <p class="profile-form__pwd-hint">
                    Este campo deve ser idêntico ao anterior.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="profile-form__password-modal-footer">
            <button
              type="button"
              class="profile-form__pwd-btn profile-form__pwd-btn--secondary"
              @click="closePasswordModal"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="profile-form__pwd-btn profile-form__pwd-btn--primary"
              @click="handlePasswordChange"
            >
              Alterar senha
            </button>
          </div>
        </div>
      </div>
    </transition>
    </Teleport>
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
    inset: 0;
    z-index: 1100;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.5);
    padding: 16px;
    box-sizing: border-box;
    overflow-y: auto;
  }

  &__password-modal-panel {
    display: flex;
    width: 600px;
    max-width: calc(100vw - 32px);
    box-sizing: border-box;
    padding: 0 16px;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    overflow: clip;
    border-radius: 16px;
    background: var(--off_white, #faf9f9);
    box-shadow: 4px 4px 8px 0 rgba(0, 0, 0, 0.1);
  }

  &__password-modal-column {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 0 32px;
    box-sizing: border-box;
  }

  &__password-modal-header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 32px;
    padding-bottom: 16px;
  }

  &__password-modal-title {
    flex: 1 0 0;
    margin: 0;
    font-family: "DM Sans", sans-serif;
    font-size: 20px;
    font-weight: 500;
    line-height: 1.5;
    color: #2f2f2f;
  }

  &__password-modal-body {
    width: 100%;
    padding: 0 12px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  &__pwd-field-group {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  &__pwd-field {
    display: flex;
    flex-direction: column;
    gap: 1px;
    width: 100%;
    max-width: 600px;
    min-width: 200px;
  }

  &__pwd-label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 8px 12px 8px 0;
    box-sizing: border-box;
  }

  &__pwd-label {
    font-family: "DM Sans", sans-serif;
    font-size: 16px;
    font-weight: 500;
    line-height: 1.5;
    color: #212529;
    margin: 0;
  }

  &__pwd-help {
    display: inline-flex;
    width: 12px;
    height: 12px;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    color: #212529;
  }

  &__pwd-help .bi {
    font-size: 12px;
    line-height: 1;
  }

  &__pwd-input-shell {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 30px;
    box-sizing: border-box;
    padding: 6px 10px;
    background: var(--off_white, #faf9f9);
    border: 0.75px solid var(--preto, #1f1f1f);
    border-radius: 5px;
    overflow: clip;
  }

  &__pwd-input-shell--disabled {
    background: #f1f1f1;
    border-color: #c8c8c8;
  }

  &__pwd-input {
    flex: 1;
    min-width: 0;
    height: 100%;
    border: none;
    background: transparent;
    padding: 0;
    margin: 0;
    font-family: "DM Sans", sans-serif;
    font-size: 14px;
    font-weight: 400;
    font-style: normal;
    line-height: 1.5;
    color: #212529;
  }

  &__pwd-input:disabled {
    color: #8a8a8a;
    cursor: not-allowed;
    opacity: 1;
    -webkit-text-fill-color: #8a8a8a;
  }

  &__pwd-input::placeholder {
    font-style: italic;
    color: #636262;
  }

  &__pwd-input:focus {
    outline: none;
  }

  &__pwd-toggle {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    padding: 0;
    margin: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    color: #1f1f1f;
  }

  &__pwd-toggle .bi {
    font-size: 18px;
    line-height: 1;
  }

  &__pwd-extra {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 4px 0;
    box-sizing: border-box;
  }

  &__pwd-forgot {
    flex: 1 0 0;
    margin: 0;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    text-align: left;
    font-family: "DM Sans", sans-serif;
    font-size: 12px;
    font-weight: 400;
    line-height: 1.15;
    color: var(--azul_m, #0f89e1);
    text-decoration: underline;
    text-decoration-skip-ink: none;
  }

  &__pwd-hint {
    margin: 0;
    padding: 4px 0 0;
    width: 100%;
    font-family: "DM Sans", sans-serif;
    font-size: 12px;
    font-weight: 400;
    line-height: 1.15;
    color: var(--cinza_e, #2f2f2f);
  }

  &__pwd-hint--right {
    text-align: right;
  }

  &__email-copy {
    margin: 0;
    width: 100%;
    padding: 8px 12px;
    font-family: "DM Sans", sans-serif;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.25;
    color: #212529;
    padding: 0;
    width: 98%;
  }

  &__email-copy-highlight {
    font-weight: 700;
  }

  &__password-modal-footer {
    width: 100%;
    display: flex;
    gap: 16px;
    align-items: flex-start;
    align-self: stretch;
    padding: 16px 0;
    box-sizing: border-box;
  }

  &__pwd-btn {
    flex: 1 0 0;
    min-width: 0;
    margin: 0;
    padding: 2px 14px;
    border-radius: 5px;
    border-style: solid;
    border-width: 1px;
    font-family: "DM Sans", sans-serif;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.5;
    text-align: center;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: center;
    box-sizing: border-box;
  }

  &__pwd-btn--secondary {
    background: var(--off_white, #faf9f9);
    border-color: var(--cinza_e, #2f2f2f);
    color: var(--cinza_e, #2f2f2f);
  }

  &__pwd-btn--primary {
    background: var(--cinza_e, #2f2f2f);
    border-color: var(--cinza_e, #2f2f2f);
    color: var(--branco, #ffffff);
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
  transition: opacity 0.2s ease;

  .profile-form__password-modal-panel {
    transition: opacity 0.3s ease 0.2s;
  }
}

.fade-modal-leave-active {
  transition: opacity 0.2s ease 0.2s;

  .profile-form__password-modal-panel {
    transition: opacity 0.2s ease;
  }
}

.fade-modal-enter-from,
.fade-modal-leave-to {
  opacity: 0;

  .profile-form__password-modal-panel {
    opacity: 0;
  }
}

/* regras mobile */
@media (max-width: 767px) {
  .profile-form {
    &__password-modal {
      padding: 0;
      align-items: stretch;
      justify-content: stretch;
    }

    &__password-modal-panel {
      width: 100vw;
      max-width: 100vw;
      height: 100dvh;
      border-radius: 0;
      padding: 0 12px;
      margin: 0;

      display: grid;
      grid-template-rows: auto 1fr auto;
      gap: 12px;
      overflow: hidden;
    }
  }

  .profile-form {
    &__password-modal-column {
      grid-row: 1 / span 2;
      min-height: 0;
      display: flex;
      flex-direction: column;
      padding: 0 12px;
    }

    &__password-modal-header {
      padding-top: 20px;
      padding-bottom: 12px;
    }

    &__password-modal-title {
      font-size: 20px;
      line-height: 1.35;
      margin: 0;
    }

    &__password-modal-body {
      flex: 1 1 auto;
      min-height: 0;
      padding: 0;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      gap: 14px;
    }

    .profile-form {
      &__pwd-label {
        font-size: 14px;
      }

      &__pwd-input-shell {
        height: 34px;
        padding: 4px 10px;
      }

      &__pwd-input {
        font-size: 14px;
        line-height: 1.25;
      }

      &__pwd-hint {
        font-size: 12px;
        line-height: 1.2;
      }

      &__pwd-extra {
        padding: 2px 0;
      }
    }

    .profile-form {
      &__password-modal-footer {
        grid-row: 3;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 12px 0 calc(12px + env(safe-area-inset-bottom));
        align-self: stretch;
      }

      &__pwd-btn {
        width: 100%;
        flex: 0 0 auto;
        min-height: 32px;
        height: 32px;
        padding: 2px 12px;
        line-height: 1.2;
      }

      &__pwd-btn--secondary { order: 1; }
      &__pwd-btn--primary { order: 2; }
    }

    

  }


    
}

</style>