<template>
  <div class="image-suggestion-edit container">
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

    <div class="image-suggestion-edit__content">

      <div v-if="loadingImage" class="image-suggestion-edit__loading">
        <div class="image-suggestion-edit__skeleton-card">
          <div class="image-suggestion-edit__skeleton-line image-suggestion-edit__skeleton-line--label" />
          <div class="image-suggestion-edit__skeleton-line image-suggestion-edit__skeleton-line--field" />
          <div class="image-suggestion-edit__skeleton-line image-suggestion-edit__skeleton-line--field" />
        </div>
      </div>

      <div class="metadata-sections" v-else>
        <div class="identity-picker">
          <h2 class="identity-picker__label">Você está sugerindo como</h2>
          <div>

            <div class="identity-picker__selected" :class="{
              'identity-picker__selected--clickable': hasCollectives,
            }" @click="hasCollectives ? toggleIdentityDropdown() : null" :role="hasCollectives ? 'button' : undefined">
              <div class="identity-picker__selected-info" v-if="selectedIdentity">

                <div v-if="selectedIdentity.avatar" class="identity-picker__avatar">
                  <img :src="`${API_BASE_URL}${selectedIdentity.avatar}`" alt="" class="identity-picker__avatar-img" />
                </div>
                <div v-else class="identity-picker__avatar">
                  <img :src="defaultImageUser" alt="" class="identity-picker__avatar-img" />
                </div>

                <span class="identity-picker__name">{{ capitalizeWords(selectedIdentity.name) }}</span>

              </div>
              <div v-else>Carregando...</div>

              <i v-if="hasCollectives" class="bi bi-chevron-down identity-picker__chevron"
                :class="{ 'identity-picker__chevron--open': isIdentityDropdownOpen }" />

            </div>

            <div v-if="hasCollectives && isIdentityDropdownOpen" class="identity-picker__dropdown">
              <div v-for="identity in availableIdentities" :key="identity.id" class="identity-picker__item"
                @click="selectIdentity(identity)" role="button">
                <div v-if="identity.avatar" class="identity-picker__avatar">
                  <img :src="identity.avatar" alt="" class="identity-picker__avatar-img" />
                </div>
                <span class="identity-picker__name">{{ capitalizeWords(identity.name) }}</span>
              </div>
            </div>
          </div>
        </div>

        <section id="essenciais" class="metadata-section metadata-section--card"
          :class="{ 'metadata-section--invalid': isEssenciaisInvalid }">
          <h2 class="metadata-section__title">Dados essenciais</h2>

          <div class="metadata-section__field">
            <UiField label="Título da imagem" explain="Sugira um novo título para a imagem" :invalid="isTitleInvalid"
              invalidMessage="O título da imagem é obrigatório">
              <template #default="{ id, ariaInvalid, ariaDescribedby }">
                <input :id="id" type="text" class="form-control" :class="{ 'is-invalid': isTitleInvalid }"
                  placeholder="Adicione um título" v-model="form.title" :aria-invalid="ariaInvalid"
                  :aria-describedby="ariaDescribedby" @blur="isTitleTouched = true" />
              </template>
            </UiField>
          </div>

          <div class="metadata-section__field">
            <h3 class="metadata-section__subtitle">Direitos de uso da imagem</h3>
            <span class="license-badge">{{
              props.image?.license || form.license
              }}</span>
            <p class="metadata-section__hint">A licença não pode ser alterada.</p>
          </div>
        </section>

        <!-- Dados Gerais -->
        <section id="geral" class="metadata-section">
          <h2 class="metadata-section__title">Dados gerais</h2>

          <div class="metadata-section__field">
            <UiField label="Tags da imagem" explain="Sugira tags para classificar a imagem">
              <div class="tag-input">
                <input type="text" class="tag-input__field" placeholder="Digite uma tag e pressione Enter"
                  v-model="tagInput" @keydown.enter.prevent="addTag" @input="onTagInputChange"
                  @focus="showTagSuggestions = true" @blur="hideTagSuggestions" autocomplete="off" />
                <div v-if="
                  showTagSuggestions &&
                  (filteredTagSuggestions.length > 0 || canCreateSubject)
                " class="tag-input__suggestions">
                  <button v-for="(suggestion, index) in filteredTagSuggestions" :key="index" type="button"
                    class="tag-input__suggestion-item" @click="selectTagSuggestion(suggestion)">
                    {{ suggestion.term }}
                  </button>
                  <button v-if="canCreateSubject" type="button"
                    class="tag-input__suggestion-item tag-input__suggestion-item--create" :disabled="isCreatingSubject"
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
            <div class="tag-input__chips">
              <div v-for="(tag, index) in form.tags" :key="tag.id || tag.term || index" class="tag-input__chip">
                {{ tag.term || tag }}
                <button type="button" class="tag-input__chip-remove" aria-label="Remover" @click="removeTag(index)">
                  <span class="bi bi-x"></span>
                </button>
              </div>
            </div>
          </div>

          <div class="metadata-section__field">
            <UiField label="Descrição da imagem" explain="Sugira uma descrição detalhada da imagem">
              <textarea class="form-control" style="resize: none;" rows="5" placeholder="Texto exemplo"
                v-model="form.description" maxlength="500"></textarea>
            </UiField>
            <div class="metadata-section__hint--required">Máximo 500 caracteres.</div>
          </div>

          <div class="metadata-section__field">
            <UiField label="Data da imagem" explain="Sugira a data de criação da imagem">
              <div class="date-field">
                <div v-if="form.dateType === 'year'" class="date-field__year-only">
                  <input type="number" class="date-field__input" v-model="dateYearInput" placeholder="Ano" min="0" />
                </div>
                <div v-else class="date-field__interval">
                  <span>Entre</span>
                  <div class="date-field__year-box">
                    <input type="number" class="date-field__input" v-model="dateYearInput" placeholder="Ano" min="0" />
                  </div>
                  <span>e</span>
                  <div class="date-field__year-box">
                    <input type="number" class="date-field__input" v-model="dateEndYearInput" placeholder="Ano"
                      min="0" />
                  </div>
                </div>
                <div class="date-field__options">
                  <div class="date-field__option">
                    <input class="date-field__radio" type="radio" name="sg-dateType" id="sg-dateTypeYear" value="year"
                      v-model="form.dateType" />
                    <label class="date-field__option-label" for="sg-dateTypeYear">Ano</label>
                  </div>
                  <div class="date-field__option">
                    <input class="date-field__radio" type="radio" name="sg-dateType" id="sg-dateTypeInterval"
                      value="interval" v-model="form.dateType" />
                    <label class="date-field__option-label" for="sg-dateTypeInterval">Intervalo</label>
                  </div>
                </div>
                <div class="date-field__options">
                  <div class="date-field__option">
                    <input class="date-field__radio" type="radio" name="sg-dateAccuracy" id="sg-dateAccExact"
                      value="exact" v-model="form.dateAccuracy" />
                    <label class="date-field__option-label" for="sg-dateAccExact">Data exata</label>
                  </div>
                  <div class="date-field__option">
                    <input class="date-field__radio" type="radio" name="sg-dateAccuracy" id="sg-dateAccApprox"
                      value="approximate" v-model="form.dateAccuracy" />
                    <label class="date-field__option-label" for="sg-dateAccApprox">Data aproximada</label>
                  </div>
                </div>
              </div>
            </UiField>
          </div>
        </section>

        <!-- Localização -->
        <section id="localizacao" class="metadata-section">
          <h2 class="metadata-section__title">Localização</h2>
          <div class="metadata-section__field">
            <UiField label="Buscar por localidade" explain="Busque e selecione a localidade no mapa">
              <div class="location-search">
                <div class="location-search__group">
                  <input type="text" class="location-search__input" placeholder="Ex: Av. Paulista, 1578, São Paulo"
                    v-model="form.location" @keydown.enter.prevent="searchLocation"
                    @focus="showLocationSuggestions = true" @blur="hideLocationSuggestions" autocomplete="off" />
                  <button type="button" class="location-search__submit" @click="searchLocation"
                    :disabled="isSearchingLocation">
                    <span v-if="isSearchingLocation" class="location-search__spinner" role="status" />
                    <i v-else class="bi bi-search" />
                  </button>
                </div>
                <div v-if="showLocationSuggestions && locationSuggestions.length > 0"
                  class="location-search__suggestions">
                  <button v-for="(suggestion, index) in locationSuggestions" :key="index" type="button"
                    class="location-search__suggestion-item" @click="selectLocationSuggestion(suggestion)">
                    {{ suggestion.display_name }}
                  </button>
                </div>
              </div>
            </UiField>

            <h3 class="map-panel__instructions">
              Selecione no mapa a localização de sua imagem
            </h3>

            <div class="map-panel__container">
              <MapLibreMap :style-url="mapStyleUrl" :center="mapCenter" :zoom="mapZoom"
                :marker-position="form.coordinates" @map-ready="handleMapReady" @map-error="handleMapError"
                @click="handleMapClick" clickable marker-color="#0f89e1">
                <MapControls class="position-absolute bottom-0 start-50 translate-middle-x mb-3" @zoom-in="zoomIn"
                  @zoom-out="zoomOut" />
                <button type="button" class="map-panel__controls" @click="form.coordinates = null; form.location = ''">
                  <i class="bi bi-x-circle me-1" />Remover marcador
                </button>
              </MapLibreMap>
            </div>
          </div>
        </section>

        <!-- Motivo da sugestão -->
        <section id="motivo" class="metadata-section metadata-section--card">
          <h2 class="metadata-section__title metadata-section__title--compact">Justificativa da sugestão</h2>
          <p class="metadata-section__description">
            Suas sugestões serão analisadas pela comunidade e, caso sejam aprovadas,
            irão substituir ou complementar os dados desta imagem.
            Informe à comunidade o motivo da sua sugestão.
          </p>
          <UiField label="" explain="" :invalid="isReasonInvalid" invalidMessage="Informe o motivo da sugestão">
            <template #default="{ id, ariaInvalid, ariaDescribedby }">
              <textarea :id="id" class="form-control" ref="reasonTextarea" :class="{ 'is-invalid': isReasonInvalid }"
                rows="4" placeholder="Conte seus motivos para a sugestão de edição" maxlength="1000"
                style="resize: none;" v-model="reason" :aria-invalid="ariaInvalid" :aria-describedby="ariaDescribedby"
                @blur="isReasonTouched = true"></textarea>
            </template>
          </UiField>
          <div class="metadata-section__hint metadata-section__hint--required">Preenchimento obrigatório</div>
        </section>
      </div>
    </div>
  </div>

  <!-- Barra de ações -->
  <div class="preview-actions-bar">
    <div class="preview-actions-bar__group">
      <button class="action-btn action-btn--cancel" @click="handleCancel">Cancelar</button>
      <button class="action-btn action-btn--submit" :disabled="!isFormValid || isReasonInvalid || isSaving || isSaved"
        @click="handleSubmit">
        <span v-if="isSaving" class="action-btn__spinner" role="status" />
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
import defaultImageUser from "@/assets/profile_image.png";
const API_BASE_URL = import.meta.env.VITE_BASE_REQUEST_URL;

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
const initialFormSnapshot = ref(null);

