<template>
  <div class="container py-4 position-relative metadata-upload-page">
    <AppToast
      class="upload-box__alert"
      variant="soft"
      :toasts="toast.toasts.value"
      @close="toast.hide"
      @pause="toast.pause"
      @resume="toast.resume"
    />

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
                  :class="{
                    'justify-content-between cursor-pointer rounded':
                      hasCollectives,
                  }"
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
            class="metadata-essenciais py-4 p-4 shadow-sm"
            :class="[isEssenciaisInvalid ? 'bg-negativo-c' : 'bg-off-white']"
            style="border-radius: 5px"
          >
            <h2 class="mb-4">Dados essenciais</h2>

            <div class="metadata-essenciais__field">
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

            <div class="metadata-essenciais__field">
              <div class="term-text-wrapper mb-2">
                <h3 class="form-label text-cinza-e h3 mb-0">
                  Autorizações para publicação
                </h3>
                <a
                  href="#"
                  class="term-text-link text-decoration-none d-flex align-items-center gap-1 text-muted"
                >
                  <i class="bi bi-book" /> Revisar Termos e Condições
                </a>
              </div>
              <div class="metadata-essenciais__toggle mb-3">
                <label
                  class="form-check-label text-muted fst-italic small"
                  for="isAuthor"
                  >A imagem é de minha autoria</label
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
                <div class="metadata-essenciais__toggle mb-3">
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
                  class="metadata-essenciais__toggle mb-4"
                >
                  <label
                    class="form-check-label text-muted fst-italic small"
                    :class="{ 'text-negativo-e': isRightsInvalid }"
                    for="hasAuthorization"
                    >Tenho permissão expressa de quem detém a autoria para
                    disponibilizar a imagem no ARQUIGRAFIA</label
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
                    explain="Informe o nome de quem detém a autoria da imagem"
                    :invalid="isAuthorNameInvalid"
                    invalidMessage="Informe quem detém a autoria da imagem"
                  >
                    <template #default="{ id, ariaInvalid, ariaDescribedby }">
                      <input
                        :id="id"
                        type="text"
                        class="form-control"
                        :class="{ 'is-invalid': isAuthorNameInvalid }"
                        placeholder="Nome"
                        v-model="form.authorName"
                        :disabled="form.unknownAuthor"
                        :aria-invalid="ariaInvalid"
                        :aria-describedby="ariaDescribedby"
                        @blur="isAuthorNameTouched = true"
                      />
                    </template>
                  </UiField>
                </div>

                <div class="metadata-essenciais__toggle mb-4">
                  <label
                    class="form-check-label text-muted fst-italic small"
                    for="unknownAuthor"
                    >Não sei de quem é a autoria da imagem</label
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

            <div class="metadata-essenciais__field" v-if="!isRightsInvalid">
              <div class="term-text-wrapper mb-2">
                <h3 class="form-label text-cinza-e h3 mb-0">
                  Direitos de uso da imagem
                </h3>
                <a
                  href="#"
                  class="term-text-link text-decoration-none d-flex align-items-center gap-1 text-muted"
                >
                  <i class="bi bi-book" /> Sobre os Creative Commons
                </a>
              </div>

              <div class="metadata-essenciais__licenses">
                <div
                  v-for="license in licenses"
                  :key="license.value"
                  class="form-check metadata-essenciais__license"
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
                    class="form-check-label metadata-essenciais__license-label"
                    :for="license.value"
                  >
                    <span class="metadata-essenciais__license-name">
                      {{ license.label }}
                    </span>
                    <span
                      v-if="license.description"
                      class="metadata-essenciais__license-desc"
                    >
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

          <section id="geral" class="metadata-geral py-4">
            <h2 class="metadata-geral__title mb-4">Dados gerais</h2>

            <div class="metadata-geral__fields">
              <div class="metadata-geral__field-group">
                <div class="metadata-geral__field">
                  <WorkAutocompleteField
                    ref="workFieldRef"
                    v-model="form.work"
                  />
                </div>

                <div class="metadata-geral__field">
                  <UiField
                    label="Tags da imagem"
                    explain="Adicione tags para classificar a imagem"
                  >
                    <div class="position-relative">
                      <input
                        type="text"
                        class="form-control"
                        placeholder="Adicione novas tags aqui"
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
                          (filteredTagSuggestions.length > 0 ||
                            canCreateSubject)
                        "
                        class="dropdown-menu menu-light w-100 show position-absolute top-100 start-0 mt-1"
                        style="
                          z-index: 1000;
                          max-height: 300px;
                          overflow-y: auto;
                        "
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
                          <span>{{
                            isCreatingSubject
                              ? "Criando..."
                              : `Criar tag "${tagInput.trim()}"`
                          }}</span>
                        </button>
                      </div>
                    </div>
                  </UiField>
                  <div class="metadata-geral__tags d-flex flex-wrap">
                    <div
                      v-for="(tag, index) in form.tags"
                      :key="tag"
                      class="btn btn-outline-primary btn-sm btn-tag metadata-geral__tag d-inline-flex align-items-center"
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

                <div class="metadata-geral__field">
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
                  <div class="metadata-geral__hint">Máximo 500 caracteres.</div>
                </div>
              </div>

              <div class="metadata-geral__field">
                <UiField
                  label="Data da imagem"
                  explain="Informe a data de criação da imagem"
                >
                  <div class="metadata-geral__date">
                    <div
                      v-if="form.dateType === 'year'"
                      class="metadata-geral__date-input"
                    >
                      <input
                        type="number"
                        class="form-control"
                        v-model="dateYearInput"
                        placeholder="Ano"
                      />
                    </div>
                    <div
                      v-else
                      class="metadata-geral__date-interval d-flex align-items-center flex-wrap"
                    >
                      <span>Entre</span>
                      <div class="metadata-geral__date-input">
                        <input
                          type="number"
                          class="form-control"
                          v-model="dateYearInput"
                          placeholder="Ano"
                        />
                      </div>
                      <span>e</span>
                      <div class="metadata-geral__date-input">
                        <input
                          type="number"
                          class="form-control"
                          v-model="dateEndYearInput"
                          placeholder="Ano"
                        />
                      </div>
                    </div>

                    <div class="metadata-geral__date-options">
                      <div class="form-check metadata-geral__date-option">
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
                      <div class="form-check metadata-geral__date-option">
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

                    <div class="metadata-geral__date-options">
                      <div class="form-check metadata-geral__date-option">
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
                      <div class="form-check metadata-geral__date-option">
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
            </div>
          </section>

          <section id="localizacao" class="py-4">
            <h2 class="mb-4">Localização</h2>

            <div class="mb-4">
              <UiField
                :label="
                  isLocationSelected
                    ? 'Localidade selecionada'
                    : 'Buscar por localidade'
                "
                :explain="
                  isLocationSelected
                    ? 'Clique no mapa para escolher outro ponto'
                    : 'Busque e selecione a localidade no mapa'
                "
              >
                <!-- Estado de busca: enquanto não há marcador. -->
                <div v-if="!isLocationSelected" class="position-relative mb-3">
                  <input
                    type="text"
                    class="form-control"
                    placeholder="Ex: Av. Paulista, 1578, São Paulo"
                    v-model="locationQuery"
                    @input="onLocationInput"
                    @keydown.escape="closeLocationSuggestions"
                    autocomplete="off"
                  />
                  <div
                    v-if="
                      isSearchingLocation ||
                      locationSuggestions.length > 0 ||
                      hasSearchedLocation
                    "
                    class="dropdown-menu menu-light w-100 show position-absolute top-100 start-0 mt-1"
                    style="z-index: 1000; max-height: 300px; overflow-y: auto"
                  >
                    <span
                      v-if="isSearchingLocation"
                      class="dropdown-item-text text-muted fst-italic small"
                    >
                      Buscando…
                    </span>
                    <span
                      v-else-if="locationSuggestions.length === 0"
                      class="dropdown-item-text text-muted small"
                    >
                      Nenhum resultado encontrado.
                    </span>
                    <button
                      v-for="(suggestion, index) in locationSuggestions"
                      :key="index"
                      type="button"
                      class="dropdown-item text-wrap small"
                      @click="selectLocationSuggestion(suggestion)"
                    >
                      {{ labelFromResult(suggestion) }}
                    </button>
                  </div>
                </div>

                <!-- Estado selecionado: o endereço do marcador, com o X de
                     remover no padrão de "Suas redes" do formulário de perfil. -->
                <div v-else class="mb-3">
                  <div class="input-group">
                    <input
                      v-if="isEditingLocationLabel"
                      type="text"
                      class="form-control border-end-0"
                      v-model="form.location"
                      aria-label="Endereço da imagem"
                      @keydown.enter.prevent="finishEditingLocationLabel"
                      @blur="finishEditingLocationLabel"
                      v-focus
                    />
                    <!-- `readonly` em vez de `disabled`: mantém o endereço
                         acessível ao teclado e ao leitor de tela, e permite
                         rolar o texto quando ele é longo. -->
                    <input
                      v-else
                      type="text"
                      class="form-control border-end-0 location-readonly"
                      aria-label="Endereço da imagem"
                      readonly
                      :value="
                        isReverseGeocoding
                          ? 'Buscando endereço…'
                          : selectedLocationLabel
                      "
                    />
                    <button
                      type="button"
                      class="btn btn-light location-clear-btn"
                      aria-label="Limpar localização"
                      @click="clearLocation"
                    >
                      <i class="bi bi-x-lg" />
                    </button>
                  </div>
                  <button
                    v-if="!isEditingLocationLabel && !isReverseGeocoding"
                    type="button"
                    class="btn btn-link btn-sm px-0 text-decoration-underline"
                    @click="startEditingLocationLabel"
                  >
                    Editar endereço
                  </button>
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
                  marker-color="#2F2F2F"
                >
                  <MapControls
                    class="position-absolute bottom-0 start-50 translate-middle-x mb-3"
                    :show-search="false"
                    @zoom-in="zoomIn"
                    @zoom-out="zoomOut"
                  />
                  <!-- Sobreposto ao mapa: informa a busca sem empurrar o
                       restante da página ao aparecer e sumir. -->
                  <span
                    v-if="isReverseGeocoding"
                    class="position-absolute top-0 start-0 m-2 px-2 py-1 rounded bg-white border small text-muted"
                    style="z-index: 1"
                  >
                    Buscando o endereço deste ponto…
                  </span>
                </MapLibreMap>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>

  <div class="preview-actions-bar" aria-label="Ações do envio">
    <div class="preview-actions-bar__checkbox form-check mb-0">
      <input
        class="form-check-input"
        type="checkbox"
        id="sameDataToggle"
        v-model="useSameDataForAll"
        @change="handleSameDataToggle"
      />
      <label
        class="form-check-label preview-actions-bar__checkbox-label"
        for="sameDataToggle"
      >
        Usar mesmos dados para todas as imagens
      </label>
      <button
        type="button"
        class="btn p-0 border-0 bg-transparent ms-2 preview-actions-bar__info-btn"
        data-bs-toggle="popover"
        data-bs-placement="top"
        data-bs-trigger="hover focus"
        aria-label="Enquanto marcada, qualquer alteração nos metadados é aplicada a todas as imagens."
        ref="sameDataInfoRef"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M12 6C12 7.5913 11.3679 9.11742 10.2426 10.2426C9.11742 11.3679 7.5913 12 6 12C4.4087 12 2.88258 11.3679 1.75736 10.2426C0.632141 9.11742 0 7.5913 0 6C0 4.4087 0.632141 2.88258 1.75736 1.75736C2.88258 0.632141 4.4087 0 6 0C7.5913 0 9.11742 0.632141 10.2426 1.75736C11.3679 2.88258 12 4.4087 12 6ZM4.122 4.52475C4.09782 4.52508 4.07384 4.52047 4.0515 4.51121C4.02917 4.50195 4.00896 4.48823 3.99211 4.47089C3.97526 4.45354 3.96213 4.43295 3.95351 4.41036C3.94489 4.38777 3.94098 4.36366 3.942 4.3395C4.0125 3.06825 5.05275 2.625 6.00375 2.625C7.05075 2.625 8.00775 3.1725 8.00775 4.305C8.00775 5.115 7.5315 5.5005 7.07475 5.84775C6.522 6.267 6.31725 6.42375 6.31725 6.96225V7.041C6.31725 7.09073 6.2975 7.13842 6.26233 7.17358C6.22717 7.20875 6.17948 7.2285 6.12975 7.2285H5.52225C5.47304 7.22851 5.4258 7.20916 5.39072 7.17465C5.35564 7.14013 5.33554 7.09321 5.33475 7.044L5.33175 6.88125C5.30325 6.186 5.703 5.75775 6.20775 5.391C6.65025 5.058 6.9315 4.839 6.9315 4.36275C6.9315 3.744 6.4605 3.48675 5.946 3.48675C5.34375 3.48675 5.00625 3.84525 4.9395 4.33725C4.926 4.44 4.8435 4.52475 4.74 4.52475H4.12125H4.122ZM5.86575 9.357C5.42775 9.357 5.109 9.0615 5.109 8.66175C5.109 8.24775 5.42775 7.95675 5.8665 7.95675C6.32325 7.95675 6.6375 8.24775 6.6375 8.66175C6.6375 9.0615 6.3225 9.357 5.86575 9.357Z"
            fill="#2F2F2F"
          />
        </svg>
      </button>
    </div>

    <div class="preview-actions-bar__buttons">
      <button
        type="button"
        class="btn btn-primary preview-actions-bar__btn"
        :disabled="!canSubmit || isSubmitting"
        @click="handleSubmit"
      >
        <span
          v-if="isSubmitting"
          class="spinner-border spinner-border-sm me-2"
          role="status"
          aria-hidden="true"
        />
        {{ isSubmitting ? "Enviando..." : "Enviar imagens" }}
      </button>

      <button
        type="button"
        class="btn btn-outline-secondary preview-actions-bar__btn"
        :disabled="isSubmitting"
        @click="handleCancel"
      >
        Cancelar
      </button>
    </div>
  </div>

  <transition name="fade">
    <div
      v-if="isSubmitting"
      class="upload-overlay"
      role="alertdialog"
      aria-live="assertive"
      aria-busy="true"
    >
      <div class="upload-overlay__box">
        <div class="spinner-border text-light mb-3" role="status">
          <span class="visually-hidden">Enviando...</span>
        </div>
        <p class="upload-overlay__text mb-0">
          Enviando {{ uploadProgress.current }} de {{ uploadProgress.total }}...
        </p>
        <p class="upload-overlay__hint mb-0">Não feche esta janela.</p>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, markRaw, computed, watch, onMounted, onBeforeUnmount } from "vue";
