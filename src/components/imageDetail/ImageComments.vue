<template>
  <div>
    <div v-if="props.comments.length" class="comments-list">
      <div
        v-for="comment in props.comments"
        :key="comment.id"
        class="comment mb-4"
      >
        <div class="d-flex align-items-start">
          <img
            :src="comment.avatarUrl"
            class="rounded-circle me-3"
            alt="Avatar"
          />
          <div>
            <h6 class="mb-1">{{ comment.author }}</h6>
            <p class="mb-1">{{ comment.content }}</p>
            <small class="text-muted">
              {{ new Date(comment.date).toLocaleDateString() }}
            </small>
          </div>
        </div>
      </div>
    </div>
    <p v-else class="text-muted">Ainda não há comentários.</p>

    <div class="comment-form__header">
      <h5 class="comment-form__title mb-0">Deixe seu comentário</h5>
    </div>

    <div class="mb-3">
      <label class="visually-hidden" for="comment-input">Comentário</label>
      <textarea
        id="comment-input"
        class="form-control comment-form__textarea"
        placeholder="Comentário"
        rows="4"
      ></textarea>
    </div>

    <div class="d-flex justify-content-end">
      <button type="button" class="btn btn-secondary btn-sm">Comentar</button>
    </div>

    <p class="comment-form__disclaimer mt-3">
      <strong>**</strong>
      Cada usuário é responsável por seus próprios comentários. O ARQUIGRAFIA
      não se responsabiliza pelos comentários postados, mas apenas por tornar
      indisponível no site o conteúdo considerado infringente ou danoso por
      determinação judicial (art.19 da Lei 12.965/14).
    </p>
  </div>
</template>

<script setup>
const props = defineProps({
  comments: {
    type: Array,
    default: () => [],
  },
});
</script>

<style scoped>
.comment {
  background-color: #fff;
  transition: all 0.2s ease;
}

.comment-form {
  background-color: var(--Branco);
  border: 1px solid var(--Cinza_C);
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.comment-form__header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.comment-form__title {
  color: var(--Cinza_E);
  font-size: 1.125rem;
  font-weight: 600;
}

.comment-form__hint {
  align-items: center;
  border: 1px solid var(--Cinza_C);
  border-radius: 50%;
  color: var(--Cinza_E);
  display: inline-flex;
  font-size: 0.85rem;
  font-weight: 700;
  height: 1.75rem;
  justify-content: center;
  width: 1.75rem;
}

.comment-form__textarea {
  min-height: 9rem;
  padding: 1rem;
  resize: vertical;
}

.comment-form__submit {
  min-width: 9rem;
}

.comment-form__disclaimer {
  color: var(--Cinza_M);
  font-size: 0.875rem;
  line-height: 1.4;
}

.comment-form__disclaimer strong {
  font-weight: 600;
}
</style>
