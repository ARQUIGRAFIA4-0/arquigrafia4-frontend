<template>
  <div class="comment-delete-modal__overlay" @click.self="$emit('cancel')">
    <div class="comment-delete-modal">
      <div class="comment-delete-modal__wrapper">
        <div class="comment-delete-modal__header">
          <h3>Excluir Comentário</h3>
          <button class="comment-delete-modal__close" @click="$emit('cancel')">
            <i class="bi bi-x"></i>
          </button>
        </div>
        <p class="comment-delete-modal__text">
          Tem certeza que deseja excluir este comentário?
        </p>
      </div>

      <div class="comment-delete-modal__actions">
        <button class="btn btn-cancel btn-sm" @click="$emit('cancel')">
          Cancelar
        </button>
        <button class="btn btn-delete btn-sm" @click="$emit('confirm')">
          Excluir
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
  border-radius: 1rem;
  padding: 1rem;
  width: 90%;
  max-width: 577px;
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

  &__wrapper {
    margin: 0 2.1rem;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;

    h3 {
      font-size: 1.25rem;
      color: var(--Preto);
      margin: 0;
    }
  }

  &__close {
    background: none;
    border: none;
    color: var(--Cinza_M);
    font-size: 1.25rem;
    cursor: pointer;

    &:hover {
      color: var(--Cinza_E);
    }
  }

  &__text {
    font-size: 0.95rem;
    color: var(--Cinza_E);
    margin-bottom: 0;
  }

  &__actions {
    display: flex;
    margin-top: 2rem;
    gap: 1rem;


    & .btn-delete {
      flex: 1;
      background-color: var(--Preto);
      color: #fff;

      &:hover {
        background-color: var(--Cinza_E);
      }
    }

    & .btn-cancel {
      border: 1px solid var(--Cinza_M);
      flex: 1;

      &:hover {
        background-color: var(--Cinza_M);
        color: #fff;
      }
    }
  }
}
</style>