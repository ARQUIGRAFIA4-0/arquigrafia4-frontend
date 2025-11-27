<template>
  <div class="container py-4 position-relative">
    <transition name="fade">
      <div class="upload-box__alert" v-if="showAlert">
        <div
          class="alert alert-danger h-auto bg-negativo-c fs-6 text-negativo-e border border-danger border-start-3"
          role="alert"
        >
          <i class="bi bi-exclamation-triangle-fill text-negativo-e" />
          <span>{{ alertMessage }}</span>
          <button
            type="button"
            class="btn-close text-negativo-e"
            data-bs-dismiss="alert"
            aria-label="Close"
            @click="showAlert = false"
          />
        </div>
      </div>
    </transition>

    <div class="row align-items-start gy-4 metadata-upload__layout">
      <div class="col-12 col-md-6 order-1 order-md-1">
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
                  class="d-flex align-items-center justify-content-between cursor-pointer rounded p-2"
                  @click="toggleIdentityDropdown"
                  role="button"
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
                    class="bi bi-chevron-down transition-transform"
                    :class="{ 'rotate-180': isIdentityDropdownOpen }"
                  />
                </div>

                <div
                  v-if="isIdentityDropdownOpen"
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
                <input
                  type="text"
                  class="form-control"
                  placeholder="Texto exemplo"
                  v-model="form.work"
                />
              </UiField>
            </div>

            <div class="mb-4 px-3">
              <UiField
                label="Tags da imagem"
                explain="Adicione tags para classificar a imagem"
              >
                <input
                  type="text"
                  class="form-control"
                  placeholder="Digite uma tag e pressione Enter"
                  v-model="tagInput"
                  @keydown.enter.prevent="addTag"
                />
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
                      v-model="form.date"
                      placeholder="Ano"
                    />
                  </div>
                  <div v-else class="d-flex align-items-center gap-2">
                    <span>Entre</span>
                    <div style="width: 120px">
                      <input
                        type="number"
                        class="form-control"
                        v-model="form.date"
                        placeholder="Ano"
                      />
                    </div>
                    <span>e</span>
                    <div style="width: 120px">
                      <input
                        type="number"
                        class="form-control"
                        v-model="form.dateEnd"
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
                <input
                  type="text"
                  class="form-control mb-3"
                  placeholder="Texto exemplo"
                  v-model="form.location"
                />
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
</template>

<script setup>
import { ref, markRaw, computed, onMounted, watch } from "vue";
import { api } from "@/services/api";
import ImagePreviewPanel from "@/components/imageMetadaUpload/ImagePreviewPanel.vue";
import UiField from "@/components/ui/UiField.vue";
import MapLibreMap from "@/components/map/MapLibreMap.vue";
import MapControls from "@/components/map/MapControls.vue";
import { useImageUploadStore } from "@/store/imageUploads";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
defineOptions({ name: "ImageMetadataUpload" });

const router = useRouter();
const imageUploadStore = useImageUploadStore();
const { pendingImages, selectedIndex } = storeToRefs(imageUploadStore);

const tabs = [
  { label: "Essenciais", section: "essenciais" },
  { label: "Geral", section: "geral" },
  { label: "Localização", section: "localizacao" },
];

const publishingIdentities = ref([]);
const selectedIdentity = ref(null);
const isIdentityDropdownOpen = ref(false);

const availableIdentities = computed(() => {
  return publishingIdentities.value.filter(
    (identity) => identity.id !== selectedIdentity.value?.id
  );
});

const toggleIdentityDropdown = () => {
  isIdentityDropdownOpen.value = !isIdentityDropdownOpen.value;
};

const selectIdentity = (identity) => {
  selectedIdentity.value = identity;
  isIdentityDropdownOpen.value = false;
};

onMounted(async () => {
  try {
    const identities = await api.getPublishingIdentities();
    publishingIdentities.value = identities;
    if (identities.length > 0) {
      selectedIdentity.value = identities[0];
    }
  } catch (error) {
    console.error("Erro ao carregar identidades:", error);
  }
});

const currentSection = ref("essenciais");
const showAlert = ref(false);
const alertMessage = ref("");

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
  work: "",
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

      form.value = {
        ...defaultForm,
        ...storedMetadata,
        tags,
        coordinates,
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

const tagInput = ref("");

const addTag = () => {
  const tag = tagInput.value.trim();
  if (tag && !form.value.tags.includes(tag)) {
    form.value.tags.push(tag);
    tagInput.value = "";
  }
};

const removeTag = (index) => {
  form.value.tags.splice(index, 1);
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
    alertMessage.value =
      "Por favor, preencha todos os dados obrigatórios de todas as imagens.";
    showAlert.value = true;
    return;
  }

  // TODO: implementar o envio das imagens para a API
  console.log("Enviando imagens:", pendingImages.value);
};
</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;

.upload-box__alert {
  position: absolute;
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
  padding: 1rem 2rem;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 3rem;
  box-shadow: 2px -2px 5px 2px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.preview-actions-bar button {
  font-weight: 400;
  font-size: 14px;
  line-height: 150%;
}
</style>