// ─── Motivo da sugestão ───────────────────────────────────────────────────────
const reason = ref("");
const reasonTextarea = ref(null);
const isReasonTouched = ref(false);
const isReasonInvalid = computed(
  () => isReasonTouched.value && !reason.value.trim()
);

// ─── Composable ──────────────────────────────────────────────────────────────
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
  isTitleInvalid,
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
  capitalizeWords
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
    initialFormSnapshot.value = JSON.parse(JSON.stringify(form.value))
    loadingImage.value = false;
  },
  { immediate: true }
);

const isFieldUnchanged = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

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

  const payloadKeyToFormFields = {
    title: ["title"],
    description: ["description"],
    photographer: ["authorName", "isAuthor"],
    subjects: ["tags"],
    latitude: ["coordinates"],
    longitude: ["coordinates"],
    location_label: ["location"],
    earliest_date: ["date"],
    latest_date: ["dateEnd"],
    circa: ["dateAccuracy"],
  };


  const snapshot = initialFormSnapshot.value;

  const finalPayload = Object.fromEntries(
    Object.entries(payload).filter(([key, v]) => {
      // Mantém o filtro original: nulos descartados, exceto lat/lng/location_label
      const passesNullFilter =
        v !== null || ["latitude", "longitude", "location_label"].includes(key);
      if (!passesNullFilter) return false;

      const relatedFields = payloadKeyToFormFields[key];
      // Sem mapeamento (ex.: reason) ou sem snapshot ainda -> sempre envia
      if (!relatedFields || !snapshot) return true;

      // Se QUALQUER campo do form relacionado mudou, mantém a chave no payload
      const changed = relatedFields.some(
        (field) => !isFieldUnchanged(form.value[field], snapshot[field])
      );
      return changed;
    })
  );

  return finalPayload;
};

