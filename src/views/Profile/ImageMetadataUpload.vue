<template>
  <div class="container py-4 position-relative">
    <transition name="fade">
      <div class="upload-box__alert" v-if="showAlert">
        <div
          class="alert h-auto fs-6 border border-start-3"
          :class="alertType === 'success'
            ? 'alert-success bg-positivo-c text-positivo-e border-success'
            : 'alert-danger bg-negativo-c text-negativo-e border-danger'"
          role="alert"
        >
          <i
            :class="alertType === 'success'
              ? 'bi bi-check-circle-fill text-positivo-e'
              : 'bi bi-exclamation-triangle-fill text-negativo-e'"
          />
          <span>{{ alertMessage }}</span>
          <button
            type="button"
            :class="['btn-close', alertType === 'success' ? 'text-positivo-e' : 'text-negativo-e']"
            data-bs-dismiss="alert"
            aria-label="Close"
            @click="showAlert = false"
          />
        </div>
      </div>
    </transition>

    <div class="row align-items-start gy-4 metadata-upload__layout">
      <div class="col-12 col-md-6 order-1 order-md-1 sticky-preview-panel">
        <ImagePreviewPanel @upload-error="handleUploadError" />
      </div>

      <div class="col-12 col-md-6 order-2 order-md-2">
        <div
          class="d-flex flex-column flex-md-row justify-content-start align-items-start align-items-md-center gap-3 bg-white py-2"
        >
          <ul class="nav nav-underline">
            <li v-for="tab in tabs" :key="tab.section" class="nav-item">
              <a
                class="nav-link"
                :href="`#${tab.section}`"
                :class="{ active: currentSection === tab.section }"
                :aria-current="
                  currentSection === tab.section ? 'page' : undefined
                "
                :data-label="tab.label"
                @click="selectTab(tab.section)"
              >
                {{ tab.label }}
              </a>
            </li>
          </ul>
        </div>

        <div class="metadata-sections">
          <div class="bg-off-white p-2 mb-4" style="border-radius: 5px">
            <div>
              <h2 class="text-muted fst-italic small mb-2">
                Você está publicando como
              </h2>

              <div>
                <div
                  class="d-flex align-items-center p-2"
                  :class="{ 'justify-content-between cursor-pointer rounded': hasCollectives }"
                  @click="hasCollectives ? toggleIdentityDropdown() : null"
                  :role="hasCollectives ? 'button' : undefined"
                >
                  <div
                    class="d-flex align-items-center gap-2"
                    v-if="selectedIdentity"
                  >
                    <div
                      v-if="selectedIdentity.avatar"
                      class="rounded-circle overflow-hidden"
                      style="width: 40px; height: 40px"
                    >
                      <img
                        :src="selectedIdentity.avatar"
                        alt=""
                        class="w-100 h-100 object-fit-cover"
                      />
                    </div>
                    <div
                      v-else
                      class="rounded-circle bg-black text-white d-flex align-items-center justify-content-center fw-bold"
                      style="width: 40px; height: 40px"
                    >
                      {{ selectedIdentity.initials }}
                    </div>

                    <span class="fw-medium">{{ selectedIdentity.name }}</span>
                  </div>
                  <div v-else>Carregando...</div>
                  <i
                    v-if="hasCollectives"
                    class="bi bi-chevron-down transition-transform"
                    :class="{ 'rotate-180': isIdentityDropdownOpen }"
                  />
                </div>

                <div
                  v-if="hasCollectives && isIdentityDropdownOpen"
                  class="w-100 bg-off-white rounded mt-1"
                >
                  <div
                    v-for="identity in availableIdentities"
                    :key="identity.id"
                    class="d-flex align-items-center gap-2 p-2 hover-bg-light cursor-pointer identity-item"
                    @click="selectIdentity(identity)"
                    role="button"
                  >
                    <div
                      v-if="identity.avatar"
                      class="rounded-circle overflow-hidden"
                      style="width: 40px; height: 40px"
                    >
                      <img
                        :src="identity.avatar"
                        alt=""
                        class="w-100 h-100 object-fit-cover"
                      />
                    </div>
                    <div
                      v-else
                      class="rounded-circle bg-black text-white d-flex align-items-center justify-content-center fw-bold"
                      style="width: 40px; height: 40px"
                    >
                      {{ identity.initials }}
                    </div>
                    <span class="fw-medium">{{ identity.name }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section
            id="essenciais"
            class="py-4 p-4 shadow-sm"
            :class="[isEssenciaisInvalid ? 'bg-negativo-c' : 'bg-off-white']"
            style="border-radius: 5px"
          >
            <h2 class="mb-4">Dados essenciais</h2>

            <div class="mb-4 px-3">
              <UiField
                label="Título da imagem"
                explain="Adicione um título para a imagem"
                :invalid="isTitleInvalid"
                invalidMessage="O título da imagem é obrigatório"
              >
                <template #default="{ id, ariaInvalid, ariaDescribedby }">
                  <input
                    :id="id"
                    type="text"
                    class="form-control"
                    :class="{ 'is-invalid': isTitleInvalid }"
                    placeholder="Adicione um título"
                    v-model="form.title"
                    :aria-invalid="ariaInvalid"
                    :aria-describedby="ariaDescribedby"
                    @blur="isTitleTouched = true"
                  />
                </template>
              </UiField>
            </div>

            <div class="mb-4 px-3">
              <div
                class="d-flex justify-content-between align-items-center mb-2"
              >
                <h3 class="form-label text-cinza-e h3 mb-0">
                  Autorizações para publicação
                </h3>
                <a
                  href="#"
                  class="text-decoration-none d-flex align-items-center gap-1 text-muted small"
                >
                  <i class="bi bi-book" /> Revisar Termos e Condições
                </a>
              </div>
              <div
                class="d-flex justify-content-between align-items-center mb-3"
              >
                <label
                  class="form-check-label text-muted fst-italic small"
                  for="isAuthor"
                  >Sou o autor da imagem</label
                >
                <div class="form-check form-switch p-0 m-0">
                  <input
                    class="form-check-input m-0"
                    type="checkbox"
                    role="switch"
                    id="isAuthor"
                    v-model="form.isAuthor"
                  />
                </div>
              </div>

              <template v-if="!form.isAuthor">
                <div
                  class="d-flex justify-content-between align-items-center mb-3"
                >
                  <label
                    class="form-check-label text-muted fst-italic small"
                    for="isPublicDomain"
                    >Imagem está em Domínio Público</label
                  >
                  <div class="form-check form-switch p-0 m-0">
                    <input
                      class="form-check-input m-0"
                      type="checkbox"
                      role="switch"
                      id="isPublicDomain"
                      v-model="form.isPublicDomain"
                    />
                  </div>
                </div>

                <div
                  v-if="!form.isPublicDomain && !form.unknownAuthor"
                  class="d-flex justify-content-between align-items-center mb-4"
                >
                  <label
                    class="form-check-label text-muted fst-italic small"
                    :class="{ 'text-negativo-e': isRightsInvalid }"
                    for="hasAuthorization"
                    >Tenho permissão expressa do autor para disponibilizar a
                    imagem no ARQUIGRAFIA</label
                  >
                  <div class="form-check form-switch p-0 m-0">
                    <input
                      class="form-check-input m-0"
                      type="checkbox"
                      role="switch"
                      id="hasAuthorization"
                      v-model="form.hasAuthorization"
                    />
                  </div>
                </div>

                <div class="mb-2" v-if="!isRightsInvalid">
                  <UiField
                    label="Autoria da imagem"
                    explain="Informe o nome do autor da imagem"
                    :invalid="isAuthorNameInvalid"
                    invalidMessage="O nome do autor é obrigatório"
                  >
                    <template #default="{ id, ariaInvalid, ariaDescribedby }">
                      <input
                        :id="id"
                        type="text"
                        class="form-control"
                        :class="{ 'is-invalid': isAuthorNameInvalid }"
                        placeholder="Nome do autor"
                        v-model="form.authorName"
                        :disabled="form.unknownAuthor"
                        :aria-invalid="ariaInvalid"
                        :aria-describedby="ariaDescribedby"
                        @blur="isAuthorNameTouched = true"
                      />
                    </template>
                  </UiField>
                </div>

                <div
                  class="d-flex justify-content-between align-items-center mb-4"
                >
                  <label
                    class="form-check-label text-muted fst-italic small"
                    for="unknownAuthor"
                    >Não sei quem é o autor da imagem</label
                  >
                  <div class="form-check form-switch p-0 m-0">
                    <input
                      class="form-check-input m-0"
                      type="checkbox"
                      role="switch"
                      id="unknownAuthor"
                      v-model="form.unknownAuthor"
                      @change="
                        form.unknownAuthor
                          ? (form.hasAuthorization = false)
                          : null
                      "
                    />
                  </div>
                </div>
              </template>
            </div>

            <div class="mb-4 px-3" v-if="!isRightsInvalid">
              <div
                class="d-flex justify-content-between align-items-center mb-2"
              >
                <h3 class="form-label text-cinza-e h3 mb-0">
                  Direitos de uso da imagem
                </h3>
                <a
                  href="#"
                  class="text-decoration-none d-flex align-items-center gap-1 text-muted small"
                >
                  <i class="bi bi-book" /> Sobre os Creative Commons
                </a>
              </div>

              <div class="d-flex flex-column gap-2">
                <div
                  v-for="license in licenses"
                  :key="license.value"
                  class="form-check"
                >
                  <input
                    class="form-check-input"
                    type="radio"
                    name="license"
                    :id="license.value"
                    :value="license.value"
                    v-model="form.license"
                  />
                  <label
                    class="form-check-label text-muted fst-italic small"
                    :for="license.value"
                  >
                    <span>{{ license.label }}</span>
                    <span v-if="license.description" class="ms-1">
                      {{ license.description }}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div class="text-end mt-4 text-muted fst-italic small">
              Preenchimento obrigatório
            </div>
          </section>

          <section id="geral" class="py-4">
            <h2 class="mb-4">Dados gerais</h2>

            <div class="mb-4 px-3">
              <UiField label="Obra" explain="Informe a obra relacionada">
                <!-- Selected state -->
                <div v-if="form.work" class="form-control d-flex align-items-center justify-content-between gap-2" style="height: auto; min-height: 38px;">
                  <div class="d-flex flex-column lh-sm">
                    <span class="fw-semibold">{{ form.work.label }}</span>
                    <small v-if="form.work.address" class="text-muted">{{ form.work.address }}</small>
                  </div>
                  <button
                    type="button"
                    class="btn-close flex-shrink-0"
                    aria-label="Remover obra"
                    @click="form.work = null; workInput = ''"
                  />
                </div>
                <!-- Search state -->
                <div v-else class="position-relative">
                  <input
                    type="text"
                    class="form-control"
                    placeholder="Busque por nome ou endereço"
                    v-model="workInput"
                    @input="onWorkInputChange"
                    @focus="showWorkSuggestions = true"
                    @blur="hideWorkSuggestions"
                    autocomplete="off"
                  />
                  <div
                    v-if="showWorkSuggestions && (filteredWorkSuggestions.length > 0 || canShowCreateWork)"
                    class="dropdown-menu w-100 show position-absolute top-100 start-0 mt-1"
                    style="z-index: 1000; max-height: 320px; overflow-y: auto"
                  >
                    <button
                      v-for="work in filteredWorkSuggestions"
                      :key="work.id"
                      type="button"
                      class="dropdown-item d-flex flex-column align-items-start py-2"
                      @click="selectWork(work)"
                    >
                      <span class="fw-semibold">{{ workPrimaryTitle(work) }}</span>
                      <small v-if="workMatchedAlternate(work, workInput)" class="text-muted fst-italic">
                        também conhecido como: {{ workMatchedAlternate(work, workInput) }}
                      </small>
                      <small v-else-if="work.location?.label" class="text-muted">{{ work.location.label }}</small>
                      <small v-if="workMatchedAlternate(work, workInput) && work.location?.label" class="text-muted">{{ work.location.label }}</small>
                    </button>
                    <button
                      v-if="canShowCreateWork"
                      type="button"
                      class="dropdown-item text-primary d-flex align-items-center gap-1"
                      @click="showWorkCreateModal = true; showWorkSuggestions = false"
                    >
                      <i class="bi bi-plus-circle" />
                      <span>Criar obra "{{ workInput.trim() }}"</span>
                    </button>
                  </div>
                </div>
              </UiField>
            </div>

            <div class="mb-4 px-3">
              <UiField
                label="Tags da imagem"
                explain="Adicione tags para classificar a imagem"
              >
                <div class="position-relative">
                  <input
                    type="text"
                    class="form-control"
                    placeholder="Digite uma tag e pressione Enter"
                    v-model="tagInput"
                    @keydown.enter.prevent="addTag"
                    @input="onTagInputChange"
                    @focus="showTagSuggestions = true"
                    @blur="hideTagSuggestions"
                    autocomplete="off"
                  />
                  <div
                    v-if="showTagSuggestions && (filteredTagSuggestions.length > 0 || canCreateSubject)"
                    class="dropdown-menu w-100 show position-absolute top-100 start-0 mt-1"
                    style="z-index: 1000; max-height: 300px; overflow-y: auto"
                  >
                    <button
                      v-for="(suggestion, index) in filteredTagSuggestions"
                      :key="index"
                      type="button"
                      class="dropdown-item"
                      @click="selectTagSuggestion(suggestion.term)"
                    >
                      {{ suggestion.term }}
                    </button>
                    <button
                      v-if="canCreateSubject"
                      type="button"
                      class="dropdown-item text-primary d-flex align-items-center gap-1"
                      :disabled="isCreatingSubject"
                      @click="createAndAddSubject(tagInput.trim())"
                    >
                      <i class="bi bi-plus-circle" />
                      <span>{{ isCreatingSubject ? "Criando..." : `Criar tag "${tagInput.trim()}"` }}</span>
                    </button>
                  </div>
                </div>
              </UiField>
              <div class="d-flex flex-wrap gap-2 mt-2">
                <div
                  v-for="(tag, index) in form.tags"
                  :key="tag"
                  class="btn btn-outline-secondary btn-sm btn-tag d-inline-flex align-items-center"
                >
                  {{ tag }}
                  <button
                    type="button"
                    class="btn-close ms-2"
                    aria-label="Remover"
                    @click="removeTag(index)"
                  />
                </div>
              </div>
            </div>

            <div class="mb-4 px-3">
              <UiField
                label="Descrição da imagem"
                explain="Adicione uma descrição detalhada da imagem"
              >
                <textarea
                  class="form-control"
                  rows="5"
                  placeholder="Texto exemplo"
                  v-model="form.description"
                  maxlength="500"
                ></textarea>
              </UiField>
              <div class="text-end text-muted small mt-1">
                Máximo 500 caracteres.
              </div>
            </div>

            <div class="mb-4 px-3">
              <UiField
                label="Data da imagem"
                explain="Informe a data de criação da imagem"
              >
                <div class="d-flex flex-column gap-3">
                  <div v-if="form.dateType === 'year'" style="width: 120px">
                    <input
                      type="number"
                      class="form-control"
                      v-model="dateYearInput"
                      placeholder="Ano"
                    />
                  </div>
                  <div v-else class="d-flex align-items-center gap-2">
                    <span>Entre</span>
                    <div style="width: 120px">
                      <input
                        type="number"
                        class="form-control"
                        v-model="dateYearInput"
                        placeholder="Ano"
                      />
                    </div>
                    <span>e</span>
                    <div style="width: 120px">
                      <input
                        type="number"
                        class="form-control"
                        v-model="dateEndYearInput"
                        placeholder="Ano"
                      />
                    </div>
                  </div>

                  <div class="d-flex gap-4">
                    <div class="form-check">
                      <input
                        class="form-check-input"
                        type="radio"
                        name="dateType"
                        id="dateTypeYear"
                        value="year"
                        v-model="form.dateType"
                      />
                      <label class="form-check-label" for="dateTypeYear"
                        >Ano</label
                      >
                    </div>
                    <div class="form-check">
                      <input
                        class="form-check-input"
                        type="radio"
                        name="dateType"
                        id="dateTypeInterval"
                        value="interval"
                        v-model="form.dateType"
                      />
                      <label class="form-check-label" for="dateTypeInterval"
                        >Intervalo</label
                      >
                    </div>
                  </div>

                  <div class="d-flex gap-4">
                    <div class="form-check">
                      <input
                        class="form-check-input"
                        type="radio"
                        name="dateAccuracy"
                        id="dateAccExact"
                        value="exact"
                        v-model="form.dateAccuracy"
                      />
                      <label class="form-check-label" for="dateAccExact"
                        >Data exata</label
                      >
                    </div>
                    <div class="form-check">
                      <input
                        class="form-check-input"
                        type="radio"
                        name="dateAccuracy"
                        id="dateAccApprox"
                        value="approximate"
                        v-model="form.dateAccuracy"
                      />
                      <label class="form-check-label" for="dateAccApprox"
                        >Data aproximada</label
                      >
                    </div>
                  </div>
                </div>
              </UiField>
            </div>
          </section>

          <section id="localizacao" class="py-4">
            <h2 class="mb-4">Localização</h2>

            <div class="mb-4">
              <UiField
                label="Buscar por localidade"
                explain="Busque e selecione a localidade no mapa"
              >
                <div class="position-relative mb-3">
                  <div class="input-group">
                    <input
                      type="text"
                      class="form-control"
                      placeholder="Ex: Av. Paulista, 1578, São Paulo"
                      v-model="form.location"
                      @keydown.enter.prevent="searchLocation"
                      @focus="showLocationSuggestions = true"
                      @blur="hideLocationSuggestions"
                      autocomplete="off"
                    />
                    <button
                      type="button"
                      class="btn btn-outline-secondary"
                      @click="searchLocation"
                    >
                      <i class="bi bi-search" />
                    </button>
                  </div>
                  <div
                    v-if="showLocationSuggestions && locationSuggestions.length > 0"
                    class="dropdown-menu w-100 show position-absolute top-100 start-0 mt-1"
                    style="z-index: 1000; max-height: 300px; overflow-y: auto"
                  >
                    <button
                      v-for="(suggestion, index) in locationSuggestions"
                      :key="index"
                      type="button"
                      class="dropdown-item text-wrap small"
                      @click="selectLocationSuggestion(suggestion)"
                    >
                      {{ suggestion.display_name }}
                    </button>
                  </div>
                </div>
              </UiField>

              <h3 class="form-label text-cinza-e h3 mb-2">
                Selecione no mapa a localização de sua imagem
              </h3>

              <div
                class="map-container overflow-hidden border"
                style="height: 400px"
              >
                <MapLibreMap
                  :style-url="mapStyleUrl"
                  :center="mapCenter"
                  :zoom="mapZoom"
                  :marker-position="form.coordinates"
                  @map-ready="handleMapReady"
                  @map-error="handleMapError"
                  @click="handleMapClick"
                  clickable
                  marker-color="#0f89e1"
                >
                  <MapControls
                    class="position-absolute bottom-0 start-50 translate-middle-x mb-3"
                    @zoom-in="zoomIn"
                    @zoom-out="zoomOut"
                  />
                  <button
                    v-if="form.coordinates"
                    type="button"
                    class="position-absolute top-0 end-0 m-2 btn btn-sm btn-light border"
                    style="z-index: 1"
                    @click="form.coordinates = null"
                  >
                    <i class="bi bi-x-circle me-1" />Remover marcador
                  </button>
                </MapLibreMap>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>

  <div class="preview-actions-bar">
    <div class="form-check mb-0">
      <input
        class="form-check-input"
        type="checkbox"
        id="sameDataToggle"
        v-model="useSameDataForAll"
        @change="handleSameDataToggle"
      />
      <label class="form-check-label" for="sameDataToggle">
        Usar mesmos dados para todos os arquivos enviados
      </label>
    </div>
    <div class="d-flex gap-3">
      <button class="btn btn-outline-secondary" @click="handleCancel">
        Cancelar
      </button>
      <button
        class="btn btn-primary"
        :disabled="!canSubmit"
        @click="handleSubmit"
      >
        Enviar imagens
      </button>
    </div>
  </div>

  <WorkCreateModal
    v-model="showWorkCreateModal"
    @created="onWorkCreated"
  />
</template>

<script setup>
import { ref, markRaw, computed, watch, onMounted } from "vue";
import axios from "@/axios";
import ImagePreviewPanel from "@/components/imageMetadaUpload/ImagePreviewPanel.vue";
import UiField from "@/components/ui/UiField.vue";
import MapLibreMap from "@/components/map/MapLibreMap.vue";
import MapControls from "@/components/map/MapControls.vue";
import WorkCreateModal from "@/components/work/WorkCreateModal.vue";
import { useImageUploadStore } from "@/store/imageUploads";
import { useAuthStore } from "@/store/auth";
import { useVracStore } from "@/store/vrac";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { formatDate, parseYearFromDateString } from "@/helpers/dateUtils";
import Fuse from "fuse.js";
defineOptions({ name: "ImageMetadataUpload" });

const API_BASE_URL = import.meta.env.VITE_BASE_REQUEST_URL;

const router = useRouter();
const imageUploadStore = useImageUploadStore();
const { pendingImages, selectedIndex } = storeToRefs(imageUploadStore);
const authStore = useAuthStore();
const { loggedUser } = storeToRefs(authStore);
const vracStore = useVracStore();

const tabs = [
  { label: "Essenciais", section: "essenciais" },
  { label: "Geral", section: "geral" },
  { label: "Localização", section: "localizacao" },
];

const isIdentityDropdownOpen = ref(false);
const selectedIdentityId = ref(null);

const getInitials = (name) => name?.charAt(0).toUpperCase() || "?";

const resolveAvatarUrl = (entity) => {
  if (entity.avatar_url) {
    return entity.avatar_url.startsWith("http") ? entity.avatar_url : `${API_BASE_URL}${entity.avatar_url}`;
  }
  if (entity.avatar_path) {
    return `${API_BASE_URL}/storage/${entity.avatar_path}`;
  }
  return null;
};

// All publishing identities: the user + their collectives
const publishingIdentities = computed(() => {
  if (!loggedUser.value) return [];
  const user = loggedUser.value;
  const identities = [
    {
      id: user.id,
      type: "user",
      name: user.name || user.username,
      avatar: resolveAvatarUrl(user),
      initials: user.initials || getInitials(user.name || user.username),
    },
  ];
  if (Array.isArray(user.collectives)) {
    for (const collective of user.collectives) {
      identities.push({
        id: collective.id,
        type: "collective",
        name: collective.name,
        avatar: resolveAvatarUrl(collective),
        initials: getInitials(collective.name),
      });
    }
  }
  return identities;
});

// Default to user identity
const selectedIdentity = computed(() => {
  if (!publishingIdentities.value.length) return null;
  if (!selectedIdentityId.value) return publishingIdentities.value[0];
  return publishingIdentities.value.find((i) => i.id === selectedIdentityId.value) || publishingIdentities.value[0];
});

const hasCollectives = computed(() =>
  Array.isArray(loggedUser.value?.collectives) && loggedUser.value.collectives.length > 0
);

const availableIdentities = computed(() => {
  return publishingIdentities.value.filter(
    (identity) => identity.id !== selectedIdentity.value?.id
  );
});

const toggleIdentityDropdown = () => {
  isIdentityDropdownOpen.value = !isIdentityDropdownOpen.value;
};

const selectIdentity = (identity) => {
  selectedIdentityId.value = identity.id;
  isIdentityDropdownOpen.value = false;
};

const currentSection = ref("essenciais");
const showAlert = ref(false);
const alertMessage = ref("");
const alertType = ref("error"); // 'error' | 'success'

const isTitleTouched = ref(false);
const isTitleInvalid = computed(
  () => isTitleTouched.value && !form.value.title.trim()
);

const isAuthorNameTouched = ref(false);
const isAuthorNameInvalid = computed(() => {
  // Só valida se: não é autor, tem autorização e não marcou "autor desconhecido"
  const shouldValidate =
    !form.value.isAuthor &&
    !form.value.isPublicDomain &&
    form.value.hasAuthorization &&
    !form.value.unknownAuthor;

  return (
    shouldValidate && isAuthorNameTouched.value && !form.value.authorName.trim()
  );
});

const defaultForm = {
  title: "",
  isAuthor: true,
  isPublicDomain: false,
  authorName: "",
  unknownAuthor: false,
  hasAuthorization: true,
  license: "CC BY-NC-SA",
  work: null,
  tags: [],
  description: "",
  date: "",
  dateEnd: "",
  dateType: "year",
  dateAccuracy: "exact",
  location: "",
  coordinates: null,
};

const form = ref({ ...defaultForm });

const useSameDataForAll = ref(false);

const formatExifDateToIso = (exifDate) => {
  if (!exifDate) return "";
  try {
    const date = exifDate instanceof Date ? exifDate : new Date(exifDate);
    if (isNaN(date.getTime())) return "";
    return formatDate(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate()
    );
  } catch {
    return "";
  }
};

const yearToDateString = (year, isEnd = false) => {
  if (!year) return "";
  const parsedYear = parseInt(year, 10);
  if (isNaN(parsedYear)) return "";
  return formatDate(parsedYear, isEnd ? 12 : 1, isEnd ? 31 : 1);
};

watch(
  selectedIndex,
  (newIndex) => {
    if (pendingImages.value[newIndex]) {
      const currentImage = pendingImages.value[newIndex];
      const storedMetadata = currentImage.metadata || {};

      const tags = storedMetadata.tags
        ? [...storedMetadata.tags]
        : [...defaultForm.tags];

      // Usa coordenadas do EXIF se disponíveis e não houver coordenadas salvas no metadata
      const coordinates =
        storedMetadata.coordinates ||
        (currentImage.exif?.coordinates
          ? { ...currentImage.exif.coordinates }
          : null);

      // Usa data do EXIF se disponível e não houver data salva no metadata
      const exifDate = formatExifDateToIso(currentImage.exif?.date);
      let date = storedMetadata.date || exifDate || defaultForm.date;
      let dateEnd = storedMetadata.dateEnd || exifDate || defaultForm.dateEnd;

      // If EXIF date exists, use it for both date and dateEnd
      if (exifDate && !storedMetadata.date) {
        date = exifDate;
        dateEnd = exifDate;
      }
      // If user-provided date exists and dateType is 'year', expand to full year
      else if (date && !storedMetadata.dateEnd && form.value.dateType === 'year') {
        const year = parseYearFromDateString(date);
        if (year) {
          date = formatDate(year, 1, 1);
          dateEnd = formatDate(year, 12, 31);
        }
      }
      // If user-provided date exists and dateType is 'interval', expand both dates
      else if (date && dateEnd && form.value.dateType === 'interval') {
        const startYear = parseYearFromDateString(date);
        const endYear = parseYearFromDateString(dateEnd);
        if (startYear) date = formatDate(startYear, 1, 1);
        if (endYear) dateEnd = formatDate(endYear, 12, 31);
      }

      const dateAccuracy =
        storedMetadata.dateAccuracy ||
        (exifDate ? "exact" : defaultForm.dateAccuracy);

      form.value = {
        ...defaultForm,
        ...storedMetadata,
        tags,
        coordinates,
        date,
        dateEnd,
        dateAccuracy,
      };

      isTitleTouched.value = false;
      isAuthorNameTouched.value = false;
    }
  },
  { immediate: true }
);

watch(
  form,
  (newForm) => {
    if (pendingImages.value[selectedIndex.value]) {
      const metadataToSave = {
        ...newForm,
        tags: [...newForm.tags],
      };
      imageUploadStore.updateMetadata(selectedIndex.value, metadataToSave);

      // Se o toggle está ativo, propaga para todas as outras imagens
      if (useSameDataForAll.value) {
        pendingImages.value.forEach((_, index) => {
          if (index !== selectedIndex.value) {
            imageUploadStore.updateMetadata(index, {
              ...metadataToSave,
              tags: [...metadataToSave.tags],
            });
          }
        });
      }
    }
  },
  { deep: true }
);

const mapStyleUrl = "https://tiles.openfreemap.org/styles/positron";
const mapCenter = [-51.9253, -14.235]; // Brasil
const mapZoom = 2;
const mapInstance = ref(null);

const handleMapReady = (map) => {
  mapInstance.value = markRaw(map);
};

const handleMapError = (error) => {
  console.error("Erro no mapa:", error);
};

const handleMapClick = ({ lng, lat }) => {
  form.value.coordinates = { lng, lat };
};

const zoomIn = () => {
  mapInstance.value?.zoomIn();
};

const zoomOut = () => {
  mapInstance.value?.zoomOut();
};

// Location geocoding
const locationSuggestions = ref([]);
const showLocationSuggestions = ref(false);

const searchLocation = async () => {
  const query = form.value.location.trim();
  if (!query || query.length < 3) {
    locationSuggestions.value = [];
    return;
  }
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
      { headers: { "Accept-Language": "pt-BR,pt" } }
    );
    locationSuggestions.value = await response.json();
  } catch (error) {
    console.warn("Erro ao buscar localidade:", error);
  }
};

