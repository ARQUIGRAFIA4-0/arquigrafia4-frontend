<template>
  <div class="comment-delete-modal__overlay" @click.self="$emit('cancel')">
    <div class="comment-delete-modal">
      <p class="comment-delete-modal__text">
        Tem certeza que deseja remover este comentário?
      </p>
      <div class="comment-delete-modal__actions">
        <button class="btn btn-link btn-sm" @click="$emit('cancel')">
          Cancelar
        </button>
        <button class="btn btn-danger btn-sm" @click="$emit('confirm')">
          Remover
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['cancel', 'confirm'])
</script>

<style lang="scss" scoped>
.comment-delete-modal {
  background: #fff;
  border-radius: 0.75rem;
  padding: 1.5rem;
  width: 90%;
  max-width: 360px;
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

  &__text {
    font-size: 0.95rem;
    color: var(--Cinza_E);
    margin-bottom: 1.25rem;
    text-align: center;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }
}
</style>