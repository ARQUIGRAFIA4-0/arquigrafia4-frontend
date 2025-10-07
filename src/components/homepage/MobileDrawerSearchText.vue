<template>
  <ui-mobile-drawer
    id="drawer-search-text"
    v-model="open"
    title="Busca por palavras"
  >
    <div class="p-3 drawer-content">
      <div class="mb-3">
        <div class="input-group">
          <button
            class="btn btn-primary dropdown-toggle bg-cinza-m border-preto fw-normal"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            {{ selectedFieldLabel }}
          </button>
          <ul class="dropdown-menu menu-light">
            <li v-for="opt in fieldOptions" :key="opt.value">
              <button
                class="dropdown-item"
                @click.prevent="selectedField = opt.value"
              >
                {{ opt.label }}
              </button>
            </li>
          </ul>
          <input
            v-model="textQueryInput"
            type="text"
            class="form-control border-preto border-end-0"
            placeholder="Digite o termo de busca"
          />
          <button
            class="btn btn-light border-preto border-start-0 bg-transparent btn-enlarge-40"
            type="button"
            aria-label="Buscar"
            @click="addSearchTerm"
          >
            <i class="bi bi-plus-square-fill"></i>
          </button>
        </div>
      </div>

      <div class="mb-4">
        <div class="h2 pt-3">Termos de busca</div>
        <div class="d-flex flex-wrap gap-2">
          <span v-if="searchTerms.length === 0" class="text-muted"
            >Nenhum termo adicionado.</span
          >
          <button
            v-for="(term, idx) in searchTerms"
            :key="idx"
            type="button"
            class="btn btn-info btn-sm btn-tag"
          >
            {{ term.label }}
            <button
              type="button"
              class="btn-close ms-2"
              aria-label="Remover termo"
              @click.stop="removeSearchTerm(idx)"
            ></button>
          </button>
        </div>
      </div>

      <div class="mb-3 pt-3">
        <div class="h2">Sugestões de busca</div>
      </div>

      <div class="mb-3">
        <div class="p">Localização</div>
        <div class="text-muted small mb-2">
          (localizações mais recorrentes em nosso acervo)
        </div>
        <div class="d-flex flex-wrap gap-2">
          <button
            v-for="city in locationSuggestions"
            :key="city"
            type="button"
            :class="[
              'btn btn-sm',
              selectedLocations.includes(city)
                ? 'btn-dark'
                : 'btn-outline-secondary',
            ]"
            @click="toggleLocation(city)"
          >
            {{ city }}
          </button>
        </div>
      </div>

      <div class="mb-3">
        <div class="p">Tags</div>
        <div class="text-muted small mb-2">
          (termos mais utilizados em nosso acervo)
        </div>
        <div class="d-flex flex-wrap gap-2">
          <button
            v-for="tag in tagSuggestions"
            :key="tag"
            type="button"
            :class="[
              'btn btn-sm',
              selectedTags.includes(tag) ? 'btn-dark' : 'btn-outline-secondary',
            ]"
            @click="toggleTag(tag)"
          >
            {{ tag }}
          </button>
        </div>
      </div>

      <div class="mb-4">
        <div class="p pb-2">Uso permitido</div>
        <div class="d-flex flex-wrap gap-2">
          <button
            type="button"
            :class="[
              'btn btn-sm',
              selectedUse === 'commercial'
                ? 'btn-dark'
                : 'btn-outline-secondary',
            ]"
            @click="setUse('commercial')"
          >
            Permite uso comercial
          </button>
          <button
            type="button"
            :class="[
              'btn btn-sm',
              selectedUse === 'nonCommercial'
                ? 'btn-dark'
                : 'btn-outline-secondary',
            ]"
            @click="setUse('nonCommercial')"
          >
            Não permite uso comercial
          </button>
        </div>
      </div>

      <div class="drawer-actions d-grid gap-2 pt-3">
        <button class="btn btn-outline-secondary" @click="open = false">
          Cancelar
        </button>
        <button class="btn btn-dark" @click="confirm">Busca</button>
      </div>
    </div>
  </ui-mobile-drawer>