const selectLocationSuggestion = (suggestion) => {
  const lng = parseFloat(suggestion.lon);
  const lat = parseFloat(suggestion.lat);
  form.value.location = suggestion.display_name;
  form.value.coordinates = { lng, lat };
  mapInstance.value?.flyTo({ center: [lng, lat], zoom: 14 });
  locationSuggestions.value = [];
  showLocationSuggestions.value = false;
};

const hideLocationSuggestions = () => {
  setTimeout(() => {
    showLocationSuggestions.value = false;
  }, 200);
};

const isRightsInvalid = computed(() => {
  return (
    !form.value.isAuthor &&
    !form.value.isPublicDomain &&
    !form.value.hasAuthorization
  );
});

const isEssenciaisInvalid = computed(
  () =>
    isRightsInvalid.value || isTitleInvalid.value || isAuthorNameInvalid.value
);

const dateYearInput = computed({
  get() {
    const dateStr = form.value.date;
    if (!dateStr) return "";
    const year = parseYearFromDateString(dateStr);
    return year ? year.toString() : "";
  },
  set(yearStr) {
    form.value.date = yearToDateString(yearStr, false);
    form.value.dateEnd = yearToDateString(yearStr, true);
  },
});

const dateEndYearInput = computed({
  get() {
    const dateStr = form.value.dateEnd;
    if (!dateStr) return "";
    const year = parseYearFromDateString(dateStr);
    return year ? year.toString() : "";
  },
  set(yearStr) {
    form.value.dateEnd = yearToDateString(yearStr, true);
  },
});

