<script setup>
import { nextTick, ref } from "vue";

defineOptions({ name: "PathPointsPanel" });

defineProps({
  stops: { type: Array, default: () => [] },
  saving: { type: Boolean, default: false },
});

const emit = defineEmits(["add", "remove", "rename", "save", "back"]);

const editingId = ref(null);
const draftTitle = ref("");
const titleInputRef = ref(null);

function setTitleInputRef(el) {
  titleInputRef.value = el ?? null;
}

async function startEdit(stop) {
  editingId.value = stop.id;
  draftTitle.value = stop.title;
  
  await nextTick();

  titleInputRef.value?.focus();
  titleInputRef.value?.select();

}

function commitEdit(stop) {
  if (editingId.value !== stop.id) return;

  const next = draftTitle.value.trim();
  editingId.value = null;

  if (!next || next === stop.title) return;
  emit("rename", { id: stop.id, title: next });
}

function cancelEdit() {
  editingId.value = null;
  draftTitle.value = "";
}

function onTitleKeydown(event, stop) {
  if (event.key === "Enter") {
    event.preventDefault();
    commitEdit(stop);
  } else if (event.key === "Escape") {
    event.preventDefault();
    cancelEdit();
  }
}
</script>

<template>
  <aside
    class="path-points-panel"
    role="dialog"
    aria-labelledby="path-points-panel-title"
  >
    <div class="path-points-panel__body">
      <h2 id="path-points-panel-title" class="path-points-panel__title">
        Selecione os pontos do percurso
      </h2>

      <ul class="path-points-panel__list">
        <li
          v-for="stop in stops"
          :key="stop.id"
          class="path-points-panel__item"
        >
          <span
            class="path-points-panel__pin"
            :class="{ 'path-points-panel__pin--custom': stop.type === 'custom' }"
            aria-hidden="true"
          >
            {{ stop.order }}
          </span>

          <input
            v-if="editingId === stop.id"
            :ref="setTitleInputRef"
            v-model="draftTitle"
            type="text"
            class="path-points-panel__title-input"
            :aria-label="`Editar título do ponto ${stop.order}`"
            @blur="commitEdit(stop)"
            @keydown="onTitleKeydown($event, stop)"
          />
          <button
            v-else
            type="button"
            class="path-points-panel__label path-points-panel__label--editable"
            @click="startEdit(stop)"
          >
            {{ stop.title }}
          </button>

          <button
            type="button"
            class="path-points-panel__icon-btn"
            :aria-label="`Remover ${stop.title}`"
            @click="$emit('remove', stop.id)"
          >
            <svg
              class="path-points-panel__icon"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="#6C757D"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </li>

        <li class="path-points-panel__item path-points-panel__item--add">
          <button
            type="button"
            class="path-points-panel__add"
            @click="$emit('add')"
          >
            <span
              class="path-points-panel__pin path-points-panel__pin--add"
              aria-hidden="true"
            >
              +
            </span>
            <span class="path-points-panel__label">Adicionar novo ponto</span>
          </button>
        </li>
      </ul>
    </div>

    <div class="path-points-panel__footer">
      <button
        type="button"
        class="path-points-panel__btn path-points-panel__btn--primary"
        :disabled="saving"
        @click="$emit('save')"
      >
        {{ saving ? "Salvando…" : "Salvar e continuar" }}
      </button>
      <button
        type="button"
        class="path-points-panel__btn path-points-panel__btn--secondary"
        @click="$emit('back')"
      >
        Voltar
      </button>
    </div>
  </aside>
</template>

<style scoped>
.path-points-panel {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 320px;
  height: 520px;
  max-height: calc(100% - 24px);
  padding: 24px 20px 20px;
  border-radius: 16px;
  border: 0.75px solid #b3b3b3;
  background: var(--Off_white, #faf9f9);
  box-shadow: 4px 4px 8px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.path-points-panel__body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 20px;
  min-height: 0;
  width: 100%;
}

.path-points-panel__title {
  margin: 0;
  width: 100%;
  min-height: 48px;
  color: var(--Gray-900, #212529);
  font-family: "DM Sans", sans-serif;
  font-size: 18px;
  font-style: normal;
  font-weight: 500;
  line-height: 150%;
}

.path-points-panel__list {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-y: auto;
  min-height: 0;
}

.path-points-panel__item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 28px;
}

.path-points-panel__pin {
  box-sizing: border-box;
  display: flex;
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  padding: 4px;
  justify-content: center;
  align-items: center;
  border-radius: 14px;
  background: var(--Preto, #1f1f1f);
  color: var(--Branco, #fff);
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 150%;
}

.path-points-panel__pin--add {
  background: var(--Laranja_E, #aa4f28);
}

.path-points-panel__pin--custom {
  background: var(--Laranja_E, #aa4f28);
}

.path-points-panel__label {
  flex: 1 1 auto;
  min-width: 0;
  max-width: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: #000;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-style: normal;
  font-weight: 500;
  line-height: 150%;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.path-points-panel__label--editable {
  cursor: text;
}

.path-points-panel__title-input {
  box-sizing: border-box;
  flex: 1 1 auto;
  min-width: 0;
  height: 28px;
  margin: 0;
  padding: 0 4px;
  border: 1px solid #b3b3b3;
  border-radius: 4px;
  background: #fff;
  color: #000;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 150%;
  outline: none;
}

.path-points-panel__title-input:focus {
  border-color: #2f2f2f;
}

.path-points-panel__icon-btn {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  opacity: 0;
}

.path-points-panel__item:hover .path-points-panel__icon-btn,
.path-points-panel__icon-btn:focus-visible {
  opacity: 1;
}

.path-points-panel__add {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.path-points-panel__footer {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 8px;
  align-self: stretch;
  width: 100%;
  margin-top: 16px;
}

.path-points-panel__btn {
  box-sizing: border-box;
  display: flex;
  height: 30px;
  padding: 2px 14px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
  align-self: stretch;
  margin: 0;
  border-radius: 5px;
  border: 1px solid var(--Cinza_E, #2f2f2f);
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 150%;
  cursor: pointer;
}

.path-points-panel__btn--primary {
  background: var(--Cinza_E, #2f2f2f);
  color: var(--Branco, #fff);
}

.path-points-panel__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.path-points-panel__btn--secondary {
  background: var(--Off_white, #faf9f9);
  color: var(--Cinza_E, #2f2f2f);
}
</style>
