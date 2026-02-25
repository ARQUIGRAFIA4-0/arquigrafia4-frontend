<template>
  <div class="no-results-container">
    <div class="no-results-content">
      <div class="icon-container">
        <span class="question-mark left">?</span>
        <i class="bi bi-signpost-split"></i>
        <span class="question-mark right">?</span>
      </div>

      <h2 class="no-results-title pt-4">Ops. Sua busca não teve resultados.</h2>

      <div class="no-results-actions pt-4">
        <button
          class="btn btn-outline-secondary btn-sm"
          @click="$emit('clear')"
        >
          Limpar busca
        </button>
        <button class="btn btn-secondary btn-sm" @click="$emit('new-search')">
          Editar busca
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(["clear", "new-search"]);
</script>

<style scoped>
.no-results-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: 2rem 1rem;
}

.no-results-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 600px;
}

.icon-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
}

.icon-container .bi-signpost-split {
  font-size: 5rem;
  color: #333;
}

.question-mark {
  font-size: 2rem;
  font-weight: 600;
  color: #333;
  position: absolute;
}

.question-mark.left {
  left: -1.5rem;
  top: 50%;
  transform: translateY(-50%);
}

.question-mark.right {
  right: -1.5rem;
  top: 0;
}

.no-results-title {
  font-size: 1.75rem;
  font-weight: 500;
  color: #1a1a1a;
  margin: 0 0 2rem 0;
  line-height: 1.4;
}

.no-results-actions {
  display: flex;
  gap: 1rem;
  width: 100%;
}

.no-results-actions .btn {
  flex: 1;
}

@media (max-width: 480px) {
  .no-results-actions {
    flex-direction: column;
  }
}
</style>