const tagInput = ref("");

// Tag autocomplete state
const allSubjects = ref([]);
const filteredTagSuggestions = ref([]);
const showTagSuggestions = ref(false);
const isCreatingSubject = ref(false);
let fuseInstance = null;
let debounceTimer = null;

const canCreateSubject = computed(() => {
  const term = tagInput.value.trim();
  if (!term) return false;
  if (form.value.tags.includes(term)) return false;
  return !allSubjects.value.some(
    (s) => s.term.toLowerCase() === term.toLowerCase()
  );
});

// Contributor names state
const allContributorNames = ref([]);

// Fetch fresh user data, subjects, and contributor names on mount
onMounted(async () => {
  try {
    // Refresh user data so collectives are up-to-date
    await authStore.getLoggedUser();

    // Fetch subjects
    const subjects = await vracStore.getVRACSubjects();
    if (Array.isArray(subjects)) {
      allSubjects.value = subjects;
      // Initialize Fuse.js with fetched subjects
      fuseInstance = new Fuse(allSubjects.value, {
        keys: ["term"],
        threshold: 0.3, // Allow fuzzy matching
        includeScore: true,
      });
    }

    // Fetch contributor names
    const contributors = await vracStore.getVRACContributorNames();
    if (Array.isArray(contributors)) {
      allContributorNames.value = contributors;
    }

    // Fetch works
    const works = await vracStore.getVRACWorks();
    if (Array.isArray(works)) {
      allWorks.value = works;
      workFuse = new Fuse(allWorks.value, {
        keys: [
          { name: "titles.label", weight: 0.7 },
          { name: "location.label", weight: 0.3 },
        ],
        threshold: 0.3,
        includeScore: true,
      });
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
});

// Debounced search function
const onTagInputChange = () => {
  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    if (!tagInput.value.trim()) {
      filteredTagSuggestions.value = [];
      return;
    }

    if (fuseInstance) {
      const results = fuseInstance.search(tagInput.value);
      // Filter out tags that are already added
      filteredTagSuggestions.value = results
        .map(result => result.item) // extract the actual subject
        .filter(item => !form.value.tags.includes(item.term))
        .slice(0, 10);
    }
  }, 300); // 300ms debounce
};

