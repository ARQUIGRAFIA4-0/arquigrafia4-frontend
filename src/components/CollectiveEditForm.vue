<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import UiField from './ui/UiField.vue';
import { useAuthStore } from '@/store/auth';
import { useVracStore } from '@/store/vrac';
import defaultProfileImage from '@/assets/collective_image.png';
import axios from '@/axios';
import imageCompression from 'browser-image-compression';

const props = defineProps({
  collectiveData: {
    type: Object,
    required: true,
  },
});

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 7 * 1024 * 1024; // 7 MB
const MAX_DIMENSION = 2000;
const NAME_MAX_LENGTH = 120;
const LOCATION_MAX_LENGTH = 120;
const DESCRIPTION_MAX_LENGTH = 500;

const router = useRouter();
const authStore = useAuthStore();
const vracStore = useVracStore();

const API_BASE_URL = import.meta.env.VITE_BASE_REQUEST_URL;

// Form fields
const name = ref('');
const email = ref('');
const foundationDate = ref('');
const location = ref('');
const description = ref('');

// Avatar upload
const avatarFile = ref(null);
const avatarPreview = ref('');
const avatarInputRef = ref(null);
const isProcessingImage = ref(false);

const currentAvatarUrl = computed(() => {
  const d = props.collectiveData;
  if (!d) return null;
  if (d.avatar_url) {
    return d.avatar_url.startsWith('http') ? d.avatar_url : `${API_BASE_URL}${d.avatar_url}`;
  }
  if (d.avatar_path) return `${API_BASE_URL}/storage/${d.avatar_path}`;
  return null;
});

// Subjects
const allSubjects = ref([]);
const interestInput = ref('');
const selectedInterests = ref([]);

const filteredSubjects = computed(() =>
  allSubjects.value.filter(
    (option) =>
      option.term.toLowerCase().includes(interestInput.value.toLowerCase()) &&
      !selectedInterests.value.some((s) => s.id === option.id)
  )
);

// Socials (object keyed by network name)
const socials = ref({
  lattes: '',
  orcid: '',
  facebook: '',
  instagram: '',
  linkedin: '',
  whatsapp: '',
  x: '',
});
const selectedSocialOption = ref('');
const selectedSocialValue = ref('');

const socialOptions = {
  lattes: { label: 'Lattes', placeholder: 'http://lattes.cnpq.br/seu_id_lattes' },
  orcid: { label: 'Orcid', placeholder: 'http://orcid.org/seu_id_orcid' },
  facebook: { label: 'Facebook', placeholder: 'http://facebook.com/seu_id_facebook' },
  instagram: { label: 'Instagram', placeholder: 'http://instagram.com/seu_id_instagram' },
  linkedin: { label: 'Linkedin', placeholder: 'http://linkedin.com/in/seu_id_linkedin' },
  whatsapp: { label: 'Whatsapp', placeholder: 'Digite o DDD + Telefone: XX999999999' },
  x: { label: 'X', placeholder: 'http://x.com/seu_id_x' },
};

// Alert
const alertMessage = ref('');
const alertType = ref('error');
const showAlert = ref(false);
const isSaving = ref(false);
const isLoadingSubjects = ref(true);

// Section refs for CollectiveEditNav scroll targets
const collectiveDataRef = ref(null);
const socialsRef = ref(null);
const interestsRef = ref(null);

defineExpose({ collectiveDataRef, socialsRef, interestsRef });

const today = new Date().toISOString().slice(0, 10);

function displayAlert(message, type = 'error') {
  alertMessage.value = message;
  alertType.value = type;
  showAlert.value = true;
}