import axios from "@/axios";
import ImagePreviewPanel from "@/components/imageMetadaUpload/ImagePreviewPanel.vue";
import AppToast from "@/components/ui/AppToast.vue";
import { useToast } from "@/composables/useToast";
import UiField from "@/components/ui/UiField.vue";
import MapLibreMap from "@/components/map/MapLibreMap.vue";
import MapControls from "@/components/map/MapControls.vue";
import WorkAutocompleteField from "@/components/work/WorkAutocompleteField.vue";
import { resolveWorkId } from "@/composables/useWorkAutocomplete";
import { useImageUploadStore } from "@/store/imageUploads";
import { useAuthStore } from "@/store/auth";
import { useVracStore } from "@/store/vrac";
import { storeToRefs } from "pinia";
import { useRouter, useRoute } from "vue-router";
import { useQueryClient } from "@tanstack/vue-query";
import { formatDate, parseYearFromDateString } from "@/helpers/dateUtils";
import { isMetadataValid } from "@/helpers/imageMetadata";
import { labelFromResult } from "@/helpers/locationLabel";
import Fuse from "fuse.js";
import { Popover } from "bootstrap";
defineOptions({ name: "ImageMetadataUpload" });

const API_BASE_URL = import.meta.env.VITE_BASE_REQUEST_URL;