const hideTagSuggestions = () => {
  // Small delay to allow click on suggestion before hiding
  setTimeout(() => {
    showTagSuggestions.value = false;
  }, 200);
};

const selectTagSuggestion = (term) => {
  if (!form.value.tags.includes(term)) {
    form.value.tags.push(term);
  }
  tagInput.value = "";
  filteredTagSuggestions.value = [];
  showTagSuggestions.value = false;
};

const createAndAddSubject = async (term) => {
  if (!term || form.value.tags.includes(term) || isCreatingSubject.value) return;
  isCreatingSubject.value = true;
  try {
    const subjectData = await vracStore.addVRACSubject(term);
    if (subjectData?.id && subjectData?.term) {
      allSubjects.value.push(subjectData);
      fuseInstance = new Fuse(allSubjects.value, {
        keys: ["term"],
        threshold: 0.3,
        includeScore: true,
      });
      form.value.tags.push(subjectData.term);
    } else {
      form.value.tags.push(term);
    }
    tagInput.value = "";
    filteredTagSuggestions.value = [];
    showTagSuggestions.value = false;
  } catch {
    alertType.value = "error";
    alertMessage.value = "Não foi possível criar o assunto. Tente novamente.";
    showAlert.value = true;
  } finally {
    isCreatingSubject.value = false;
  }
};