function closeAlert() {
  showAlert.value = false;
  alertMessage.value = '';
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Pre-populate non-subject fields from props
watch(
  () => props.collectiveData,
  (data) => {
    if (!data) return;
    name.value = data.name || '';
    email.value = data.email || '';
    foundationDate.value = data.foundation_date ? data.foundation_date.slice(0, 10) : '';
    location.value = data.location || '';
    description.value = data.description || '';
    if (data.socials && typeof data.socials === 'object' && !Array.isArray(data.socials)) {
      socials.value = { ...socials.value, ...data.socials };
    }
  },
  { immediate: true }
);

onMounted(async () => {
  try {
    allSubjects.value = await vracStore.getVRACSubjects();
    // Map collective's subject UUIDs to {id, term} objects for display
    if (props.collectiveData?.subjects?.length) {
      selectedInterests.value = props.collectiveData.subjects.map((id) => {
        const found = allSubjects.value.find((s) => s.id === id);
        return found || { id, term: id };
      });
    }
  } catch (error) {
    console.error('Erro ao carregar temas:', error);
  } finally {
    isLoadingSubjects.value = false;
  }
});

// Image upload handlers
function validateMimeType(file) {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    displayAlert('Formato não suportado. Use JPEG, PNG ou WebP.');
    scrollToTop();
    return false;
  }
  return true;
}

function validateFileSize(file) {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    displayAlert('A imagem deve ter no máximo 7 MB.');
    scrollToTop();
    return false;
  }
  return true;
}

function validateImage(file) {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(true);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      displayAlert('Arquivo inválido. Selecione uma imagem válida.');
      avatarFile.value = null;
      avatarPreview.value = '';
      resolve(false);
    };
    img.src = objectUrl;
  });
}

async function handleImageChange(event) {
  closeAlert();
  const file = event.target.files?.[0];
  if (!file) return;
  if (!validateMimeType(file)) return;
  if (!validateFileSize(file)) return;

  isProcessingImage.value = true;
  try {
    const isValid = await validateImage(file);
    if (!isValid) return;

    const compressed = await imageCompression(file, {
      maxWidthOrHeight: MAX_DIMENSION,
      useWebWorker: true,
    });

    avatarFile.value = compressed;
    if (avatarPreview.value) URL.revokeObjectURL(avatarPreview.value);
    avatarPreview.value = URL.createObjectURL(compressed);
  } finally {
    isProcessingImage.value = false;
  }
}

function openImageDialog() {
  avatarInputRef.value?.click();
}

// Subjects handlers
function addInterest(obj) {
  if (!selectedInterests.value.some((i) => i.id === obj.id)) {
    selectedInterests.value.push(obj);
    interestInput.value = '';
  }
}

function removeInterest(obj) {
  selectedInterests.value = selectedInterests.value.filter((i) => i.id !== obj.id);
}

async function createNewSubjectFromInterest(term) {
  try {
    const result = await vracStore.addVRACSubject(term);
    interestInput.value = '';
    addInterest(result);
  } catch (error) {
    console.error('Erro ao adicionar novo termo:', error);
  }
}

// Socials handlers
function addSocial() {
  if (!selectedSocialOption.value || !selectedSocialValue.value.trim()) return;
  socials.value[selectedSocialOption.value] = selectedSocialValue.value.trim();
  selectedSocialOption.value = '';
  selectedSocialValue.value = '';
}

function removeSocial(key) {
  socials.value[key] = '';
}

// Form submit
async function handleSubmit() {
  closeAlert();

  if (!name.value.trim()) {
    displayAlert('O nome do coletivo é obrigatório.');
    scrollToTop();
    return;
  }

  const formData = new FormData();
  // Laravel method spoofing: multipart/form-data não funciona com PATCH/PUT direto no PHP
  formData.append('_method', 'PATCH');
  formData.append('name', name.value.trim());
  formData.append('email', email.value.trim());
  if (foundationDate.value) formData.append('foundation_date', foundationDate.value);
  if (location.value) formData.append('location', location.value.trim());
  formData.append('description', description.value);

  if (avatarFile.value) {
    formData.append('avatar', avatarFile.value);
  }

  // Subjects — send full list; omit field entirely when empty so the backend
  // does not receive an invalid empty string value.
  for (const s of selectedInterests.value) {
    formData.append('subjects[]', s.id);
  }

  // Socials — send each key individually
  for (const [key, value] of Object.entries(socials.value)) {
    formData.append(`socials[${key}]`, value || '');
  }

  isSaving.value = true;
  try {
    await axios.post(
      `/api/collectives/${props.collectiveData.id}`,
      formData,
      {
        headers: {
          Authorization: authStore.authHeader,
        },
      }
    );
    displayAlert('Alterações salvas com sucesso!', 'success');
    scrollToTop();
    setTimeout(() => {
      router.push({ name: 'collective-detail', params: { id: props.collectiveData.id } });
    }, 1500);
  } catch (error) {
    const status = error.response?.status;
    if (status === 403) {
      displayAlert('Você não tem permissão para editar este coletivo.');
    } else {
      const apiErrors = error.response?.data?.errors;
      if (apiErrors) {
        const firstError = Object.values(apiErrors)[0]?.[0];
        displayAlert(firstError || 'Erro ao salvar alterações.');
      } else {
        displayAlert(error.response?.data?.message || 'Erro inesperado. Tente novamente.');
      }
    }
    scrollToTop();
    console.error('[CollectiveEditForm] handleSubmit error:', error);
  } finally {
    isSaving.value = false;
  }
}

