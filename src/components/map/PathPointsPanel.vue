<script setup>
import { nextTick, ref } from "vue";
import draggable from "vuedraggable";

defineOptions({ name: "PathPointsPanel" });

const props = defineProps({
  stops: { type: Array, default: () => [] },
  saving: { type: Boolean, default: false },
  /** true enquanto o usuário escolhe o novo ponto no mapa */
  picking: { type: Boolean, default: false },
});

const emit = defineEmits(["add", "remove", "rename", "reorder", "save", "back"]);

const listRef = ref(null);

// Emite a nova ordem (lista de ids) depois de soltar um ponto arrastado.
function onDragReorder(nextStops) {
  emit("reorder", nextStops.map((stop) => stop.id));
}

// Move um ponto com as setas do teclado (acessibilidade do arrastar e soltar).
async function onHandleKeydown(event, index) {
  const delta = { ArrowUp: -1, ArrowDown: 1 }[event.key];
  if (!delta) return;

  event.preventDefault();
  const target = index + delta;
  if (target < 0 || target >= props.stops.length) return;

  const ids = props.stops.map((stop) => stop.id);
  const [moved] = ids.splice(index, 1);
  ids.splice(target, 0, moved);
  emit("reorder", ids);

  // Mantém o foco no ícone do ponto movido para permitir vários movimentos seguidos.
  await nextTick();
  listRef.value?.$el
    ?.querySelector(`[data-stop-handle="${moved}"]`)
    ?.focus();
}

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

      <draggable
        ref="listRef"
        :model-value="stops"
        tag="ul"
        class="path-points-panel__list"
        item-key="id"
        handle=".path-points-panel__handle"
        ghost-class="path-points-panel__item--ghost"
        chosen-class="path-points-panel__item--chosen"
        :animation="150"
        :disabled="saving || stops.length < 2"
        @update:model-value="onDragReorder"
      >
        <template #item="{ element: stop, index }">
        <li class="path-points-panel__item">
          <button
            type="button"
            class="path-points-panel__handle"
            :class="{ 'path-points-panel__handle--hidden': stops.length < 2 }"
            :data-stop-handle="stop.id"
            :disabled="saving || stops.length < 2"
            :aria-label="`Reordenar ${stop.title} (posição ${stop.order} de ${stops.length}). Use as setas para cima e para baixo.`"
            title="Arraste para reordenar"
            @keydown="onHandleKeydown($event, index)"
          >
            <i class="bi bi-grip-vertical" aria-hidden="true"></i>
          </button>

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
        </template>

        <template #footer>
        <li class="path-points-panel__item path-points-panel__item--add">
          <button
            type="button"
            class="path-points-panel__add"
            :class="{ 'path-points-panel__add--active': picking }"
            :aria-pressed="picking"
            @click="$emit('add')"
          >
            <span
              class="path-points-panel__pin path-points-panel__pin--add"
              :class="{ 'path-points-panel__pin--picking': picking }"
              aria-hidden="true"
            >
              {{ picking ? "×" : "+" }}
            </span>
            <span class="path-points-panel__label">
              {{ picking ? "Clique no mapa… (cancelar)" : "Adicionar novo ponto" }}
            </span>
          </button>
        </li>
        </template>
      </draggable>
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

/* Alça de arrastar: sempre visível (descoberta e telas de toque), mais forte no hover */
.path-points-panel__handle {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 28px;
  margin: 0 -4px 0 0;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: #b3b3b3;
  font-size: 16px;
  cursor: grab;
  touch-action: none;
  transition: color 0.15s ease;
}

.path-points-panel__item:hover .path-points-panel__handle,
.path-points-panel__handle:focus-visible {
  color: #2f2f2f;
}

.path-points-panel__handle:focus-visible {
  outline: 2px solid #2f2f2f;
  outline-offset: 1px;
}

.path-points-panel__handle:active {
  cursor: grabbing;
}

/* Com menos de 2 pontos não há o que reordenar: some, mas mantém o alinhamento */
.path-points-panel__handle--hidden {
  visibility: hidden;
}

/* Linha "Adicionar novo ponto" alinhada com os números (largura da alça + gap) */
.path-points-panel__item--add {
  padding-left: 20px;
}

/* Lugar onde o ponto vai cair durante o arraste */
.path-points-panel__item--ghost {
  border-radius: 6px;
  background: rgba(170, 79, 40, 0.12);
  outline: 1px dashed var(--Laranja_E, #aa4f28);
}

.path-points-panel__item--ghost > * {
  opacity: 0.4;
}

.path-points-panel__item--chosen {
  border-radius: 6px;
  background: #fff;
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

.path-points-panel__add--active .path-points-panel__label {
  color: var(--Laranja_E, #aa4f28);
}

.path-points-panel__pin--picking {
  animation: path-points-pin-pulse 1.4s ease-out infinite;
}

@keyframes path-points-pin-pulse {
  0% { box-shadow: 0 0 0 0 rgba(170, 79, 40, 0.55); }
  100% { box-shadow: 0 0 0 10px rgba(170, 79, 40, 0); }
}

@media (prefers-reduced-motion: reduce) {
  .path-points-panel__pin--picking {
    animation: none;
  }
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