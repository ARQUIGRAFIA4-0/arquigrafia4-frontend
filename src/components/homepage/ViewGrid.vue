<template>
  <div>
    <template v-if="isPending && items.length === 0">
      <div class="row g-2 g-md-4">
        <div v-for="n in 12" :key="`skeleton-${n}`" class="col-6 col-md-4 col-lg-2">
          <div class="view-grid__card view-grid__card--skeleton">
            <div class="view-grid__skeleton-image"></div>
            <div class="view-grid__skeleton-body">
              <div class="view-grid__skeleton-title"></div>
              <div class="view-grid__skeleton-subtitle"></div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div class="row g-2 g-md-4">
      <div v-for="item in items" :key="item.id" class="col-6 col-md-4 col-lg-2">
        <RouterLink
          v-if="!selectionMode"
          :to="`/explore/dados/image/${item.id}`"
          class="view-grid__link"
        >
          <ImageGridCard
            :item="item"
            clickable-tags
            @image-error="handleImageError"
            @tag-click="handleTagClick"
          />
        </RouterLink>

        <div
          v-else
          class="view-grid__link view-grid__link--selectable"
          role="button"
          tabindex="0"
          :aria-pressed="isSelected(item.id)"
          @click="onCardClick(item, $event)"
          @keydown.enter.prevent="toggleSelection(item)"
          @keydown.space.prevent="toggleSelection(item)"
        >
          <ImageGridCard
            :item="item"
            :show-tags="false"
            class="view-grid__card--selectable"
            :class="{ 'view-grid__card--selected': isSelected(item.id) }"
            @image-error="handleImageError"
          >
            <template #image-overlay>
              <div
                class="view-grid__select-indicator"
                :class="{ 'view-grid__select-indicator--checked': isSelected(item.id) }"
                aria-hidden="true"
              >
                <i v-if="isSelected(item.id)" class="bi bi-check-lg"></i>
              </div>

              <div
                v-if="isSelected(item.id)"
                class="view-grid__select-overlay"
                aria-hidden="true"
              ></div>
            </template>
          </ImageGridCard>
        </div>
      </div>
    </div>

    <div v-if="isFetchingNextPage" class="text-center my-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, toRef, watch } from "vue";
import { RouterLink, useRouter, useRoute } from "vue-router";
import ImageGridCard from "@/components/image/ImageGridCard.vue";
import { useImagesInfiniteQuery } from "@/composables/useImagesInfiniteQuery";
import { sanitizeDateParam } from "@/helpers/dateUtils";
import { queryToFilters, hasAnyAdvancedFilter } from "@/helpers/searchQueryMapping";

const router = useRouter();
const route = useRoute();