function handleCancel() {
  router.push({ name: 'collective-detail', params: { id: props.collectiveData.id } });
}
</script>

<template>
  <!-- Alerta -->
  <div
    v-if="showAlert"
      :class="['alert', 'fs-6', alertType === 'success' ? 'alert-positivo' : 'alert-negativo', 'mb-3', 'd-flex', 'align-items-center', 'justify-content-between']"
    role="alert"
  >
    <div class="d-flex align-items-center gap-2">
      <i :class="alertType === 'success' ? 'bi bi-check-all' : 'bi bi-exclamation-triangle-fill'"></i>
      <span>{{ alertMessage }}</span>
    </div>
    <button type="button" class="btn-close" @click="closeAlert" aria-label="Fechar"></button>
  </div>

  <form @submit.prevent="handleSubmit" class="collective-form">
    <!-- Foto do coletivo -->
    <div class="collective-form__avatar row mb-4" ref="collectiveDataRef">
      <h3>Foto do coletivo</h3>
      <div class="d-flex flex-row gap-3 align-items-end">
        <div class="collective-form__avatar-preview position-relative">
          <img
            :src="avatarPreview || currentAvatarUrl || defaultProfileImage"
            alt="Foto do coletivo"
            :class="{ 'opacity-50': isProcessingImage }"
          />
          <div v-if="isProcessingImage" class="position-absolute top-50 start-50 translate-middle">
            <div class="spinner-border spinner-border-sm text-secondary" role="status">
              <span class="visually-hidden">Carregando...</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          class="btn btn-outline-secondary lh-1"
          @click="openImageDialog"
          :disabled="isProcessingImage"
        >
          <span v-if="isProcessingImage">
            <i class="bi bi-hourglass-split me-1"></i>Processando...
          </span>
          <span v-else>Alterar imagem</span>
        </button>
      </div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        ref="avatarInputRef"
        @change="handleImageChange"
        class="d-none"
      />
      <small class="mt-2">
        <i class="bi bi-exclamation-circle me-1"></i>Envie imagens JPEG, PNG ou WebP de até 7 MB.
      </small>
    </div>

    <!-- Nome -->
    <div class="row mb-4">
      <div class="col-12">
        <UiField id="collective-name" label="Nome" explain="Nome do coletivo.">
          <input
            type="text"
            class="form-control"
            id="collective-name"
            v-model="name"
            placeholder="Nome do coletivo"
            :maxlength="NAME_MAX_LENGTH"
          />
        </UiField>
        <div class="d-flex flex-row mt-1">
          <small class="form-text text-muted">Preenchimento obrigatório. {{ name.length }}/{{ NAME_MAX_LENGTH }}.</small>
        </div>
      </div>
    </div>

    <!-- E-mail -->
    <div class="row mb-4">
      <div class="col-12">
        <UiField id="collective-email" label="E-mail de contato" explain="E-mail público de contato do coletivo.">
          <input
            type="email"
            class="form-control"
            id="collective-email"
            v-model="email"
            placeholder="contato@coletivo.org"
            autocomplete="off"
          />
        </UiField>
      </div>
    </div>

    <!-- Data de fundação + Localização -->
    <div class="row mb-4 gy-4 gy-md-0">
      <div class="col-12 col-md-6">
        <UiField
          id="collective-creation-date"
          label="Data de criação"
          explain="Data em que o coletivo foi criado."
        >
          <input
            type="date"
            class="form-control"
            id="collective-creation-date"
            v-model="foundationDate"
            :max="today"
          />
        </UiField>
      </div>
      <div class="col-12 col-md-6">
        <UiField id="collective-location" label="Localização do grupo" explain="Cidade, estado ou país do coletivo.">
          <input
            type="text"
            class="form-control"
            id="collective-location"
            v-model="location"
            placeholder="São Paulo, SP"
            :maxlength="LOCATION_MAX_LENGTH"
          />
        </UiField>
        <div class="d-flex flex-row-reverse mt-1">
          <small class="form-text text-muted">{{ location.length }}/{{ LOCATION_MAX_LENGTH }}</small>
        </div>
      </div>
    </div>

    <!-- Descrição -->
    <div class="row mb-4 mb-md-5">
      <div class="col-12">
        <UiField id="collective-description" label="Descrição do grupo" explain="Descreva o coletivo e seus objetivos.">
          <textarea
            id="collective-description"
            class="form-control"
            v-model="description"
            rows="5"
            placeholder="Descreva o coletivo"
            :maxlength="DESCRIPTION_MAX_LENGTH"
          ></textarea>
        </UiField>
        <div class="d-flex flex-row-reverse mt-1">
          <small class="form-text text-muted">{{ description.length }}/{{ DESCRIPTION_MAX_LENGTH }}</small>
        </div>
      </div>
    </div>

    <!-- Redes do coletivo -->
    <div class="row gy-3 mb-5" ref="socialsRef">
      <UiField label="Redes do coletivo" labelTag="span"
        explain="Escolha uma rede social, digite o link do perfil do coletivo nessa rede e clique no botão (+) para adicionar à lista.">
        <div class="input-group input-group-sm">
          <button class="btn btn-primary dropdown-toggle bg-cinza-m border-preto fw-normal rounded-end-0" type="button"
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
          <input v-model="selectedSocialValue" id="collective-social-value-input" name="collective-social-value-input"
            class="form-control border-preto border-end-0"
            :placeholder="socialOptions[selectedSocialOption]?.placeholder || 'Selecione uma rede social'" />
          <button class="btn btn-light btn-sm border-preto border-start-0 social-icon-btn" type="button"
            aria-label="Adicionar" @click="addSocial" :disabled="!selectedSocialOption || !selectedSocialValue">
            <i class="bi bi-plus-square-fill"></i>
          </button>
        </div>
      </UiField>
      <ul>
        <UiField class="mb-3" v-for="[key, value] in Object.entries(socials).filter(([_, v]) => v)" :key="key">
          <div class="input-group input-group-sm">
            <button class="btn btn-primary bg-preto border-preto fw-normal" aria-expanded="false" disabled="true">
              {{ socialOptions[key]?.label }}
            </button>
            <input :id="'collective-social-' + key" :name="'collective-social-' + key" :value="value" disabled="true"
              class="form-control border-preto border-end-0" placeholder="" />
            <button class="btn btn-light btn-sm border-preto border-start-0 social-icon-btn" type="button" aria-label="Remover"
              @click="removeSocial(key)">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </UiField>
      </ul>
    </div>

    <!-- Temas abordados -->
    <div class="row mb-5" ref="interestsRef">
      <div class="col-12 mb-4">
        <UiField
          id="collective-interest-input"
          label="Temas abordados"
          explain="Digite um tema e selecione da lista. Caso o tema não exista, você pode adicioná-lo clicando em 'Adicionar novo termo'."
        >
          <div class="position-relative">
            <input
              type="text"
              id="collective-interest-input"
              name="collective-interest-input"
              class="form-control"
              :class="
                interestInput
                  ? 'collective-form__interest-input-with-text'
                  : 'collective-form__interest-input'
              "
              placeholder="Temas"
              v-model="interestInput"
              maxlength="250"
            />
            <div
              v-if="interestInput"
              style="
                width: calc(100%);
                height: 1px;
                border-left: 1px solid #000;
                border-right: 1px solid #000;
                padding: 0 12px;
              "
            >
              <div style="width: calc(100%); height: 1px; background-color: #000"></div>
            </div>
            <ul v-if="interestInput" class="collective-form__interest-list">
              <li
                v-for="option in filteredSubjects.slice(0, 20)"
                :key="option.id"
                @click="addInterest(option)"
                class="collective-form__interest-list-item"
              >
                <span class="collective-form__interest-list-item-term">{{ option.term }}</span>
              </li>
              <li
                v-if="
                  interestInput.trim() &&
                  !filteredSubjects.some(
                    (opt) => opt.term.toLowerCase() === interestInput.trim().toLowerCase()
                  )
                "
                @click="createNewSubjectFromInterest(interestInput.trim())"
                class="collective-form__interest-list-item collective-form__interest-list-item--new"
              >
                <i class="bi bi-check me-2"></i>
                <span class="collective-form__interest-list-item-term">
                  Adicionar novo termo "<span style="font-weight: 900">{{ interestInput.trim() }}</span>"
                </span>
              </li>
            </ul>
          </div>
        </UiField>
      </div>
      <div
        v-if="isLoadingSubjects && props.collectiveData?.subjects?.length"
        class="d-flex align-items-center gap-2 py-2"
      >
        <span class="spinner-border spinner-border-sm text-secondary" role="status" aria-hidden="true"></span>
        <small class="text-muted">Carregando temas.</small>
      </div>
      <UiField
        v-else-if="selectedInterests.length > 0"
        label="Temas de interesse cadastrados no coletivo"
        labelTag="span"
        explain="Clique no × para remover um tema."
      >
        <div class="d-flex flex-wrap gap-2 mt-2">
          <div
            v-for="interest in selectedInterests"
            :key="interest.id"
            class="btn btn-primary btn-sm btn-tag d-inline-flex align-items-center"
          >
            {{ interest.term }}
            <button
              type="button"
              class="btn-close ms-2"
              aria-label="Remover"
              @click="removeInterest(interest)"
            />
          </div>
        </div>
      </UiField>
    </div>

    <!-- Botões -->
    <div class="row row-cols-2 g-3 mb-5">
      <div class="col">
        <button
          type="button"
          class="btn btn-outline-secondary btn-sm w-100"
          @click="handleCancel"
          :disabled="isSaving"
        >
          Cancelar
        </button>
      </div>
      <div class="col">
        <button
          type="submit"
          class="btn btn-secondary btn-sm w-100"
          :disabled="isSaving || isProcessingImage"
        >
          <span v-if="isSaving">
            <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Salvando...
          </span>
          <span v-else>Salvar alterações</span>
        </button>
      </div>
    </div>
  </form>
</template>

<style lang="scss" scoped>
@use '@/scss/variables' as *;

$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.collective-form {
  &__avatar {
    .collective-form__avatar-preview {
      width: 70px;
      height: 70px;
      background-color: $color-laranja-e;
      border-radius: 50%;
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
      font-size: 12px;
      line-height: 115%;

      i {
        font-size: 12px;
      }
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
    font-size: 14px;
    transition: background-color 0.2s ease;

    &:hover {
      color: var(--Laranja_E);
      background-color: var(--Laranja_C);
    }

    &--new {
      color: var(--Laranja_E);
      border-top: 1px solid #eee;
    }
  }

  &__interest-list-item-term {
    flex: 1;
    font-weight: 400;
  }
}

/* Botões de ícone do campo de redes ("+" e "×"). Sem tamanho definido, o ícone
   crescia livre e deixava o botão mais alto que o campo ao lado — no caso do
   "+", agravado por `fs-8`, classe que sequer existe (a escala vai até fs-6). */
.social-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.social-icon-btn > .bi {
  font-size: 1rem;
  line-height: 1;
}
</style>