const addTag = async () => {
  const term = tagInput.value.trim();
  if (!term) return;
  if (form.value.tags.includes(term)) {
    tagInput.value = "";
    return;
  }
  const exactMatch = allSubjects.value.find(
    (s) => s.term.toLowerCase() === term.toLowerCase()
  );
  if (exactMatch) {
    selectTagSuggestion(exactMatch.term);
  } else {
    await createAndAddSubject(term);
  }
};

const removeTag = (index) => {
  form.value.tags.splice(index, 1);
};

// Work autocomplete state
const showWorkCreateModal = ref(false);
const allWorks = ref([]);
const workInput = ref("");
const filteredWorkSuggestions = ref([]);
const showWorkSuggestions = ref(false);
let workFuse = null;
let workDebounceTimer = null;

const workPrimaryTitle = (work) => {
  const titles = work?.titles || [];
  const preferred = titles.find((t) => t.pref);
  return (preferred || titles[0])?.label || "(sem título)";
};

const workMatchedAlternate = (work, query) => {
  if (!query?.trim()) return null;
  const q = query.trim().toLowerCase();
  const preferred = workPrimaryTitle(work).toLowerCase();
  if (preferred.includes(q)) return null;
  const alt = (work?.titles || []).find(
    (t) => !t.pref && t.label.toLowerCase().includes(q)
  );
  return alt?.label || null;
};

