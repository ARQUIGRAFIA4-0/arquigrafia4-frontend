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

    <!-- <button v-if="showOwnerActions" class="comment-actions__btn comment-actions__btn--edit" @click="$emit('edit')">
      <i class="bi bi-pencil-fill"></i>
    </button> -->

    <button v-if="showOwnerActions" class="comment-actions__btn comment-actions__btn--delete" @click="$emit('delete')">
      <i class="bi bi-trash-fill"></i>
    </button>

    <button class="comment-actions__btn comment-actions__btn--report" @click="$emit('report')">
      <i class="bi bi-exclamation-circle-fill"></i>
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

defineEmits(['like', 'reply', 'edit', 'delete', 'report'])
</script>

<style lang="scss" scoped>
.comment-actions {
  display: flex;
  align-items: center;
  gap: 0.7rem;

  &__btn {
    display: inline-flex;
    align-items: center;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.85rem;
    color: var(--Cinza_E);
    transition: color 0.15s ease;

    & i {
      font-size: 1.1rem;
      line-height: 1;
      vertical-align: middle;
      display: inline-flex;
      align-items: center;
    }

    &--like {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      &:hover,
      &.comment-actions__btn--liked {
        color: var(--Laranja_E, #ff7f00);
      }

      & span {
        color: var(--Preto);
      }
    }

    &--reply {
      transform: scaleX(-1);

      &:hover {
        color: var(--Laranja_E, #ff7f00);
      }
    }

    &--edit {
      &:hover {
        color: var(--Laranja_E, #ff7f00);
      }
    }

    &--delete {
      &:hover {
        color: var(--bs-danger);
      }
    }

    &--report {
      &:hover {
        color: var(--Laranja_E, #ff7f00);
      }
    }
  }
}
</style>