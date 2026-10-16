<script setup>
import { computed, onBeforeUnmount, onMounted, ref, toRef, watch } from "vue";
import { useRoute } from "vue-router";
import ImageMosaic from "@/components/ImageMosaic.vue";
import { useImagesInfiniteQuery } from "@/composables/useImagesInfiniteQuery";
import { sanitizeDateParam } from "@/helpers/dateUtils";
import { queryToFilters, hasAnyAdvancedFilter } from "@/helpers/searchQueryMapping";

const props = defineProps({
  search: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["no-results"]);

const route = useRoute();

const isProcessing = ref(false);
const mosaicItems = ref([]);
const processedIds = new Set();
const mosaicRef = ref(null);

const preloadImageDimensions = (url) => {
  return new Promise((resolve) => {
    const img = new Image();

    const cleanup = () => {
      img.onload = null;
      img.onerror = null;
    };

    img.onload = () => {
      cleanup();
      resolve({
        width: img.naturalWidth || 1,
        height: img.naturalHeight || 1,
      });
    };

    img.onerror = () => {
      cleanup();
      resolve({ width: 1, height: 1 });
    };

    img.decoding = "async";
    img.src = url;

    if (img.complete && img.naturalWidth) {
      cleanup();
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      return;
    }
  });
};

const processItems = async (sourceItems) => {
  const pendingItems = sourceItems.filter((item) => !processedIds.has(item.id));

  if (pendingItems.length === 0) {
    return;
  }

  isProcessing.value = true;
  try {
    const resolvedItems = await Promise.all(
      pendingItems.map(async (item) => {
        try {
          const dimensions = await preloadImageDimensions(item.imageUrl);

          if (
            !dimensions ||
            dimensions.width === 1 ||
            dimensions.height === 1
          ) {
            return null;
          }

          const { width, height } = dimensions;
          const aspectRatio = width && height ? width / height : 1;

          return {
            id: item.id,
            src: item.imageUrl,
            title: item.title,
            width,
            height,
            aspectRatio,
          };
        } catch (preloadError) {
          return null;
        }
      })
    );

    const newItems = resolvedItems.filter((item) => item !== null);
    if (newItems.length === 0) return;

    newItems.forEach((item) => processedIds.add(item.id));
    mosaicItems.value = [...mosaicItems.value, ...newItems];
  } catch (error) {
    console.error("Error processing items:", error);
  } finally {
    isProcessing.value = false;
  }
};

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
  items: rawItems,
  hasNextPage,
  fetchNextPage,
  isPending,
  isFetchingNextPage,
} = useImagesInfiniteQuery({ search: toRef(props, "search"), filters });

const hasActiveFilters = computed(() => hasAnyAdvancedFilter(queryToFilters(route.query)));

watch(rawItems, (val) => {
  if ((props.search || hasActiveFilters.value) && !isPending.value && val.length === 0) {
    emit("no-results");
  }
});

const tryFetchNextPage = () => {
  if (!hasNextPage.value || isFetchingNextPage.value || isProcessing.value || mosaicRef.value?.isRebuilding) {
    return;
  }

  fetchNextPage();
};

let lastSearchKey = null;

watch(
  rawItems,
  async (newItems) => {
    const rawSubjects = route.query['subject[]'];
    const subjectsKey = rawSubjects ? (Array.isArray(rawSubjects) ? [...rawSubjects].sort().join(',') : rawSubjects) : null;
    const rawSubjectTerms = route.query['subject_term[]'];
    const subjectTermsKey = rawSubjectTerms ? (Array.isArray(rawSubjectTerms) ? [...rawSubjectTerms].sort().join(',') : rawSubjectTerms) : null;
    const rawLicenses = route.query['license[]'];
    const licensesKey = rawLicenses ? (Array.isArray(rawLicenses) ? [...rawLicenses].sort().join(',') : rawLicenses) : null;

    // --- Novos campos ---
    const rawMaterialTerms = route.query['material_term[]'];
    const materialTermsKey = rawMaterialTerms ? (Array.isArray(rawMaterialTerms) ? [...rawMaterialTerms].sort().join(',') : rawMaterialTerms) : null;
    const rawTechniqueTerms = route.query['technique_term[]'];
    const techniqueTermsKey = rawTechniqueTerms ? (Array.isArray(rawTechniqueTerms) ? [...rawTechniqueTerms].sort().join(',') : rawTechniqueTerms) : null;
    const rawAestheticsTerms = route.query['aesthetics_term[]'];
    const aestheticsTermsKey = rawAestheticsTerms ? (Array.isArray(rawAestheticsTerms) ? [...rawAestheticsTerms].sort().join(',') : rawAestheticsTerms) : null;
    const rawCulturalContextTerms = route.query['cultural_context_term[]'];
    const culturalContextTermsKey = rawCulturalContextTerms ? (Array.isArray(rawCulturalContextTerms) ? [...rawCulturalContextTerms].sort().join(',') : rawCulturalContextTerms) : null;
    const rawTypologyTerms = route.query['typology_term[]'];
    const typologyTermsKey = rawTypologyTerms ? (Array.isArray(rawTypologyTerms) ? [...rawTypologyTerms].sort().join(',') : rawTypologyTerms) : null;
    // --- fim dos novos campos ---

    // Chave das características (binomial[chave]), na mesma lógica do filters computed
    const characteristicsKey = Object.keys(route.query)
      .filter((key) => /^binomial\[.+\]$/.test(key))
      .sort()
      .map((key) => `${key}:${route.query[key]}`)
      .join(',') || null;

    const searchKey = JSON.stringify({ 
      search: props.search, 
      q: route.query.q || null, 
      date_from: route.query.date_from || null, 
      date_to: route.query.date_to || null,
      work_date_from: route.query.work_date_from || null,
      work_date_to: route.query.work_date_to || null,
      characteristics: characteristicsKey,
      subjects: subjectsKey, 
      subjectTerms: subjectTermsKey, 
      title: route.query.title || null, 
      contributor: route.query.contributor || null, 
      licenses: licensesKey,
      materialTerms: materialTermsKey,
      techniqueTerms: techniqueTermsKey,
      aestheticsTerms: aestheticsTermsKey,
      culturalContextTerms: culturalContextTermsKey,
      typologyTerms: typologyTermsKey,
    });
    if (searchKey !== lastSearchKey) {
      // Reset when search params change (including going from search to browse)
      mosaicItems.value = [];
      processedIds.clear();
      lastSearchKey = searchKey;
    }
    await processItems(newItems ?? []);
  },
  { immediate: true }
);

const handleScroll = () => {
  const scrollPosition = window.innerHeight + window.scrollY;
  const pageBottom = document.documentElement.offsetHeight - 1000;

  if (scrollPosition >= pageBottom) {
    tryFetchNextPage();
  }
};

const loadImages = async () => {
  if (!hasNextPage.value) {
    return;
  }

  await tryFetchNextPage();
};

onMounted(() => {
  loadImages();
  window.addEventListener("scroll", handleScroll, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<template>
  <ImageMosaic ref="mosaicRef" class="container-fluid mosaic-container" :items="mosaicItems"
    :loading="isPending || (isProcessing && mosaicItems.length === 0)"
    :loading-more="isFetchingNextPage || (mosaicItems.length > 0 && isProcessing)" />
</template>

<style scoped>
.mosaic-container {
  min-height: 100vh;
}

.container-fluid {
  --bs-gutter-x: 0;
}
</style>
