<script setup>
import { useRoute, useRouter } from "vue-router";

defineOptions({ name: "CollectionEdit" });

const route = useRoute();
const router = useRouter();

function handleCancel() {
  const collectionId = route.params.collectionId;
  if (!collectionId) return;

  router.push({
    name: "my-collection-detail",
    params: {
      collectionId: String(collectionId),
      viewMode: String(route.query.viewMode || "grid"),
    },
  });
}
</script>

<template>
    <section class="collection-edit" aria-label="Editar coleção">
      <div class="collection-edit__content">
        <!-- conteúdo da edição entra aqui depois -->
      </div>
  
      <footer class="collection-edit__footer">
        <button
          type="button"
          class="collection-edit__btn collection-edit__btn--cancel"
          @click="handleCancel"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="collection-edit__btn collection-edit__btn--save"
          disabled
          aria-disabled="true"
        >
          Salvar edições
        </button>
      </footer>
    </section>
</template>

<style scoped lang="scss">
.collection-edit {
  display: flex;
  flex-direction: column;
  background: var(--Branco, #fff);
}

.collection-edit__content {
  flex: 1 1 auto;
  padding-bottom: 72px; /* espaço para o footer fixo */
}

.collection-edit__footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--Branco, #fff);
  box-shadow: 2px -2px 5px 2px rgba(0, 0, 0, 0.25);
  box-sizing: border-box;
}

.collection-edit__btn {
  display: flex;
  padding: 2px 14px;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  border-radius: 5px;
  border-width: 1px;
  border-style: solid;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 150%;
  cursor: pointer;
  box-sizing: border-box;
  white-space: nowrap;
}

.collection-edit__btn--cancel {
  border-color: var(--Cinza_E, #2f2f2f);
  background: var(--Off_white, #faf9f9);
  color: var(--Cinza_E, #2f2f2f);
}

.collection-edit__btn--save {
  border-color: var(--Laranja_E, #aa4f28);
  background: var(--Laranja_E, #aa4f28);
  color: var(--Branco, #fff);
  opacity: 0.4;
  cursor: not-allowed;
}

.collection-edit__btn--save:disabled {
  opacity: 0.4;
}
</style>