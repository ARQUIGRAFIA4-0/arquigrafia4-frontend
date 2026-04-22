<template>
  <div class="comment-actions">
    <button class="comment-actions__btn comment-actions__btn--like" :class="{ 'comment-actions__btn--liked': liked }"
      @click="$emit('like')">
      <i class="bi bi-heart-fill"></i>
      <span>{{ likesCount }}</span>
    </button>

    <button v-if="showReply" class="comment-actions__btn comment-actions__btn--reply" @click="$emit('reply')">
      <i class="bi bi-reply"></i>
    </button>

    <button v-if="showOwnerActions" class="comment-actions__btn comment-actions__btn--edit" @click="$emit('edit')">
      <i class="bi bi-pencil"></i>
    </button>

    <button v-if="showOwnerActions" class="comment-actions__btn comment-actions__btn--delete" @click="$emit('delete')">
      <i class="bi bi-trash"></i>
    </button>
  </div>
</template>

<script setup>
defineProps({
  liked: {
    type: Boolean,
    default: false,
  },
  likesCount: {
    type: Number,
    default: 0,
  },
  // exibe botão de responder
  showReply: {
    type: Boolean,
    default: false,
  },
  // exibe botões de editar e deletar
  showOwnerActions: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['like', 'reply', 'edit', 'delete'])
</script>

<style lang="scss" scoped>
.comment-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    background: none;
    border: none;
    padding: 0.25rem;
    cursor: pointer;
    font-size: 0.85rem;
    color: var(--Cinza_M);
    transition: color 0.15s ease;

    &--like {

      &:hover,
      &.comment-actions__btn--liked {
        color: var(--Laranja_E, #ff7f00);
      }
    }

    &--reply {
      &:hover {
        color: var(--Cinza_E);
      }
    }

    &--edit {
      &:hover {
        color: var(--Cinza_E);
      }
    }

    &--delete {
      &:hover {
        color: var(--bs-danger);
      }
    }
  }
}
</style>