const router = useRouter();
const route = useRoute();
const queryClient = useQueryClient();

// Destino pós-upload: se a publicação foi para um coletivo, volta para a página
// inicial daquele coletivo; caso contrário, para o grid de imagens do usuário.
function postUploadTarget() {
  const { publishAs, publishAsId } = route.query;
  if (publishAs === "collective" && publishAsId) {
    return { name: "collective-detail", params: { id: String(publishAsId) } };
  }
  return { name: "my-profile-images" };
}

// Invalida os caches das listagens de imagens. Cobre o grid do usuário/home
// (["images"]) e o grid do coletivo (["collective-images"]), já que o upload
// pode ter sido publicado em qualquer um dos contextos.
async function invalidateImageCaches() {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["images"], refetchType: "all" }),
    queryClient.invalidateQueries({
      queryKey: ["collective-images"],
      refetchType: "all",
    }),
  ]);
}
const imageUploadStore = useImageUploadStore();
const { pendingImages, selectedIndex } = storeToRefs(imageUploadStore);
const authStore = useAuthStore();
const { loggedUser } = storeToRefs(authStore);
const vracStore = useVracStore();

// Referência ao campo de obra, usada para registrar uma obra recém-criada na
// busca depois que o rascunho é materializado no envio.
const workFieldRef = ref(null);

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
    return entity.avatar_url.startsWith("http")
      ? entity.avatar_url
      : `${API_BASE_URL}${entity.avatar_url}`;
  }
  if (entity.avatar_path) {
    return `${API_BASE_URL}/storage/${entity.avatar_path}`;
  }
  return null;
};

