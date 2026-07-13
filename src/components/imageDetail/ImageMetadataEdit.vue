<template>
  <div class="container px-0 py-4 position-relative">
    <transition name="fade">
      <div class="upload-box__alert" v-if="showAlert">
        <div class="alert h-auto fs-6 border border-start-3" :class="alertType === 'success'
          ? 'alert-success bg-positivo-c text-positivo-e border-success'
          : 'alert-danger bg-negativo-c text-negativo-e border-danger'
          " role="alert">
          <i :class="alertType === 'success'
            ? 'bi bi-check-circle-fill text-positivo-e'
            : 'bi bi-exclamation-triangle-fill text-negativo-e'
            " />
          <span>{{ alertMessage }}</span>
          <button type="button" :class="[
            'btn-close',
            alertType === 'success' ? 'text-positivo-e' : 'text-negativo-e',
          ]" @click="showAlert = false" />
        </div>
      </div>
    </transition>

    <div class="row align-items-start gy-4 metadata-upload__layout">

      <div v-if="loadingImage" class="d-flex flex-column gap-4 mt-3">
        <div class="bg-off-white p-4 rounded shadow-sm">
          <div class="skeleton mb-3" style="height: 20px; width: 40%" />
          <div class="skeleton mb-2" style="height: 40px; width: 100%" />
          <div class="skeleton" style="height: 40px; width: 100%" />
        </div>
        <div class="bg-off-white p-4 rounded shadow-sm">
          <div class="skeleton mb-3" style="height: 20px; width: 30%" />
          <div class="skeleton mb-2" style="height: 40px; width: 100%" />
          <div class="skeleton mb-2" style="height: 80px; width: 100%" />
          <div class="skeleton" style="height: 40px; width: 60%" />
        </div>
      </div>

      <div class="metadata-sections" v-else>
        <!-- Publicando como -->
        <div class="bg-off-white p-2 mb-4" style="border-radius: 5px">
          <h2 class="text-muted fst-italic small mb-2">
            Você está editando como
          </h2>
          <div>
            <div class="d-flex align-items-center p-2" :class="{
              'justify-content-between cursor-pointer rounded': hasCollectives,
            }" @click="hasCollectives ? toggleIdentityDropdown() : null" :role="hasCollectives ? 'button' : undefined">
              <div class="d-flex align-items-center gap-2" v-if="selectedIdentity">
                <div v-if="selectedIdentity.avatar" class="rounded-circle overflow-hidden"
                  style="width: 40px; height: 40px">
                  <img :src="selectedIdentity.avatar" alt="" class="w-100 h-100 object-fit-cover" />
                </div>
                <div v-else
                  class="rounded-circle bg-black text-white d-flex align-items-center justify-content-center fw-bold"
                  style="width: 40px; height: 40px">
                  {{ selectedIdentity.initials }}
                </div>
                <span class="fw-medium">{{ selectedIdentity.name }}</span>
              </div>
              <div v-else>Carregando...</div>
              <i v-if="hasCollectives" class="bi bi-chevron-down transition-transform"
                :class="{ 'rotate-180': isIdentityDropdownOpen }" />
            </div>

            <div v-if="hasCollectives && isIdentityDropdownOpen" class="w-100 bg-off-white rounded mt-1">
              <div v-for="identity in availableIdentities" :key="identity.id"
                class="d-flex align-items-center gap-2 p-2 hover-bg-light cursor-pointer identity-item"
                @click="selectIdentity(identity)" role="button">
                <div v-if="identity.avatar" class="rounded-circle overflow-hidden" style="width: 40px; height: 40px">
                  <img :src="identity.avatar" alt="" class="w-100 h-100 object-fit-cover" />
                </div>
                <div v-else
                  class="rounded-circle bg-black text-white d-flex align-items-center justify-content-center fw-bold"
                  style="width: 40px; height: 40px">
                  {{ identity.initials }}
                </div>
                <span class="fw-medium">{{ identity.name }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Seção: Dados Essenciais -->
        <section id="essenciais" class="py-4 p-4 shadow-sm"
          :class="[isEssenciaisInvalid ? 'bg-negativo-c' : 'bg-off-white']" style="border-radius: 5px">
          <h2 class="mb-4">Dados essenciais</h2>

          <div class="mb-4 px-3">
            <UiField label="Título da imagem" explain="Adicione um título para a imagem" :invalid="isTitleInvalid"
              invalidMessage="O título da imagem é obrigatório">
              <template #default="{ id, ariaInvalid, ariaDescribedby }">
                <input :id="id" type="text" class="form-control" :class="{ 'is-invalid': isTitleInvalid }"
                  placeholder="Adicione um título" v-model="form.title" :aria-invalid="ariaInvalid"
                  :aria-describedby="ariaDescribedby" @blur="isTitleTouched = true" />
              </template>
            </UiField>
          </div>

          <div class="mb-4 px-3">
            <div class="term-text-wrapper ">
              <!-- <div class="d-flex justify-content-between align-items-center mb-2 md:flex-row flex-column gap-2"> -->
              <h3 class="form-label text-cinza-e h3 mb-0">
                Autorizações para publicação
              </h3>
              <!-- <a href="#" class="text-decoration-none d-flex align-items-center gap-1 text-muted text-xs"> -->
              <a href="#" class="term-text-link text-decoration-none d-flex align-items-center gap-1 text-muted">
                <i class="bi bi-book" />Revisar Termos e Condições
              </a>
            </div>

            <div class="d-flex justify-content-between align-items-center mb-3">
              <label class="form-check-label text-muted fst-italic small" for="isAuthor">Sou o autor da imagem</label>
              <div class="form-check form-switch p-0 m-0">
                <input class="form-check-input m-0" type="checkbox" role="switch" id="isAuthor"
                  v-model="form.isAuthor" />
              </div>
            </div>

            <template v-if="!form.isAuthor">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <label class="form-check-label text-muted fst-italic small" for="isPublicDomain">Imagem está em
                  Domínio Público</label>
                <div class="form-check form-switch p-0 m-0">
                  <input class="form-check-input m-0" type="checkbox" role="switch" id="isPublicDomain"
                    v-model="form.isPublicDomain" />
                </div>
              </div>
              <div v-if="form.isPublicDomain" class="alert alert-info py-2 px-3 small mt-2 h-auto">
                <i class="bi bi-info-circle me-1" />
                Mesmo em domínio público, informe o nome do autor original se souber.
              </div>

              <div v-if="!form.isPublicDomain && !form.unknownAuthor"
                class="d-flex justify-content-between align-items-center mb-4">
                <label class="form-check-label text-muted fst-italic small"
                  :class="{ 'text-negativo-e': isRightsInvalid }" for="hasAuthorization">Tenho permissão expressa do
                  autor para disponibilizar a
                  imagem no ARQUIGRAFIA</label>
                <div class="form-check form-switch p-0 m-0">
                  <input class="form-check-input m-0" type="checkbox" role="switch" id="hasAuthorization"
                    v-model="form.hasAuthorization" />
                </div>
              </div>

              <div class="mb-2" v-if="!isRightsInvalid">
                <UiField label="Autoria da imagem" explain="Informe o nome do autor da imagem"
                  :invalid="isAuthorNameInvalid" invalidMessage="O nome do autor é obrigatório">
                  <template #default="{ id, ariaInvalid, ariaDescribedby }">
                    <input :id="id" type="text" class="form-control" :class="{ 'is-invalid': isAuthorNameInvalid }"
                      placeholder="Nome do autor" v-model="form.authorName" :disabled="form.unknownAuthor"
                      :aria-invalid="ariaInvalid" :aria-describedby="ariaDescribedby"
                      @blur="isAuthorNameTouched = true" />
                  </template>
                </UiField>
              </div>

              <div class="d-flex justify-content-between align-items-center mb-4">
                <label class="form-check-label text-muted fst-italic small" for="unknownAuthor">Não sei quem é o autor
                  da
                  imagem</label>
                <div class="form-check form-switch p-0 m-0">
                  <input class="form-check-input m-0" type="checkbox" role="switch" id="unknownAuthor"
                    v-model="form.unknownAuthor" @change="
                      form.unknownAuthor
                        ? (form.hasAuthorization = false)
                        : null
                      " />
                </div>
              </div>
            </template>
          </div>

          <div class="mb-4 px-3">
            <h3 class="form-label text-cinza-e h3 mb-2">Direitos de uso da imagem</h3>
            <span class="badge bg-secondary fs-6 fw-normal">{{ props.image?.license || form.license }}</span>
            <p class="text-muted small mt-1">A licença não pode ser alterada após o envio.</p>
          </div>

          <div class="text-end mt-4 text-muted fst-italic small">
            Preenchimento obrigatório
          </div>
        </section>

        <!-- Seção: Dados Gerais -->
        <section id="geral" class="py-4">
          <h2 class="mb-4">Dados gerais</h2>

          <!-- <div class="mb-4 px-3">
            <UiField label="Obra" explain="Informe a obra relacionada">
              <input type="text" class="form-control" placeholder="Texto exemplo" v-model="form.work" />
            </UiField>
          </div> -->

          <div class="mb-4 px-3">
            <UiField label="Tags da imagem" explain="Adicione tags para classificar a imagem">
              <div class="position-relative">
                <input type="text" class="form-control" placeholder="Digite uma tag e pressione Enter"
                  v-model="tagInput" @keydown.enter.prevent="addTag" @input="onTagInputChange"
                  @focus="showTagSuggestions = true" @blur="hideTagSuggestions" autocomplete="off" />
                <div v-if="
                  showTagSuggestions &&
                  (filteredTagSuggestions.length > 0 || canCreateSubject)
                " class="dropdown-menu w-100 show position-absolute top-100 start-0 mt-1"
                  style="z-index: 1000; max-height: 300px; overflow-y: auto">
                  <button v-for="(suggestion, index) in filteredTagSuggestions" :key="index" type="button"
                    class="dropdown-item" @click="selectTagSuggestion(suggestion)">
                    {{ suggestion.term }}
                  </button>
                  <button v-if="canCreateSubject" type="button"
                    class="dropdown-item text-primary d-flex align-items-center gap-1" :disabled="isCreatingSubject"
                    @click="createAndAddSubject(tagInput.trim())">
                    <i class="bi bi-plus-circle" />
                    <span>{{
                      isCreatingSubject
                        ? "Criando..."
                        : `Criar tag "${tagInput.trim()}"`
                    }}</span>
                  </button>
                </div>
              </div>
            </UiField>
            <div class="d-flex flex-wrap gap-2 mt-2">
              <div v-for="(tag, index) in form.tags" :key="tag"
                class="btn btn-outline-secondary btn-sm btn-tag d-inline-flex align-items-center">
                {{ tag.term || tag }}
                <button type="button" class="btn-close ms-2" aria-label="Remover" @click="removeTag(index)" />
              </div>
            </div>
          </div>

          <div class="mb-4 px-3">
            <UiField label="Descrição da imagem" explain="Adicione uma descrição detalhada da imagem">
              <textarea class="form-control" rows="5" placeholder="Texto exemplo" v-model="form.description"
                maxlength="500"></textarea>
            </UiField>
            <div class="text-end text-muted small mt-1">
              Máximo 500 caracteres.
            </div>
          </div>

          <div class="mb-4 px-3">
            <UiField label="Data da imagem" explain="Informe a data de criação da imagem">
              <div class="d-flex flex-column gap-3">
                <div v-if="form.dateType === 'year'" style="width: 120px">
                  <input type="number" class="form-control" v-model="dateYearInput" placeholder="Ano" />
                </div>
                <div v-else class="d-flex align-items-center gap-2">
                  <span>Entre</span>
                  <div style="width: 120px">
                    <input type="number" class="form-control" v-model="dateYearInput" placeholder="Ano" />
                  </div>
                  <span>e</span>
                  <div style="width: 120px">
                    <input type="number" class="form-control" v-model="dateEndYearInput" placeholder="Ano" />
                  </div>
                </div>

                <div class="d-flex gap-4">
                  <div class="form-check">
                    <input class="form-check-input" type="radio" name="dateType" id="dateTypeYear" value="year"
                      v-model="form.dateType" />
                    <label class="form-check-label" for="dateTypeYear">Ano</label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="radio" name="dateType" id="dateTypeInterval" value="interval"
                      v-model="form.dateType" />
                    <label class="form-check-label" for="dateTypeInterval">Intervalo</label>
                  </div>
                </div>

                <div class="d-flex gap-4">
                  <div class="form-check">
                    <input class="form-check-input" type="radio" name="dateAccuracy" id="dateAccExact" value="exact"
                      v-model="form.dateAccuracy" />
                    <label class="form-check-label" for="dateAccExact">Data exata</label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="radio" name="dateAccuracy" id="dateAccApprox"
                      value="approximate" v-model="form.dateAccuracy" />
                    <label class="form-check-label" for="dateAccApprox">Data aproximada</label>
                  </div>
                </div>
              </div>
            </UiField>
          </div>
        </section>

        <!-- Seção: Localização -->
        <section id="localizacao" class="py-4">
          <h2 class="mb-4">Localização</h2>

          <div class="mb-4">
            <UiField label="Buscar por localidade" explain="Busque e selecione a localidade no mapa">
              <div class="position-relative mb-3">
                <div class="input-group">
                  <input type="text" class="form-control" placeholder="Ex: Av. Paulista, 1578, São Paulo"
                    v-model="form.location" @keydown.enter.prevent="searchLocation"
                    @focus="showLocationSuggestions = true" @blur="hideLocationSuggestions" autocomplete="off" />
                  <button type="button" class="btn btn-outline-secondary" @click="searchLocation"
                    :disabled="isSearchingLocation">
                    <span v-if="isSearchingLocation" class="spinner-border spinner-border-sm" role="status" />
                    <i v-else class="bi bi-search" />
                  </button>
                </div>
                <div v-if="
                  showLocationSuggestions && locationSuggestions.length > 0
                " class="dropdown-menu w-100 show position-absolute top-100 start-0 mt-1"
                  style="z-index: 1000; max-height: 300px; overflow-y: auto">
                  <button v-for="(suggestion, index) in locationSuggestions" :key="index" type="button"
                    class="dropdown-item text-wrap small" @click="selectLocationSuggestion(suggestion)">
                    {{ suggestion.display_name }}
                  </button>
                </div>
              </div>
            </UiField>

            <h3 class="form-label text-cinza-e h3 mb-2">
              Selecione no mapa a localização de sua imagem
            </h3>

            <div class="map-container overflow-hidden border" style="height: 400px">
              <MapLibreMap :style-url="mapStyleUrl" :center="mapCenter" :zoom="mapZoom"
                :marker-position="form.coordinates" @map-ready="handleMapReady" @map-error="handleMapError"
                @click="handleMapClick" clickable marker-color="#0f89e1">
                <MapControls class="position-absolute bottom-0 start-50 translate-middle-x mb-3" @zoom-in="zoomIn"
                  @zoom-out="zoomOut" />
                <button type="button" class="position-absolute top-0 end-0 m-2 btn btn-sm btn-light border"
                  style="z-index: 1" @click="form.coordinates = null; form.location = ''">
                  <i class="bi bi-x-circle me-1" />Remover marcador
                </button>
              </MapLibreMap>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>

  <!-- Barra de ações -->
  <div class="preview-actions-bar">
    <div class="d-flex gap-3">
      <button class="btn btn-outline-secondary" @click="handleCancel">
        Cancelar
      </button>
      <button class="btn btn-primary" :disabled="!isFormValid || isSaving || isSaved" @click="handleSubmit">
        <span v-if="isSaving" class="spinner-border spinner-border-sm me-2" role="status" />
        {{ isSaving ? "Salvando..." : "Salvar alterações" }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import axios from "@/axios";
import UiField from "@/components/ui/UiField.vue";
import MapLibreMap from "@/components/map/MapLibreMap.vue";
import MapControls from "@/components/map/MapControls.vue";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "vue-router";
import { useQueryClient } from "@tanstack/vue-query";
import { useImageForm } from "@/composables/useImageForm";

defineOptions({ name: "ImageMetadataEdit" });

const props = defineProps({
  /** ID da imagem a ser editada — obrigatório */
  image: {
    type: Object,
    default: null,
  },
});
const emit = defineEmits(["updated"]);

const router = useRouter();
const authStore = useAuthStore();
const queryClient = useQueryClient();
const isSaved = ref(false);

const buildPayload = async () => {
  const photographerUuid = await resolvePhotographerUuid(form.value);
  const subjectUuids = resolveSubjectUuids(form.value.tags);

  const payload = {
    title: form.value.title || null,
    description: form.value.description || null,
    photographer: photographerUuid || null,
    subjects: subjectUuids.length ? subjectUuids : [],
    latitude: form.value.coordinates?.lat
      ? parseFloat(form.value.coordinates.lat.toFixed(8))
      : null,
    longitude: form.value.coordinates?.lng
      ? parseFloat(form.value.coordinates.lng.toFixed(8))
      : null,
    location_label: form.value.location || null,
    earliest_date: form.value.date || null,
    latest_date: form.value.dateEnd || null,
    circa: form.value.dateAccuracy === "approximate",
  };

  return Object.fromEntries(
    Object.entries(payload).filter(([key, v]) =>
      v !== null || ["latitude", "longitude", "location_label"].includes(key))
  );
};

// ─── Composable 
const {
  showAlert,
  alertMessage,
  alertType,
  showError,
  showSuccess,
  isIdentityDropdownOpen,
  selectedIdentity,
  hasCollectives,
  availableIdentities,
  toggleIdentityDropdown,
  selectIdentity,
  form,
  populateFormFromApi,
  isTitleTouched,
  isAuthorNameTouched,
  isTitleInvalid,
  isAuthorNameInvalid,
  isRightsInvalid,
  isEssenciaisInvalid,
  isFormValid,
  touchAllFields,
  dateYearInput,
  dateEndYearInput,
  mapStyleUrl,
  mapCenter,
  mapZoom,
  handleMapReady,
  handleMapError,
  handleMapClick,
  zoomIn,
  zoomOut,
  locationSuggestions,
  showLocationSuggestions,
  searchLocation,
  isSearchingLocation,
  selectLocationSuggestion,
  hideLocationSuggestions,
  tagInput,
  filteredTagSuggestions,
  showTagSuggestions,
  isCreatingSubject,
  canCreateSubject,
  onTagInputChange,
  hideTagSuggestions,
  selectTagSuggestion,
  createAndAddSubject,
  addTag,
  removeTag,
  resolvePhotographerUuid,
  resolveSubjectUuids,
  loadFormDependencies,
} = useImageForm();

// ─── Estado local (exclusivo de edição) 
const loadingImage = ref(true);
const isSaving = ref(false);

// ─── Inicialização 
watch(
  () => props.image,
  async (newImage) => {
    if (!newImage) {
      loadingImage.value = false;
      return;
    }

    await loadFormDependencies();

    populateFormFromApi(newImage, authStore.loggedUser?.name);
    loadingImage.value = false;
  },
  { immediate: true }
);

const handleSubmit = async () => {
  touchAllFields();

  if (!isFormValid.value) {
    showError("Por favor, preencha todos os dados obrigatórios.");
    return;
  }

  isSaving.value = true;

  try {

    const payload = await buildPayload();

    await axios.put(`/api/images/${props.image.id}`, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: authStore.authHeader,
      },
    });


    // Invalida o cache da listagem de imagens para que o grid (perfil/home)
    // reflita a edição sem depender de refresh. refetchType "all" força o
    // refetch mesmo com a query inativa (usuário está na tela de detalhes).
    await queryClient.invalidateQueries({ queryKey: ["images"], refetchType: "all" });

    showSuccess("Imagem atualizada com sucesso!");
    isSaved.value = true;
    emit("updated");

    setTimeout(() => {
      router.push({ name: "image-detail-dados", params: { id: props.image.id } });
    }, 1500);
  } catch (error) {
    console.error("Erro ao atualizar imagem:", error);
    showError(
      error.response?.data?.message ||
      "Erro ao salvar alterações. Por favor, tente novamente."
    );
  } finally {
    isSaving.value = false;
  }
};

// ─── Cancelar ─────────────────────────────────────────────────────────────────
const handleCancel = () => {
  router.push({ name: "image-detail-dados", params: { id: props.image.id } });
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

.term-text-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;

  @media (max-width: 1024px) {
    flex-direction: column;
    align-items: flex-start;
  }

  .term-text-link {
    font-size: 0.75rem;
    margin-bottom: 20px;

    .bi {
      font-size: 14px;
    }
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

@media (max-width: 768px) {
  label.form-check-label {
    font-size: 0.75rem;
  }
}

.form-check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

.image-edit__preview img {
  width: 100%;
  max-height: 500px;
  object-fit: contain;
  background: #f8f9fa;
}

.skeleton {
  background: linear-gradient(90deg, #e2e2e2 25%, #f0f0f0 50%, #e2e2e2 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 4px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}
</style>