const canShowCreateWork = computed(() => {
  const term = workInput.value.trim();
  return term.length > 0;
});

watch(
  () => form.value.work,
  (selected) => {
    if (!selected) workInput.value = "";
  }
);

const onWorkInputChange = () => {
  if (form.value.work && workInput.value !== form.value.work.label) {
    form.value.work = null;
  }

  if (workDebounceTimer) clearTimeout(workDebounceTimer);

  workDebounceTimer = setTimeout(() => {
    if (!workInput.value.trim()) {
      filteredWorkSuggestions.value = [];
      return;
    }

    if (workFuse) {
      const results = workFuse.search(workInput.value);
      filteredWorkSuggestions.value = results
        .map((result) => result.item)
        .slice(0, 10);
    }
  }, 300);
};

const hideWorkSuggestions = () => {
  setTimeout(() => {
    showWorkSuggestions.value = false;
  }, 200);
};

const selectWork = (work) => {
  form.value.work = {
    id: work.id,
    label: workPrimaryTitle(work),
    address: work.location?.label || null,
  };
  filteredWorkSuggestions.value = [];
  showWorkSuggestions.value = false;
};

// The modal emits a self-contained draft. No backend records are created here —
// see `materializeWork` for the actual POSTs, deferred until image submit.
const onWorkCreated = (draft) => {
  form.value.work = {
    draft,
    label: draft.label || "(sem título)",
    address: draft.address || null,
  };
  filteredWorkSuggestions.value = [];
  showWorkSuggestions.value = false;
};

