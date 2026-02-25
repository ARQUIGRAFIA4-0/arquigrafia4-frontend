<template>
  <div>
    <div class="row g-4">
      <div v-for="item in items" :key="item.id" class="col-6 col-md-4 col-lg-2">
        <RouterLink
          :to="`/explore/dados/image/${item.id}`"
          class="view-grid__link"
        >
          <UiCard class="h-100 view-grid__card">
            <template #image>
              <div class="view-grid__image-wrapper">
                <img
                  :src="item.imageUrl"
                  class="view-grid__image"
                  :alt="item.title"
                  :data-test-image="item.id"
                  @error="handleImageError"
                />
              </div>
            </template>
            <div class="ui-card__header">
              <h3 class="ui-card__title">{{ item.title }}</h3>
              <p v-if="formatDate(item.dates)" class="ui-card__subtitle">{{ formatDate(item.dates) }}</p>
              <div v-if="item.subjects && item.subjects.length > 0" class="ui-card__tags">
                <button 
                  v-for="(subject, index) in item.subjects" 
                  :key="index" 
                  class="btn btn-outline-primary btn-sm btn-tag grid-tag"
                  type="button"
                  @click.prevent="handleTagClick(subject)"
                >
                  <span>{{ subject.term }}</span>
                </button>
              </div>
            </div>
          </UiCard>
        </RouterLink>
      </div>
    </div>

    <div v-if="loading" class="text-center my-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, toRef, watch } from "vue";
import { RouterLink, useRouter, useRoute } from "vue-router";
import UiCard from "@/components/ui/UiCard.vue";
import { useImagesInfiniteQuery } from "@/composables/useImagesInfiniteQuery";
import { sanitizeDateParam } from "@/helpers/dateUtils";

const router = useRouter();
const route = useRoute();

const props = defineProps({
  search: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["no-results"]);

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
  const rawSubjects = route.query['subject[]'];
  if (rawSubjects) {
    f.subjects = Array.isArray(rawSubjects) ? rawSubjects : [rawSubjects];
  }
  const rawSubjectTerms = route.query['subject_term[]'];
  if (rawSubjectTerms) {
    f.subjectTerms = Array.isArray(rawSubjectTerms) ? rawSubjectTerms : [rawSubjectTerms];
  }
  if (route.query.title) {
    f.title = route.query.title;
  }
  if (route.query.contributor) {
    f.contributor = route.query.contributor;
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

watch(items, (val) => {
  if (props.search && !isPending.value && val.length === 0) {
    emit("no-results");
  }
});

const loading = computed(() => isPending.value || isFetchingNextPage.value);

// Função para formatar data com lógica de circa e intervalo
const formatDate = (dates) => {
  if (!dates || dates.length === 0) return null;
  
  // Procura o primeiro objeto do tipo 'creation', ou usa o primeiro disponível
  const dateInfo = dates.find(d => d.type === 'creation') || dates[0];
  if (!dateInfo) return null;
  
  const earliest = dateInfo.earliest_date ? new Date(dateInfo.earliest_date).getFullYear() : null;
  const latest = dateInfo.latest_date ? new Date(dateInfo.latest_date).getFullYear() : null;
  const circa = dateInfo.circa_earliest_date || dateInfo.circa_latest_date;
  
  if (!earliest) return null;
  
  const prefix = circa ? 'c.' : '';
  
  if (!latest || earliest === latest) {
    return `${prefix}${earliest}`;
  }
  
  return `${prefix}${earliest}-${latest}`;
};

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
  const existing = rawSubjects
    ? (Array.isArray(rawSubjects) ? rawSubjects : [rawSubjects])
    : [];
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
</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.view-grid__link {
  display: block;
  height: 100%;
  text-decoration: none;
  color: inherit;
}

.view-grid__card {
  border: 0.25px solid var(--Cinza_C, #A6A6A6);
  box-shadow: 1px 1px 3px 2px #0000001A;
  border-radius: 5px;

  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.view-grid__card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
}

.view-grid__image-wrapper {
  position: relative;
  padding-top: 100%; // imagem quadrada
  overflow: hidden;
  background-color: #f8f9fa;
}

.view-grid__image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.view-grid__image-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.85);
  z-index: 1;
}

.ui-card__header {
  padding-bottom: 8px;
}

.ui-card__title {
  @include md {
    font-weight: 700;
    font-size: 14px;
    line-height: 125%;
    letter-spacing: 0%;
    padding-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.ui-card__subtitle {
  @include md {
    font-weight: 400;
    font-size: 14px;
    line-height: 125%;
    letter-spacing: 0%;
    color: var(--Cinza_E);
  }
}

.ui-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;  
  max-height: calc(32px * 2 + 8px); /* 2 linhas de tags (altura da tag * 2 + gap) */
  overflow: hidden;
}

.grid-tag {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
