<script setup>
import { computed } from "vue";

const props = defineProps({
  album: { type: Object, required: true },
});

// `percursos_count` vem das listagens de coleções (withCount no backend).
const hasPercurso = computed(() => Number(props.album?.percursos_count) > 0);
</script>

<template>
  <div v-if="hasPercurso || album.is_private" class="collection-card-labels">
    <span v-if="hasPercurso" class="collection-card-labels__label">
      <i class="bi bi-signpost-split-fill" aria-hidden="true"></i>
      <span class="collection-card-labels__text">Percurso</span>
    </span>
    <span v-if="album.is_private" class="collection-card-labels__label">
      <i class="bi bi-lock-fill" aria-hidden="true"></i>
      <span class="collection-card-labels__text">Privada</span>
    </span>
  </div>
</template>

<style lang="scss" scoped>
.collection-card-labels {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.collection-card-labels__label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  height: 25px;
  padding: 2px 8px;
  border-radius: 8px;
  background: #efefef;
  color: var(--Cinza_E, #2f2f2f);
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1;

  i {
    flex-shrink: 0;
    font-size: 14px;
    line-height: 1;
  }
}

.collection-card-labels__text {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