// Materialize a draft into a real VRACWork. Called only when the image upload
// is actually submitted, so cancelling never leaves orphan records.
const materializeWork = async (draft) => {
  const authHeader = { Authorization: authStore.authHeader };

  const titleIds = [];
  for (const t of draft.titles) {
    const res = await axios.post(
      "/api/vrac-titles",
      { label: t.label, type: t.type, pref: t.pref },
      { headers: authHeader }
    );
    titleIds.push(res.data.title.id);
  }

  // Resolve agent role labels → IDs (lookup, else create with lowercased label)
  let roles = null;
  const roleIdCache = {};
  const resolveRoleId = async (label) => {
    if (roleIdCache[label]) return roleIdCache[label];
    if (!roles) roles = (await vracStore.getVRACAgentRoles()) || [];
    const match = roles.find((r) => r.label?.toLowerCase() === label.toLowerCase());
    if (match) {
      roleIdCache[label] = match.id;
      return match.id;
    }
    const res = await axios.post(
      "/api/vrac-agent-roles",
      { label: label.toLowerCase() },
      { headers: authHeader }
    );
    const id = res.data.role.id;
    roles.push(res.data.role);
    roleIdCache[label] = id;
    return id;
  };

  const agentIds = [];
  for (const a of draft.agents) {
    let contribId = a.contributorNameId;
    if (!contribId) {
      const res = await axios.post(
        "/api/vrac-contributor-names",
        { name: a.contributorName, type: "personal" },
        { headers: authHeader }
      );
      contribId = res.data.name.id;
    }
    const roleId = await resolveRoleId(a.roleLabel);
    const res = await axios.post(
      "/api/vrac-agents",
      { contributor_name_id: contribId, role_id: roleId },
      { headers: authHeader }
    );
    agentIds.push(res.data.agent.id);
  }

  const dateIds = [];
  for (const d of draft.dates) {
    const res = await axios.post("/api/vrac-dates", d, { headers: authHeader });
    dateIds.push(res.data.date.id);
  }

  // Vocab buckets: existing IDs are used as-is; new terms are POSTed first (lowercased).
  const VOCAB_CREATE = {
    stylePeriods: { endpoint: "vrac-style-periods",     payload: (v) => ({ label: v }),                              responseKey: "period"    },
    culturalCtxs: { endpoint: "vrac-cultural-contexts", payload: (v) => ({ label: v, vocab: "ARQUIGRAFIA" }),         responseKey: "context"   },
    workTypes:    { endpoint: "vrac-work-types",        payload: (v) => ({ label: v, vocab: "ARQUIGRAFIA" }),         responseKey: "work_type" },
    techniques:   { endpoint: "vrac-techniques",        payload: (v) => ({ label: v, vocab: "ARQUIGRAFIA" }),         responseKey: "technique" },
    materials:    { endpoint: "vrac-materials",         payload: (v) => ({ label: v, type: "other", vocab: "ARQUIGRAFIA" }), responseKey: "material"  },
    subjects:     { endpoint: "vrac-subjects",          payload: (v) => ({ term: v, type: "otherTopic", vocab: "ARQUIGRAFIA" }), responseKey: "data" },
  };

  const resolvedVocab = {};
  for (const key of Object.keys(VOCAB_CREATE)) {
    const bucket = draft[key] || { existing: [], newTerms: [] };
    const ids = [...bucket.existing];
    const cfg = VOCAB_CREATE[key];
    for (const term of bucket.newTerms) {
      const lower = term.toLowerCase();
      const res = await axios.post(`/api/${cfg.endpoint}`, cfg.payload(lower), { headers: authHeader });
      const created = res.data[cfg.responseKey];
      if (created?.id) ids.push(created.id);
    }
    resolvedVocab[key] = ids;
  }

  const workPayload = {
    latitude: draft.coords.lat,
    longitude: draft.coords.lng,
    location_label: draft.locationLabel || undefined,
    titles: titleIds,
  };
  if (agentIds.length)                       workPayload.agents            = agentIds;
  if (dateIds.length)                        workPayload.dates             = dateIds;
  if (draft.description)                     workPayload.description       = draft.description;
  if (resolvedVocab.stylePeriods.length)     workPayload.style_periods     = resolvedVocab.stylePeriods;
  if (resolvedVocab.culturalCtxs.length)     workPayload.cultural_contexts = resolvedVocab.culturalCtxs;
  if (resolvedVocab.workTypes.length)        workPayload.work_types        = resolvedVocab.workTypes;
  if (resolvedVocab.techniques.length)       workPayload.techniques        = resolvedVocab.techniques;
  if (resolvedVocab.materials.length)        workPayload.materials         = resolvedVocab.materials;
  if (resolvedVocab.subjects.length)         workPayload.subjects          = resolvedVocab.subjects;

  const workRes = await axios.post("/api/vrac-works", workPayload, { headers: authHeader });
  return workRes.data.data;
};

const licenses = [
  { value: "CC-0", label: "CC-0", description: "" },
  {
    value: "CC BY",
    label: "CC BY",
    description:
      "Permite: uso comercial, alterações, compartilhamento sob outras licenças",
  },
  {
    value: "CC BY-SA",
    label: "CC BY-SA",
    description:
      "Permite: uso comercial, alterações. Não permite: compartilhamento sob outras licenças",
  },
  {
    value: "CC BY-NC",
    label: "CC BY-NC",
    description:
      "Permite: alterações, compartilhamento com outras licenças. Não permite: uso comercial",
  },
  {
    value: "CC BY-NC-SA",
    label: "CC BY-NC-SA",
    description:
      "Permite: alterações. Não permite: uso comercial, compartilhamento sob outras licenças",
  },
  {
    value: "CC BY-ND",
    label: "CC BY-ND",
    description: "Permite: uso comercial. Não permite: alterações",
  },
  {
    value: "CC BY-NC-ND",
    label: "CC BY-NC-ND",
    description: "Não permite: uso comercial, alterações",
  },
];

const selectTab = (section) => {
  currentSection.value = section;
};

const handleUploadError = (message) => {
  alertType.value = "error";
  alertMessage.value = message;
  showAlert.value = true;
};

const isMetadataValid = (metadata) => {
  if (!metadata.title?.trim()) {
    return false;
  }

  if (metadata.isAuthor || metadata.isPublicDomain) {
    return true;
  }

  if (!metadata.hasAuthorization && !metadata.unknownAuthor) {
    return false;
  }

  if (
    metadata.hasAuthorization &&
    !metadata.unknownAuthor &&
    !metadata.authorName?.trim()
  ) {
    return false;
  }

  return true;
};

const canSubmit = computed(() => {
  if (pendingImages.value.length === 0) {
    return false;
  }

  return pendingImages.value.every((image) => {
    const metadata = image.metadata || {};
    return isMetadataValid(metadata);
  });
});

const handleSameDataToggle = () => {
  if (useSameDataForAll.value) {
    const currentMetadata = { ...form.value, tags: [...form.value.tags] };

    pendingImages.value.forEach((_, index) => {
      if (index !== selectedIndex.value) {
        imageUploadStore.updateMetadata(index, {
          ...currentMetadata,
          tags: [...currentMetadata.tags],
        });
      }
    });
  }
};

const handleCancel = () => {
  imageUploadStore.clearImages();
  router.back();
};