// Todas as identidades de publicação: o usuário e seus coletivos
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

// Pré-seleciona a identidade com base no contexto de onde o upload foi iniciado
watch(
  publishingIdentities,
  (identities) => {
    if (selectedIdentityId.value !== null || !identities.length) return;
    const { publishAs, publishAsId } = route.query;
    if (!publishAs || !publishAsId) return;
    const match = identities.find(
      (i) => i.type === publishAs && String(i.id) === String(publishAsId),
    );
    if (match) selectedIdentityId.value = match.id;
  },
  { immediate: true },
);

// Padrão: identidade do usuário
const selectedIdentity = computed(() => {
  if (!publishingIdentities.value.length) return null;
  if (!selectedIdentityId.value) return publishingIdentities.value[0];
  return (
    publishingIdentities.value.find((i) => i.id === selectedIdentityId.value) ||
    publishingIdentities.value[0]
  );
});

const hasCollectives = computed(
  () =>
    Array.isArray(loggedUser.value?.collectives) &&
    loggedUser.value.collectives.length > 0,
);

const availableIdentities = computed(() => {
  return publishingIdentities.value.filter(
    (identity) => identity.id !== selectedIdentity.value?.id,
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
const toast = useToast();

const isSubmitting = ref(false);
const uploadProgress = ref({ current: 0, total: 0 });

// Trava o scroll do body enquanto o overlay de envio está ativo
watch(isSubmitting, (active) => {
  document.body.style.overflow = active ? "hidden" : "";
});

// Popover de ajuda do checkbox "usar mesmos dados"
const sameDataInfoRef = ref(null);
let sameDataPopover = null;

onMounted(() => {
  if (sameDataInfoRef.value) {
    sameDataPopover = new Popover(sameDataInfoRef.value, {
      trigger: "hover focus",
      placement: "top",
      container: "body",
      content:
        "Enquanto marcada, qualquer alteração nos metadados é aplicada a todas as imagens.",
    });
  }
});

onBeforeUnmount(() => {
  document.body.style.overflow = "";
  if (sameDataPopover) {
    sameDataPopover.dispose();
    sameDataPopover = null;
  }
  if (locationDebounce) clearTimeout(locationDebounce);
  locationAbortController?.abort();
  reverseAbortController?.abort();
});

const isTitleTouched = ref(false);
const isTitleInvalid = computed(
  () => isTitleTouched.value && !form.value.title.trim(),
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
    return formatDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
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

      // Se a data do EXIF existe, usa para data inicial e final
      if (exifDate && !storedMetadata.date) {
        date = exifDate;
        dateEnd = exifDate;
      }
      // Se o usuário informou uma data e o tipo é 'year', expande para o ano completo
      else if (
        date &&
        !storedMetadata.dateEnd &&
        form.value.dateType === "year"
      ) {
        const year = parseYearFromDateString(date);
        if (year) {
          date = formatDate(year, 1, 1);
          dateEnd = formatDate(year, 12, 31);
        }
      }
      // Se o usuário informou uma data e o tipo é 'interval', expande as duas datas
      else if (date && dateEnd && form.value.dateType === "interval") {
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
  { immediate: true },
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
  { deep: true },
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

// Clicar no mapa também preenche o endereço, como no WorkCreateModal: sem isso
// o rótulo salvo continuaria apontando para um lugar diferente do marcador.
const handleMapClick = async ({ lng, lat }) => {
  form.value.coordinates = { lng, lat };

  // Uma busca por texto pendente sobrescreveria o endereço que vamos escrever
  // aqui, então ela é descartada junto com a lista de sugestões.
  if (locationDebounce) clearTimeout(locationDebounce);
  locationAbortController?.abort();
  isSearchingLocation.value = false;
  closeLocationSuggestions();

  reverseAbortController?.abort();
  reverseAbortController = new AbortController();
  const { signal } = reverseAbortController;

  isReverseGeocoding.value = true;
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { "Accept-Language": "pt-BR,pt" }, signal },
    );
    const data = await response.json();
    form.value.location = labelFromResult(data, { lat, lng });
  } catch (error) {
    if (error.name === "AbortError") return;
    console.warn("Erro no reverse geocoding:", error);
    // Sem endereço, o rótulo vira a própria coordenada: o estado selecionado
    // continua descrevendo o marcador, em vez de ficar em branco.
    form.value.location = labelFromResult(null, { lat, lng });
  } finally {
    if (!signal.aborted) isReverseGeocoding.value = false;
  }
};

const zoomIn = () => {
  mapInstance.value?.zoomIn();
};

const zoomOut = () => {
  mapInstance.value?.zoomOut();
};

// Geocodificação de localização
//
// `locationQuery` é o que o usuário digita para procurar, e `form.location` é
// o rótulo do ponto escolhido — o valor que vai para o backend. Só existe
// rótulo quando existe coordenada, o que impede o endereço de apontar para um
// lugar diferente do marcador.
const locationQuery = ref("");
const locationSuggestions = ref([]);
const isSearchingLocation = ref(false);
const hasSearchedLocation = ref(false);
const isReverseGeocoding = ref(false);
const isEditingLocationLabel = ref(false);
const LOCATION_MIN_LENGTH = 3;
let locationDebounce = null;
let locationAbortController = null;
let reverseAbortController = null;

// A coordenada é a fonte da verdade: havendo marcador, a tela está no estado
// "selecionado" e a busca dá lugar ao endereço escolhido.
const isLocationSelected = computed(() => form.value.coordinates !== null);

// Uma coordenada sem rótulo chega pelo EXIF da foto, que é adotado sem passar
// pela Nominatim. Nesse caso o ponto se descreve pelas próprias coordenadas em
// vez de deixar a caixa vazia.
const selectedLocationLabel = computed(() => {
  if (form.value.location?.trim()) return form.value.location;
  if (!form.value.coordinates) return "";
  const { lat, lng } = form.value.coordinates;
  return labelFromResult(null, { lat, lng });
});

const searchLocation = async () => {
  const query = locationQuery.value.trim();
  if (query.length < LOCATION_MIN_LENGTH) {
    locationSuggestions.value = [];
    hasSearchedLocation.value = false;
    return;
  }
  // Cancela a busca anterior para que uma resposta atrasada não sobrescreva
  // o resultado da digitação mais recente.
  locationAbortController?.abort();
  locationAbortController = new AbortController();
  const { signal } = locationAbortController;

  isSearchingLocation.value = true;
  try {
    const response = await fetch(
      // `addressdetails=1` traz o objeto `address` estruturado, de onde o
      // rótulo é composto sem o nome do estabelecimento.
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`,
      { headers: { "Accept-Language": "pt-BR,pt" }, signal },
    );
    locationSuggestions.value = await response.json();
    hasSearchedLocation.value = true;
  } catch (error) {
    if (error.name === "AbortError") return;
    console.warn("Erro ao buscar localidade:", error);
    locationSuggestions.value = [];
    hasSearchedLocation.value = true;
  } finally {
    if (!signal.aborted) isSearchingLocation.value = false;
  }
};

// A Nominatim é gratuita e limita a 1 req/s: só buscamos depois que
// o usuário para de digitar.
const onLocationInput = () => {
  hasSearchedLocation.value = false;
  if (locationDebounce) clearTimeout(locationDebounce);
  locationDebounce = setTimeout(searchLocation, 500);
};

const selectLocationSuggestion = (suggestion) => {
  const lng = parseFloat(suggestion.lon);
  const lat = parseFloat(suggestion.lat);
  form.value.coordinates = { lng, lat };
  form.value.location = labelFromResult(suggestion, { lat, lng });
  mapInstance.value?.flyTo({ center: [lng, lat], zoom: 14 });
  locationSuggestions.value = [];
  hasSearchedLocation.value = false;
};

// Fecha a lista sem descartar o que já foi digitado ou selecionado.
const closeLocationSuggestions = () => {
  if (locationDebounce) clearTimeout(locationDebounce);
  locationSuggestions.value = [];
  hasSearchedLocation.value = false;
};

// Volta ao estado de busca: descarta rótulo e marcador juntos, nunca um só.
// O texto digitado antes da seleção é devolvido ao campo, para que corrigir um
// endereço seja ajustar a busca em vez de redigitá-la do zero.
const clearLocation = () => {
  if (locationDebounce) clearTimeout(locationDebounce);
  locationAbortController?.abort();
  reverseAbortController?.abort();
  form.value.location = "";
  form.value.coordinates = null;
  locationSuggestions.value = [];
  hasSearchedLocation.value = false;
  isSearchingLocation.value = false;
  isReverseGeocoding.value = false;
  isEditingLocationLabel.value = false;
};

// Leva o cursor ao campo assim que ele aparece, para "Editar endereço" já sair
// digitável.
const vFocus = {
  mounted: (el) => el.focus(),
};

// Zera só o que é estado de tela, preservando rótulo e coordenada da imagem.
// Declarado aqui, junto do estado que manipula, e ligado à troca de imagem por
// um watcher próprio — o watcher de `selectedIndex` que restaura o formulário
// roda com `immediate: true`, ou seja, ainda durante o setup, quando estas
// referências não existem.
const resetLocationUi = () => {
  if (locationDebounce) clearTimeout(locationDebounce);
  locationAbortController?.abort();
  reverseAbortController?.abort();
  locationQuery.value = "";
  locationSuggestions.value = [];
  hasSearchedLocation.value = false;
  isSearchingLocation.value = false;
  isReverseGeocoding.value = false;
  isEditingLocationLabel.value = false;
};

watch(selectedIndex, resetLocationUi);

// Saída de emergência para os casos em que a Nominatim não descreve bem o
// lugar: o rótulo passa a ser editável, mas a coordenada permanece a do
// marcador. É a única forma de texto e ponto divergirem, e exige ação
// deliberada.
const startEditingLocationLabel = () => {
  isEditingLocationLabel.value = true;
};

const finishEditingLocationLabel = () => {
  isEditingLocationLabel.value = false;
  // Rótulo apagado por inteiro volta a ser o do ponto marcado, para o envio
  // nunca sair com coordenada sem endereço.
  if (!form.value.location.trim() && form.value.coordinates) {
    const { lat, lng } = form.value.coordinates;
    form.value.location = labelFromResult(null, { lat, lng });
  }
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
    isRightsInvalid.value || isTitleInvalid.value || isAuthorNameInvalid.value,
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

// Estado do autocomplete de tags
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
    (s) => s.term.toLowerCase() === term.toLowerCase(),
  );
});

// Estado dos nomes de contribuidores
const allContributorNames = ref([]);

// Carrega dados atualizados do usuário, assuntos e nomes de contribuidores na montagem
onMounted(async () => {
  try {
    // Atualiza dados do usuário para garantir coletivos atualizados
    await authStore.getLoggedUser();

    // Busca assuntos
    const subjects = await vracStore.getVRACSubjects();
    if (Array.isArray(subjects)) {
      allSubjects.value = subjects;
      // Inicializa o Fuse.js com os assuntos carregados
      fuseInstance = new Fuse(allSubjects.value, {
        keys: ["term"],
        threshold: 0.3, // Permite correspondência aproximada
        includeScore: true,
      });
    }

    // Busca nomes de contribuidores
    const contributors = await vracStore.getVRACContributorNames();
    if (Array.isArray(contributors)) {
      allContributorNames.value = contributors;
    }

    // As obras são carregadas pelo próprio WorkAutocompleteField.
  } catch (error) {
    console.error("Error fetching data:", error);
  }
});

// Função de busca com debounce
const onTagInputChange = () => {
  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    if (!tagInput.value.trim()) {
      filteredTagSuggestions.value = [];
      return;
    }

    if (fuseInstance) {
      const results = fuseInstance.search(tagInput.value);
      // Exclui tags que já foram adicionadas
      filteredTagSuggestions.value = results
        .map((result) => result.item) // extrai o assunto em si
        .filter((item) => !form.value.tags.includes(item.term))
        .slice(0, 10);
    }
  }, 300); // 300ms debounce
};

const hideTagSuggestions = () => {
  // Pequeno atraso para permitir o clique na sugestão antes de ocultar
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
  if (!term || form.value.tags.includes(term) || isCreatingSubject.value)
    return;
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
    toast.show("Não foi possível criar o assunto. Tente novamente.", "error");
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
    (s) => s.term.toLowerCase() === term.toLowerCase(),
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
  toast.show(message, "error");
};

// Traduz a falha de um POST /api/images em frase.
// A API responde 422 com `errors`/`message` legíveis na validação;
// um 5xx não traz motivo aproveitável (o corpo é genérico).
function describeUploadError(error) {
  const status = error.response?.status;

  if (status >= 500) {
    return "o servidor não conseguiu processar o arquivo. Tente novamente ou avise a equipe.";
  }

  const apiErrors = error.response?.data?.errors;
  if (apiErrors) {
    const firstError = Object.values(apiErrors)[0]?.[0];
    if (firstError) return firstError;
  }

  return (
    error.response?.data?.message ||
    error.message ||
    "erro inesperado no envio."
  );
}

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
    toast.show(
      "Por favor, preencha todos os dados obrigatórios de todas as imagens.",
      "error",
    );
    return;
  }

  if (isSubmitting.value) return; // cinto de segurança contra duplo-envio
  isSubmitting.value = true;
  uploadProgress.value = { current: 0, total: pendingImages.value.length };

  try {
    const successfulUploads = [];
    const failedUploads = [];

    // Processa cada imagem individualmente
    for (let index = 0; index < pendingImages.value.length; index++) {
      const image = pendingImages.value[index];
      const metadata = image.metadata || {};

      uploadProgress.value = {
        current: index + 1,
        total: pendingImages.value.length,
      };

      try {
        // Mapeia as tags selecionadas para seus UUIDs em allSubjects
        const subjectUuids = (metadata.tags || [])
          .map((tagTerm) => {
            const subject = allSubjects.value.find((s) => s.term === tagTerm);
            return subject ? subject.id : null;
          })
          .filter((id) => id !== null);

        // Busca ou cria o UUID do fotógrafo
        // Se isAuthor for verdadeiro, usa o nome do usuário logado; caso contrário, usa authorName
        let photographerUuid = null;
        let photographerName = null;

        if (metadata.isAuthor && loggedUser.value?.name) {
          photographerName = loggedUser.value.name.trim();
        } else if (metadata.authorName && metadata.authorName.trim()) {
          photographerName = metadata.authorName.trim();
        }

        if (photographerName) {
          let contributor = allContributorNames.value.find(
            (c) => c.name.toLowerCase() === photographerName.toLowerCase(),
          );

          // Se o fotógrafo não existe, cria um novo
          if (!contributor) {
            const newContributor =
              await vracStore.addVRACContributorName(photographerName);
            if (newContributor?.id) {
              contributor = newContributor;
              allContributorNames.value.push(contributor);
            }
          }

          photographerUuid = contributor?.id || null;
        }

        // Cria o FormData para esta imagem específica
        const formData = new FormData();
        formData.append("image", image.file);
        formData.append("user_id", loggedUser.value.id);
        if (selectedIdentity.value?.type === "collective") {
          formData.append("collective_id", selectedIdentity.value.id);
        }
        formData.append("title", metadata.title || "");
        formData.append("license", metadata.license || "CC BY-NC-SA");

        // Adiciona campos opcionais
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
        } else {
          formData.append("circa", "0");
        }
        if (metadata.coordinates) {
          // Garante casas decimais nas coordenadas (Laravel espera decimal:1,8)
          const lat = parseFloat(metadata.coordinates.lat).toFixed(8);
          const lng = parseFloat(metadata.coordinates.lng).toFixed(8);
          formData.append("latitude", lat);
          formData.append("longitude", lng);
        }
        if (metadata.location) {
          formData.append("location_label", metadata.location);
        }

        // Adiciona array de assuntos
        subjectUuids.forEach((uuid) => {
          formData.append("subjects[]", uuid);
        });

        // Adiciona a obra selecionada (seleção única, mas o backend espera array).
        // Se a obra ainda é um rascunho do WorkCreateModal, materializa agora —
        // este é o primeiro momento em que o usuário confirmou o envio.
        const { id: workId, work: newWork } = await resolveWorkId(
          metadata.work,
        );
        if (newWork) workFieldRef.value?.registerWork(newWork);
        if (workId) {
          formData.append("works[]", workId);
        }

        // Loga as entradas do FormData para depuração
        console.log(`\n=== FormData for Image ${index + 1} ===`);
        for (const [key, value] of formData.entries()) {
          if (value instanceof File) {
            console.log(`${key}: [File] ${value.name} (${value.size} bytes)`);
          } else {
            console.log(`${key}: ${value}`);
          }
        }
        console.log("===========================\n");

        // Envia esta imagem
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
          error: describeUploadError(error),
        });
      }
    }

    // Exibe os resultados
    if (successfulUploads.length > 0 && failedUploads.length === 0) {
      const successMessage = `${successfulUploads.length} ${
        successfulUploads.length === 1 ? "imagem enviada" : "imagens enviadas"
      } com sucesso!`;

      // Invalida o cache e redireciona, levando a mensagem de sucesso para o
      // perfil (o overlay cobriria o alerta se ele fosse exibido aqui).
      imageUploadStore.clearImages();
      await invalidateImageCaches();
      router.push({
        ...postUploadTarget(),
        state: { uploadSuccess: successMessage },
      });
    } else if (failedUploads.length > 0) {
      // Reabilita a UI para permitir correção e reenvio
      isSubmitting.value = false;
      const intro =
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

      // O motivo de cada falha (uma só, ou uma linha por imagem) — sem ele a
      // contagem não diz ao usuário o que houve nem o que tentar em seguida.
      const reasons =
        failedUploads.length === 1
          ? ` ${failedUploads[0].error}`
          : ` ${failedUploads
              .map((failure) => `${failure.title}: ${failure.error}`)
              .join("; ")}`;

      toast.show(`${intro}${reasons}`, "error");

      // Se alguns enviaram com sucesso, remove-os da lista
      if (successfulUploads.length > 0) {
        setTimeout(async () => {
          // Remove os uploads bem-sucedidos da lista pendente
          const remainingImages = pendingImages.value.filter((img) => {
            const title = img.metadata?.title || "";
            return !successfulUploads.includes(title);
          });

          if (remainingImages.length === 0) {
            imageUploadStore.clearImages();
            await invalidateImageCaches();
            router.push(postUploadTarget());
          }
        }, 2000);
      }
    }
  } catch (error) {
    console.error("Erro ao enviar imagens:", error);
    isSubmitting.value = false;
    toast.show(
      error.response?.data?.message ||
        "Erro ao enviar imagens. Por favor, tente novamente.",
      "error",
    );
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

.location-readonly {
  cursor: default;
}

// X de remover a localização: claro em repouso, invertido no hover.
.location-clear-btn {
  display: flex;
  align-items: center;
  padding-top: 0;
  padding-bottom: 0;
  border: var(--bs-border-width) solid var(--Preto);
  border-left: 0;

  .bi {
    line-height: 1;
    vertical-align: 0;
  }

  &:hover,
  &:focus {
    background-color: var(--Preto);
    border-color: var(--Preto);
    color: var(--Branco);
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

.upload-overlay {
  position: fixed;
  inset: 0;
  z-index: 1060;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(2px);
}

.upload-overlay__box {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: #fff;
  padding: 2rem;
}

.upload-overlay__text {
  color: #fff;
  font-size: 1.1rem;
  font-weight: 500;
}

.upload-overlay__hint {
  color: #fff;
  font-size: 0.875rem;
  opacity: 0.75;
  margin-top: 0.25rem;
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

$breakpoint-tablet: 1024px;

.term-text-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;

  @media (max-width: #{$breakpoint-tablet}) {
    flex-direction: column;
    align-items: flex-start;
  }

  .term-text-link {
    font-size: 0.75rem;

    @media (max-width: #{$breakpoint-tablet}) {
      margin-bottom: 12px;
    }

    .bi {
      font-size: 14px;
    }
  }
}

.metadata-essenciais {
  @media (max-width: #{$breakpoint-tablet}) {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: stretch;
    align-self: stretch;
    padding: var(--pp, 8px) var(--p, 12px) !important;
    box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);

    h2.mb-4 {
      flex: 1 0 0;
      align-self: stretch;
      padding-top: var(--p, 12px);
      margin-bottom: 1rem !important;
      font-size: 16px;
    }
  }

  &__field {
    margin-bottom: 24px;

    @media (max-width: #{$breakpoint-tablet}) {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: stretch;
      gap: var(--ppp, 4px);
      align-self: stretch;
      margin-bottom: 24px;
      padding: 0;
      width: 100%;
    }

    &:last-of-type {
      margin-bottom: 0;
    }
  }

  &__toggle {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;

    .form-check-label {
      flex: 1 1 auto;
      min-width: 0;
    }

    .form-check.form-switch {
      flex-shrink: 0;
    }
  }

  &__licenses {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--ppp, 4px);
    align-self: stretch;
    width: 100%;

    @media (max-width: #{$breakpoint-tablet}) {
      padding-right: 24px;
    }
  }

  &__license {
    margin-bottom: 0;
    padding: 8px 0 4px 0;
    padding-left: 0;
    display: flex;
    align-items: flex-start;
    gap: var(--pp, 8px);
    align-self: stretch;
    width: 100%;
    min-height: unset;

    &.form-check {
      padding-left: 0;
      min-height: unset;
    }

    .form-check-input {
      flex-shrink: 0;
      margin-top: 2px;
      margin-left: 0;

      @media (max-width: #{$breakpoint-tablet}) {
        width: 12px;
        height: 12px;
      }
    }
  }

  &__license-label {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    gap: var(--ppp, 4px);
    flex: 1 1 auto;
    min-width: 0;
    padding-left: 0;
    margin-bottom: 0;
  }

  &__license-name {
    display: block;
    font-style: normal;
    color: var(--Preto, #1f1f1f);
    font-size: 14px;
    line-height: 150%;
    font-weight: 600;

    @media (max-width: #{$breakpoint-tablet}) {
      font-size: 10px;
      line-height: 16px;
    }
  }

  &__license-desc {
    display: block;
    margin-top: 0;
    font-size: 12px;
    line-height: 125%;
    color: var(--Cinza_M, #636262);
    font-style: normal;

    @media (max-width: #{$breakpoint-tablet}) {
      font-size: 10px;
      line-height: 16px;
    }
  }
}

.metadata-geral {
  @media (max-width: #{$breakpoint-tablet}) {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__title {
    @media (max-width: #{$breakpoint-tablet}) {
      flex: 1 0 0;
      align-self: stretch;
      color: var(--Gray-900, #212529);
      font-family: "DM Sans", sans-serif;
      font-size: 16px;
      font-style: normal;
      font-weight: 500;
      line-height: 150%;
      margin-bottom: 0 !important;
    }
  }

  &__fields {
    display: flex;
    flex-direction: column;
    gap: 24px;
    width: 100%;
  }

  &__field-group {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
  }

  &__field {
    width: 100%;

    @media (max-width: #{$breakpoint-tablet}) {
      padding-left: 0;
      padding-right: 0;
    }

    :deep(.form-control:not(textarea)) {
      @media (max-width: #{$breakpoint-tablet}) {
        display: flex;
        height: 30px;
        min-height: 30px;
        padding: 6px 10px;
        align-items: center;
        gap: 18px;
        align-self: stretch;
        border-radius: 5px;
        border: 0.75px solid var(--Preto, #1f1f1f);
        background: var(--Off_white, #faf9f9);
        font-size: 14px;
        box-sizing: border-box;
      }
    }

    :deep(textarea.form-control) {
      @media (max-width: #{$breakpoint-tablet}) {
        display: flex;
        min-height: 120px;
        padding: 6px 10px;
        align-items: flex-start;
        gap: 18px;
        align-self: stretch;
        border-radius: 5px;
        border: 0.75px solid var(--Preto, #1f1f1f);
        background: var(--Off_white, #faf9f9);
        box-sizing: border-box;
      }
    }
  }

  &__tags {
    gap: 8px 12px;
    margin-top: var(--p, 12px);
  }

  &__tag {
    height: 24px;
    padding: 4px 8px;
    gap: var(--p, 12px);
    border-radius: 2px;
    border-color: var(--Laranja_E, #aa4f28);
    color: var(--Laranja_E, #aa4f28);
    font-size: 12px;
    line-height: 115%;
  }

  &__work-selected {
    @media (max-width: #{$breakpoint-tablet}) {
      height: auto;
      min-height: 30px;
    }
  }

  &__hint {
    padding: var(--ppp, 4px) 0;
    text-align: right;
    color: var(--Cinza_E, #2f2f2f);
    font-size: 12px;
    line-height: 115%;
  }

  &__date {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
    max-width: 600px;
  }

  &__date-interval {
    gap: 8px;
    font-size: 12px;
    font-weight: 500;
    line-height: 125%;
    color: var(--Gray-900, #212529);
  }

  &__date-input {
    width: 85px;
    flex-shrink: 0;
  }

  &__date-options {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 4px;
  }

  &__date-option {
    display: flex;
    align-items: flex-start;
    gap: var(--pp, 8px);
    padding: 8px 4px 4px;
    margin-bottom: 0;
    min-height: unset;

    .form-check-input {
      flex-shrink: 0;
      margin-top: 2px;
      margin-left: 0;

      @media (max-width: #{$breakpoint-tablet}) {
        width: 12px;
        height: 12px;
      }
    }

    .form-check-label {
      font-size: 12px;
      line-height: 125%;
      font-weight: 500;
      color: var(--Cinza_E, #2f2f2f);
    }
  }
}

.metadata-upload-page {
  @media (max-width: 767.98px) {
    padding-left: var(--g, 24px);
    padding-right: var(--g, 24px);
  }
}

.preview-actions-bar {
  position: relative;
  background-color: var(--Branco, #fff);
  box-shadow: 2px -1px 5px rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  padding: 24px;
  padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px));
  z-index: 1;

  &__checkbox {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 4px;
    padding-right: 4px;
    width: 100%;
  }

  &__checkbox-label {
    flex: 1 1 auto;
    font-size: 12px;
    line-height: 125%;
    color: var(--Cinza_E, #2f2f2f);
  }

  &__info-btn {
    vertical-align: middle;
    transform: translateY(-2px);
  }

  &__buttons {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  &__btn {
    width: 100%;
    justify-content: center;
    font-weight: 400;
    font-size: 14px;
    line-height: 150%;
  }

  @include md {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    gap: 3rem;
    padding: 1rem 2rem;
    padding-bottom: 1rem;
    box-shadow: 2px -2px 5px 2px rgba(0, 0, 0, 0.1);

    &__checkbox {
      width: auto;
      flex: 0 0 auto;
      padding-bottom: 0;
      padding-right: 0;
    }

    &__checkbox-label {
      flex: 0 1 auto;
      font-size: 14px;
      line-height: 150%;
    }

    &__buttons {
      flex-direction: row-reverse;
      width: auto;
      flex: 0 0 auto;
      gap: 12px;
    }

    &__btn {
      width: auto;
      flex: unset;
    }
  }
}

@media (min-width: 768px) {
  .sticky-preview-panel {
    position: sticky;
    top: 20px;
    align-self: flex-start;
  }
}
</style>
