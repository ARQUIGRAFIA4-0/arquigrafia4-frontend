<template>
  <div class="container px-0 py-4 position-relative">
    <transition name="fade">
      <div class="upload-box__alert" v-if="showAlert">
        <div
          class="alert h-auto fs-6 border border-start-3"
          :class="
            alertType === 'success'
              ? 'alert-success bg-positivo-c text-positivo-e border-success'
              : 'alert-danger bg-negativo-c text-negativo-e border-danger'
          "
          role="alert"
        >
          <i
            :class="
              alertType === 'success'
                ? 'bi bi-check-circle-fill text-positivo-e'
                : 'bi bi-exclamation-triangle-fill text-negativo-e'
            "
          />
          <span>{{ alertMessage }}</span>
          <button
            type="button"
            :class="[
              'btn-close',
              alertType === 'success' ? 'text-positivo-e' : 'text-negativo-e',
            ]"
            @click="showAlert = false"
          />
        </div>
      </div>
    </transition>

    <div class="row align-items-start gy-4">
      <!-- Tabs -->
      <div
        class="d-flex flex-column flex-md-row justify-content-start align-items-start align-items-md-center gap-3 bg-white py-2"
      >
        <ul class="nav nav-underline">
          <li v-for="tab in tabs" :key="tab.section" class="nav-item">
            <a
              class="nav-link"
              :href="`#${tab.section}`"
              :class="{ active: currentSection === tab.section }"
              @click="selectTab(tab.section)"
            >
              {{ tab.label }}
            </a>
          </li>
        </ul>
      </div>

      <div v-if="loadingImage" class="d-flex flex-column gap-4 mt-3">
        <div class="bg-off-white p-4 rounded shadow-sm">
          <div class="skeleton mb-3" style="height: 20px; width: 40%" />
          <div class="skeleton mb-2" style="height: 40px; width: 100%" />
          <div class="skeleton" style="height: 40px; width: 100%" />
        </div>
      </div>

      <div class="metadata-sections" v-else>
        <!-- Publicando como -->
        <div class="bg-off-white p-2 mb-4" style="border-radius: 5px">
          <h2 class="text-muted fst-italic small mb-2">Você está sugerindo como</h2>
          <div>
            <div
              class="d-flex align-items-center p-2"
              :class="{
                'justify-content-between cursor-pointer rounded': hasCollectives,
              }"
              @click="hasCollectives ? toggleIdentityDropdown() : null"
              :role="hasCollectives ? 'button' : undefined"
            >
              <div class="d-flex align-items-center gap-2" v-if="selectedIdentity">
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

        <!-- Dados Essenciais -->
        <section
          id="essenciais"
          class="py-4 p-4 shadow-sm mb-4"
          style="border-radius: 5px"
          :class="[isEssenciaisInvalid ? 'bg-negativo-c' : 'bg-off-white']"
        >
          <h2 class="mb-4">Dados essenciais</h2>

          <div class="mb-4 px-3">
            <UiField
              label="Título da imagem"
              explain="Sugira um novo título para a imagem"
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
            <h3 class="form-label text-cinza-e h3 mb-2">Direitos de uso da imagem</h3>
            <span class="badge bg-secondary fs-6 fw-normal">{{
              props.image?.license || form.license
            }}</span>
            <p class="text-muted small mt-1">A licença não pode ser alterada.</p>
          </div>

          <div class="text-end mt-4 text-muted fst-italic small">Preenchimento obrigatório</div>
        </section>

        <!-- Dados Gerais -->
        <section id="geral" class="py-4">
          <h2 class="mb-4">Dados gerais</h2>

          <div class="mb-4 px-3">
            <UiField
              label="Tags da imagem"
              explain="Sugira tags para classificar a imagem"
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
                  v-if="
                    showTagSuggestions &&
                    (filteredTagSuggestions.length > 0 || canCreateSubject)
                  "
                  class="dropdown-menu w-100 show position-absolute top-100 start-0 mt-1"
                  style="z-index: 1000; max-height: 300px; overflow-y: auto"
                >
                  <button
                    v-for="(suggestion, index) in filteredTagSuggestions"
                    :key="index"
                    type="button"
                    class="dropdown-item"
                    @click="selectTagSuggestion(suggestion)"
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
              <div
                v-for="(tag, index) in form.tags"
                :key="tag.id || tag.term || index"
                class="btn btn-outline-secondary btn-sm btn-tag d-inline-flex align-items-center"
              >
                {{ tag.term || tag }}
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
              explain="Sugira uma descrição detalhada da imagem"
            >
              <textarea
                class="form-control"
                rows="5"
                placeholder="Texto exemplo"
                v-model="form.description"
                maxlength="500"
              ></textarea>
            </UiField>
            <div class="text-end text-muted small mt-1">Máximo 500 caracteres.</div>
          </div>

          <div class="mb-4 px-3">
            <UiField label="Data da imagem" explain="Sugira a data de criação da imagem">
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
                      name="sg-dateType"
                      id="sg-dateTypeYear"
                      value="year"
                      v-model="form.dateType"
                    />
                    <label class="form-check-label" for="sg-dateTypeYear">Ano</label>
                  </div>
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="radio"
                      name="sg-dateType"
                      id="sg-dateTypeInterval"
                      value="interval"
                      v-model="form.dateType"
                    />
                    <label class="form-check-label" for="sg-dateTypeInterval">Intervalo</label>
                  </div>
                </div>
                <div class="d-flex gap-4">
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="radio"
                      name="sg-dateAccuracy"
                      id="sg-dateAccExact"
                      value="exact"
                      v-model="form.dateAccuracy"
                    />
                    <label class="form-check-label" for="sg-dateAccExact">Data exata</label>
                  </div>
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="radio"
                      name="sg-dateAccuracy"
                      id="sg-dateAccApprox"
                      value="approximate"
                      v-model="form.dateAccuracy"
                    />
                    <label class="form-check-label" for="sg-dateAccApprox">Data aproximada</label>
                  </div>
                </div>
              </div>
            </UiField>
          </div>
        </section>

        <!-- Localização -->
        <section id="localizacao" class="py-4">
          <h2 class="mb-4">Localização</h2>
          <div class="mb-4">
            <UiField label="Buscar por localidade" explain="Busque e selecione a localidade no mapa">
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
                    :disabled="isSearchingLocation"
                  >
                    <span
                      v-if="isSearchingLocation"
                      class="spinner-border spinner-border-sm"
                      role="status"
                    />
                    <i v-else class="bi bi-search" />
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

            <div class="map-container overflow-hidden border" style="height: 400px">
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
                  type="button"
                  class="position-absolute top-0 end-0 m-2 btn btn-sm btn-light border"
                  style="z-index: 1"
                  @click="form.coordinates = null; form.location = ''"
                >
                  <i class="bi bi-x-circle me-1" />Remover marcador
                </button>
              </MapLibreMap>
            </div>
          </div>
        </section>

        <!-- Motivo da sugestão -->
        <section id="motivo" class="py-4 p-4 bg-off-white shadow-sm mb-4" style="border-radius: 5px">
          <h2 class="mb-1">Motivo da sugestão</h2>
          <p class="text-muted small mb-3">
            Suas sugestões serão analisadas pela comunidade e, caso sejam aprovadas,
            irão substituir ou complementar os dados desta imagem.
            Informe à comunidade o motivo da sua sugestão.
          </p>
          <UiField
            label=""
            explain=""
            :invalid="isReasonInvalid"
            invalidMessage="Informe o motivo da sugestão"
          >
            <template #default="{ id, ariaInvalid, ariaDescribedby }">
              <textarea
                :id="id"
                class="form-control"
                :class="{ 'is-invalid': isReasonInvalid }"
                rows="4"
                placeholder="Conte seus motivos para a sugestão de edição"
                v-model="reason"
                :aria-invalid="ariaInvalid"
                :aria-describedby="ariaDescribedby"
                @blur="isReasonTouched = true"
              ></textarea>
            </template>
          </UiField>
          <div class="text-end mt-2 text-muted fst-italic small">Preenchimento obrigatório</div>
        </section>
      </div>
    </div>
  </div>

  <!-- Barra de ações -->
  <div class="preview-actions-bar">
    <div class="d-flex gap-3">
      <button class="btn btn-outline-secondary" @click="handleCancel">Cancelar</button>
      <button
        class="btn btn-primary"
        :disabled="!isFormValid || isReasonInvalid || isSaving || isSaved"
        @click="handleSubmit"
      >
        <span
          v-if="isSaving"
          class="spinner-border spinner-border-sm me-2"
          role="status"
        />
        {{ isSaving ? "Enviando..." : "Enviar à comunidade" }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import axios from "@/axios";
import UiField from "@/components/ui/UiField.vue";
import MapLibreMap from "@/components/map/MapLibreMap.vue";
import MapControls from "@/components/map/MapControls.vue";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "vue-router";
import { useImageForm } from "@/composables/useImageForm";

defineOptions({ name: "ImageSuggestionEdit" });

const props = defineProps({
  image: {
    type: Object,
    default: null,
  },
});
const emit = defineEmits(["submitted"]);

const router = useRouter();
const authStore = useAuthStore();
const isSaved = ref(false);
const isSaving = ref(false);
const loadingImage = ref(true);

// ─── Motivo da sugestão ───────────────────────────────────────────────────────
const reason = ref("");
const isReasonTouched = ref(false);
const isReasonInvalid = computed(
  () => isReasonTouched.value && !reason.value.trim()
);

// ─── Composable ──────────────────────────────────────────────────────────────
const {
  tabs,
  currentSection,
  selectTab,
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

// ─── Inicialização ────────────────────────────────────────────────────────────
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

// ─── Payload ──────────────────────────────────────────────────────────────────
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
    reason: reason.value.trim(),
  };

  return Object.fromEntries(
    Object.entries(payload).filter(
      ([key, v]) =>
        v !== null ||
        ["latitude", "longitude", "location_label"].includes(key)
    )
  );
};

// ─── Submit ───────────────────────────────────────────────────────────────────
const handleSubmit = async () => {
  touchAllFields();
  isReasonTouched.value = true;

  if (!isFormValid.value || !reason.value.trim()) {
    showError("Por favor, preencha todos os dados obrigatórios.");
    return;
  }

  isSaving.value = true;

  try {
    const payload = await buildPayload();

    await axios.post(`/api/images/${props.image.id}/suggestions`, {
      payload,
    }, {
      headers: {
        "Content-Type": "application/json",
        Authorization: authStore.authHeader,
      },
    });

    showSuccess("Sugestão enviada com sucesso!");
    isSaved.value = true;
    emit("submitted");

    setTimeout(() => {
      router.push({
        name: "image-detail-dados",
        params: { id: props.image.id },
      });
    }, 1500);
  } catch (error) {
    console.error("Erro ao enviar sugestão:", error);
    showError(
      error.response?.data?.message ||
        "Erro ao enviar sugestão. Por favor, tente novamente."
    );
  } finally {
    isSaving.value = false;
  }
};

// ─── Cancelar ─────────────────────────────────────────────────────────────────
const handleCancel = () => {
  router.push({
    name: "image-detail-dados",
    params: { id: props.image.id },
  });
};
</script>
