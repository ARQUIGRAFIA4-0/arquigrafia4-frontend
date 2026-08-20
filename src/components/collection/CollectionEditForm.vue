<script setup>
import { computed } from "vue";
import UiField from "@/components/ui/UiField.vue";

defineOptions({ name: "CollectionEditForm" });

const props = defineProps({
  title: { type: String, default: "" },
  description: { type: String, default: "" },
  isPrivate: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  titleDisabled: { type: Boolean, default: false },
});

const emit = defineEmits(["update:title", "update:description", "update:isPrivate"]);

const DESCRIPTION_MAX_LENGTH = 500;

const descriptionLength = computed(() => props.description.length);
const isDescriptionOverLimit = computed(() => descriptionLength.value > DESCRIPTION_MAX_LENGTH);

// Função para atualizar o título da coleção.
function onTitleInput(event) {
  emit("update:title", event.target.value);
}

// Função para atualizar a descrição da coleção.
function onDescriptionInput(event) {
  emit("update:description", event.target.value);
}

// Função para alternar a visibilidade (pública/privada) da coleção.
function onPrivateChange(event) {
  emit("update:isPrivate", event.target.checked);
}
</script>

<template>
  <article class="collection-edit-form" aria-labelledby="collection-edit-form-heading">
    <h2 id="collection-edit-form-heading" class="collection-edit-form__heading">
      Dados
    </h2>

    <div class="collection-edit-form__fields">
      <div class="collection-edit-form__field">
        <UiField
          id="collection-edit-title"
          label="Título da coleção"
          explain="Nome público da coleção."
        >
          <input
            id="collection-edit-title"
            class="collection-edit-form__input"
            type="text"
            :value="title"
            :disabled="disabled || titleDisabled"
            placeholder="Arquitetura no percurso da fonte à fábrica"
            @input="onTitleInput"
          />
        </UiField>
      </div>

      <div class="collection-edit-form__field">
        <UiField
          id="collection-edit-description"
          label="Descrição da coleção"
          explain="Texto descritivo exibido na página da coleção."
        >
          <textarea
            id="collection-edit-description"
            class="collection-edit-form__textarea"
            rows="6"
            :value="description"
:disabled="disabled"
            :maxlength="DESCRIPTION_MAX_LENGTH"
            placeholder="Esse conjunto de imagens mostra como o distrito do Brás passou por diversas transformações ao longo do tempo..."
            @input="onDescriptionInput"
          />
        </UiField>

        <p
          class="collection-edit-form__hint collection-edit-form__hint--right"
          :class="{ 'collection-edit-form__hint--over-limit': isDescriptionOverLimit }"
        >
          {{ descriptionLength }} / {{ DESCRIPTION_MAX_LENGTH }} caracteres
        </p>
      </div>
    </div>

    <div class="collection-edit-form__visibility">
      <div class="form-check m-0">
        <input
          id="collection-edit-private"
          class="form-check-input"
          type="checkbox"
          :checked="isPrivate"
          :disabled="disabled"
          @change="onPrivateChange"
        />
        <label class="form-check-label" for="collection-edit-private">
          Coleção privada
        </label>
      </div>
      <p class="collection-edit-form__hint">
        Coleções privadas só podem ser vistas por você.
      </p>
    </div>

    <p class="collection-edit-form__hint collection-edit-form__hint--required">
      Preenchimento obrigatório
    </p>
  </article>
</template>

<style scoped lang="scss">
.collection-edit-form {
  display: flex;
  width: 100%;
  padding: var(--pp, 8px) var(--p, 12px);
  flex-direction: column;
  justify-content: center;
  align-items: stretch;
  gap: var(--ppp, 4px);
  border-radius: 5px;
  background: var(--Off_white, #faf9f9);
  box-shadow: 1px 1px 4px rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
}

.collection-edit-form__heading {
  flex: 1 0 0;
  align-self: stretch;
  padding-top: var(--p, 12px);
  margin: 0;
  gap: 10px;
  color: var(--Gray-900, #212529);
  font-family: "DM Sans", sans-serif;
  font-size: 20px;
  font-style: normal;
  font-weight: 500;
  line-height: 150%;
}

.collection-edit-form__fields {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 42px;
  width: 100%;
  padding: 12px;
}

.collection-edit-form__field {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  align-self: stretch;
}

.collection-edit-form :deep(.ui-field > .d-flex) {
  display: flex;
  padding: 8px var(--p, 12px) 8px 0;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
  margin-bottom: 0;
}

.collection-edit-form :deep(.form-label) {
  color: var(--Gray-900, #212529);
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-style: normal;
  font-weight: 500;
  line-height: 150%;
  margin-bottom: 0;
}

.collection-edit-form__input,
.collection-edit-form__textarea {
  display: flex;
  align-self: stretch;
  width: 100%;
  border-radius: 5px;
  border: 0.75px solid var(--Preto, #1f1f1f);
  background: var(--Off_white, #faf9f9);
  box-sizing: border-box;
  padding: 6px 10px;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 150%;
  color: var(--Gray-900, #212529);
}

.collection-edit-form__input {
  height: 30px;
  align-items: center;
}

.collection-edit-form__textarea {
  min-height: 120px;
  resize: vertical;
}

.collection-edit-form__input::placeholder,
.collection-edit-form__textarea::placeholder {
  color: #636262;
  font-style: italic;
}

.collection-edit-form__input:focus,
.collection-edit-form__textarea:focus {
  outline: none;
}

.collection-edit-form__visibility {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-self: stretch;
  padding: 0 12px;
}

.collection-edit-form__visibility :deep(.form-check-label) {
  color: var(--Gray-900, #212529);
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 150%;
}

.collection-edit-form__hint {
  margin: 0;
  font-family: "DM Sans", sans-serif;
  font-size: 10px;
  font-style: normal;
  font-weight: 400;
  line-height: 160%;
  color: var(--Cinza_E, #2f2f2f);
}

.collection-edit-form__hint--right {
  align-self: stretch;
  text-align: right;
}

.collection-edit-form__hint--over-limit {
  color: #bc1518;
  font-weight: 500;
}

.collection-edit-form__hint--required {
  align-self: stretch;
  color: var(--Cinza_E, #2f2f2f);
  text-align: right;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-style: italic;
  font-weight: 400;
  line-height: 125%;
}
</style>