const props = defineProps({
  selectionMode: {
    type: Boolean,
    default: false,
  },
  selectedImages: {
    type: Array,
    default: () => [],
  },
  search: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["no-results", "update:selected-images"]);

// Combina filtros da prop search com filtros da URL
const filters = computed(() => {
  const f = {};
  if (route.query.q) {
    f.q = route.query.q;
  }
  if (route.query.date_from) {
    f.date_from = sanitizeDateParam(route.query.date_from, true) || route.query.date_from;
  }
  if (route.query.date_to) {
    f.date_to = sanitizeDateParam(route.query.date_to, false) || route.query.date_to;
  }

  if (route.query.work_date_from) {
    f.workDateFrom = sanitizeDateParam(route.query.work_date_from, true) || route.query.work_date_from;
  }

  if (route.query.work_date_to) {
    f.workDateTo = sanitizeDateParam(route.query.work_date_to, false) || route.query.work_date_to;
  }

  const characteristics = {};
  Object.keys(route.query).forEach((key) => {
    const match = key.match(/^binomial\[(.+)\]$/);
    if (match) {
      const side = route.query[key];
      if (side === 'left' || side === 'right') {
        characteristics[match[1]] = side;
      }
    }
  });
  if (Object.keys(characteristics).length > 0) {
    f.characteristics = characteristics;
  }

  const rawSubjects = route.query['subject[]'];
  if (rawSubjects) {
    f.subjects = Array.isArray(rawSubjects) ? rawSubjects : [rawSubjects];
  }
  const rawSubjectTerms = route.query['subject_term[]'];
  if (rawSubjectTerms) {
    f.subjectTerms = Array.isArray(rawSubjectTerms) ? rawSubjectTerms : [rawSubjectTerms];
  }

  //--- Novos campos adicionados para material, técnica, período de estilo, contexto cultural e tipo de obra

  const rawMaterialTerms = route.query['material_term[]'];
  if (rawMaterialTerms) {
    f.materialTerms = Array.isArray(rawMaterialTerms) ? rawMaterialTerms : [rawMaterialTerms];
  }
  const rawTechniqueTerms = route.query['technique_term[]'];
  if (rawTechniqueTerms) {
    f.techniqueTerms = Array.isArray(rawTechniqueTerms) ? rawTechniqueTerms : [rawTechniqueTerms];
  }
  const rawAestheticsTerms = route.query['aesthetics_term[]'];
  if (rawAestheticsTerms) {
    f.AestheticsTerms = Array.isArray(rawAestheticsTerms) ? rawAestheticsTerms : [rawAestheticsTerms];
  }
  const rawCulturalContextTerms = route.query['cultural_context_term[]'];
  if (rawCulturalContextTerms) {
    f.culturalContextTerms = Array.isArray(rawCulturalContextTerms) ? rawCulturalContextTerms : [rawCulturalContextTerms];
  }
  const rawTypologyTerms = route.query['typology_term[]'];
  if (rawTypologyTerms) {
    f.TypologyTerms = Array.isArray(rawTypologyTerms) ? rawTypologyTerms : [rawTypologyTerms];
  }
  // --- fim dos novos campos ---

  if (route.query.title) {
    f.title = route.query.title;
  }
  if (route.query.contributor) {
    f.contributor = route.query.contributor;
  }
  const rawLicenses = route.query['license[]'];
  if (rawLicenses) {
    f.licenses = Array.isArray(rawLicenses) ? rawLicenses : [rawLicenses];
  }
  return f;
});

const {
  items,
  hasNextPage,
  fetchNextPage,
  isPending,
  isFetchingNextPage,
} = useImagesInfiniteQuery({ search: toRef(props, "search"), filters });

const hasActiveFilters = computed(() => hasAnyAdvancedFilter(queryToFilters(route.query)));

watch(items, (val) => {
  if ((props.search || hasActiveFilters.value) && !isPending.value && val.length === 0) {
    emit("no-results");
  }
});

const fallbackImageUrl = "https://picsum.photos/300/200?grayscale&blur=2";

const handleImageError = (event) => {
  const target = event?.target;

  if (target && target.tagName === "IMG") {
    target.onerror = null;
    target.src = fallbackImageUrl;
  }
};

const handleTagClick = (subject) => {
  const rawSubjects = route.query['subject[]'];
  const existing = rawSubjects ? (Array.isArray(rawSubjects) ? rawSubjects : [rawSubjects]) : [];
  const updated = existing.includes(subject.id) ? existing : [...existing, subject.id];
  router.push({
    query: { ...route.query, 'subject[]': updated.length === 1 ? updated[0] : updated },
  });
};

const tryFetchNextPage = () => {
  if (!hasNextPage.value || isFetchingNextPage.value) {
    return;
  }

  fetchNextPage();
};

const handleScroll = () => {
  const scrollPosition = window.innerHeight + window.scrollY;
  const pageBottom = document.documentElement.offsetHeight - 1000;

  if (scrollPosition >= pageBottom) {
    tryFetchNextPage();
  }
};

onMounted(async () => {
  if (items.value.length === 0 && hasNextPage.value) {
    await fetchNextPage();
  }

  window.addEventListener("scroll", handleScroll, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", handleScroll);
});

// Função para verificar se a imagem está selecionada
function isSelected(itemId) {
  return props.selectedImages.some((img) => img.id === itemId);
}

// Função para adicionar ou remover a imagem da seleção
function toggleSelection(item) {
  const current = [...props.selectedImages];
  const index = current.findIndex((img) => img.id === item.id);

  if (index >= 0) {
    current.splice(index, 1);
  } else {
    current.push({
      id: item.id,
      title: item.title,
      imageUrl: item.imageUrl,
    });
  }

  emit("update:selectedImages", current);
}

// Função para lidar com o clique na imagem
function onCardClick(item, event) {
  if (!props.selectionMode) return;

  event.preventDefault();
  event.stopPropagation();
  toggleSelection(item);
}

</script>

<style lang="scss" scoped>
.view-grid__link {
  display: block;
  height: 100%;
  text-decoration: none;
  color: inherit;

  &:hover {
    text-decoration: none;
  }
}

.view-grid__link--selectable {
  cursor: pointer;
}

.view-grid__link--selectable :deep(.image-grid-card:hover),
.view-grid__link--selectable .view-grid__card--selectable:hover {
  transform: none;
  box-shadow: 1px 1px 3px 2px rgba(0, 0, 0, 0.1);
}

.view-grid__link--selectable .view-grid__card--selected {
  background: var(--Off_white, #faf9f9);
  border-color: var(--Laranja_E, #aa4f28);
}

// Skeleton
@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.view-grid__card--skeleton {
  border: 0.25px solid #e0e0e0;
  box-shadow: 1px 1px 3px 2px #0000001A;
  border-radius: 5px;
  overflow: hidden;
  pointer-events: none;
}

.view-grid__skeleton-image {
  width: 100%;
  padding-top: 100%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
}

.view-grid__skeleton-body {
  padding: 8px;
}

.view-grid__skeleton-title {
  height: 14px;
  border-radius: 4px;
  margin-bottom: 6px;
  width: 80%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
}

.view-grid__skeleton-subtitle {
  height: 12px;
  border-radius: 4px;
  width: 50%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
}

.view-grid__select-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.view-grid__select-indicator--checked {
  background: var(--Laranja_E, #aa4f28);
  border-color: var(--Laranja_E, #aa4f28);
  color: #fff;
}

.view-grid__select-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: rgba(170, 79, 40, 0.35);
  pointer-events: none;
}
</style>
