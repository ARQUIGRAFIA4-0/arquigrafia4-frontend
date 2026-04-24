<template>
  <div class="comment-report-modal__overlay" @click.self="$emit('cancel')">
    <div class="comment-report-modal">
      <h5 class="comment-report-modal__title">Ajude a denunciar o conteúdo inadequado</h5>

      <div class="comment-report-modal__wrapper">
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
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.comment-report-modal {
  background: #fff;
  border-radius: 1rem;
  // padding: 2rem 3rem 0 3rem;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);

  &__overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  &__title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--Cinza_E);
    text-align: center;
    // margin: 2rem 3rem 1.25rem 3rem;
    margin: 1.5rem 1rem 1.25rem 1rem;

    @include md {
      text-align: left;
      margin: 2rem 3rem 1.25rem 3rem;
    }
  }

  &__wrapper {
    // margin: 0 3.5rem;
    margin: 0 1rem;

    @include md {
      margin: 0 3.5rem;
    }
  }

  &__preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 1.5rem;

    @include md {
      flex-direction: row;
    }
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
    color: var(--Preto);
    margin: 0;
    line-height: 1.5;
    max-width: 344px;
    text-align: center;

    @include md {
      text-align: left;
    }
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
    flex-direction: column;
    gap: 0.75rem;

    @include md {
      flex-direction: row;
      gap: 1.25rem;
    }
  }

  &__option {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.75rem;
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
    resize: none;
  }

  &__actions {
    display: flex;
    gap: 1rem;
    margin: 2rem 1rem 1rem 1rem;
  }

  &__cancel {
    flex: 1;
    border: 1px solid var(--Preto);
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