// ─── Submit ───────────────────────────────────────────────────────────────────
const handleSubmit = async () => {
  touchAllFields();
  isReasonTouched.value = true;

  if (!reason.value.trim()) {
    showError("Por favor, informe o motivo da sugestão.");

    reasonTextarea.value?.focus();

    reasonTextarea.value?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    return;
  }


  if (!isFormValid.value) {
    showError("Por favor, preencha todos os dados obrigatórios.");
    return;
  }

  isSaving.value = true;

  try {
    const payload = await buildPayload();
    console.log(payload);

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

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-md: 768px;

$avatar-size: 40px;



@mixin avatar($size: $avatar-size) {
  width: $size;
  height: $size;
  border-radius: 50%;
  flex-shrink: 0;
}

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.image-suggestion-edit {
  position: relative;
  padding: 0;

  &__content {
    display: flex;
    flex-direction: row;
  }

  &__loading {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-top: .75rem;
  }

  &__skeleton-card {
    background-color: var(--White);
    padding: 1rem;
    border-radius: 5px;
    box-shadow: 0 1px 3px rgb(0 0 0 / 8%);
  }

  &__skeleton-line {
    background-color: var(--Cinza-C);
    border-radius: 4px;
    animation: skeleton-pulse 1.4s ease-in-out infinite;

    &--label {
      height: 20px;
      width: 40%;
      margin-bottom: .75rem;
    }

    &--field {
      height: 40px;
      width: 100%;
      margin-top: .5rem;

    }
  }
}

.metadata-sections {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.identity-picker {
  background-color: var(--Off_white);
  padding: .25rem .5rem .5rem .5rem;
  border-radius: .313rem;

  &__label {
    color: var(--Preto);
    font-style: italic;
    font-weight: 400;
    font-size: .875rem;
    margin-bottom: .625rem;
    line-height: 125%;
  }

  &__selected {
    display: flex;
    align-items: center;
    justify-content: space-between;

    // Modificador: clicável quando existem coletivos disponíveis
    &--clickable {
      justify-content: space-between;
      cursor: pointer;
      border-radius: 4px;

      &:hover {
        background-color: rgba(0 0 0 / 4%);
      }
    }
  }

  &__selected-info {
    display: flex;
    align-items: center;
    gap: .5rem;
  }

  &__chevron {
    transition: transform 0.15s ease-in-out;

    &--open {
      transform: rotate(180deg);
    }
  }

  &__dropdown {
    width: 100%;
    max-height: 300px;
    background-color: var(--Off_white);
    border-radius: 4px;
    margin-top: .25rem;
    overflow-y: scroll;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: .5rem;
    padding: .5rem;
    cursor: pointer;
    transition: background-color 0.15s ease-in-out;

    &:hover {
      background-color: rgba(0 0 0 / 6%);
    }
  }

  &__avatar {
    width: 70px;
    height: 70px;
    border-radius: 50%;
  }

  &__avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__name {
    font-weight: 400;
    font-size: .875rem;
    line-height: 150%;
    color: var(--Preto);
  }
}

.metadata-section {

  &--card {
    padding: .5rem .75rem;
    box-shadow: 0 1px 3px rgb(0 0 0 / 8%);
    border-radius: 5px;
    background-color: var(--Off_white);

    &.metadata-section--invalid {
      background-color: var(--Negativo_C);
    }
  }

  &__title {
    font-size: 1.25rem;
    font-weight: 500;
    line-height: 150%;
    padding-top: 1.5rem;
    margin-bottom: .75rem;

    &--compact {
      padding: 0;
      margin-bottom: .75rem;
      margin-top: 1.25rem;
    }
  }

  &__description {
    color: var(--Preto);
    font-weight: 500;
    font-size: 1rem;
    line-height: 150%;
    margin-top: .5rem;
    margin-bottom: 1rem;
  }

  &__field {
    margin-bottom: 1.5rem;
    padding: 0 .75rem;
  }

  &__subtitle {
    color: var(--Cinza_E);
    margin-bottom: .5rem;
  }

  &__hint {
    color: var(--Cinza_M);
    font-size: .8rem;
    margin-top: .25rem;

    &--required {
      color: var(--Preto);
      font-weight: 400;
      font-size: .75rem;
      line-height: 114%;
      text-align: right;
      margin: .25rem 0;
    }
  }
}

.license-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.35em 0.65em;
  font-size: 1rem;
  font-weight: 400;
  border-radius: 4px;
  background-color: var(--Preto);
  color: var(--Branco);
}

.tag-input {
  position: relative;

  &__field {
    width: 100%;
    box-sizing: border-box;
    padding: .375rem .75rem;
    font-size: 1rem;
    border: 1px solid var(--Preto);
    border-radius: 4px;
    background-color: var(--Off_white);
    color: var(--Preto);
    transition:
      border-color 0.15s ease-in-out,
      box-shadow 0.15s ease-in-out;

    &:focus {
      outline: none;
      background-color: var(--Branco);
    }
  }

  &__suggestions {
    width: 100%;
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: .25rem;
    z-index: 1000;
    max-height: 300px;
    overflow-y: auto;
    background-color: var(--Branco);
    border: 1px solid var(--Cinza_C);
    border-radius: 4px;
    box-shadow: 0 4px 10px rgb(0 0 0 / 10%);
  }

  &__suggestion-item {
    display: block;
    width: 100%;
    text-align: left;
    padding: .5rem 1rem;
    background: none;
    border: none;
    cursor: pointer;
    font-size: .875rem;
    color: var(--Preto);

    &:hover {
      background-color: var(--Off_white);
    }

    &--create {
      display: flex;
      align-items: center;
      gap: .25rem;
      color: var(--Laranja_E);

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
  }

  &__chips {
    display: flex;
    flex-wrap: wrap;
    gap: .75rem;
    margin-top: .75rem;
  }

  &__chip {
    display: inline-flex;
    align-items: center;
    padding: .3125rem .5rem;
    gap: .75rem;
    font-weight: 400;
    font-size: .75rem;
    line-height: 114%;
    border: 1px solid var(--Cinza_M);
    color: var(--Cinza_M);
    border-radius: 2px;
    background-color: var(--Off_white);
  }

  &__chip-remove {
    background: none;
    border: none;
    cursor: pointer;

    span {
      display: flex;
      width: 13px;
      height: 13px;
      justify-content: center;
      align-items: center;
      box-sizing: border-box;

      &::before {
        font-size: .875rem;
        color: var(--Cinza_M);
      }
    }
  }
}

.date-field {
  display: flex;
  flex-direction: column;
  gap: .75rem;

  &__year-only {
    width: 120px;
  }

  &__interval {
    display: flex;
    align-items: center;
    gap: .5rem;

    span {
      font-size: .75rem;
      font-weight: 500;
      line-height: 125%;
    }
  }

  &__year-box {
    width: 120px;
  }

  &__input {
    width: 100%;
    box-sizing: border-box;
    padding: .375rem .75rem;
    font-size: .875rem;
    font-weight: 400;
    line-height: 150%;
    border: 1px solid var(--Preto);
    border-radius: 4px;
    background-color: var(--Off_white);
    color: var(--Preto);
    outline: none;

    &:focus {
      background-color: var(--Branco);
    }
  }

  &__options {
    display: flex;
    gap: 1.5rem;
  }

  &__option {
    display: flex;
    align-items: center;
    gap: .5rem;
  }

  &__radio {
    margin: 0;
    accent-color: var(--Preto);
  }

  &__option-label {
    margin: 0;
    font-size: .75rem;
    font-weight: 500;
    line-height: 125%;
  }
}

.location-search {
  position: relative;
  margin-bottom: 1rem;

  &__group {
    display: flex;
  }

  &__input {
    flex: 1;
    box-sizing: border-box;
    padding: .375rem .75rem;
    font-size: 1rem;
    border: 1px solid var(--Preto);
    border-radius: 4px 0 0 4px;
    background-color: var(--Off_white);
    color: var(--Preto);
    outline: none;

    &:focus {
      outline: none;
      background-color: var(--Branco);
    }
  }

  &__submit {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: .375rem .75rem;
    border: 1px solid var(--Preto);
    border-left: none;
    border-radius: 0 4px 4px 0;
    background-color: transparent;
    color: var(--Preto);
    cursor: pointer;
    transition: background-color 0.15s ease-in-out;

    &:hover:not(:disabled) {
      background-color: var(--Preto);
      color: var(--Branco);
    }

    &:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }
  }

  &__spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid currentcolor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  &__suggestions {
    width: 100%;
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: .25rem;
    z-index: 1000;
    max-height: 300px;
    overflow-y: auto;
    background-color: var(--Branco);
    border: 1px solid var(--Cinza_C);
    border-radius: 4px;
    box-shadow: 0 4px 10px rgb(0 0 0 / 10%);
  }

  &__suggestion-item {
    display: block;
    width: 100%;
    text-align: left;
    white-space: normal;
    padding: .5rem 1rem;
    background: none;
    border: none;
    cursor: pointer;
    font-size: .8rem;
    color: var(--Preto);

    &:hover {
      background-color: var(--Off_white);
    }
  }
}

.map-panel {

  &__instructions {
    color: var(--Cinza_E);
    margin-bottom: .5rem;
    font-weight: 700;
    font-size: .875rem;
    line-height: 125%;
  }

  // ------------------------------------------------------------------
  // Elemento: __container — wrapper do componente de mapa
  // ------------------------------------------------------------------

  &__container {
    height: 400px;
    overflow: hidden;
    border: 1px solid var(--Cinza_C);
    position: relative;
  }

  // ------------------------------------------------------------------
  // Elemento: __controls — controles de zoom posicionados sobre o mapa
  // ------------------------------------------------------------------

  &__controls {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    margin-bottom: 1rem;
  }

  // ------------------------------------------------------------------
  // Elemento: __clear-marker — botão de remover marcador
  // ------------------------------------------------------------------

  &__clear-marker {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 1;
    margin: .5rem;
    display: inline-flex;
    align-items: center;
    gap: .25rem;
    padding: .25rem .5rem;
    font-size: .875rem;
    background-color: var(--Branco);
    border: 1px solid var(--Cinza_C);
    border-radius: 4px;
    cursor: pointer;
    color: var(--Preto);

    &:hover {
      background-color: var(--Off_white);
    }
  }
}

.preview-actions-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: white;
  padding: 1rem;
  // display: flex;
  // flex-direction: column;
  // align-items: stretch;
  box-shadow: 2px -2px 5px 2px rgba(0, 0, 0, 0.1);
  z-index: 1000;

  &__group {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
  }

}

// .preview-actions-bar {
//   font-weight: 400;
//   font-size: 14px;
//   line-height: 150%;
// }

.action-btn {
  max-width: 264px;
  width: 100%;
  height: 25px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: .125rem 0;
  font-size: .875rem;
  border-radius: 5px;
  font-weight: 400;
  font-size: .875rem;
  line-height: 150%;
  cursor: pointer;

  &--cancel {
    color: var(--Preto);
    background-color: transparent;
    border: 1px solid var(--Preto);
    transition: background-color 0.15s ease-in-out, color 0.15s ease-in-out;

    &:hover {
      color: var(--Branco);
      background-color: var(--Preto);
    }
  }

  &--submit {
    color: var(--Branco);
    background-color: var(--Preto);
    border: 1px solid var(--Preto);

    &:hover:not(:disabled) {
      background-color: var(--Cinza_E);
    }

    &:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }
  }

  &__spinner {
    width: 1rem;
    height: 1rem;
    margin-right: .5rem;
    border: 2px solid currentcolor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
}

@keyframes skeleton-pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>