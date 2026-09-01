<template>
  <UiField label="Obra" :explain="explain">
    <!-- Estado selecionado -->
    <div
      v-if="selected"
      class="form-control d-flex align-items-center justify-content-between gap-2"
      style="height: auto; min-height: 38px"
      data-cy="work-selected"
    >
      <div class="d-flex flex-column lh-sm">
        <span class="fw-semibold">{{ selected.label }}</span>
        <small v-if="selected.address" class="text-muted">{{
          selected.address
        }}</small>
      </div>
      <button
        type="button"
        class="btn-close flex-shrink-0"
        aria-label="Remover obra"
        data-cy="work-clear"
        @click="clearWork"
      />
    </div>
    <!-- Estado de busca -->
    <div v-else class="position-relative">
      <input
        type="text"
        class="form-control"
        placeholder="Busque por nome ou endereço"
        v-model="workInput"
        data-cy="work-autocomplete"
        @input="onWorkInputChange"
        @focus="showWorkSuggestions = true"
        @blur="hideWorkSuggestions"
        autocomplete="off"
      />
      <div
        v-if="
          showWorkSuggestions &&
          (filteredWorkSuggestions.length > 0 || canShowCreateWork)
        "
        class="dropdown-menu menu-light w-100 show position-absolute top-100 start-0 mt-1"
        style="z-index: 1000; max-height: 320px; overflow-y: auto"
      >
        <button
          v-for="work in filteredWorkSuggestions"
          :key="work.id"
          type="button"
          class="dropdown-item d-flex flex-column align-items-start py-2"
          data-cy="work-suggestion"
          @click="selectWork(work)"
        >
          <span class="fw-semibold">{{ workPrimaryTitle(work) }}</span>
          <small
            v-if="workMatchedAlternate(work, workInput)"
            class="text-muted fst-italic"
          >
            também conhecido como:
            {{ workMatchedAlternate(work, workInput) }}
          </small>
          <small v-else-if="work.location?.label" class="text-muted">{{
            work.location.label
          }}</small>
          <small
            v-if="workMatchedAlternate(work, workInput) && work.location?.label"
            class="text-muted"
            >{{ work.location.label }}</small
          >
        </button>
        <button
          v-if="canShowCreateWork"
          type="button"
          class="dropdown-item text-primary d-flex align-items-center gap-1"
          data-cy="work-create"
          @click="
            showWorkCreateModal = true;
            showWorkSuggestions = false;
          "
        >
          <i class="bi bi-plus-circle" />
          <span>Criar obra "{{ workInput.trim() }}"</span>
        </button>
      </div>
    </div>
  </UiField>

  <WorkCreateModal
    v-model="showWorkCreateModal"
    :initial-title="workInput"
    @created="onWorkCreated"
    @select-existing="selectWork"
  />
</template>

<script setup>
import UiField from "@/components/ui/UiField.vue";
import WorkCreateModal from "@/components/work/WorkCreateModal.vue";
import { useWorkAutocomplete } from "@/composables/useWorkAutocomplete";

defineOptions({ name: "WorkAutocompleteField" });

defineProps({
  explain: { type: String, default: "Informe a obra relacionada" },
});

/**
 * Obra selecionada: `{ id, label, address }` para obra existente ou
 * `{ draft, label, address }` para rascunho ainda não criado no backend.
 * Cabe à tela que consome resolver o rascunho no envio, com `resolveWorkId`.
 */
const selected = defineModel({ type: Object, default: null });

const {
  workInput,
  filteredWorkSuggestions,
  showWorkSuggestions,
  showWorkCreateModal,
  canShowCreateWork,
  registerWork,
  workPrimaryTitle,
  workMatchedAlternate,
  onWorkInputChange,
  hideWorkSuggestions,
  selectWork,
  clearWork,
  onWorkCreated,
} = useWorkAutocomplete(selected);

// A tela avisa quando materializa um rascunho, para que a obra nova já apareça
// nas buscas seguintes sem recarregar a lista.
defineExpose({ registerWork });
</script>