const handleSubmit = async () => {
  if (!canSubmit.value) {
    alertType.value = "error";
    alertMessage.value =
      "Por favor, preencha todos os dados obrigatórios de todas as imagens.";
    showAlert.value = true;
    return;
  }

  try {
    const successfulUploads = [];
    const failedUploads = [];

    // Process each image individually
    for (let index = 0; index < pendingImages.value.length; index++) {
      const image = pendingImages.value[index];
      const metadata = image.metadata || {};

      try {
        // Map selected tags to their UUIDs from allSubjects
        const subjectUuids = (metadata.tags || [])
          .map((tagTerm) => {
            const subject = allSubjects.value.find((s) => s.term === tagTerm);
            return subject ? subject.id : null;
          })
          .filter((id) => id !== null);

        // Find or create photographer UUID
        // If isAuthor is true, use logged user's name, otherwise use authorName
        let photographerUuid = null;
        let photographerName = null;

        if (metadata.isAuthor && loggedUser.value?.name) {
          photographerName = loggedUser.value.name.trim();
        } else if (metadata.authorName && metadata.authorName.trim()) {
          photographerName = metadata.authorName.trim();
        }

        if (photographerName) {
          let contributor = allContributorNames.value.find(
            (c) => c.name.toLowerCase() === photographerName.toLowerCase()
          );

          // If photographer doesn't exist, create it
          if (!contributor) {
            const newContributor = await vracStore.addVRACContributorName(
              photographerName
            );
            if (newContributor?.id) {
              contributor = newContributor;
              allContributorNames.value.push(contributor);
            }
          }

          photographerUuid = contributor?.id || null;
        }

        // Create FormData for this specific image
        const formData = new FormData();
        formData.append("image", image.file);
        formData.append("user_id", loggedUser.value.id);
        if (selectedIdentity.value?.type === "collective") {
          formData.append("collective_id", selectedIdentity.value.id);
        }
        formData.append("title", metadata.title || "");
        formData.append("license", metadata.license || "CC BY-NC-SA");

        // Add optional fields
        if (photographerUuid) {
          formData.append("photographer", photographerUuid);
        }
        if (metadata.description) {
          formData.append("description", metadata.description);
        }
        if (metadata.date) {
          formData.append("earliest_date", metadata.date);
        }
        if (metadata.dateEnd) {
          formData.append("latest_date", metadata.dateEnd);
        }
        if (metadata.dateAccuracy === "approximate") {
          formData.append("circa", "1");
        }
        else {
          formData.append("circa", "0");
        }
        if (metadata.coordinates) {
          // Ensure coordinates have decimal places (Laravel expects decimal:1,8)
          const lat = parseFloat(metadata.coordinates.lat).toFixed(8);
          const lng = parseFloat(metadata.coordinates.lng).toFixed(8);
          formData.append("latitude", lat);
          formData.append("longitude", lng);
        }
        if (metadata.location) {
          formData.append("location_label", metadata.location);
        }

        // Add subjects array
        subjectUuids.forEach((uuid) => {
          formData.append("subjects[]", uuid);
        });

        // Add selected work (single-select but backend expects array).
        // If the work is still a draft from WorkCreateModal, materialize it now —
        // this is the first moment the user has committed to the upload.
        let workId = metadata.work?.id || null;
        if (!workId && metadata.work?.draft) {
          const newWork = await materializeWork(metadata.work.draft);
          workId = newWork?.id || null;
          if (workId) {
            // Persist the resolved id so a retry of this image doesn't re-create the work.
            metadata.work.id = workId;
            metadata.work.draft = null;
            allWorks.value.push(newWork);
            workFuse = new Fuse(allWorks.value, {
              keys: [
                { name: "titles.label", weight: 0.7 },
                { name: "location.label", weight: 0.3 },
              ],
              threshold: 0.3,
              includeScore: true,
            });
          }
        }
        if (workId) {
          formData.append("works[]", workId);
        }

        // Log FormData entries for debugging
        console.log(`\n=== FormData for Image ${index + 1} ===`);
        for (const [key, value] of formData.entries()) {
          if (value instanceof File) {
            console.log(`${key}: [File] ${value.name} (${value.size} bytes)`);
          } else {
            console.log(`${key}: ${value}`);
          }
        }
        console.log("===========================\n");

        // Submit this image
        const response = await axios.post("/api/images", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: authStore.authHeader,
          },
        });

        if (response.status === 201 || response.status === 200) {
          successfulUploads.push(metadata.title || `Imagem ${index + 1}`);
        }
      } catch (error) {
        console.error(`Erro ao enviar imagem ${index + 1}:`, error);
        failedUploads.push({
          title: metadata.title || `Imagem ${index + 1}`,
          error: error.response?.data?.message || error.message,
        });
      }
    }

    // Show results
    if (successfulUploads.length > 0 && failedUploads.length === 0) {
      alertType.value = "success";
      alertMessage.value = `${successfulUploads.length} ${
        successfulUploads.length === 1 ? "imagem enviada" : "imagens enviadas"
      } com sucesso!`;
      showAlert.value = true;

      // Clear images and redirect after a short delay
      setTimeout(() => {
        imageUploadStore.clearImages();
        router.push("/profile");
      }, 2500);
    } else if (failedUploads.length > 0) {
      alertType.value = "error";
      const message =
        successfulUploads.length > 0
          ? `${successfulUploads.length} ${
              successfulUploads.length === 1
                ? "imagem enviada"
                : "imagens enviadas"
            } com sucesso. ${failedUploads.length} ${
              failedUploads.length === 1 ? "falhou" : "falharam"
            }.`
          : `Erro ao enviar ${failedUploads.length} ${
              failedUploads.length === 1 ? "imagem" : "imagens"
            }.`;

      alertMessage.value = message;
      showAlert.value = true;

      // If some succeeded, remove them from the list
      if (successfulUploads.length > 0) {
        setTimeout(() => {
          // Remove successful uploads from pending
          const remainingImages = pendingImages.value.filter((img) => {
            const title = img.metadata?.title || "";
            return !successfulUploads.includes(title);
          });

          if (remainingImages.length === 0) {
            imageUploadStore.clearImages();
            router.push("/profile");
          }
        }, 2000);
      }
    }
  } catch (error) {
    console.error("Erro ao enviar imagens:", error);
    alertType.value = "error";
    alertMessage.value =
      error.response?.data?.message ||
      "Erro ao enviar imagens. Por favor, tente novamente.";
    showAlert.value = true;
  }
};
</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.upload-box__alert {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  max-width: 90%;
  z-index: 1050;
  width: max-content;

  @media (min-width: 768px) {
    max-width: 50%;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}

.form-check-input[role="switch"]:checked {
  background-color: var(--Azul_M);
  border-color: var(--Azul_M);
}

.cursor-pointer {
  cursor: pointer;
}

.hover-bg-light:hover {
  background-color: #f8f9fa;
}

.transition-transform {
  transition: transform 0.2s ease-in-out;
}

.rotate-180 {
  transform: rotate(180deg);
}

.identity-item {
  border-top: 1px solid color-mix(in srgb, var(--Cinza_C), transparent 50%);
}

.preview-actions-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: white;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.75rem;
  box-shadow: 2px -2px 5px 2px rgba(0, 0, 0, 0.1);
  z-index: 1000;

  .d-flex.gap-3 {
    width: 100%;

    .btn {
      flex: 1;
    }
  }

  @include md {
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    gap: 3rem;
    padding: 1rem 2rem;

    .d-flex.gap-3 {
      width: auto;

      .btn {
        flex: unset;
      }
    }
  }
}

.preview-actions-bar button {
  font-weight: 400;
  font-size: 14px;
  line-height: 150%;
}

@media (min-width: 768px) {
  .sticky-preview-panel {
    position: sticky;
    top: 20px;
    align-self: flex-start;
  }
}
</style>
