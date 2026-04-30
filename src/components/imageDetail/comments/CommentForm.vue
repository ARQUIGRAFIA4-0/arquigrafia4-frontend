<template>
  <div class="comment-form" :class="{ 'comment-form--disabled': disabled }">
    <div class="comment-form__header">
      <h5 class="comment-form__title">Deixe seu comentário</h5>
    </div>

    <div class="comment-form__field">
      <label class="visually-hidden" for="comment-input">Comentário</label>
      <textarea id="comment-input" v-model="content" class="form-control comment-form__textarea"
        placeholder="Comentário" rows="4" maxlength="2000" :disabled="submitting || disabled"></textarea>
      <small class="comment-form__char-count" :class="{ 'comment-form__char-count--limit': content.length >= 1800 }">
        {{ content.length }}/2000
      </small>
    </div>

    <div class="comment-form__actions">
      <button type="button" class="btn btn-secondary btn-sm comment-form__submit"
        :disabled="!content.trim() || submitting || disabled" @click="handleSubmit">
        {{ props.submitting ? 'Enviando...' : 'Comentar' }}
      </button>
    </div>

    <p class="comment-form__disclaimer">
      <strong>** </strong>
      Cada usuário é responsável por seus próprios comentários. O ARQUIGRAFIA
      não se responsabiliza pelos comentários postados, mas apenas por tornar
      indisponível no site o conteúdo considerado infringente ou danoso por
      determinação judicial (art.19 da Lei 12.965/14).
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['submit'])

const props = defineProps({
  submitting: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  }
})

const content = ref('')

function handleSubmit() {
  if (!content.value.trim()) return
  emit('submit', content.value.trim())
  content.value = ''
}
</script>

<style lang="scss" scoped>
.comment-form {

  &__char-count {
    display: block;
    text-align: right;
    font-size: 0.75rem;
    color: var(--Cinza_M);
    margin-top: 0.25rem;

    &--limit {
      color: var(--bs-danger);
      font-weight: 600;
    }
  }


  &--disabled {
    .comment-form__title {
      color: var(--Cinza_M);
    }

    .comment-form__textarea {
      background-color: #f5f5f5;
      color: var(--Cinza_M);
      border-color: #dcdcdc;
      cursor: not-allowed;
    }

    .comment-form__textarea::placeholder {
      color: var(--Cinza_M);
    }
  }
}

.comment-form {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }

  &__title {
    color: var(--Cinza_E);
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0;
  }

  &__field {
    margin-bottom: 0.75rem;
  }

  &__textarea {
    min-height: 9rem;
    padding: 1rem;
    resize: vertical;
    resize: none;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 1rem;
  }

  &__submit {
    min-width: 9rem;
  }

  &__disclaimer {
    color: var(--Cinza_M);
    font-size: 0.875rem;
    line-height: 1.4;
    margin: 0;
  }
}
</style>