</template>

<script>
import { ref, computed } from "vue";
import UiMobileDrawer from "@/components/ui/UiMobileDrawer.vue";

export default {
  name: "MobileDrawerSearchText",
  components: { UiMobileDrawer },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue", "confirm"],
  setup(props, { emit }) {
    const open = computed({
      get: () => props.modelValue,
      set: (value) => emit("update:modelValue", value),
    });

    const fieldOptions = ref([
      { value: "all", label: "Todos os campos" },
      { value: "author", label: "Autoria" },
      { value: "tag", label: "Tag" },
      { value: "location", label: "Localização" },
      { value: "title", label: "Título" },
    ]);
    const selectedField = ref("all");
    const textQueryInput = ref("");
    const searchTerms = ref([]); // { field, value, label }

    const selectedFieldLabel = computed(() => {
      const found = fieldOptions.value.find(
        (f) => f.value === selectedField.value
      );
      return found ? found.label : "Todos os campos";
    });

    const addSearchTerm = () => {
      const value = textQueryInput.value.trim();
      if (!value) return;
      const fieldLabel =
        fieldOptions.value.find((f) => f.value === selectedField.value)
          ?.label || "Termo";
      searchTerms.value.push({
        field: selectedField.value,
        value,
        label: `${fieldLabel}: ${value}`,
      });
      textQueryInput.value = "";
    };
    const removeSearchTerm = (index) => {
      searchTerms.value.splice(index, 1);
    };

    const locationSuggestions = ref([
      "São Paulo",
      "Rio de Janeiro",
      "Brasilia",
      "Jaú",
      "Ribeirão Preto",
      "Londrina",
      "Mauá",
      "Itu",
      "Ouro Preto",
      "Praia Grande",
    ]);
    const selectedLocations = ref([]);
    const toggleLocation = (city) => {
      const i = selectedLocations.value.indexOf(city);
      if (i >= 0) selectedLocations.value.splice(i, 1);
      else selectedLocations.value.push(city);
    };

    const tagSuggestions = ref([
      "Concreto",
      "Público",
      "Ferro",
      "Vidro",
      "Alvenaria",
      "Vegetação",
      "Fachada",
      "Edifício",
      "Prédio",
      "Pilar",
    ]);
    const selectedTags = ref([]);
    const toggleTag = (tag) => {
      const i = selectedTags.value.indexOf(tag);
      if (i >= 0) selectedTags.value.splice(i, 1);
      else selectedTags.value.push(tag);
    };

    const selectedUse = ref(null); // 'commercial' | 'nonCommercial' | null
    const setUse = (use) => {
      selectedUse.value = selectedUse.value === use ? null : use;
    };

    const confirm = () => {
      const payload = {
        terms: searchTerms.value,
        locations: selectedLocations.value,
        tags: selectedTags.value,
        use: selectedUse.value,
      };
      emit("confirm", payload);
      open.value = false;
    };

    return {
      open,
      // fields
      fieldOptions,
      selectedField,
      selectedFieldLabel,
      textQueryInput,
      searchTerms,
      addSearchTerm,
      removeSearchTerm,
      // suggestions
      locationSuggestions,
      selectedLocations,
      toggleLocation,
      tagSuggestions,
      selectedTags,
      toggleTag,
      // use
      selectedUse,
      setUse,
      // actions
      confirm,
    };
  },
};
</script>

<style scoped>
.drawer-content .btn.btn-sm {
  border-radius: 2px !important;
}

.drawer-content .p {
  font-size: 14px;
  font-weight: 500;
  line-height: 150%;
}

.drawer-content .d-flex > .btn.flex-fill {
  min-width: 0;
}

.drawer-content .drawer-actions {
  grid-template-columns: 1fr 1fr;
}
.drawer-content .drawer-actions > .btn {
  width: 100%;
}

.drawer-content .btn-enlarge-40 {
  padding: calc(0.1rem) calc(0.75rem);
}
.drawer-content .btn-enlarge-40 > i.bi {
  font-size: 1.6rem;
  line-height: 1.4;
}
</style>
