<template>
  <div class="comment-report-modal__overlay" @click.self="$emit('cancel')">
    <div class="comment-report-modal">
      <h5 class="comment-report-modal__title">Ajude a denunciar o conteúdo inadequado</h5>

      <div class="comment-report-modal__preview">
        <img :src="props.imageUrl" alt="Imagem do comentário" class="comment-report-modal__image" />
        <p class="comment-report-modal__description">
          Por favor, informe o motivo pelo qual deseja denunciar o comentário desta imagem.
        </p>
      </div>

      <div class="comment-report-modal__field">
        <label class="comment-report-modal__label">
          Tipo de denúncia
          <i class="bi bi-question-circle comment-report-modal__hint"></i>
        </label>
        <div class="comment-report-modal__options">
          <label v-for="option in reportOptions" :key="option.value" class="comment-report-modal__option">
            <input type="radio" :value="option.value" v-model="selectedType" class="comment-report-modal__radio" />
            {{ option.label }}
          </label>
        </div>
      </div>

      <div class="comment-report-modal__field">
        <label class="comment-report-modal__label">
          Explique-nos o motivo de sua denúncia
          <i class="bi bi-question-circle comment-report-modal__hint"></i>
        </label>
        <textarea v-model="description" class="form-control comment-report-modal__textarea"
          placeholder="Deixe seu comentário aqui" rows="4"></textarea>
      </div>

      <div class="comment-report-modal__actions">
        <button class="btn comment-report-modal__cancel" @click="$emit('cancel')">
          Cancelar
        </button>
        <button class="btn comment-report-modal__submit" :disabled="!selectedType" @click="handleSubmit">
          Enviar denúncia
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  imageUrl: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['cancel', 'confirm'])

const selectedType = ref('inappropriate')
const description = ref('')

const reportOptions = [
  { value: 'inappropriate', label: 'Conteúdo inapropriado' },
  { value: 'harassment', label: 'Assédio moral' },
  { value: 'violation', label: 'Violação' },
]

function handleSubmit() {
  emit('confirm', {
    type: selectedType.value,
    description: description.value.trim(),
  })
}
</script>

<style lang="scss" scoped>
.comment-report-modal {
  background: #fff;
  border-radius: 0.75rem;
  padding: 2rem;
  width: 90%;
  max-width: 480px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);

  &__overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  &__title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--Cinza_E);
    margin-bottom: 1.25rem;
  }

  &__preview {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  &__image {
    width: 5rem;
    height: 4rem;
    object-fit: cover;
    border-radius: 0.25rem;
    flex-shrink: 0;
  }

  &__description {
    font-size: 0.875rem;
    color: var(--Cinza_M);
    margin: 0;
    line-height: 1.5;
  }

  &__field {
    margin-bottom: 1.25rem;
  }

  &__label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--Cinza_E);
    margin-bottom: 0.75rem;
  }

  &__hint {
    color: var(--Cinza_M);
    font-size: 0.85rem;
  }

  &__options {
    display: flex;
    gap: 1.25rem;
    flex-wrap: wrap;
  }

  &__option {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.875rem;
    color: var(--Cinza_E);
    cursor: pointer;
  }

  &__radio {
    accent-color: var(--Cinza_E);
    cursor: pointer;
  }

  &__textarea {
    font-size: 0.875rem;
    resize: vertical;
  }

  &__actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }

  &__cancel {
    flex: 1;
    border: 1px solid var(--Cinza_C);
    color: var(--Cinza_E);
    font-size: 0.875rem;

    &:hover {
      background-color: var(--Cinza_C);
    }
  }

  &__submit {
    flex: 1;
    background-color: var(--Cinza_E);
    color: #fff;
    font-size: 0.875rem;

    &:hover:not(:disabled) {
      opacity: 0.9;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}
</style>